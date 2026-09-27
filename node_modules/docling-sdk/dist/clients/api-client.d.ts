import { HttpClient } from "../api/http";
import type { AsyncTaskManager } from "../services/async-task-manager";
import { ChunkService } from "../services/chunk";
import { FileService } from "../services/file";
import type { AsyncChunkTask, AsyncConversionTask, ChunkDocumentResponse, ChunkFileUploadParams, ConversionFileResult, ConversionOptions, ConversionTarget, ConvertDocumentResponse, ConvertDocumentsRequest, FileSource, FileUploadParams, HealthCheckResponse, HierarchicalChunkerOptionsDocumentsRequest, HttpSource, HybridChunkerOptionsDocumentsRequest, PresignedUrlConvertDocumentResponse, S3Source, TargetConversionResult, TaskStatusResponse } from "../types/api";
import type { DoclingAPI, DoclingAPIConfig, S3Config } from "../types/client";
import type { ProgressConfig, SafeConversionResult, SafeFileConversionResult } from "../types/client";
import { type ConnectionState } from "./websocket-client";
export declare class DoclingAPIClient implements DoclingAPI {
    readonly type: "api";
    private http;
    private config;
    private ws;
    private progressManager;
    readonly files: FileService;
    readonly chunks: ChunkService;
    private static readonly EXT_BY_INPUT;
    private static readonly CT_BY_INPUT;
    constructor(config: DoclingAPIConfig | string);
    private mergeWithDefaults;
    convert(file: Uint8Array | string, filename: string, options?: ConversionOptions, progress?: ProgressConfig): Promise<ConvertDocumentResponse>;
    extractText(file: Uint8Array | string, filename: string, options?: Omit<ConversionOptions, "to_formats">): Promise<ConvertDocumentResponse>;
    toHtml(file: Uint8Array | string, filename: string, options?: Omit<ConversionOptions, "to_formats">, progress?: ProgressConfig): Promise<ConvertDocumentResponse>;
    toMarkdown(file: Uint8Array | string, filename: string, options?: Omit<ConversionOptions, "to_formats">, progress?: ProgressConfig): Promise<ConvertDocumentResponse>;
    convertDocument(file: Uint8Array | string, filename: string, options: ConversionOptions, progress?: ProgressConfig): Promise<ConvertDocumentResponse>;
    process(file: Uint8Array | string, filename: string, options?: ConversionOptions, progress?: ProgressConfig): Promise<ConvertDocumentResponse>;
    convertToFile(file: Uint8Array | string, filename: string, options: ConversionOptions): Promise<ConversionFileResult>;
    health(): Promise<HealthCheckResponse>;
    convertSource(request: ConvertDocumentsRequest): Promise<ConvertDocumentResponse | PresignedUrlConvertDocumentResponse>;
    convertFile(params: FileUploadParams): Promise<ConvertDocumentResponse>;
    convertSourceAsync(request: ConvertDocumentsRequest): Promise<AsyncConversionTask>;
    convertFileAsync(params: FileUploadParams, _progressOverride?: ProgressConfig): Promise<AsyncConversionTask>;
    convertFileAsyncToZip(params: FileUploadParams, _progressOverride?: ProgressConfig): Promise<AsyncConversionTask>;
    pollTaskStatus(taskId: string, waitSeconds?: number): Promise<TaskStatusResponse>;
    getTaskResult(taskId: string): Promise<ConvertDocumentResponse | PresignedUrlConvertDocumentResponse>;
    getTaskResultFile(taskId: string): Promise<ConversionFileResult>;
    convertSync(file: Uint8Array | string, filename: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    convertAsync(file: Uint8Array | string, filename: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    convertStream(inputStream: NodeJS.ReadableStream, filename: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    convertStreamToFile(inputStream: NodeJS.ReadableStream, filename: string, options: ConversionOptions): Promise<ConversionFileResult>;
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
    getTaskManager(): AsyncTaskManager;
    convertFromUrl(url: string, options?: ConversionOptions, headers?: Record<string, string>): Promise<ConvertDocumentResponse>;
    convertFromFile(filePath: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    convertFromBuffer(buffer: Uint8Array, filename: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    convertFromBase64(base64String: string, filename: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    convertFromS3(s3Config: S3Config, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    convertWithTarget(sources: (HttpSource | FileSource | S3Source | (S3Config & {
        kind: "s3";
    }))[], target: ConversionTarget | (S3Config & {
        kind: "s3";
    }), options?: ConversionOptions): Promise<TargetConversionResult>;
    private validateConvertRequest;
    private prepareFiles;
    private createAsyncTask;
    private waitForTaskCompletion;
    private normalizeDocumentResponse;
    private normalizeError;
    convertWithAutoProgress(file: Uint8Array | string, filename: string, options?: ConversionOptions, progressOverride?: ProgressConfig): Promise<ConvertDocumentResponse>;
    convertToStream(file: Uint8Array | string, filename: string, outputStream: {
        write(chunk: string | Uint8Array): boolean;
        end(): void;
    }, options?: ConversionOptions, returnAsZip?: boolean): Promise<{
        success: boolean;
        error?: {
            message: string;
            details?: string;
        };
    }>;
    private createStreamRequest;
    private executeStreamRequest;
    private executeZipStreamRequest;
    private isReadableStream;
    private executeContentStreamRequest;
    private createStreamError;
    private createProgressWrapper;
    private pollRecursively;
    private convertInputByType;
    private handleFileStreamResponse;
    private handleDataStreamResponse;
    private handleEmptyStreamResponse;
    convertWithProgress(file: Uint8Array | string, filename: string, options?: ConversionOptions, onProgress?: (progress: {
        stage: string;
        percentage?: number;
        message?: string;
        uploadProgress?: number;
        conversionProgress?: number;
    }) => void): Promise<ConvertDocumentResponse>;
    validateFiles(files: Array<{
        buffer?: Uint8Array;
        filePath?: string;
        filename: string;
    }>): Promise<{
        valid: boolean;
        results: Array<{
            filename: string;
            valid: boolean;
            errors?: string[];
            warnings?: string[];
        }>;
    }>;
    convertWithWebSocket(request: ConvertDocumentsRequest, onProgress?: (progress: {
        stage: string;
        percentage?: number;
        message?: string;
        taskId: string;
        position?: number;
        status: string;
        timestamp: number;
    }) => void): Promise<ConvertDocumentResponse>;
    convertFileWithWebSocket(buffer: Uint8Array, filename: string, options?: ConversionOptions, onProgress?: (progress: {
        stage: string;
        percentage?: number;
        message?: string;
        taskId: string;
        position?: number;
        status: string;
        timestamp: number;
        uploadedBytes?: number;
        totalBytes?: number;
    }) => void): Promise<ConvertDocumentResponse>;
    getWebSocketState(): ConnectionState;
    convertFileWithPipeline(filePath: string, options?: ConversionOptions, onProgress?: (progress: {
        stage: string;
        percentage?: number;
        message?: string;
        uploadedBytes?: number;
        totalBytes?: number;
        bytesPerSecond?: number;
    }) => void): Promise<ConvertDocumentResponse>;
    convertStreamWithPipeline(stream: NodeJS.ReadableStream, filename: string, options?: ConversionOptions, size?: number, onProgress?: (progress: {
        stage: string;
        percentage?: number;
        message?: string;
        uploadedBytes?: number;
        totalBytes?: number;
        bytesPerSecond?: number;
    }) => void): Promise<ConvertDocumentResponse>;
    convertStreamDirect(inputStream: NodeJS.ReadableStream, filename: string, contentType: string, options?: ConversionOptions, estimatedSize?: number, onProgress?: (progress: {
        uploadedBytes: number;
        totalBytes: number;
        percentage: number;
        bytesPerSecond: number;
        stage: "preparing" | "uploading" | "processing" | "completed";
    }) => void): Promise<ConvertDocumentResponse>;
    convertMultipleFiles(files: Array<{
        buffer?: Uint8Array;
        filePath?: string;
        stream?: NodeJS.ReadableStream;
        filename: string;
        size?: number;
    }>, options?: ConversionOptions, onProgress?: (progress: {
        stage: string;
        currentFile: number;
        totalFiles: number;
        filename: string;
        percentage?: number;
        message?: string;
        uploadedBytes?: number;
        totalBytes?: number;
    }) => void): Promise<{
        success: boolean;
        results: Array<{
            filename: string;
            success: boolean;
            result?: ConvertDocumentResponse;
            error?: string;
        }>;
    }>;
    private static readonly EXT_CT_MAP;
    private getContentType;
    private convertWithAsyncProgress;
    safeConvert(file: Uint8Array | string, filename: string, options?: ConversionOptions): Promise<SafeConversionResult>;
    safeConvertToFile(file: Uint8Array | string, filename: string, options: ConversionOptions): Promise<SafeFileConversionResult>;
    getHttpClient(): HttpClient;
    getConfig(): DoclingAPIConfig;
    updateConfig(updates: Partial<DoclingAPIConfig>): void;
    destroy(): void;
}
