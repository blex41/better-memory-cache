export const cacheErrorCodes = {
    CACHE_ERROR: 'CACHE_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_STATE_ERROR: 'INVALID_STATE_ERROR',
};

export class CacheError extends Error {
    constructor(message: string) {
        super(message);
        this.name = cacheErrorCodes.CACHE_ERROR;
    }
}

export class ValidationError extends CacheError {
    constructor(message: string) {
        super(message);
        this.name = cacheErrorCodes.VALIDATION_ERROR;
    }
}

export class InvalidStateError extends CacheError {
    constructor(message: string) {
        super(message);
        this.name = cacheErrorCodes.INVALID_STATE_ERROR;
    }
}