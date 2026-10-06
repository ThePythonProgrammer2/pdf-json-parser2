export * from "./docling-core";
export * from "./api";
export * from "./cli";
export type { OpenAPI, paths, components, operations } from "./generated";
export * from "./adapters";
export interface DoclingClientConfig {
    cli?: {
        doclingPath?: string;
        pythonPath?: string;
        timeout?: number;
        cwd?: string;
        env?: Record<string, string>;
    };
    api?: {
        baseUrl?: string;
        timeout?: number;
        headers?: Record<string, string>;
        retries?: number;
        retryDelay?: number;
    };
}
export declare class DoclingError extends Error {
    code?: string | undefined;
    details?: unknown | undefined;
    constructor(message: string, code?: string | undefined, details?: unknown | undefined);
}
export declare class DoclingNetworkError extends DoclingError {
    statusCode?: number | undefined;
    response?: unknown | undefined;
    constructor(message: string, statusCode?: number | undefined, response?: unknown | undefined);
}
export declare class DoclingValidationError extends DoclingError {
    field?: string | undefined;
    value?: unknown | undefined;
    constructor(message: string, field?: string | undefined, value?: unknown | undefined);
}
export declare class DoclingTimeoutError extends DoclingError {
    constructor(timeout: number, operation?: string);
}
export declare class DoclingFileError extends DoclingError {
    filePath?: string | undefined;
    fileSize?: number | undefined;
    constructor(message: string, filePath?: string | undefined, fileSize?: number | undefined);
}
export declare const DoclingUtils: {
    isValidFilePath: (path: string) => boolean;
    getFileExtension: (filename: string) => string;
    isSupportedFileExtension: (filename: string) => boolean;
    formatFileSize: (bytes: number) => string;
};
