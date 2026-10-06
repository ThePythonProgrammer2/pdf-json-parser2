import { $fetch, type FetchError, type FetchOptions, ofetch } from "ofetch";
import { type BinaryData } from "./binary";
import type { ExtendedHttpOptions, FileUploadInfo, HttpClientConfig, HttpResponse, UploadProgress } from "./types";
export declare class PlatformHttpClient {
    private config;
    private fetcher;
    constructor(config: HttpClientConfig);
    request<T = unknown>(endpoint: string, options?: ExtendedHttpOptions): Promise<HttpResponse<T>>;
    get<T = unknown>(endpoint: string, options?: Omit<ExtendedHttpOptions, "method">): Promise<HttpResponse<T>>;
    post<T = unknown>(endpoint: string, body?: unknown, options?: Omit<ExtendedHttpOptions, "method" | "body">): Promise<HttpResponse<T>>;
    put<T = unknown>(endpoint: string, body?: unknown, options?: Omit<ExtendedHttpOptions, "method" | "body">): Promise<HttpResponse<T>>;
    delete<T = unknown>(endpoint: string, options?: Omit<ExtendedHttpOptions, "method">): Promise<HttpResponse<T>>;
    getJson<T = unknown>(endpoint: string, options?: Omit<ExtendedHttpOptions, "method" | "responseType">): Promise<HttpResponse<T>>;
    postJson<T = unknown>(endpoint: string, body?: unknown, options?: Omit<ExtendedHttpOptions, "method" | "body" | "responseType">): Promise<HttpResponse<T>>;
    putJson<T = unknown>(endpoint: string, body?: unknown, options?: Omit<ExtendedHttpOptions, "method" | "body" | "responseType">): Promise<HttpResponse<T>>;
    deleteJson<T = unknown>(endpoint: string, options?: Omit<ExtendedHttpOptions, "method" | "responseType">): Promise<HttpResponse<T>>;
    getBytes(endpoint: string, options?: Omit<ExtendedHttpOptions, "method" | "responseType">): Promise<HttpResponse<Uint8Array>>;
    getText(endpoint: string, options?: Omit<ExtendedHttpOptions, "method" | "responseType">): Promise<HttpResponse<string>>;
    uploadFiles<T = unknown>(endpoint: string, files: FileUploadInfo[], fields?: Record<string, unknown>, options?: Omit<ExtendedHttpOptions, "method" | "body">): Promise<HttpResponse<T>>;
    streamUpload<T = unknown>(endpoint: string, files: Array<{
        name: string;
        data: BinaryData | ReadableStream<Uint8Array>;
        filename?: string;
        contentType?: string;
        size?: number;
    }>, fields?: Record<string, unknown>, options?: {
        onProgress?: (progress: UploadProgress) => void;
        chunkSize?: number;
    } & Omit<ExtendedHttpOptions, "method" | "body">): Promise<HttpResponse<T>>;
    requestFileStream<T = unknown>(endpoint: string, options?: ExtendedHttpOptions): Promise<{
        data?: T;
        fileStream?: ReadableStream<Uint8Array>;
        fileMetadata?: {
            filename: string;
            contentType: string;
            size?: number;
        };
        status: number;
        statusText: string;
        headers: Record<string, string>;
    }>;
    updateConfig(config: Partial<HttpClientConfig>): void;
    getConfig(): HttpClientConfig;
    private normalizeError;
    private extractErrorMessage;
}
export declare function createHttpClient(config: HttpClientConfig): PlatformHttpClient;
export { $fetch, ofetch, type FetchOptions, type FetchError };
