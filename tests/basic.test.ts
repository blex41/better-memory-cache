import { describe, expect, it } from 'vitest';
import Cache from '../src/index';

function initCache() {
    return new Cache<string>();
}

describe('Basic Cache', () => {
    describe('set', () => {
        it.each([
            ['1', 1],
            ['""', ''],
            ['{}', {}],
            ['[]', []],
            ['null', null],
            ['undefined', undefined],
          ])('throws if key is invalid -> %s', (_testLabel: string, key: any) => {
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

    describe('get', () => {
        it.each([
            ['1', 1],
            ['""', ''],
            ['{}', {}],
            ['[]', []],
            ['null', null],
            ['undefined', undefined],
          ])('throws if key is invalid -> %s', (_testLabel: string, key: any) => {
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

            cache.set('key_1', 'foo');
            cache.set('key_2', 'bar');
            expect(cache.keys()).toEqual(['key_1', 'key_2']);
        });
    });

    describe('has', () => {
        it.each([
            ['1', 1],
            ['""', ''],
            ['{}', {}],
            ['[]', []],
            ['null', null],
            ['undefined', undefined],
          ])('throws if key is invalid -> %s', (_testLabel: string, key: any) => {
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
        it.each([
            ['1', 1],
            ['""', ''],
            ['{}', {}],
            ['[]', []],
            ['null', null],
            ['undefined', undefined],
          ])('throws if key is invalid -> %s', (_testLabel: string, key: any) => {
            const cache = initCache();

            expect(() => cache.del(key))
                .toThrowError("Key must be a non-empty string");
          })

        it('deletes an existing key', () => {
            const cache = initCache();

            cache.set('key_1', 'bar');
            cache.set('key_2', 'bar');
            
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

    describe('flushAll', () => {
        it('deletes all keys', () => {
            const cache = initCache();

            cache.set('key_1', 'bar');
            cache.set('key_2', 'bar');
            
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