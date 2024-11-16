import { describe, expect, it, vi } from 'vitest';
import Cache from '../src/index';
import { sleep } from '../src/utils';

function initCache(fetchMethod?: (key: string) => Promise<string | undefined>, staleTimeoutMs?: number) {
    const cache = new Cache<string>({
        staleAfterMs: 20,
        staleTimeoutMs,
        timePrecisionMs: 1,
        fetchMethod,
    });

    cache.set('foo', 'initial_value');

    return cache;
}

describe('Stale', () => {
    it('throws if staleAfterMs is provided without a fetchMethod', () => {
        expect(() => initCache())
            .toThrowError("fetchMethod is required when refreshAfterMs or staleAfterMs is set");
    });

    it('retrieves an entry by calling fetchMethod when key does not exist', async () => {
        const mock = { fetchMethod: async (key: string) => key.replace('_key', '_value') };
        const spy = vi.spyOn(mock, 'fetchMethod');
        const cache = initCache(mock.fetchMethod);

        expect(await cache.fetch('new_key')).toBe('new_value');
        expect(spy).toHaveBeenCalledWith('new_key');
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('does not call fetchMethod when key is not stale', async () => {
        const mock = { fetchMethod: async (key: string) => key.replace('_key', '_value') };
        const spy = vi.spyOn(mock, 'fetchMethod');
        const cache = initCache(mock.fetchMethod);

        expect(await cache.fetch('foo')).toBe('initial_value');
        expect(spy).toHaveBeenCalledTimes(0);
    });

    it('calls fetchMethod when key is stale', async () => {
        const mock = { fetchMethod: async (key: string) => key.replace('_key', '_value') };
        const spy = vi.spyOn(mock, 'fetchMethod');
        const cache = initCache(mock.fetchMethod);

        await sleep(22);
        expect(await cache.fetch('foo_key')).toBe('foo_value');
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('returns newer value when staleTimeoutMs is not exceeded', async () => {
        const mock = {
            fetchMethod: async (key: string) => {
                await sleep(5);
                return 'new_value';
            }
        };
        const spy = vi.spyOn(mock, 'fetchMethod');
        const cache = initCache(mock.fetchMethod, 10);

        await sleep(22);
        expect(await cache.fetch('foo')).toBe('new_value'); // 👈
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('returns old value when staleTimeoutMs is exceeded', async () => {
        const mock = {
            fetchMethod: async (key: string) => {
                await sleep(25);
                return 'new_value';
            }
        };
        const spy = vi.spyOn(mock, 'fetchMethod');
        const cache = initCache(mock.fetchMethod, 10);

        await sleep(22);
        expect(await cache.fetch('foo')).toBe('initial_value'); // 👈
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('returns old value when staleTimeoutMs is exceeded, and then new value', async () => {
        const mock = {
            fetchMethod: async (key: string) => {
                await sleep(5);
                return 'new_value';
            }
        };
        const spy = vi.spyOn(mock, 'fetchMethod');
        const cache = initCache(mock.fetchMethod, 2);

        await sleep(25);
        expect(await cache.fetch('foo')).toBe('initial_value'); // 👈
        await sleep(4);
        expect(await cache.fetch('foo')).toBe('new_value'); // 👈
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('only calls fetchMethod once on concurrent fetches', async () => {
        const mock = {
            fetchMethod: async (key: string) => {
                await sleep(5);
                return key.replace('_key', '_value');
            }
        };
        const spy = vi.spyOn(mock, 'fetchMethod');
        const cache = initCache(mock.fetchMethod);

        for (let i = 0; i < 10; i++) {
            cache.fetch('new_key');
        }

        expect(await cache.fetch('new_key')).toBe('new_value');
        expect(spy).toHaveBeenCalledWith('new_key');
        expect(spy).toHaveBeenCalledTimes(1);
    });
});