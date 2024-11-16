import { InvalidStateError, ValidationError } from "./errors";
import { CacheOptions, Wrapper } from "./interfaces";
import { hasOwnProperty, withTimeout } from "./utils";

export * from "./constants";
export * from "./errors";
export { CacheOptions, Wrapper } from "./interfaces";

export default class Cache<T> {
    private _namespace: string | null;
    private _expireAfterMs: number | null;
    private _staleAfterMs: number | null;
    private _staleTimeoutMs: number | null;
    private _refreshAfterMs: number | null;
    private _refreshTimeoutMs: number | null;
    private _timePrecisionMs: number = 50;
    private _fetchMethod?: ((key: string) => T | undefined | Promise<T | undefined>) | null;
    private _maxKeys?: number | null;
    private _evictStrategy: 'LRU' | null = null;
    private _keys: string[] = [];
    private _keyLength: number = 0;
    private _cache: Record<string, Wrapper<T>> = {};
    private _timestampThrottleTimeout: ReturnType<typeof setTimeout> | null = null;
    private _pendingRefreshes: Record<string, Promise<boolean>> = {};
    private _refreshLoopTimeout: ReturnType<typeof setTimeout> | null = null;

    /**
     * Creates a new Cache instance.
     */
    constructor(options?: CacheOptions<T>) {
        this._namespace = options?.namespace || null;
        this._expireAfterMs = options?.expireAfterMs || null;
        this._staleAfterMs = options?.staleAfterMs || null;
        this._staleTimeoutMs = options?.staleTimeoutMs || null;
        this._refreshAfterMs = options?.refreshAfterMs || null;
        this._refreshTimeoutMs = options?.refreshTimeoutMs || null;
        this._timePrecisionMs = options?.timePrecisionMs || 1000;
        this._fetchMethod = options?.fetchMethod || null;
        this._maxKeys = options?.maxKeys || null;
        this._evictStrategy = options?.evictStrategy || null;

        if ((options?.refreshAfterMs || options?.staleAfterMs) && !options?.fetchMethod) {
            throw new ValidationError(this._getLogPrefix() + "fetchMethod is required when refreshAfterMs or staleAfterMs is set");
        }

        if (this._refreshAfterMs) {
            this._refreshOldValues();
        }
    }

    /**
     * Returns the value of a key in the cache if present, and undefined otherwise.
     */
    get(key: string): T | undefined {
        this._validateKey(key);

        if (!this.has(key)) {
            return;
        }

        if (this._isExpired(key)) {
            this.del(key);
            return;
        }

        this._cache[key].a = this._now();
        return this._cache[key].v;
    }

    /**
     * Returns a promise that resolves to the value of a key in the cache if present,
     * and fetches it asynchronously otherwise.
     */
    async fetch(key: string): Promise<T | undefined> {
        if (!this._fetchMethod) {
            throw new ValidationError(this._getLogPrefix() + "fetchMethod is required when calling fetch");
        }

        this._validateKey(key);

        if (this.has(key) && !this._isStale(key) && !this._isExpired(key)) {
            return this.get(key);
        }

        this.refresh(key);
        
        if (!this.has(key)) {
            // If the key is not present, we need to wait for the refresh to complete
            await this._pendingRefreshes[key];
        } else if (this._staleTimeoutMs) {
            // Otherwise, we wait until the fetch is complete or the stale timeout is reached
            await withTimeout(this._pendingRefreshes[key], this._staleTimeoutMs);
        }

        return this.get(key);
    }

    /**
     * Sets a key-value pair in the cache.
     */
    set(key: string, value: T) {
        this._validateKey(key);

        if (!this.has(key) && this._maxKeys && this._keyLength >= this._maxKeys) {
            this._onMaxKeysReached();
        }

        const oldWrapper = this._cache[key];
        const ts = this._now();

        this._cache[key] = {
            v: value,
            a: oldWrapper?.a || null,
            r: ts,
        };

        this._updateStats();
    }

    /**
     * Refreshes a key
     */
    refresh(key: string): Promise<boolean> {
        if (!this._fetchMethod) {
            throw new ValidationError(this._getLogPrefix() + "fetchMethod is required when calling refresh");
        }

        if (!this._isPendingRefresh(key)) {
            this._pendingRefreshes[key] = new Promise<boolean>((resolve) => {
                const result = this._fetchMethod!(key);
                const promise = result instanceof Promise ? result : Promise.resolve(result);

                promise
                    .then(value => {
                        if (value != undefined) {
                            this.set(key, value);
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    })
                    .catch(() => {
                        resolve(false);
                    })
                    .finally(() => {
                        delete this._pendingRefreshes[key];
                    });
            });
        }

        return this._pendingRefreshes[key];
    }

    /**
     * Returns true if the cache has the given key, and false otherwise.
     */
    has(key: string): boolean {
        this._validateKey(key);

        return hasOwnProperty(this._cache, key);
    }

    /**
     * Returns an array of all keys in the cache.
     */
    keys(): string[] {
        return this._keys;
    }

    /**
     * Deletes a key from the cache.
     */
    del(key: string): Cache<T> {
        this._validateKey(key);

        delete this._cache[key];

        this._updateStats();

        return this;
    }

    /**
     * Deletes all keys from the cache.
     */
    flushAll(): Cache<T> {
        for (const key in this._cache) {
            delete this._cache[key];
        }

        this._updateStats();

        return this;
    }

    /**
     * Returns full cache object, which can be used later with `load`.
     */
    dump(): Record<string, Wrapper<T>> {
        return this._cache;
    }

    /**
     * Loads a cache object into the cache.
     */
    load(cache: Record<string, Wrapper<T>>): Cache<T> {
        this._cache = cache;

        this._updateStats();

        return this;
    }

    /**
     * Empties the cache and stops all internal processes.
     */
    destroy() {
        this.flushAll();
        clearTimeout(this._timestampThrottleTimeout!);
        clearTimeout(this._refreshLoopTimeout!);
    }

    /**
     * Checks if a key is valid, and throws an error if it is not.
     */
    private _validateKey(key: unknown) {
        if (typeof key !== "string" || key.length === 0) {
            throw new ValidationError(this._getLogPrefix() + "Key must be a non-empty string. Here: " + String(key));
        }
    }

    /**
     * Checks if a key is expired.
     */
    private _isExpired(key: string) {
        return this._expireAfterMs !== null
            && this._cache[key].r + this._expireAfterMs < this._now();
    }

    /**
     * Checks if a key is stale.
     */
    private _isStale(key: string) {
        return this._staleAfterMs !== null
            && this._cache[key].r + this._staleAfterMs < this._now();
    }

    /**
     * Checks if a key is pending refresh.
     */
    private _isPendingRefresh(key: string) {
        return hasOwnProperty(this._pendingRefreshes, key);
    }

    /**
     * Checks if a key needs to be refreshed.
     */
    private _needsRefresh(key: string) {
        return this._refreshAfterMs !== null
            && !this._isPendingRefresh(key)
            && this._cache[key].r + this._refreshAfterMs < this._now();
    }

    /**
     * Evicts keys based on the evict strategy or throws an error if no strategy is set.
     */
    private _onMaxKeysReached() {
        switch (this._evictStrategy) {
            case 'LRU':
                this._evictLRU();
                break;
            default:
                throw new InvalidStateError(this._getLogPrefix() + "Cache is full. Either increase maxKeys or set an evictStrategy");
        }
    }

    /**
     * Evicts the least recently used keys to make room for an extra key.
     */
    private _evictLRU() {
        const keysByAccessedAtDescNullsLast = this._keys.sort((a, b) => {
            const accessedAtA = this._cache[a].a || this._cache[a].r;
            const accessedAtB = this._cache[b].a || this._cache[b].r;
            if (accessedAtA === accessedAtB) {
                return 0;
            }
            return accessedAtA - accessedAtB < 0 ? 1 : -1;
        });

        const keysToEvict = keysByAccessedAtDescNullsLast.slice(this._maxKeys! - 1);

        keysToEvict.forEach(key => this.del(key));
    }

    /**
     * Returns the current timestamp in milliseconds.
     */
    private _now() {
        return Date.now();
    }

    /**
     * Refreshes all values that need to be refreshed.
     */
    private _refreshOldValues() {
        this.keys()
            .filter(key => this._needsRefresh(key))
            .forEach(key => this.refresh(key));
        this._refreshLoopTimeout = setTimeout(() => this._refreshOldValues(), this._timePrecisionMs);
    }

    /**
     * Updates the internal stats of the cache.
     */
    private _updateStats() {
        this._keys = Object.keys(this._cache);
        this._keyLength = this._keys.length;
    }

    /**
     * Returns a log prefix with the namespace if set.
     */
    private _getLogPrefix() {
        return `[Cache${this._namespace ? `:${this._namespace}` : ''}] `;
    }
};