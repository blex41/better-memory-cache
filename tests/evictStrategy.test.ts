import { describe, expect, it } from 'vitest';
import Cache, { CacheOptions } from '../src/index';
import { sleep } from '../src/utils';

function initCache(evictStrategy?: CacheOptions<string>['evictStrategy']) {
    const cache = new Cache<string>({
        maxKeys: 9,
        evictStrategy
    });

    const dump = {};
 
    for (let i = 1; i <= 9; i++) {
        dump[`key_${i}`] = {
            v: `value_${i}`,
            c: i,
            a: null,
            r: i,
        };
    }

    cache.load(dump);

    return cache;
}

describe('EvictStrategy', () => {
    describe('without evictStrategy', () => {
        it('throws when maxKeys is exceeded and no evictStrategy is set', () => {
            const cache = initCache();

            expect(() => cache.set('key_10', 'value_10'))
                .toThrowError("[Cache] Cache is full. Either increase maxKeys or set an evictStrategy");
        });

        it('does not throw when overwriting an existing key', () => {
            const cache = initCache();

            expect(() => cache.set('key_9', 'new_value_9')).not.toThrow();
            expect(cache.get('key_9')).toBe('new_value_9');
        });
    });

    describe('LRU', () => {
        it('evicts the least recently used key when maxKeys is exceeded', async () => {
            const cache = initCache('LRU');

            cache.get('key_6');
            await sleep(1);
            cache.get('key_2');
            await sleep(1);
            cache.mget(['key_1', 'key_4']);
            await sleep(1);
            cache.set('key_10', 'value_10');

            expect(cache.keys()).toEqual([
                'key_1',
                'key_2',
                'key_4',
                'key_5',
                'key_6',
                'key_7',
                'key_8',
                'key_9',
                'key_10'
            ]);
        });
    });

    describe('FIFO', () => {
        it('evicts the least recently created key when maxKeys is exceeded', async () => {
            const cache = initCache('FIFO');

            cache.get('key_6');
            await sleep(1);
            cache.get('key_2');
            await sleep(1);
            cache.get('key_1');
            await sleep(1);
            cache.get('key_4');
            await sleep(1);
            // Creating them at the same time to test the order
            cache.mset([
                ['key_10', 'value_10'],
                ['key_11', 'value_11']
            ]);

            expect(cache.keys()).toEqual([
                'key_3',
                'key_4',
                'key_5',
                'key_6',
                'key_7',
                'key_8',
                'key_9',
                'key_10',
                'key_11'
            ]);
        });
    });
});