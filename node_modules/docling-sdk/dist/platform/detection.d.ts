export type RuntimeEnvironment = "node" | "bun" | "deno" | "browser" | "unknown";
export declare function isNode(): boolean;
export declare function isBun(): boolean;
export declare function isDeno(): boolean;
export declare function isBrowser(): boolean;
export declare function isServer(): boolean;
export declare function hasNativeWebSocket(): boolean;
export declare function hasNativeFetch(): boolean;
export declare function hasWebStreams(): boolean;
export declare function hasAbortController(): boolean;
export declare function hasFormData(): boolean;
export declare function hasBlob(): boolean;
export declare function hasFile(): boolean;
export declare function hasRandomUUID(): boolean;
export declare function detectRuntime(): RuntimeEnvironment;
export declare function getRuntimeInfo(): {
    runtime: RuntimeEnvironment;
    version?: string;
    features: {
        nativeWebSocket: boolean;
        nativeFetch: boolean;
        webStreams: boolean;
        abortController: boolean;
        formData: boolean;
        blob: boolean;
        file: boolean;
        randomUUID: boolean;
    };
};
declare global {
    var Bun: {
        version?: string;
    } | undefined;
    var Deno: {
        version?: {
            deno?: string;
        };
    } | undefined;
}
