import { existsSync, rmSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Cache from '../src/index';
import * as Persistence from '../src/Persistence';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_PERSISTENCE_PREFIX = join(__dirname, '.tmp-persistence-test');

function cleanupTestFiles() {
    if (existsSync(TEST_PERSISTENCE_PREFIX)) {
        rmSync(TEST_PERSISTENCE_PREFIX, { recursive: true });
    }
}

describe('Persistence', () => {
    afterEach(() => {
        cleanupTestFiles();
    });

    describe('options validation', () => {
        it('throws if persistenceDirPath is set without namespace', () => {
            expect(() => new Cache<string>({
                persistenceDirPath: TEST_PERSISTENCE_PREFIX,
            })).toThrowError("namespace is required when persistenceDirPath is set");
        });

        it('does not throw if persistenceDirPath and namespace are both set', () => {
            const cache = new Cache<string>({
                namespace: 'test',
                persistenceDirPath: TEST_PERSISTENCE_PREFIX,
            });
            cache.stop();

            expect(cache).toBeDefined();
        });
    });

    describe('set', () => {
        it('persists data to file system', () => {
            const cache = new Cache<string>({
                namespace: 'test-set',
                persistenceDirPath: TEST_PERSISTENCE_PREFIX,
            });
            cache.stop();

            cache.set('foo', 'bar');

            const expectedFile = join(TEST_PERSISTENCE_PREFIX, 'test-set.cache.json');
            expect(existsSync(expectedFile)).toBe(true);
        });
    });

    describe('mset', () => {
        it('persists data to file system', () => {
            const cache = new Cache<string>({
                namespace: 'test-mset',
                persistenceDirPath: TEST_PERSISTENCE_PREFIX,
            });
            cache.stop();

            cache.mset([
                ['foo', 'bar'],
                ['baz', 'qux'],
            ]);

            const expectedFile = join(TEST_PERSISTENCE_PREFIX, 'test-mset.cache.json');
            expect(existsSync(expectedFile)).toBe(true);
        });
    });

    describe('restore', () => {
        it('restores persisted data when creating a new cache', () => {
            const cache1 = new Cache<string>({
                namespace: 'test-restore',
                persistenceDirPath: TEST_PERSISTENCE_PREFIX,
            });
            cache1.stop();

            cache1.set('foo', 'bar');
            cache1.set('baz', 'qux');

            const cache2 = new Cache<string>({
                namespace: 'test-restore',
                persistenceDirPath: TEST_PERSISTENCE_PREFIX,
            });
            cache2.stop();

            expect(cache2.get('foo')).toBe('bar');
            expect(cache2.get('baz')).toBe('qux');
            expect(cache2.keys()).toEqual(['foo', 'baz']);
        });

        it('does not restore data if namespace is different', () => {
            const cache1 = new Cache<string>({
                namespace: 'test-restore-ns1',
                persistenceDirPath: TEST_PERSISTENCE_PREFIX,
            });
            cache1.stop();

            cache1.set('foo', 'bar');

            const cache2 = new Cache<string>({
                namespace: 'test-restore-ns2',
                persistenceDirPath: TEST_PERSISTENCE_PREFIX,
            });
            cache2.stop();

            expect(cache2.get('foo')).toBe(undefined);
            expect(cache2.keys()).toEqual([]);
        });

        it('does not restore data if persistenceDirPath is not set', () => {
            const cache1 = new Cache<string>({
                namespace: 'test-restore-no-prefix',
                persistenceDirPath: TEST_PERSISTENCE_PREFIX,
            });
            cache1.stop();

            cache1.set('foo', 'bar');

            const cache2 = new Cache<string>({
                namespace: 'test-restore-no-prefix',
            });
            cache2.stop();

            expect(cache2.get('foo')).toBe(undefined);
            expect(cache2.keys()).toEqual([]);
        });
    });

    describe('del', () => {
        it('updates persisted data when deleting a key', () => {
            const cache1 = new Cache<string>({
                namespace: 'test-del',
                persistenceDirPath: TEST_PERSISTENCE_PREFIX,
            });
            cache1.stop();

            cache1.set('foo', 'bar');
            cache1.set('baz', 'qux');
            cache1.del('foo');

            const cache2 = new Cache<string>({
                namespace: 'test-del',
                persistenceDirPath: TEST_PERSISTENCE_PREFIX,
            });
            cache2.stop();

            expect(cache2.get('foo')).toBe(undefined);
            expect(cache2.get('baz')).toBe('qux');
        });
    });

    describe('mdel', () => {
        it('updates persisted data when deleting multiple keys', () => {
            const cache1 = new Cache<string>({
                namespace: 'test-mdel',
                persistenceDirPath: TEST_PERSISTENCE_PREFIX,
            });
            cache1.stop();

            cache1.mset([
                ['foo', 'bar'],
                ['baz', 'qux'],
                ['quux', 'corge'],
            ]);
            cache1.mdel(['foo', 'baz']);

            const cache2 = new Cache<string>({
                namespace: 'test-mdel',
                persistenceDirPath: TEST_PERSISTENCE_PREFIX,
            });
            cache2.stop();

            expect(cache2.get('foo')).toBe(undefined);
            expect(cache2.get('baz')).toBe(undefined);
            expect(cache2.get('quux')).toBe('corge');
        });
    });

    describe('flushAll', () => {
        it('removes persisted file when flushing cache', () => {
            const cache = new Cache<string>({
                namespace: 'test-flush',
                persistenceDirPath: TEST_PERSISTENCE_PREFIX,
            });
            cache.stop();

            cache.set('foo', 'bar');

            const expectedFile = join(TEST_PERSISTENCE_PREFIX, 'test-flush.cache.json');
            expect(existsSync(expectedFile)).toBe(true);

            cache.flushAll();

            expect(existsSync(expectedFile)).toBe(false);
        });

        it('clears persisted data so new cache starts empty', () => {
            const cache1 = new Cache<string>({
                namespace: 'test-flush-restore',
                persistenceDirPath: TEST_PERSISTENCE_PREFIX,
            });
            cache1.stop();

            cache1.set('foo', 'bar');
            cache1.flushAll();

            const cache2 = new Cache<string>({
                namespace: 'test-flush-restore',
                persistenceDirPath: TEST_PERSISTENCE_PREFIX,
            });
            cache2.stop();

            expect(cache2.get('foo')).toBe(undefined);
            expect(cache2.keys()).toEqual([]);
        });
    });

    describe('load', () => {
        it('updates persisted data when loading a cache', () => {
            const cache1 = new Cache<string>({
                namespace: 'test-load',
                persistenceDirPath: TEST_PERSISTENCE_PREFIX,
            });
            cache1.stop();

            cache1.load({
                'foo': { v: 'bar', c: Date.now(), a: null, r: Date.now() },
                'baz': { v: 'qux', c: Date.now(), a: null, r: Date.now() },
            });

            const cache2 = new Cache<string>({
                namespace: 'test-load',
                persistenceDirPath: TEST_PERSISTENCE_PREFIX,
            });
            cache2.stop();

            expect(cache2.get('foo')).toBe('bar');
            expect(cache2.get('baz')).toBe('qux');
        });
    });

    describe('without persistence', () => {
        it('does not create files when persistenceDirPath is not set', () => {
            const cache = new Cache<string>({
                namespace: 'test-no-persist',
            });
            cache.stop();

            cache.set('foo', 'bar');

            expect(existsSync(TEST_PERSISTENCE_PREFIX)).toBe(false);
        });
    });

    describe('error handling', () => {
        it('handles setItem failure gracefully', () => {
            const setItemSpy = vi.spyOn(Persistence, 'setItem').mockImplementation(() => {
                throw new Error('Write failed');
            });

            const cache = new Cache<string>({
                namespace: 'test-setitem-error',
                persistenceDirPath: TEST_PERSISTENCE_PREFIX,
            });
            cache.stop();

            // Should not throw even when persistence fails
            expect(() => cache.set('foo', 'bar')).not.toThrow();

            setItemSpy.mockRestore();
        });

        it('handles removeItem failure gracefully', () => {
            const cache = new Cache<string>({
                namespace: 'test-removeitem-error',
                persistenceDirPath: TEST_PERSISTENCE_PREFIX,
            });
            cache.stop();

            cache.set('foo', 'bar');

            const removeItemSpy = vi.spyOn(Persistence, 'removeItem').mockImplementation(() => {
                throw new Error('Remove failed');
            });

            // Should not throw even when clearing persistence fails
            expect(() => cache.flushAll()).not.toThrow();

            removeItemSpy.mockRestore();
        });

        it('handles flushAll when persisted file does not exist', () => {
            const cache = new Cache<string>({
                namespace: 'test-flush-no-file',
                persistenceDirPath: TEST_PERSISTENCE_PREFIX,
            });
            cache.stop();

            // flushAll without any prior set - file doesn't exist
            expect(() => cache.flushAll()).not.toThrow();
        });
    });
});
