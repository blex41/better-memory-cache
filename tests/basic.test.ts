import { describe, expect, it } from 'vitest';
import Cache from '../src/index';
import { INVALID_KEYS_TEST_ARRAY } from './constants';

function initCache() {
    return new Cache<string>();
}

describe('Basic Cache', () => {
    describe('set', () => {
        it.each(
            INVALID_KEYS_TEST_ARRAY
        )('throws if key is invalid -> %s', (_testLabel: string, key: any) => {
            const cache = initCache();

            expect(() => cache.set(key, 'bar'))
                .toThrowError("Key must be a non-empty string");
          })

        it('creates an entry', () => {
            const cache = initCache();

            cache.set('foo', 'bar');
            expect(cache.get('foo')).toBe('bar');
        });
    });

    describe('mset', () => {
        it.each(
            INVALID_KEYS_TEST_ARRAY
        )('throws if key is invalid -> %s', (_testLabel: string, key: any) => {
            const cache = initCache();

            expect(() => cache.mset([[key, 'bar']]))
                .toThrowError("Key must be a non-empty string");
          })

        it('creates multiple entries', () => {
            const cache = initCache();

            cache.mset([
                ['foo', 'bar'],
                ['baz', 'qux']
            ]);
            expect(cache.get('foo')).toBe('bar');
            expect(cache.get('baz')).toBe('qux');
        });
    });

    describe('get', () => {
        it.each(
            INVALID_KEYS_TEST_ARRAY
        )('throws if key is invalid -> %s', (_testLabel: string, key: any) => {
            const cache = initCache();

            expect(() => cache.get(key))
                .toThrowError("Key must be a non-empty string");
          })

        it('retrieves an existing value', () => {
            const cache = initCache();

            cache.set('foo', 'bar');
            expect(cache.get('foo')).toBe('bar');
        });

        it('returns undefined if key does not exist', () => {
            const cache = initCache();

            cache.set('foo', 'bar');
            expect(cache.get('baz')).toBe(undefined);
        });
    });

    describe('mget', () => {
        it.each(
            INVALID_KEYS_TEST_ARRAY
        )('throws if key is invalid -> %s', (_testLabel: string, key: any) => {
            const cache = initCache();

            expect(() => cache.mget([key]))
                .toThrowError("Key must be a non-empty string");
          })

        it('retrieves existing values and undefined otherwise', () => {
            const cache = initCache();

            cache.mset([
                ['foo', 'bar'],
                ['baz', 'qux']
            ]);

            expect(cache.mget(['foo', 'baz', 'banzai'])).toEqual(['bar', 'qux', undefined]);
        });
    });

    describe('fetch', () => {
        it('throws when fetch is called without a fetchMethod set', async () => {
            const cache = initCache();

            await expect(() => cache.fetch('foo'))
                .rejects.toThrowError("[Cache] fetchMethod is required when calling fetch");
        });
    });

    describe('keys', () => {
        it('returns an empty array if no keys are present', () => {
            const cache = initCache();

            expect(cache.keys()).toEqual([]);
        });

        it('returns an array with all keys', () => {
            const cache = initCache();

            cache.mset([
                ['key_1', 'foo'],
                ['key_2', 'bar']
            ]);

            expect(cache.keys()).toEqual(['key_1', 'key_2']);
        });
    });

    describe('has', () => {
        it.each(
            INVALID_KEYS_TEST_ARRAY
        )('throws if key is invalid -> %s', (_testLabel: string, key: any) => {
            const cache = initCache();

            expect(() => cache.has(key))
                .toThrowError("Key must be a non-empty string");
          })

        it('returns true if key exists', () => {
            const cache = initCache();

            cache.set('foo', 'bar');
            expect(cache.has('foo')).toBe(true);
        });

        it('returns false if key does not exist', () => {
            const cache = initCache();

            cache.set('foo', 'bar');
            expect(cache.has('baz')).toBe(false);
        });
    });

    describe('del', () => {
        it.each(
            INVALID_KEYS_TEST_ARRAY
        )('throws if key is invalid -> %s', (_testLabel: string, key: any) => {
            const cache = initCache();

            expect(() => cache.del(key))
                .toThrowError("Key must be a non-empty string");
          })

        it('deletes an existing key', () => {
            const cache = initCache();

            cache.mset([
                ['key_1', 'bar'],
                ['key_2', 'bar']
            ]);
            
            expect(cache.has('key_1')).toBe(true);

            cache.del('key_1');

            expect(cache.has('key_1')).toBe(false);
        });

        it('does nothing if key does not exist', () => {
            const cache = initCache();

            cache.del('key_1');

            expect(cache.has('key_1')).toBe(false);
        });
    });

    describe('mdel', () => {
        it.each(
            INVALID_KEYS_TEST_ARRAY
        )('throws if key is invalid -> %s', (_testLabel: string, key: any) => {
            const cache = initCache();

            expect(() => cache.mdel([key]))
                .toThrowError("Key must be a non-empty string");
          })

        it('deletes existing keys', () => {
            const cache = initCache();

            cache.mset([
                ['key_1', 'bar'],
                ['key_2', 'bar']
            ]);
            
            expect(cache.has('key_1')).toBe(true);

            cache.mdel(['key_1', 'banzai']);

            expect(cache.has('key_1')).toBe(false);
        });

        it('does nothing if keys do not exist', () => {
            const cache = initCache();

            cache.mdel(['key_1']);

            expect(cache.has('key_1')).toBe(false);
        });
    });

    describe('flushAll', () => {
        it('deletes all keys', () => {
            const cache = initCache();

            cache.mset([
                ['key_1', 'bar'],
                ['key_2', 'bar']
            ]);
            
            expect(cache.has('key_1')).toBe(true);
            expect(cache.has('key_2')).toBe(true);

            cache.flushAll();

            expect(cache.keys()).toEqual([]);
        });

        it('does nothing if there are no keys', () => {
            const cache = initCache();

            cache.flushAll();

            expect(cache.keys()).toEqual([]);
        });
    });
});