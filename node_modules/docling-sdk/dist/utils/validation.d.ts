import type { CliConvertOptions, ConversionOptions, ImageExportMode, InputFormat, OcrEngine, OutputFormat, PdfBackend, ProcessingPipeline, TableMode } from "../types";
export interface ValidationResult<T = unknown> {
    isValid: boolean;
    errors?: string[];
    data?: T;
}
export declare class ValidationUtils {
    static validateInputFormat(format: string): format is InputFormat;
    static validateOutputFormat(format: string): format is OutputFormat;
    static validateOcrEngine(engine: string): engine is OcrEngine;
    static validatePdfBackend(backend: string): backend is PdfBackend;
    static validateTableMode(mode: string): mode is TableMode;
    static validateImageExportMode(mode: string): mode is ImageExportMode;
    static validateProcessingPipeline(pipeline: string): pipeline is ProcessingPipeline;
    static validateUrl(url: string): boolean;
    static validateFilePath(path: string): boolean;
    static validatePageRange(range: [number, number]): boolean;
    static validateOcrLanguages(languages: string[]): boolean;
    static validateConversionOptions(options: ConversionOptions): ValidationResult;
    static validateCliConvertOptions(options: CliConvertOptions): ValidationResult;
    static assertValidConversionOptions(options: ConversionOptions): void;
    static assertValidCliConvertOptions(options: CliConvertOptions): void;
    static validateConversionOptionsWithZod(options: unknown): ValidationResult<ConversionOptions>;
    static safeValidateConversionOptions(options: unknown): import("zod").ZodSafeParseResult<{
        to_formats?: ("text" | "html" | "md" | "json" | "html_split_page" | "doctags")[] | undefined;
        ocr_engine?: "easyocr" | "tesserocr" | "tesseract" | "rapidocr" | "ocrmac" | undefined;
        pdf_backend?: "pypdfium2" | "dlparse_v1" | "dlparse_v2" | "dlparse_v4" | undefined;
        table_mode?: "fast" | "accurate" | undefined;
        image_export_mode?: "embedded" | "referenced" | "placeholder" | undefined;
        processing_pipeline?: "fast" | "accurate" | "default" | undefined;
        force_ocr?: boolean | undefined;
        page_range?: [number, number] | undefined;
        extract_images?: boolean | undefined;
        extract_tables?: boolean | undefined;
        extract_text?: boolean | undefined;
        table_cell_matching?: boolean | undefined;
        document_timeout?: number | undefined;
        do_ocr?: boolean | undefined;
        do_table_structure?: boolean | undefined;
        do_code_enrichment?: boolean | undefined;
        do_formula_enrichment?: boolean | undefined;
        do_picture_classification?: boolean | undefined;
        do_picture_description?: boolean | undefined;
        picture_description_area_threshold?: number | undefined;
        include_images?: boolean | undefined;
        images_scale?: number | undefined;
        md_page_break_placeholder?: string | undefined;
        abort_on_error?: boolean | undefined;
        vlm_pipeline_model?: "smoldocling" | undefined;
        vlm_pipeline_model_local?: {
            repo_id: string;
            prompt: string;
            scale: number;
            response_format: "doctags" | "markdown";
            inference_framework: "transformers" | "mlx";
            transformers_model_type: "automodel-vision2seq" | "automodel";
            extra_generation_config: Record<string, unknown>;
        } | undefined;
        vlm_pipeline_model_api?: {
            url: string;
            timeout: number;
            concurrency: number;
            prompt: string;
            scale: number;
            response_format: "doctags" | "markdown";
            headers?: Record<string, string> | undefined;
            params?: Record<string, unknown> | undefined;
        } | undefined;
        picture_description_local?: {
            repo_id: string;
            prompt: string;
            scale: number;
            response_format: "doctags" | "markdown";
            inference_framework: "transformers" | "mlx";
            transformers_model_type: "automodel-vision2seq" | "automodel";
            extra_generation_config: Record<string, unknown>;
        } | undefined;
        picture_description_api?: {
            url: string;
            headers?: Record<string, string> | undefined;
            params?: Record<string, unknown> | undefined;
            timeout?: number | undefined;
            concurrency?: number | undefined;
            prompt?: string | undefined;
        } | undefined;
        ocr_options?: {
            lang: string[];
            kind: "easyocr";
            force_full_page_ocr?: boolean | undefined;
            bitmap_area_threshold?: number | undefined;
            use_gpu?: boolean | undefined;
            confidence_threshold?: number | undefined;
            model_storage_directory?: string | undefined;
            recog_network?: string | undefined;
            download_enabled?: boolean | undefined;
        } | {
            lang: string[];
            kind: "rapidocr";
            force_full_page_ocr?: boolean | undefined;
            bitmap_area_threshold?: number | undefined;
            text_score?: number | undefined;
            use_det?: boolean | undefined;
            use_cls?: boolean | undefined;
            use_rec?: boolean | undefined;
            print_verbose?: boolean | undefined;
            det_model_path?: string | undefined;
            cls_model_path?: string | undefined;
            rec_model_path?: string | undefined;
            rec_keys_path?: string | undefined;
        } | {
            lang: string[];
            kind: "tesseract";
            force_full_page_ocr?: boolean | undefined;
            bitmap_area_threshold?: number | undefined;
            tesseract_cmd?: string | undefined;
            path?: string | undefined;
        } | {
            lang: string[];
            kind: "tesserocr";
            force_full_page_ocr?: boolean | undefined;
            bitmap_area_threshold?: number | undefined;
            path?: string | undefined;
        } | {
            lang: string[];
            kind: "ocrmac";
            force_full_page_ocr?: boolean | undefined;
            bitmap_area_threshold?: number | undefined;
            recognition?: string | undefined;
            framework?: string | undefined;
        } | undefined;
        table_structure_options?: {
            do_cell_matching?: boolean | undefined;
            mode?: "fast" | "accurate" | undefined;
        } | undefined;
        layout_options?: {
            create_orphan_clusters?: boolean | undefined;
            keep_empty_clusters?: boolean | undefined;
            model_spec?: string | undefined;
        } | undefined;
        accelerator_options?: {
            device?: "auto" | "cpu" | "cuda" | "mps" | undefined;
            num_threads?: number | undefined;
        } | undefined;
        generate_page_images?: boolean | undefined;
        generate_picture_images?: boolean | undefined;
        create_legacy_output?: boolean | undefined;
        force_backend_text?: boolean | undefined;
        enable_remote_services?: boolean | undefined;
        allow_external_plugins?: boolean | undefined;
        artifacts_path?: string | undefined;
    }>;
    static validateCliConvertOptionsWithZod(options: unknown): ValidationResult<CliConvertOptions>;
}
