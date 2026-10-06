import { EventEmitter } from "node:events";
import type { Writable } from "node:stream";
import type { ConversionFileResult, ConversionOptions, ConvertDocumentResponse } from "../types/api";
import type { CliConversionResult, CliConvertOptions } from "../types/cli";
import type { DoclingCLI, DoclingCLIConfig, ProgressConfig, SafeConversionResult, SafeFileConversionResult } from "../types/client";
export declare class DoclingCLIClient implements DoclingCLI {
    readonly type: "cli";
    private config;
    readonly progress: EventEmitter;
    private outputDir;
    private pythonPath;
    private doclingCommand;
    private static readonly FORMAT_TO_EXTENSION_MAP;
    private static readonly FORMAT_TO_CONTENT_KEY_MAP;
    private readonly retryConfig;
    private progressState;
    private performanceHistory;
    constructor(config?: DoclingCLIConfig);
    private initializePromise;
    getConfig(): DoclingCLIConfig;
    updateConfig(newConfig: Partial<DoclingCLIConfig>): void;
    buildConvertArgs(options: CliConvertOptions): string[];
    buildModelDownloadArgs(options: {
        outputDir?: string;
        force?: boolean;
        models?: string[];
        all?: boolean;
        quiet?: boolean;
    }): string[];
    initialize(): Promise<void>;
    checkAvailability(): Promise<boolean>;
    getVersion(): Promise<string>;
    private ensureInitialized;
    private mergeWithDefaults;
    convert(file: Buffer | string, filename: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    extractText(file: Buffer | string, filename: string, options?: Omit<ConversionOptions, "to_formats">): Promise<ConvertDocumentResponse>;
    toHtml(file: Buffer | string, filename: string, options?: Omit<ConversionOptions, "to_formats">): Promise<ConvertDocumentResponse>;
    toMarkdown(file: Buffer | string, filename: string, options?: Omit<ConversionOptions, "to_formats">): Promise<ConvertDocumentResponse>;
    convertDocument(file: Buffer | string, filename: string, options: ConversionOptions): Promise<ConvertDocumentResponse>;
    process(file: Buffer | string, filename: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    convertToFile(file: Buffer | string, filename: string, options: ConversionOptions): Promise<ConversionFileResult>;
    convertSync(file: Buffer | string, filename: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    convertAsync(file: Buffer | string, filename: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    convertStream(inputStream: NodeJS.ReadableStream, filename: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    convertStreamToFile(inputStream: NodeJS.ReadableStream, filename: string, options: ConversionOptions): Promise<ConversionFileResult>;
    convertToStream(options: CliConvertOptions, outputStream: Writable, returnAsZip?: boolean): Promise<CliConversionResult>;
    convertWithProgress(options: CliConvertOptions, onProgress?: (progress: {
        stage: string;
        percentage?: number;
        message?: string;
        memoryUsage?: NodeJS.MemoryUsage;
    }) => void): Promise<CliConversionResult>;
    convertWithAutoProgress(options: CliConvertOptions, progressOverride?: ProgressConfig): Promise<CliConversionResult>;
    health(): Promise<{
        status: string;
        version?: string;
    }>;
    convertFromUrl(url: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    convertFromFile(filePath: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    convertFromBuffer(buffer: Buffer, filename: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    convertFromBase64(base64String: string, filename: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    convertMultipleFiles(files: Array<{
        buffer?: Buffer;
        filePath?: string;
        filename: string;
    }>, options?: ConversionOptions, onProgress?: (progress: {
        stage: string;
        currentFile: number;
        totalFiles: number;
        filename: string;
        percentage: number;
    }) => void): Promise<{
        success: boolean;
        results: Array<{
            filename: string;
            success: boolean;
            result?: ConvertDocumentResponse;
            error?: string;
        }>;
    }>;
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
    setOutputDir(dir: string): void;
    validateFiles(files: string[]): Promise<{
        valid: string[];
        invalid: Array<{
            file: string;
            reason: string;
        }>;
    }>;
    private validateConfiguration;
    private getEnvironmentDefaults;
    private prepareOptions;
    private initializeProgress;
    private calculateProgress;
    private calculateETA;
    private updateProgress;
    private recordFileCompletion;
    private recordFormatCompletion;
    private classifyError;
    private getErrorCategory;
    private calculateDelay;
    private executeCommandWithRetry;
    private handleFileChangeWithDebounce;
    private createBufferStream;
    safeConvert(file: Buffer | string, filename: string, options?: ConversionOptions): Promise<SafeConversionResult>;
    safeConvertToFile(file: Buffer | string, filename: string, options: ConversionOptions): Promise<SafeFileConversionResult>;
    private sleep;
    private createProcessPromise;
    private createOutputPromise;
    private buildCliArgs;
    private createCliStreamContext;
    private executeCliStreamRequest;
    private spawnCliProcess;
    private processCliStream;
    private processContentStream;
    private processZipStream;
    private createZipFromTempDir;
    private streamOutputFiles;
    private handleFileEvent;
    private pollForFiles;
    private processSingleFile;
    private convertSingleFileByType;
    private findAlternativeFile;
    private prepareInputFile;
    private waitForFileStable;
    private processSingleFormat;
    private checkFileStability;
    private getExpectedExtensions;
    private processFile;
    private readonly argBuilders;
    private buildDoclingCommand;
    executeCommand(args: string[]): Promise<{
        stdout: string;
        stderr: string;
        exitCode: number;
    }>;
    destroy(): void;
    private parseDoclingOutput;
    private shouldProcessFile;
    private streamToBuffer;
    private createZipFromOutputFiles;
    private chunkArray;
    private createTempDirectory;
    private cleanupTempDirectory;
    private extractFilenameFromUrl;
    private downloadFile;
}
