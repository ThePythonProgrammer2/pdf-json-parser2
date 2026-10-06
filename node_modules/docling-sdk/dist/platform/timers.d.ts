export declare function delay<T = void>(ms: number, value?: T, signal?: AbortSignal): Promise<T>;
export declare const setTimeout: typeof delay;
export declare function timeout(ms: number, message?: string): Promise<never>;
export declare function createTimeoutController(ms: number): {
    signal: AbortSignal;
    clear: () => void;
};
export declare function withTimeout<T>(promise: Promise<T>, ms: number, message?: string): Promise<T>;
export declare function debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number): (...args: Parameters<T>) => void;
export declare function throttle<T extends (...args: unknown[]) => unknown>(fn: T, ms: number): (...args: Parameters<T>) => void;
export declare function interval(ms: number, signal?: AbortSignal): AsyncIterable<number> & {
    stop: () => void;
};
export declare function retry<T>(fn: () => Promise<T>, options?: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    shouldRetry?: (error: unknown, attempt: number) => boolean;
    onRetry?: (error: unknown, attempt: number, delay: number) => void;
    signal?: AbortSignal;
}): Promise<T>;
