import { describe, expect, it } from 'vitest';
import Cache from '../src/index';
import { sleep } from '../src/utils';

function initCache() {
    const cache = new Cache<string>({
        expireAfterMs: 20,
        timePrecisionMs: 1,
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
});