export interface Success<T> {
    readonly success: true;
    readonly data: T;
}
export interface Failure<E> {
    readonly success: false;
    readonly error: E;
}
export type Result<T, E = Error> = Success<T> | Failure<E>;
export declare function success<T>(data: T): Success<T>;
export declare function failure<E>(error: E): Failure<E>;
export declare function tryAsync<T, E = Error>(fn: () => Promise<T>): Promise<Result<T, E>>;
