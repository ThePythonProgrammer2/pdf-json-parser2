import { type BinaryData } from "../platform/binary";
import type { ApiClientConfig } from "../types/api";
export interface HttpRequestOptions extends Omit<RequestInit, "signal"> {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    accept?: "json" | "text" | "bytes";
}
export interface HttpResponse<T = unknown> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
}
export declare class HttpClient {
    private platformClient;
    private config;
    constructor(config: ApiClientConfig);
    request<T>(endpoint: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
    get<T = unknown>(endpoint: string, options?: Omit<HttpRequestOptions, "method">): Promise<HttpResponse<T>>;
    post<T = unknown>(endpoint: string, body?: BodyInit | null, options?: Omit<HttpRequestOptions, "method" | "body">): Promise<HttpResponse<T>>;
    put<T = unknown>(endpoint: string, body?: BodyInit | null, options?: Omit<HttpRequestOptions, "method" | "body">): Promise<HttpResponse<T>>;
    delete<T = unknown>(endpoint: string, options?: Omit<HttpRequestOptions, "method">): Promise<HttpResponse<T>>;
    getJson<T>(endpoint: string, options?: Omit<HttpRequestOptions, "accept" | "method">): Promise<HttpResponse<T>>;
    postJson<T>(endpoint: string, body?: unknown, options?: Omit<HttpRequestOptions, "accept" | "method" | "body">): Promise<HttpResponse<T>>;
    putJson<T>(endpoint: string, body?: unknown, options?: Omit<HttpRequestOptions, "accept" | "method" | "body">): Promise<HttpResponse<T>>;
    deleteJson<T>(endpoint: string, options?: Omit<HttpRequestOptions, "accept" | "method">): Promise<HttpResponse<T>>;
    requestJson<T>(endpoint: string, options?: Omit<HttpRequestOptions, "accept">): Promise<HttpResponse<T>>;
    requestText(endpoint: string, options?: Omit<HttpRequestOptions, "accept">): Promise<HttpResponse<string>>;
    requestBytes(endpoint: string, options?: Omit<HttpRequestOptions, "accept">): Promise<HttpResponse<BinaryData>>;
    uploadFiles<T = unknown>(endpoint: string, files: Array<{
        name: string;
        data: BinaryData | string;
        filename?: string;
        contentType?: string;
    }>, fields?: Record<string, unknown>, options?: Omit<HttpRequestOptions, "method" | "body">): Promise<HttpResponse<T>>;
    streamUpload<T = unknown>(endpoint: string, files: Array<{
        name: string;
        data: BinaryData | ReadableStream;
        filename?: string;
        contentType?: string;
        size?: number;
    }>, fields?: Record<string, unknown>, options?: {
        onProgress?: (progress: {
            uploadedBytes: number;
            totalBytes: number;
            percentage: number;
            currentFile: string;
            stage: "preparing" | "uploading" | "processing" | "completed";
        }) => void;
        chunkSize?: number;
    } & Omit<HttpRequestOptions, "method" | "body">): Promise<HttpResponse<T>>;
    chunkedStreamUpload<T = unknown>(endpoint: string, file: {
        name: string;
        stream: ReadableStream<Uint8Array>;
        filename: string;
        contentType?: string;
        size: number;
    }, fields?: Record<string, unknown>, options?: {
        onProgress?: (progress: {
            uploadedBytes: number;
            totalBytes: number;
            percentage: number;
            chunkIndex: number;
            totalChunks: number;
            stage: "preparing" | "uploading" | "processing" | "completed";
        }) => void;
        chunkSize?: number;
    } & Omit<HttpRequestOptions, "method" | "body">): Promise<HttpResponse<T>>;
    pipelineUpload<T = unknown>(endpoint: string, file: {
        name: string;
        stream: NodeJS.ReadableStream;
        filename: string;
        contentType?: string;
        size?: number;
    }, fields?: Record<string, unknown>, options?: {
        onProgress?: (progress: {
            uploadedBytes: number;
            totalBytes: number;
            percentage: number;
            bytesPerSecond: number;
            stage: "preparing" | "uploading" | "processing" | "completed";
        }) => void;
    } & Omit<HttpRequestOptions, "method" | "body">): Promise<HttpResponse<T>>;
    streamPassthrough<T = unknown>(endpoint: string, inputStream: NodeJS.ReadableStream, filename: string, contentType: string, fields?: Record<string, unknown>, options?: {
        onProgress?: (progress: {
            uploadedBytes: number;
            totalBytes: number;
            percentage: number;
            bytesPerSecond: number;
            stage: "preparing" | "uploading" | "processing" | "completed";
        }) => void;
        estimatedSize?: number;
        accept?: "json" | "zip";
    } & Omit<HttpRequestOptions, "method" | "body">): Promise<HttpResponse<T>>;
    uploadFileStream<T = unknown>(endpoint: string, filePath: string, fieldName?: string, fields?: Record<string, unknown>, options?: {
        onProgress?: (progress: {
            uploadedBytes: number;
            totalBytes: number;
            percentage: number;
            bytesPerSecond: number;
            stage: "preparing" | "uploading" | "processing" | "completed";
        }) => void;
    } & Omit<HttpRequestOptions, "method" | "body">): Promise<HttpResponse<T>>;
    requestFileStream<T = unknown>(endpoint: string, options?: HttpRequestOptions): Promise<{
        data?: T;
        fileStream?: import("node:stream").Readable;
        fileMetadata?: {
            filename: string;
            contentType: string;
            size?: number;
        };
        status: number;
        statusText: string;
        headers: Record<string, string>;
    }>;
    updateConfig(config: Partial<ApiClientConfig>): void;
    getConfig(): ApiClientConfig;
    getPoolStats(): {
        total: number;
        pending: number;
        free: number;
        active: number;
    };
    getPoolHealth(): {
        healthy: boolean;
    };
    updatePoolConfig(_config: unknown): void;
    closeIdleConnections(): void;
    destroy(): void;
    private buildHeaders;
    private normalizeBody;
    private toUint8Array;
    private toBuffer;
    private nodeStreamToWebStream;
    private getContentTypeFromFilename;
    private normalizeError;
}
