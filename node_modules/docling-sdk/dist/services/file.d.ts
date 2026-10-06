import type { HttpClient } from "../api/http";
import type { ConversionFileResult, ConversionOptions, ConvertDocumentResponse } from "../types/api";
import { AsyncTaskManager } from "./async-task-manager";
export declare class FileService {
    private http;
    private taskManager;
    constructor(http: HttpClient);
    convert(file: Uint8Array | string, filename: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    extractText(file: Uint8Array | string, filename: string, options?: Omit<ConversionOptions, "to_formats">): Promise<ConvertDocumentResponse>;
    toHtml(file: Uint8Array | string, filename: string, options?: Omit<ConversionOptions, "to_formats">): Promise<ConvertDocumentResponse>;
    toMarkdown(file: Uint8Array | string, filename: string, options?: Omit<ConversionOptions, "to_formats">): Promise<ConvertDocumentResponse>;
    convertDocument(file: Uint8Array | string, filename: string, options: ConversionOptions): Promise<ConvertDocumentResponse>;
    process(file: Uint8Array | string, filename: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    convertAsync(file: Uint8Array | string, filename: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    private isReadableStream;
    convertToFile(file: Uint8Array | string, filename: string, options: ConversionOptions): Promise<ConversionFileResult>;
    convertSync(file: Uint8Array | string, filename: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    convertToFileAsync(file: Uint8Array | string, filename: string, options: ConversionOptions): Promise<ConversionFileResult>;
    convertStream(inputStream: NodeJS.ReadableStream, filename: string, options?: ConversionOptions): Promise<ConvertDocumentResponse>;
    convertStreamToFile(_inputStream: NodeJS.ReadableStream, filename: string, options: ConversionOptions): Promise<ConversionFileResult>;
    private static readonly EXT_CT_MAP;
    private getContentType;
    private ensureUint8Array;
    getTaskManager(): AsyncTaskManager;
    destroy(): void;
    private buildFormFields;
    private createError;
}
