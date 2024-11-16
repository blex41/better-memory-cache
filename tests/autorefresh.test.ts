import { describe, expect, it, vi } from 'vitest';
import Cache from '../src/index';
import { sleep } from '../src/utils';

function initCache(fetchMethod?: (key: string) => Promise<string | undefined>, refreshTimeoutMs?: number) {
    const cache = new Cache<string>({
        namespace: 'test_cache',
        refreshAfterMs: 50,
        refreshTimeoutMs,
        timePrecisionMs: 1,
        fetchMethod,
    });

    cache.set('foo', 'initial_value');

    return cache;
}

describe('AutoRefresh', () => {
    it('throws if refreshAfterMs is provided without a fetchMethod', () => {
        expect(() => initCache())
            .toThrowError("[Cache:test_cache] fetchMethod is required when refreshAfterMs or staleAfterMs is set");
    });

    it('does not call refresh when refreshAfterMs is not exceeded', async () => {
        const mock = { fetchMethod: async (key: string) => 'new_value' };
        const spy = vi.spyOn(mock, 'fetchMethod');
        const cache = initCache(mock.fetchMethod);

        expect(await cache.fetch('foo')).toBe('initial_value');
        expect(spy).toHaveBeenCalledTimes(0);
    });

    it('calls refresh when refreshAfterMs is exceeded', async () => {
        const mock = { fetchMethod: async (key: string) => 'new_value' };
        const spy = vi.spyOn(mock, 'fetchMethod');
        const cache = initCache(mock.fetchMethod);

        await sleep(55);
        expect(await cache.fetch('foo')).toBe('new_value');
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should keep refreshing every time refreshAfterMs is exceeded', async () => {
        const mock = { fetchMethod: async (key: string) => 'new_value' };
        const spy = vi.spyOn(mock, 'fetchMethod');
        const cache = initCache(mock.fetchMethod);

        await sleep((50 + 10) * 2);
        expect(await cache.fetch('foo')).toBe('new_value');
        cache.destroy();
        expect(spy).toHaveBeenCalledTimes(2);
    });
});