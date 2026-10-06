import type { HttpClient } from "../api/http";
import type { AsyncChunkTask, ChunkDocumentResponse, ChunkFileUploadParams, ConversionOptions, HierarchicalChunkerOptionsDocumentsRequest, HybridChunkerOptionsDocumentsRequest } from "../types/api";
import { AsyncTaskManager } from "./async-task-manager";
export declare class ChunkService {
    private http;
    private static readonly CONTENT_TYPE_BY_EXT;
    private taskManager;
    constructor(http: HttpClient);
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
    private createAsyncChunkTask;
    private pollTaskStatus;
    private waitForTaskCompletion;
    private getChunkTaskResult;
    private buildFormFields;
    private ensureUint8Array;
    private getContentType;
    getTaskManager(): AsyncTaskManager;
    destroy(): void;
}
