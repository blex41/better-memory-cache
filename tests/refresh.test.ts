import { describe, expect, it, vi } from 'vitest';
import Cache from '../src/index';
import { sleep } from '../src/utils';

function initCache(fetchMethod?: (key: string) => Promise<string | undefined>) {
    const cache = new Cache<string>({
        fetchMethod,
    });

    cache.set('foo', 'initial_value');

    return cache;
}

describe('Refresh', () => {
    it('throws if refresh is called without a fetchMethod set', () => {
        const cache = initCache();

        expect(() => cache.refresh('foo'))
            .toThrowError("[Cache] fetchMethod is required when calling refresh");
    });

    it('only calls fetchMethod once on concurrent refreshes', async () => {
        const mock = {
            fetchMethod: async (key: string) => {
                await sleep(5);
                return 'new_value';
            }
        };
        const spy = vi.spyOn(mock, 'fetchMethod');
        const cache = initCache(mock.fetchMethod);

        for (let i = 0; i < 10; i++) {
            cache.refresh('foo');
        }

        expect(await cache.refresh('foo')).toBe(true);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('does not alter the existing value when fetchMethod returns undefined', async () => {
        const mock = {
            fetchMethod: async (key: string) => {
                await sleep(1);
                return undefined;
            }
        };
        const spy = vi.spyOn(mock, 'fetchMethod');
        const cache = initCache(mock.fetchMethod);

        expect(await cache.refresh('foo')).toBe(false);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(cache.get('foo')).toBe('initial_value');
    });

    it('does not create the key when fetchMethod returns undefined', async () => {
        const mock = {
            fetchMethod: async (key: string) => {
                await sleep(1);
                return undefined;
            }
        };
        const spy = vi.spyOn(mock, 'fetchMethod');
        const cache = initCache(mock.fetchMethod);

        expect(await cache.refresh('new_key')).toBe(false);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(cache.has('new_key')).toBe(false);
    });

    it('does not alter the existing value when fetchMethod rejects', async () => {
        const mock = {
            fetchMethod: async (key: string) => {
                await sleep(1);
                throw new Error('fetchMethod failed');
            }
        };
        const spy = vi.spyOn(mock, 'fetchMethod');
        const cache = initCache(mock.fetchMethod);

        expect(await cache.refresh('foo')).toBe(false);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(cache.get('foo')).toBe('initial_value');
    });

    it('does not create the key when fetchMethod rejects', async () => {
        const mock = {
            fetchMethod: async (key: string) => {
                await sleep(1);
                throw new Error('fetchMethod failed');
            }
        };
        const spy = vi.spyOn(mock, 'fetchMethod');
        const cache = initCache(mock.fetchMethod);

        expect(await cache.refresh('new_key')).toBe(false);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(cache.has('new_key')).toBe(false);
    });
});