import { describe, expect, it } from 'vitest';
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

        await sleep(22);
        expect(cache.get('foo')).toBe(undefined);
    });

    it('auto-evicts expired keys on get', async () => {
        const timePrecisionMs = 999999; // Set to a high value to avoid auto-eviction during the test
        const cache = initCache(timePrecisionMs);

        await sleep(22);
        expect(cache.get('foo')).toBe(undefined);
    });
});