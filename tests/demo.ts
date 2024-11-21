import Cache, { HOUR, MINUTE, SECOND } from '../src/index';
// Or using CommonJS require:
// const { default: Cache, MINUTE, SECOND } = require('better-memory-cache');

const fruitCache = new Cache<string>({
    namespace: 'fruits',
    expireAfterMs: 1 * HOUR,
    staleAfterMs: 15 * MINUTE,
    staleTimeoutMs: 1 * SECOND,
    refreshAfterMs: 45 * MINUTE,
    fetchMethod: async (key: string) => {
        return `${key}_value`;
    },
    maxKeys: 10,
    evictStrategy: 'LRU',
});

(async () => {
    // Setting a key-value pair directly
    fruitCache.set('apple', 'apple_value');
    console.log(fruitCache.has('apple')); // true
    console.log(fruitCache.get('apple')); // "apple_value"

    // Deleting it from the cache
    fruitCache.del('apple');
    console.log(fruitCache.has('apple')); // false
    console.log(fruitCache.get('apple')); // undefined

    // Multiple keys at once
    fruitCache.mset([
        ['kiwi', 'kiwi_value'],
        ['lemon', 'lemon_value']
    ]);
    console.log(fruitCache.mget(['kiwi', 'lemon'])); // ["kiwi_value", "lemon_value"]
    fruitCache.mdel(['kiwi', 'lemon']); 
    console.log(fruitCache.mget(['kiwi', 'lemon'])); // [undefined, undefined]

    // Fetching a value asynchronously
    const banana = await fruitCache.fetch('banana');
    console.log(banana); // "banana_value"

    // Listing all keys, flushing the cache
    console.log(fruitCache.keys()); // ["banana"]
    fruitCache.flushAll();
    console.log(fruitCache.keys()); // []

    // Refreshing a key
    fruitCache.set('cherry', 'initial_value');
    await fruitCache.refresh('cherry');
    console.log(fruitCache.get('cherry')); // "cherry_value"

    // Getting a dump of the cache, to reuse it later
    const cacheDump = fruitCache.dump();
    fruitCache.load(cacheDump);

    // Clear all internal timers or resume them
    fruitCache.stop(); // auto-refreshes/evicts will not work when stopped
    console.log(fruitCache.isStopped()); // true
    fruitCache.resume();

    fruitCache.stop();
})();