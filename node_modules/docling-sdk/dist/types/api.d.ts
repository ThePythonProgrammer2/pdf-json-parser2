import type { DoclingDocument } from "./docling-core";
import type { NodeReadable } from "./streams";
export type InputFormat = "docx" | "pptx" | "html" | "image" | "pdf" | "asciidoc" | "md" | "csv" | "xlsx" | "xml_uspto" | "xml_jats" | "json_docling" | "audio";
export type OutputFormat = "md" | "json" | "html" | "html_split_page" | "text" | "doctags";
export type OcrEngine = "easyocr" | "tesserocr" | "tesseract" | "rapidocr" | "ocrmac";
export type PdfBackend = "pypdfium2" | "dlparse_v1" | "dlparse_v2" | "dlparse_v4";
export type TableMode = "fast" | "accurate";
export interface TableStructureOptions {
    do_cell_matching?: boolean;
    mode?: TableMode;
}
export interface LayoutOptions {
    create_orphan_clusters?: boolean;
    keep_empty_clusters?: boolean;
    model_spec?: string;
}
export type AcceleratorDevice = "auto" | "cpu" | "cuda" | "mps";
export interface AcceleratorOptions {
    device?: AcceleratorDevice;
    num_threads?: number;
}
export type ImageExportMode = "embedded" | "placeholder" | "referenced";
export type ProcessingPipeline = "standard" | "vlm" | "asr";
export interface BaseOcrOptions {
    kind: OcrEngine;
    lang: string[];
    force_full_page_ocr?: boolean;
    bitmap_area_threshold?: number;
}
export interface EasyOcrOptions extends BaseOcrOptions {
    kind: "easyocr";
    lang: string[];
    use_gpu?: boolean;
    confidence_threshold?: number;
    model_storage_directory?: string;
    recog_network?: string;
    download_enabled?: boolean;
}
export interface RapidOcrOptions extends BaseOcrOptions {
    kind: "rapidocr";
    lang: string[];
    text_score?: number;
    use_det?: boolean;
    use_cls?: boolean;
    use_rec?: boolean;
    print_verbose?: boolean;
    det_model_path?: string;
    cls_model_path?: string;
    rec_model_path?: string;
    rec_keys_path?: string;
}
export interface TesseractCliOcrOptions extends BaseOcrOptions {
    kind: "tesseract";
    lang: string[];
    tesseract_cmd?: string;
    path?: string;
}
export interface TesseractOcrOptions extends BaseOcrOptions {
    kind: "tesserocr";
    lang: string[];
    path?: string;
}
export interface OcrMacOptions extends BaseOcrOptions {
    kind: "ocrmac";
    lang: string[];
    recognition?: string;
    framework?: string;
}
export type OcrOptions = EasyOcrOptions | RapidOcrOptions | TesseractCliOcrOptions | TesseractOcrOptions | OcrMacOptions;
export type TaskStatus = "pending" | "started" | "success" | "failure";
export type ConversionStatus = "success" | "partial_success" | "skipped" | "failure";
export interface HttpSource {
    kind: "http";
    url: string;
    headers?: Record<string, string>;
}
export interface FileSource {
    kind: "file";
    base64_string: string;
    filename: string;
}
export interface S3Source {
    kind: "s3";
    endpoint: string;
    verify_ssl?: boolean;
    access_key: string;
    secret_key: string;
    bucket: string;
    key_prefix?: string;
}
export interface PictureDescriptionLocal {
    repo_id: string;
    generation_config?: {
        max_new_tokens?: number;
        do_sample?: boolean;
        [key: string]: unknown;
    };
    prompt?: string;
}
export interface PictureDescriptionApi {
    url: string;
    headers?: Record<string, string>;
    params?: Record<string, unknown>;
    timeout?: number;
    concurrency?: number;
    prompt?: string;
}
export type VlmModelType = "smoldocling";
export interface VlmModelLocal {
    repo_id: string;
    prompt: string;
    scale: number;
    response_format: "doctags" | "markdown";
    inference_framework: "transformers" | "mlx";
    transformers_model_type: "automodel-vision2seq" | "automodel";
    extra_generation_config: Record<string, unknown>;
}
export interface VlmModelApi {
    url: string;
    headers?: Record<string, string>;
    params?: Record<string, unknown>;
    timeout: number;
    concurrency: number;
    prompt: string;
    scale: number;
    response_format: "doctags" | "markdown";
}
export interface ConversionOptions {
    from_formats?: InputFormat[];
    to_formats?: OutputFormat[];
    pipeline?: ProcessingPipeline;
    page_range?: [number, number];
    do_ocr?: boolean;
    force_ocr?: boolean;
    ocr_engine?: OcrEngine;
    ocr_lang?: string[];
    ocr_options?: OcrOptions;
    pdf_backend?: PdfBackend;
    table_mode?: TableMode;
    table_cell_matching?: boolean;
    do_table_structure?: boolean;
    table_structure_options?: TableStructureOptions;
    image_export_mode?: ImageExportMode;
    include_images?: boolean;
    images_scale?: number;
    generate_page_images?: boolean;
    generate_picture_images?: boolean;
    do_code_enrichment?: boolean;
    do_formula_enrichment?: boolean;
    do_picture_classification?: boolean;
    do_picture_description?: boolean;
    picture_description_area_threshold?: number;
    picture_description_local?: PictureDescriptionLocal;
    picture_description_api?: PictureDescriptionApi;
    abort_on_error?: boolean;
    document_timeout?: number;
    md_page_break_placeholder?: string;
    create_legacy_output?: boolean;
    force_backend_text?: boolean;
    layout_options?: LayoutOptions;
    accelerator_options?: AcceleratorOptions;
    enable_remote_services?: boolean;
    allow_external_plugins?: boolean;
    artifacts_path?: string;
    vlm_pipeline_model?: VlmModelType;
    vlm_pipeline_model_local?: VlmModelLocal;
    vlm_pipeline_model_api?: VlmModelApi;
    chunking_use_markdown_tables?: boolean;
    chunking_include_raw_text?: boolean;
    chunking_max_tokens?: number | null;
    chunking_tokenizer?: string;
    chunking_merge_peers?: boolean;
}
export interface InBodyTarget {
    kind: "inbody";
}
export interface ZipTarget {
    kind: "zip";
}
export interface S3Target {
    kind: "s3";
    endpoint: string;
    verify_ssl?: boolean;
    access_key: string;
    secret_key: string;
    bucket: string;
    key_prefix?: string;
}
export interface PutTarget {
    kind: "put";
    presigned_url: string;
}
export type ConversionTarget = InBodyTarget | ZipTarget | S3Target | PutTarget;
export interface ConvertDocumentsRequest {
    options?: ConversionOptions;
    sources: (HttpSource | FileSource | S3Source)[];
    target?: ConversionTarget;
}
export interface ExportDocumentResponse {
    filename: string;
    md_content?: string | null;
    json_content?: DoclingDocument | null;
    html_content?: string | null;
    text_content?: string | null;
    doctags_content?: string | null;
}
export interface DocumentContent extends ExportDocumentResponse {
    content?: string | object | undefined;
}
export interface ProcessingTimings {
    [step: string]: number;
}
export interface ProcessingError {
    message: string;
    code?: string | undefined;
    details?: unknown;
}
export type ProfilingScope = "page" | "document";
export interface ProfilingItem {
    scope: ProfilingScope;
    count?: number;
    times?: number[];
    start_timestamps?: string[];
}
export interface ExportResult {
    kind: string;
    content: ExportDocumentResponse;
    status: ConversionStatus;
    errors?: ProcessingError[];
    timings?: Record<string, ProfilingItem>;
}
export interface ConvertDocumentResponse {
    document: ExportDocumentResponse;
    status: ConversionStatus;
    processing_time: number;
    timings?: ProcessingTimings;
    errors?: ProcessingError[];
}
export interface PresignedUrlConvertDocumentResponse {
    processing_time: number;
    num_converted: number;
    num_succeeded: number;
    num_failed: number;
}
export interface TaskMeta {
    total_documents?: number;
    processed_documents?: number;
    [key: string]: unknown;
}
export interface TaskStatusResponse {
    task_id: string;
    task_status: TaskStatus;
    task_position?: number;
    task_meta?: TaskMeta;
}
export type WebSocketMessageType = "connection" | "update" | "error";
export interface WebSocketMessage {
    message: WebSocketMessageType;
    task?: TaskStatusResponse;
    error?: string;
}
export interface HealthCheckResponse {
    status: "ok";
    timestamp?: string;
}
export interface ProgressCallbackResponse {
    success: boolean;
    message?: string;
}
export interface FileUploadParams extends ConversionOptions {
    files: File | File[] | Uint8Array | Uint8Array[];
    filename?: string | string[];
}
export interface ChunkFileUploadParams extends ConversionOptions {
    files: File | File[] | Uint8Array | Uint8Array[];
    filename?: string | string[];
    include_converted_doc?: boolean;
    target_type?: "inbody" | "zip";
}
export interface ApiClientConfig {
    baseUrl: string;
    timeout?: number;
    headers?: Record<string, string>;
    retries?: number;
    retryDelay?: number;
}
export interface DocumentConversionSuccess {
    success: true;
    data: ConvertDocumentResponse;
    taskId?: string;
}
export interface TargetConversionSuccess {
    success: true;
    data: PresignedUrlConvertDocumentResponse;
    taskId?: string;
}
export interface ConversionFailure {
    success: false;
    error: ProcessingError;
    taskId?: string;
}
export type ConversionResult = DocumentConversionSuccess | ConversionFailure;
export type TargetConversionResult = TargetConversionSuccess | ConversionFailure;
export type AnyConversionResult = ConversionResult | TargetConversionResult;
export declare function isConversionSuccess(result: ConversionResult): result is DocumentConversionSuccess;
export declare function isTargetConversionSuccess(result: TargetConversionResult): result is TargetConversionSuccess;
export declare function isConversionFailure(result: AnyConversionResult): result is ConversionFailure;
export declare function hasDocumentContent(data: ConvertDocumentResponse | PresignedUrlConvertDocumentResponse): data is ConvertDocumentResponse;
export declare function isPresignedUrlResponse(data: ConvertDocumentResponse | PresignedUrlConvertDocumentResponse): data is PresignedUrlConvertDocumentResponse;
export declare function createSuccessResult(data: ConvertDocumentResponse, taskId?: string): DocumentConversionSuccess;
export declare function createFailureResult(error: ProcessingError, taskId?: string): ConversionFailure;
export interface ConversionFileResult {
    success: boolean;
    fileStream?: NodeReadable;
    data?: Uint8Array;
    fileMetadata?: {
        filename: string;
        contentType: string;
        size?: number;
    };
    error?: ProcessingError | undefined;
}
export interface ChunkFileResult {
    success: boolean;
    fileStream?: NodeReadable;
    fileMetadata?: {
        filename: string;
        contentType: string;
        size?: number;
    };
    error?: ProcessingError | undefined;
}
export interface AsyncConversionTask {
    taskId: string;
    status: TaskStatus;
    position?: number | undefined;
    meta?: TaskMeta | undefined;
    on(event: "progress", listener: (status: TaskStatusResponse) => void): this;
    on(event: "complete", listener: (result: ConvertDocumentResponse) => void): this;
    on(event: "error", listener: (error: ProcessingError) => void): this;
    poll(): Promise<TaskStatusResponse>;
    waitForCompletion(): Promise<TaskStatusResponse>;
    getResult(): Promise<ConvertDocumentResponse>;
    cancel?(): Promise<void>;
}
export interface AsyncChunkTask {
    taskId: string;
    status: TaskStatus;
    position?: number | undefined;
    meta?: TaskMeta | undefined;
    on(event: "progress", listener: (status: TaskStatusResponse) => void): this;
    on(event: "complete", listener: (result: ChunkDocumentResponse) => void): this;
    on(event: "error", listener: (error: ProcessingError) => void): this;
    poll(): Promise<TaskStatusResponse>;
    waitForCompletion(): Promise<TaskStatusResponse>;
    getResult(): Promise<ChunkDocumentResponse>;
    cancel?(): Promise<void>;
}
export interface ChunkedDocumentResultItem {
    filename: string;
    chunk_index: number;
    text: string;
    raw_text?: string | null;
    num_tokens?: number | null;
    headings?: string[] | null;
    captions?: string[] | null;
    doc_items: string[];
    page_numbers?: number[] | null;
    metadata?: Record<string, unknown> | null;
}
export interface ChunkDocumentResponse {
    chunks: ChunkedDocumentResultItem[];
    documents: ExportResult[];
    processing_time: number;
}
export interface HybridChunkerOptions {
    chunker?: "hybrid";
    use_markdown_tables?: boolean;
    include_raw_text?: boolean;
    max_tokens?: number | null;
    tokenizer?: string;
    merge_peers?: boolean;
}
export interface HierarchicalChunkerOptions {
    chunker?: "hierarchical";
    use_markdown_tables?: boolean;
    include_raw_text?: boolean;
}
export interface HybridChunkerOptionsDocumentsRequest {
    convert_options?: ConversionOptions;
    sources: (FileSource | HttpSource | S3Source)[];
    include_converted_doc?: boolean;
    target?: ConversionTarget;
    chunking_options?: HybridChunkerOptions;
}
export interface HierarchicalChunkerOptionsDocumentsRequest {
    convert_options?: ConversionOptions;
    sources: (FileSource | HttpSource | S3Source)[];
    include_converted_doc?: boolean;
    target?: ConversionTarget;
    chunking_options?: HierarchicalChunkerOptions;
}
