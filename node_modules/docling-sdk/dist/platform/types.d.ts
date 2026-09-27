import type { BinaryData } from "./binary";
export interface HttpRequestOptions {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
    headers?: Record<string, string>;
    body?: string | BinaryData | FormData | ReadableStream<Uint8Array>;
    timeout?: number;
    retry?: number;
    retryDelay?: number;
    retryStatusCodes?: number[];
    signal?: AbortSignal;
    responseType?: "json" | "text" | "binary" | "stream";
}
export interface HttpResponse<T = unknown> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    _raw?: Response;
}
export interface HttpClientConfig {
    baseUrl: string;
    timeout?: number;
    headers?: Record<string, string>;
    retry?: number;
    retryDelay?: number;
    retryStatusCodes?: number[];
}
export interface FileUploadInfo {
    name: string;
    data: BinaryData | string;
    filename?: string;
    contentType?: string;
}
export interface UploadProgress {
    uploadedBytes: number;
    totalBytes: number;
    percentage: number;
    currentFile: string;
    stage: "preparing" | "uploading" | "processing" | "completed";
}
export interface WebSocketHooks {
    open?: (peer: WebSocketPeer) => void;
    message?: (peer: WebSocketPeer, message: WebSocketMessage) => void;
    close?: (peer: WebSocketPeer, event: {
        code: number;
        reason: string;
    }) => void;
    error?: (peer: WebSocketPeer, error: Error) => void;
}
export interface WebSocketPeer {
    id: string;
    readyState: number;
    send(data: string | BinaryData): void;
    close(code?: number, reason?: string): void;
    url: string;
}
export interface WebSocketMessage {
    type: "text" | "binary";
    data: string | BinaryData;
    json<T = unknown>(): T;
    text(): string;
}
export interface WebSocketClientOptions {
    url: string;
    protocols?: string | string[];
    reconnect?: boolean;
    maxReconnectAttempts?: number;
    reconnectDelay?: number;
    heartbeatInterval?: number;
    timeout?: number;
}
export type WebSocketState = "connecting" | "connected" | "disconnected" | "reconnecting" | "error";
export interface FetchContext {
    request: string;
    options: RequestInit & {
        baseURL?: string;
    };
    response?: Response;
    error?: Error;
}
export interface FetchInterceptors {
    onRequest?: (context: FetchContext) => void | Promise<void>;
    onResponse?: (context: FetchContext) => void | Promise<void>;
    onRequestError?: (context: FetchContext) => void | Promise<void>;
    onResponseError?: (context: FetchContext) => void | Promise<void>;
}
export interface ExtendedHttpOptions extends HttpRequestOptions, FetchInterceptors {
    query?: Record<string, string | number | boolean | undefined>;
    parseResponse?: boolean;
    ignoreResponseError?: boolean;
}
export interface ProcessingError {
    message: string;
    code?: string;
    details?: unknown;
}
export interface StreamReadOptions {
    chunkSize?: number;
    maxBytes?: number;
    signal?: AbortSignal;
    onProgress?: (bytesRead: number, totalBytes?: number) => void;
}
