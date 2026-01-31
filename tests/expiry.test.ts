import { describe, expect, it, vi } from 'vitest';
import Cache from '../src/index';
import { sleep } from '../src/utils';

function initCache(timePrecisionMs = 1) {
    const cache = new Cache<string>({
        expireAfterMs: 20,
        timePrecisionMs,
    });

    cache.set('foo', 'bar');

    return cache;
}

describe('Expiry', () => {
    it('retrieves an entry before expiry', async () => {
        const cache = initCache();

        await sleep(1);
        expect(cache.get('foo')).toBe('bar');
    });

    it('does not retrieve an entry after expiry', async () => {
        const cache = initCache();

        await sleep(35);
        expect(cache.get('foo')).toBe(undefined);
    });

    it('auto-evicts expired keys on get', async () => {
        const timePrecisionMs = 999999; // Set to a high value to avoid auto-eviction during the test
        const cache = initCache(timePrecisionMs);

        await sleep(35);
        expect(cache.get('foo')).toBe(undefined);
    });
});

describe('Expiry with fetch()', () => {
    it('waits for fetchMethod when entry is expired', async () => {
        const cache = new Cache<string>({
            expireAfterMs: 5,
            timePrecisionMs: 999999, // Disable auto-eviction
            fetchMethod: async () => {
                await sleep(5);
                return 'new_value';
            },
        });

        cache.set('foo', 'initial_value');
        await sleep(10); // Wait for expiry

        expect(await cache.fetch('foo')).toBe('new_value');
    });

    it('calls fetchMethod when entry is expired', async () => {
        const mock = {
            fetchMethod: async () => {
                await sleep(5);
                return 'new_value';
            }
        };
        const spy = vi.spyOn(mock, 'fetchMethod');
        const cache = new Cache<string>({
            expireAfterMs: 20,
            timePrecisionMs: 999999,
            fetchMethod: mock.fetchMethod,
        });

        cache.set('foo', 'initial_value');
        await sleep(30);

        await cache.fetch('foo');
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('waits for fetchMethod when entry expires within staleTimeousMs', async () => {
        const cache = new Cache<string>({
            expireAfterMs: 20,
            staleAfterMs: 5,
            staleTimeoutMs: 20,
            timePrecisionMs: 999999, // Disable auto-eviction
            fetchMethod: async () => {
                await sleep(30);
                return 'new_value';
            },
        });

        cache.set('foo', 'initial_value');
        await sleep(10); // Wait for stale but not expiry

        expect(await cache.fetch('foo')).toBe('new_value');
    });
});