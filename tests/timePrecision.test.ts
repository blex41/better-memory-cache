import { describe, expect, it } from 'vitest';
import Cache from '../src/index';
import { sleep } from '../src/utils';

function initCache(timePrecisionMs?: number) {
    const cache = new Cache<string>({
        refreshAfterMs: 50,
        timePrecisionMs,
        fetchMethod: () => 'new_value',
    });

    cache.set('foo', 'initial_value');

    return cache;
}

describe('TimePrecision', () => {
    describe('with value larger than refreshAfterMs', () => {
        it('refreshes the value long after the 50 ms refresh delay', async () => {
            const cache = initCache(200);

            await sleep(150);
            expect(cache.get('foo')).toBe('initial_value');
            await sleep(60);
            expect(cache.get('foo')).toBe('new_value');
        });
    });

    describe('with value smaller than refreshAfterMs', () => {
        it('refreshes the value around refresh delay', async () => {
            const cache = initCache(10);

            await sleep(5);
            expect(cache.get('foo')).toBe('initial_value');
            await sleep(100);
            expect(cache.get('foo')).toBe('new_value');
        });
    });
});