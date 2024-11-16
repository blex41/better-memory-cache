import { describe, expect, it } from 'vitest';
import Cache from '../src/index';

describe('Dump', () => {
    it('can load a previously dumped cache', () => {
        const cacheA = new Cache<string>();
        cacheA.set('foo', 'bar');
        const dump = cacheA.dump();

        const cacheB = new Cache<string>().load(dump);
        cacheB.set('baz', 'qux');

        expect(cacheB.keys()).toEqual(['foo', 'baz']);
    });
});