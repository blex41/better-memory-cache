export interface CacheOptions<T> {
    /**
     * Namespace for the cache, used in error messages.
     */
    namespace?: string | null;

    /**
     * Delay in milliseconds between a key creation or refresh and its deletion.
     * If set to null, keys will never expire unless `maxKeys` is reached and an `evictStrategy` is set.
     * @default null
     */
    expireAfterMs?: number | null;

    /**
     * Delay in milliseconds between a key creation and it becoming stale.
     * Requires a `fetchMethod` to be set.
     * @default null
     */
    staleAfterMs?: number | null;

    /**
     * Timeout in milliseconds for fetching a new value when a key is stale.
     * If the timeout is exceeded, the stale value is returned and the value will be refreshed in the background.
     * If the fetch is fast enough, the new value is returned.
     * If set to null, the old value will always be returned while it is refreshed in the background.
     * @default null
     */
    staleTimeoutMs?: number | null;

    /**
     * Delay in milliseconds between automatic key refreshes. Useful for keeping the cache up-to-date even when not in use.
     * Requires a `fetchMethod` to be set.
     * If set to null, keys will not be refreshed automatically.
     * @default null
     */
    refreshAfterMs?: number | null;

    /**
     * Precision in milliseconds used for auto-eviction and auto-refresh timers.
     * A higher value is recommended for performance, and a lower one for precision.
     * @default 10000
     */
    timePrecisionMs?: number | null;

    /**
     * Method used for fetching a new value when a key is stale, missing, or needs to be refreshed in the background.
     * It it returns undefined, the value will not be stored in the cache.
     * Only required if `staleAfterMs` or `refreshAfterMs` is set.
     * @param {string} key 
     * @returns {T | undefined | Promise<T | undefined>}
     */
    fetchMethod?: (key: string) => T | undefined | Promise<T | undefined>;

    /**
     * Maximum number of keys in the cache. If set to null, the cache will grow indefinitely.
     * Exceeding this limit will trigger an eviction based on the `evictStrategy` if one is set, or throw an error otherwise.
     * @default null
     */
    maxKeys?: number | null;

    /**
     * Strategy used for evicting keys when the `maxKeys` limit is reached.
     * If set to null, exceeding the limit will throw an error.
     * @enum {'LRU' | null}
     * @default null
     */
    evictStrategy?: 'LRU' | null;
};

export interface Wrapper<T> {
    /**
     * value
     */
    v: T;

    /**
     * accessedAt
     */
    a: number | null;

    /**
     * refreshedAt
     */
    r: number;
}