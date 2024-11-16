/**
 * Returns a Promise that resolves after the given number of milliseconds.
 * @param {number} ms 
 */
export async function sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns true if the object has the given key, and false otherwise.
 * @param {object} obj 
 * @param {string} key 
 * @returns {boolean}
 */
export function hasOwnProperty(obj: Record<string, unknown>, key: string) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

export function withTimeout(promise: Promise<unknown>, ms: number) {
    return Promise.race([
        promise,
        sleep(ms)
    ]);
};