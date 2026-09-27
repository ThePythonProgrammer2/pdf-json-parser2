import type { AcceleratorDevice, VlmModelType as ApiVlmModelType, ImageExportMode, InputFormat, OcrEngine, OutputFormat, PdfBackend, ProcessingPipeline, TableMode } from "./api";
export type CliVlmModelType = ApiVlmModelType | "granite_vision" | "smolvlm";
export type AsrModelType = "whisper_tiny" | "whisper_small" | "whisper_medium" | "whisper_large" | "whisper_base" | "whisper_turbo";
export type AvailableModel = "layout" | "tableformer" | "code_formula" | "picture_classifier" | "smolvlm" | "smoldocling" | "smoldocling_mlx" | "granite_vision" | "easyocr";
export interface CliConvertOptions {
    sources: string[];
    fromFormats?: InputFormat[];
    toFormats?: OutputFormat[];
    output?: string;
    pipeline?: ProcessingPipeline;
    vlmModel?: CliVlmModelType;
    asrModel?: AsrModelType;
    ocr?: boolean;
    forceOcr?: boolean;
    ocrEngine?: OcrEngine;
    ocrLang?: string[];
    pdfBackend?: PdfBackend;
    tableMode?: TableMode;
    imageExportMode?: ImageExportMode;
    showLayout?: boolean;
    enrichCode?: boolean;
    enrichFormula?: boolean;
    enrichPictureClasses?: boolean;
    enrichPictureDescriptions?: boolean;
    pictureDescriptionAreaThreshold?: number;
    abortOnError?: boolean;
    documentTimeout?: number;
    numThreads?: number;
    device?: AcceleratorDevice;
    artifactsPath?: string;
    allowExternalPlugins?: boolean;
    enableRemoteServices?: boolean;
    showExternalPlugins?: boolean;
    debugVisualizeCells?: boolean;
    debugVisualizeOcr?: boolean;
    debugVisualizeLayout?: boolean;
    debugVisualizeTables?: boolean;
    headers?: string;
    verbose?: number;
}
export interface CliModelDownloadOptions {
    outputDir?: string;
    force?: boolean;
    models?: AvailableModel[];
    all?: boolean;
    quiet?: boolean;
}
export interface CliResult {
    success: boolean;
    stdout: string;
    stderr: string;
    exitCode: number;
    error?: Error | undefined;
}
export interface CliConversionResult extends CliResult {
    outputs?: {
        markdown?: string;
        json?: string;
        html?: string;
        text?: string;
        doctags?: string;
    };
    outputFiles?: string[];
}
export interface CliModelDownloadResult extends CliResult {
    modelsPath?: string | undefined;
}
export interface CliConfig {
    doclingPath?: string;
    doclingToolsPath?: string;
    pythonPath?: string;
    timeout?: number;
    cwd?: string;
    env?: Record<string, string>;
}
export interface CliVersionInfo {
    docling: string;
    doclingCore: string;
    doclingIbmModels: string;
    doclingParse: string;
    python: string;
    platform: string;
}
export type CliCommand = "convert" | "models" | "version" | "help";
export type CliModelsCommand = "download";
export interface CliExecutionOptions {
    timeout?: number;
    cwd?: string;
    env?: Record<string, string>;
    stdio?: "pipe" | "inherit" | "ignore";
}
export type CliProgressCallback = (data: {
    type: "stdout" | "stderr";
    data: string;
}) => void;
export interface CliAsyncOptions extends CliExecutionOptions {
    onProgress?: CliProgressCallback;
}
export declare class CliError extends Error {
    exitCode: number;
    stdout: string;
    stderr: string;
    constructor(message: string, exitCode: number, stdout: string, stderr: string);
}
export declare class CliTimeoutError extends Error {
    constructor(timeout: number);
}
export declare class CliNotFoundError extends Error {
    constructor(path?: string);
}
export declare const CliValidation: {
    isValidInputFormat: (format: string) => format is InputFormat;
    isValidOutputFormat: (format: string) => format is OutputFormat;
    isValidOcrEngine: (engine: string) => engine is OcrEngine;
    isValidPdfBackend: (backend: string) => backend is PdfBackend;
    isValidTableMode: (mode: string) => mode is TableMode;
    isValidImageExportMode: (mode: string) => mode is ImageExportMode;
    isValidProcessingPipeline: (pipeline: string) => pipeline is ProcessingPipeline;
    isValidVlmModel: (model: string) => model is CliVlmModelType;
    isValidAsrModel: (model: string) => model is AsrModelType;
    isValidAcceleratorDevice: (device: string) => device is AcceleratorDevice;
    isValidAvailableModel: (model: string) => model is AvailableModel;
};
