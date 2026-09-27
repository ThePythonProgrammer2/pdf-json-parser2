import type { EventEmitter } from "node:events";
import type { AsyncTaskManager } from "../services/async-task-manager";
import type { ChunkService } from "../services/chunk";
import type { FileService } from "../services/file";
import type { Result } from "../utils/result";
import type { AcceleratorOptions, AsyncChunkTask, AsyncConversionTask, ChunkDocumentResponse, ChunkFileUploadParams, ConversionFileResult, ConversionOptions, ConversionTarget, ConvertDocumentResponse, ConvertDocumentsRequest, FileSource, FileUploadParams, HealthCheckResponse, HierarchicalChunkerOptionsDocumentsRequest, HttpSource, HybridChunkerOptionsDocumentsRequest, LayoutOptions, OcrEngine, OcrOptions, PdfBackend, PresignedUrlConvertDocumentResponse, ProcessingPipeline, S3Source, TableMode, TargetConversionResult, TaskStatusResponse } from "./api";
import type { ImageInput, WebClientEvents, WebOCRResult, WebProcessOptions } from "./web";
export interface ProgressUpdate {
    stage: string;
    percentage?: number;
    message?: string;
    taskId?: string;
    position?: number;
    status?: string;
    timestamp: number;
    source?: "websocket" | "http";
    memoryUsage?: NodeJS.MemoryUsage;
    uploadedBytes?: number;
    totalBytes?: number;
    bytesPerSecond?: number;
}
export interface ProcessingError {
    message: string;
    code?: string;
    details?: unknown;
}
export interface S3Config {
    bucket: string;
    key?: string;
    region?: string;
    endpoint?: string;
    access_key_id?: string;
    secret_access_key?: string;
    session_token?: string;
    verify_ssl?: boolean;
}
export type SafeConversionResult = Result<ConvertDocumentResponse, ProcessingError>;
export type SafeFileConversionResult = Result<ConversionFileResult, ProcessingError>;
export interface ProgressConfig {
    method?: "websocket" | "http" | "hybrid";
    websocketTimeout?: number;
    httpPollInterval?: number;
    onProgress?: (progress: ProgressUpdate) => void;
    onComplete?: (result: unknown) => Promise<void> | void;
    onError?: (error: Error) => Promise<void> | void;
    onWebhook?: (webhookData: Record<string, unknown>) => Promise<void> | void;
}
export interface DoclingSharedConfig {
    defaultOptions?: ConversionOptions;
    retries?: number;
    timeout?: number;
    waitSeconds?: number;
    pollingRetries?: number;
    ocr_engine?: OcrEngine;
    ocr_options?: OcrOptions;
    pdf_backend?: PdfBackend;
    table_mode?: TableMode;
    pipeline?: ProcessingPipeline;
    accelerator_options?: AcceleratorOptions;
    layout_options?: LayoutOptions;
}
export type DoclingConfig = ({
    api: {
        baseUrl: string;
        apiKey?: string;
        timeout?: number;
        retries?: number;
        headers?: Record<string, string>;
    };
    cli?: never;
    web?: never;
    progress?: ProgressConfig;
} & DoclingSharedConfig) | ({
    cli: {
        outputDir?: string;
        verbose?: boolean;
        progressBar?: boolean;
        tempDir?: string;
        concurrency?: number;
    };
    api?: never;
    web?: never;
    progress?: ProgressConfig;
} & DoclingSharedConfig) | {
    web: {
        device?: "webgpu" | "wasm" | "auto";
        modelId?: string;
        maxNewTokens?: number;
        wasmPaths?: Record<string, string>;
        workerUrl?: string;
    };
    api?: never;
    cli?: never;
};
export interface DoclingAPIConfig extends DoclingSharedConfig {
    type: "api";
    baseUrl: string;
    apiKey?: string;
    timeout?: number;
    retries?: number;
    headers?: Record<string, string>;
    progress?: ProgressConfig;
}
export interface DoclingCLIConfig extends DoclingSharedConfig {
    type: "cli";
    outputDir?: string;
    verbose?: boolean;
    progressBar?: boolean;
    tempDir?: string;
    concurrency?: number;
    progress?: ProgressConfig;
    pythonPath?: string;
    doclingPath?: string;
}
export interface DoclingClientBase {
    readonly type: "api" | "cli" | "web";
    convert(file: Uint8Array | string, filename: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    extractText(file: Uint8Array | string, filename: string, options?: Omit<ConversionOptions, "to_formats">): Promise<ConvertDocumentResponse>;
    toHtml(file: Uint8Array | string, filename: string, options?: Omit<ConversionOptions, "to_formats">): Promise<ConvertDocumentResponse>;
    toMarkdown(file: Uint8Array | string, filename: string, options?: Omit<ConversionOptions, "to_formats">): Promise<ConvertDocumentResponse>;
    convertDocument(file: Uint8Array | string, filename: string, options: ConversionOptions): Promise<ConvertDocumentResponse>;
    process(file: Uint8Array | string, filename: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    convertToFile(file: Uint8Array | string, filename: string, options: ConversionOptions): Promise<ConversionFileResult>;
    safeConvert(file: Uint8Array | string, filename: string, options?: ConversionOptions): Promise<SafeConversionResult>;
    safeConvertToFile(file: Uint8Array | string, filename: string, options: ConversionOptions): Promise<SafeFileConversionResult>;
}
export interface DoclingAPI extends DoclingClientBase {
    readonly files: FileService;
    readonly chunks: ChunkService;
    convertSync(file: Uint8Array | string, filename: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    convertAsync(file: Uint8Array | string, filename: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    convertStream(inputStream: NodeJS.ReadableStream, filename: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    convertStreamToFile(inputStream: NodeJS.ReadableStream, filename: string, options: ConversionOptions): Promise<ConversionFileResult>;
    convert(file: Uint8Array | string, filename: string, options?: ConversionOptions, progress?: ProgressConfig): Promise<ConvertDocumentResponse>;
    toHtml(file: Uint8Array | string, filename: string, options?: Omit<ConversionOptions, "to_formats">, progress?: ProgressConfig): Promise<ConvertDocumentResponse>;
    toMarkdown(file: Uint8Array | string, filename: string, options?: Omit<ConversionOptions, "to_formats">, progress?: ProgressConfig): Promise<ConvertDocumentResponse>;
    convertDocument(file: Uint8Array | string, filename: string, options: ConversionOptions, progress?: ProgressConfig): Promise<ConvertDocumentResponse>;
    process(file: Uint8Array | string, filename: string, options?: ConversionOptions, progress?: ProgressConfig): Promise<ConvertDocumentResponse>;
    convertToFile(file: Uint8Array | string, filename: string, options: ConversionOptions, progress?: ProgressConfig): Promise<ConversionFileResult>;
    getTaskManager(): AsyncTaskManager;
    health(): Promise<HealthCheckResponse>;
    convertSource(request: ConvertDocumentsRequest): Promise<ConvertDocumentResponse | PresignedUrlConvertDocumentResponse>;
    convertFile(params: FileUploadParams): Promise<ConvertDocumentResponse>;
    convertSourceAsync(request: ConvertDocumentsRequest): Promise<AsyncConversionTask>;
    convertFileAsync(params: FileUploadParams): Promise<AsyncConversionTask>;
    convertFileAsyncToZip(params: FileUploadParams): Promise<AsyncConversionTask>;
    pollTaskStatus(taskId: string, waitSeconds?: number): Promise<TaskStatusResponse>;
    getTaskResult(taskId: string): Promise<ConvertDocumentResponse | PresignedUrlConvertDocumentResponse>;
    getTaskResultFile(taskId: string): Promise<ConversionFileResult>;
    convertFromUrl(url: string, options?: ConversionOptions, headers?: Record<string, string>): Promise<ConvertDocumentResponse>;
    convertFromFile(filePath: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    convertFromBuffer(buffer: Uint8Array, filename: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    convertFromBase64(base64String: string, filename: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    convertFromS3(s3Config: S3Config, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    convertWithTarget(sources: (HttpSource | FileSource | S3Source)[], target: ConversionTarget, options?: ConversionOptions): Promise<TargetConversionResult>;
    chunkHybridSync(file: Uint8Array | string, filename: string, options?: ConversionOptions): Promise<ChunkDocumentResponse>;
    chunkHierarchicalSync(file: Uint8Array | string, filename: string, options?: ConversionOptions): Promise<ChunkDocumentResponse>;
    chunkHybridAsync(file: Uint8Array | string, filename: string, options?: ConversionOptions): Promise<ChunkDocumentResponse>;
    chunkHierarchicalAsync(file: Uint8Array | string, filename: string, options?: ConversionOptions): Promise<ChunkDocumentResponse>;
    chunkHybridFileAsync(params: ChunkFileUploadParams): Promise<AsyncChunkTask>;
    chunkHierarchicalFileAsync(params: ChunkFileUploadParams): Promise<AsyncChunkTask>;
    chunkHybridSource(request: HybridChunkerOptionsDocumentsRequest): Promise<ChunkDocumentResponse>;
    chunkHierarchicalSource(request: HierarchicalChunkerOptionsDocumentsRequest): Promise<ChunkDocumentResponse>;
    chunkHybridSourceAsync(request: HybridChunkerOptionsDocumentsRequest): Promise<AsyncChunkTask>;
    chunkHierarchicalSourceAsync(request: HierarchicalChunkerOptionsDocumentsRequest): Promise<AsyncChunkTask>;
}
export interface DoclingCLI extends DoclingClientBase {
    watch(directory: string, options?: {
        outputDir?: string;
        recursive?: boolean;
        patterns?: string[];
        debounce?: number;
    }): Promise<void>;
    batch(files: string[], options?: ConversionOptions & {
        outputDir?: string;
        parallel?: boolean;
        maxConcurrency?: number;
    }): Promise<{
        success: boolean;
        results: Array<{
            file: string;
            success: boolean;
            output?: string;
            error?: string;
        }>;
    }>;
    processDirectory(directoryPath: string, options?: ConversionOptions): Promise<{
        success: boolean;
        results: ConvertDocumentResponse[];
        totalFiles: number;
    }>;
    readonly progress: EventEmitter;
    setOutputDir(dir: string): void;
    validateFiles(files: string[]): Promise<{
        valid: string[];
        invalid: Array<{
            file: string;
            reason: string;
        }>;
    }>;
}
export interface DoclingWeb extends DoclingClientBase {
    readonly type: "web";
    initialize(): Promise<void>;
    destroy(): void;
    readonly ready: boolean;
    readonly processing: boolean;
    processImage(input: ImageInput, options?: WebProcessOptions): Promise<WebOCRResult>;
    on<K extends keyof WebClientEvents>(event: K, callback: (data: WebClientEvents[K]) => void): this;
    off<K extends keyof WebClientEvents>(event: K, callback: (data: WebClientEvents[K]) => void): this;
    clearCache(): Promise<boolean>;
    getCacheSize(): Promise<number>;
}
export type DoclingClient<T extends DoclingConfig> = T extends {
    api: unknown;
} ? DoclingAPI : T extends {
    cli: unknown;
} ? DoclingCLI : T extends {
    web: unknown;
} ? DoclingWeb : DoclingAPI;
export type DoclingInstance<T extends DoclingConfig> = DoclingClient<T>;
export declare function isAPIConfig(config: DoclingConfig): config is Extract<DoclingConfig, {
    api: unknown;
}>;
export declare function isCLIConfig(config: DoclingConfig): config is Extract<DoclingConfig, {
    cli: unknown;
}>;
export declare function isWebConfig(config: DoclingConfig): config is Extract<DoclingConfig, {
    web: unknown;
}>;
