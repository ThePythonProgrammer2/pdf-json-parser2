import { z } from "zod";
export declare const InputFormatSchema: z.ZodEnum<{
    docx: "docx";
    pptx: "pptx";
    html: "html";
    image: "image";
    pdf: "pdf";
    asciidoc: "asciidoc";
    md: "md";
    csv: "csv";
    xlsx: "xlsx";
    xml_uspto: "xml_uspto";
    xml_jats: "xml_jats";
    json_docling: "json_docling";
    audio: "audio";
}>;
export declare const OutputFormatSchema: z.ZodEnum<{
    text: "text";
    html: "html";
    md: "md";
    json: "json";
    html_split_page: "html_split_page";
    doctags: "doctags";
}>;
export declare const OcrEngineSchema: z.ZodEnum<{
    easyocr: "easyocr";
    tesserocr: "tesserocr";
    tesseract: "tesseract";
    rapidocr: "rapidocr";
    ocrmac: "ocrmac";
}>;
export declare const AcceleratorDeviceSchema: z.ZodEnum<{
    auto: "auto";
    cpu: "cpu";
    cuda: "cuda";
    mps: "mps";
}>;
export declare const AcceleratorOptionsSchema: z.ZodOptional<z.ZodObject<{
    device: z.ZodOptional<z.ZodEnum<{
        auto: "auto";
        cpu: "cpu";
        cuda: "cuda";
        mps: "mps";
    }>>;
    num_threads: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>>;
export declare const LayoutOptionsSchema: z.ZodOptional<z.ZodObject<{
    create_orphan_clusters: z.ZodOptional<z.ZodBoolean>;
    keep_empty_clusters: z.ZodOptional<z.ZodBoolean>;
    model_spec: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
export declare const BaseOcrOptionsSchema: z.ZodObject<{
    kind: z.ZodEnum<{
        easyocr: "easyocr";
        tesserocr: "tesserocr";
        tesseract: "tesseract";
        rapidocr: "rapidocr";
        ocrmac: "ocrmac";
    }>;
    lang: z.ZodArray<z.ZodString>;
    force_full_page_ocr: z.ZodOptional<z.ZodBoolean>;
    bitmap_area_threshold: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const EasyOcrOptionsSchema: z.ZodObject<{
    lang: z.ZodArray<z.ZodString>;
    force_full_page_ocr: z.ZodOptional<z.ZodBoolean>;
    bitmap_area_threshold: z.ZodOptional<z.ZodNumber>;
    kind: z.ZodLiteral<"easyocr">;
    use_gpu: z.ZodOptional<z.ZodBoolean>;
    confidence_threshold: z.ZodOptional<z.ZodNumber>;
    model_storage_directory: z.ZodOptional<z.ZodString>;
    recog_network: z.ZodOptional<z.ZodString>;
    download_enabled: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const RapidOcrOptionsSchema: z.ZodObject<{
    lang: z.ZodArray<z.ZodString>;
    force_full_page_ocr: z.ZodOptional<z.ZodBoolean>;
    bitmap_area_threshold: z.ZodOptional<z.ZodNumber>;
    kind: z.ZodLiteral<"rapidocr">;
    text_score: z.ZodOptional<z.ZodNumber>;
    use_det: z.ZodOptional<z.ZodBoolean>;
    use_cls: z.ZodOptional<z.ZodBoolean>;
    use_rec: z.ZodOptional<z.ZodBoolean>;
    print_verbose: z.ZodOptional<z.ZodBoolean>;
    det_model_path: z.ZodOptional<z.ZodString>;
    cls_model_path: z.ZodOptional<z.ZodString>;
    rec_model_path: z.ZodOptional<z.ZodString>;
    rec_keys_path: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const TesseractCliOcrOptionsSchema: z.ZodObject<{
    lang: z.ZodArray<z.ZodString>;
    force_full_page_ocr: z.ZodOptional<z.ZodBoolean>;
    bitmap_area_threshold: z.ZodOptional<z.ZodNumber>;
    kind: z.ZodLiteral<"tesseract">;
    tesseract_cmd: z.ZodOptional<z.ZodString>;
    path: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const TesseractOcrOptionsSchema: z.ZodObject<{
    lang: z.ZodArray<z.ZodString>;
    force_full_page_ocr: z.ZodOptional<z.ZodBoolean>;
    bitmap_area_threshold: z.ZodOptional<z.ZodNumber>;
    kind: z.ZodLiteral<"tesserocr">;
    path: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const OcrMacOptionsSchema: z.ZodObject<{
    lang: z.ZodArray<z.ZodString>;
    force_full_page_ocr: z.ZodOptional<z.ZodBoolean>;
    bitmap_area_threshold: z.ZodOptional<z.ZodNumber>;
    kind: z.ZodLiteral<"ocrmac">;
    recognition: z.ZodOptional<z.ZodString>;
    framework: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const OcrOptionsSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    lang: z.ZodArray<z.ZodString>;
    force_full_page_ocr: z.ZodOptional<z.ZodBoolean>;
    bitmap_area_threshold: z.ZodOptional<z.ZodNumber>;
    kind: z.ZodLiteral<"easyocr">;
    use_gpu: z.ZodOptional<z.ZodBoolean>;
    confidence_threshold: z.ZodOptional<z.ZodNumber>;
    model_storage_directory: z.ZodOptional<z.ZodString>;
    recog_network: z.ZodOptional<z.ZodString>;
    download_enabled: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>, z.ZodObject<{
    lang: z.ZodArray<z.ZodString>;
    force_full_page_ocr: z.ZodOptional<z.ZodBoolean>;
    bitmap_area_threshold: z.ZodOptional<z.ZodNumber>;
    kind: z.ZodLiteral<"rapidocr">;
    text_score: z.ZodOptional<z.ZodNumber>;
    use_det: z.ZodOptional<z.ZodBoolean>;
    use_cls: z.ZodOptional<z.ZodBoolean>;
    use_rec: z.ZodOptional<z.ZodBoolean>;
    print_verbose: z.ZodOptional<z.ZodBoolean>;
    det_model_path: z.ZodOptional<z.ZodString>;
    cls_model_path: z.ZodOptional<z.ZodString>;
    rec_model_path: z.ZodOptional<z.ZodString>;
    rec_keys_path: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    lang: z.ZodArray<z.ZodString>;
    force_full_page_ocr: z.ZodOptional<z.ZodBoolean>;
    bitmap_area_threshold: z.ZodOptional<z.ZodNumber>;
    kind: z.ZodLiteral<"tesseract">;
    tesseract_cmd: z.ZodOptional<z.ZodString>;
    path: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    lang: z.ZodArray<z.ZodString>;
    force_full_page_ocr: z.ZodOptional<z.ZodBoolean>;
    bitmap_area_threshold: z.ZodOptional<z.ZodNumber>;
    kind: z.ZodLiteral<"tesserocr">;
    path: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    lang: z.ZodArray<z.ZodString>;
    force_full_page_ocr: z.ZodOptional<z.ZodBoolean>;
    bitmap_area_threshold: z.ZodOptional<z.ZodNumber>;
    kind: z.ZodLiteral<"ocrmac">;
    recognition: z.ZodOptional<z.ZodString>;
    framework: z.ZodOptional<z.ZodString>;
}, z.core.$strip>], "kind">;
export declare const PdfBackendSchema: z.ZodEnum<{
    pypdfium2: "pypdfium2";
    dlparse_v1: "dlparse_v1";
    dlparse_v2: "dlparse_v2";
    dlparse_v4: "dlparse_v4";
}>;
export declare const TableModeSchema: z.ZodEnum<{
    fast: "fast";
    accurate: "accurate";
}>;
export declare const TableStructureOptionsSchema: z.ZodOptional<z.ZodObject<{
    do_cell_matching: z.ZodOptional<z.ZodBoolean>;
    mode: z.ZodOptional<z.ZodEnum<{
        fast: "fast";
        accurate: "accurate";
    }>>;
}, z.core.$strip>>;
export declare const ImageExportModeSchema: z.ZodEnum<{
    embedded: "embedded";
    referenced: "referenced";
    placeholder: "placeholder";
}>;
export declare const ProcessingPipelineSchema: z.ZodEnum<{
    fast: "fast";
    accurate: "accurate";
    default: "default";
}>;
export declare const TaskStatusSchema: z.ZodEnum<{
    pending: "pending";
    started: "started";
    success: "success";
    failure: "failure";
    cancelled: "cancelled";
}>;
export declare const ConversionOptionsSchema: z.ZodObject<{
    to_formats: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        text: "text";
        html: "html";
        md: "md";
        json: "json";
        html_split_page: "html_split_page";
        doctags: "doctags";
    }>>>;
    ocr_engine: z.ZodOptional<z.ZodEnum<{
        easyocr: "easyocr";
        tesserocr: "tesserocr";
        tesseract: "tesseract";
        rapidocr: "rapidocr";
        ocrmac: "ocrmac";
    }>>;
    pdf_backend: z.ZodOptional<z.ZodEnum<{
        pypdfium2: "pypdfium2";
        dlparse_v1: "dlparse_v1";
        dlparse_v2: "dlparse_v2";
        dlparse_v4: "dlparse_v4";
    }>>;
    table_mode: z.ZodOptional<z.ZodEnum<{
        fast: "fast";
        accurate: "accurate";
    }>>;
    image_export_mode: z.ZodOptional<z.ZodEnum<{
        embedded: "embedded";
        referenced: "referenced";
        placeholder: "placeholder";
    }>>;
    processing_pipeline: z.ZodOptional<z.ZodEnum<{
        fast: "fast";
        accurate: "accurate";
        default: "default";
    }>>;
    force_ocr: z.ZodOptional<z.ZodBoolean>;
    page_range: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
    extract_images: z.ZodOptional<z.ZodBoolean>;
    extract_tables: z.ZodOptional<z.ZodBoolean>;
    extract_text: z.ZodOptional<z.ZodBoolean>;
    table_cell_matching: z.ZodOptional<z.ZodBoolean>;
    document_timeout: z.ZodOptional<z.ZodNumber>;
    do_ocr: z.ZodOptional<z.ZodBoolean>;
    do_table_structure: z.ZodOptional<z.ZodBoolean>;
    do_code_enrichment: z.ZodOptional<z.ZodBoolean>;
    do_formula_enrichment: z.ZodOptional<z.ZodBoolean>;
    do_picture_classification: z.ZodOptional<z.ZodBoolean>;
    do_picture_description: z.ZodOptional<z.ZodBoolean>;
    picture_description_area_threshold: z.ZodOptional<z.ZodNumber>;
    include_images: z.ZodOptional<z.ZodBoolean>;
    images_scale: z.ZodOptional<z.ZodNumber>;
    md_page_break_placeholder: z.ZodOptional<z.ZodString>;
    abort_on_error: z.ZodOptional<z.ZodBoolean>;
    vlm_pipeline_model: z.ZodOptional<z.ZodEnum<{
        smoldocling: "smoldocling";
    }>>;
    vlm_pipeline_model_local: z.ZodOptional<z.ZodObject<{
        repo_id: z.ZodString;
        prompt: z.ZodString;
        scale: z.ZodNumber;
        response_format: z.ZodEnum<{
            doctags: "doctags";
            markdown: "markdown";
        }>;
        inference_framework: z.ZodEnum<{
            transformers: "transformers";
            mlx: "mlx";
        }>;
        transformers_model_type: z.ZodEnum<{
            "automodel-vision2seq": "automodel-vision2seq";
            automodel: "automodel";
        }>;
        extra_generation_config: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, z.core.$strip>>;
    vlm_pipeline_model_api: z.ZodOptional<z.ZodObject<{
        url: z.ZodString;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        params: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        timeout: z.ZodNumber;
        concurrency: z.ZodNumber;
        prompt: z.ZodString;
        scale: z.ZodNumber;
        response_format: z.ZodEnum<{
            doctags: "doctags";
            markdown: "markdown";
        }>;
    }, z.core.$strip>>;
    picture_description_local: z.ZodOptional<z.ZodObject<{
        repo_id: z.ZodString;
        prompt: z.ZodString;
        scale: z.ZodNumber;
        response_format: z.ZodEnum<{
            doctags: "doctags";
            markdown: "markdown";
        }>;
        inference_framework: z.ZodEnum<{
            transformers: "transformers";
            mlx: "mlx";
        }>;
        transformers_model_type: z.ZodEnum<{
            "automodel-vision2seq": "automodel-vision2seq";
            automodel: "automodel";
        }>;
        extra_generation_config: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, z.core.$strip>>;
    picture_description_api: z.ZodOptional<z.ZodObject<{
        url: z.ZodString;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        params: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        timeout: z.ZodOptional<z.ZodNumber>;
        concurrency: z.ZodOptional<z.ZodNumber>;
        prompt: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    ocr_options: z.ZodOptional<z.ZodDiscriminatedUnion<[z.ZodObject<{
        lang: z.ZodArray<z.ZodString>;
        force_full_page_ocr: z.ZodOptional<z.ZodBoolean>;
        bitmap_area_threshold: z.ZodOptional<z.ZodNumber>;
        kind: z.ZodLiteral<"easyocr">;
        use_gpu: z.ZodOptional<z.ZodBoolean>;
        confidence_threshold: z.ZodOptional<z.ZodNumber>;
        model_storage_directory: z.ZodOptional<z.ZodString>;
        recog_network: z.ZodOptional<z.ZodString>;
        download_enabled: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>, z.ZodObject<{
        lang: z.ZodArray<z.ZodString>;
        force_full_page_ocr: z.ZodOptional<z.ZodBoolean>;
        bitmap_area_threshold: z.ZodOptional<z.ZodNumber>;
        kind: z.ZodLiteral<"rapidocr">;
        text_score: z.ZodOptional<z.ZodNumber>;
        use_det: z.ZodOptional<z.ZodBoolean>;
        use_cls: z.ZodOptional<z.ZodBoolean>;
        use_rec: z.ZodOptional<z.ZodBoolean>;
        print_verbose: z.ZodOptional<z.ZodBoolean>;
        det_model_path: z.ZodOptional<z.ZodString>;
        cls_model_path: z.ZodOptional<z.ZodString>;
        rec_model_path: z.ZodOptional<z.ZodString>;
        rec_keys_path: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        lang: z.ZodArray<z.ZodString>;
        force_full_page_ocr: z.ZodOptional<z.ZodBoolean>;
        bitmap_area_threshold: z.ZodOptional<z.ZodNumber>;
        kind: z.ZodLiteral<"tesseract">;
        tesseract_cmd: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        lang: z.ZodArray<z.ZodString>;
        force_full_page_ocr: z.ZodOptional<z.ZodBoolean>;
        bitmap_area_threshold: z.ZodOptional<z.ZodNumber>;
        kind: z.ZodLiteral<"tesserocr">;
        path: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        lang: z.ZodArray<z.ZodString>;
        force_full_page_ocr: z.ZodOptional<z.ZodBoolean>;
        bitmap_area_threshold: z.ZodOptional<z.ZodNumber>;
        kind: z.ZodLiteral<"ocrmac">;
        recognition: z.ZodOptional<z.ZodString>;
        framework: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>], "kind">>;
    table_structure_options: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        do_cell_matching: z.ZodOptional<z.ZodBoolean>;
        mode: z.ZodOptional<z.ZodEnum<{
            fast: "fast";
            accurate: "accurate";
        }>>;
    }, z.core.$strip>>>;
    layout_options: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        create_orphan_clusters: z.ZodOptional<z.ZodBoolean>;
        keep_empty_clusters: z.ZodOptional<z.ZodBoolean>;
        model_spec: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    accelerator_options: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        device: z.ZodOptional<z.ZodEnum<{
            auto: "auto";
            cpu: "cpu";
            cuda: "cuda";
            mps: "mps";
        }>>;
        num_threads: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>>;
    generate_page_images: z.ZodOptional<z.ZodBoolean>;
    generate_picture_images: z.ZodOptional<z.ZodBoolean>;
    create_legacy_output: z.ZodOptional<z.ZodBoolean>;
    force_backend_text: z.ZodOptional<z.ZodBoolean>;
    enable_remote_services: z.ZodOptional<z.ZodBoolean>;
    allow_external_plugins: z.ZodOptional<z.ZodBoolean>;
    artifacts_path: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const CliConvertOptionsSchema: z.ZodObject<{
    to_formats: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        text: "text";
        html: "html";
        md: "md";
        json: "json";
        html_split_page: "html_split_page";
        doctags: "doctags";
    }>>>;
    ocr_engine: z.ZodOptional<z.ZodEnum<{
        easyocr: "easyocr";
        tesserocr: "tesserocr";
        tesseract: "tesseract";
        rapidocr: "rapidocr";
        ocrmac: "ocrmac";
    }>>;
    pdf_backend: z.ZodOptional<z.ZodEnum<{
        pypdfium2: "pypdfium2";
        dlparse_v1: "dlparse_v1";
        dlparse_v2: "dlparse_v2";
        dlparse_v4: "dlparse_v4";
    }>>;
    table_mode: z.ZodOptional<z.ZodEnum<{
        fast: "fast";
        accurate: "accurate";
    }>>;
    image_export_mode: z.ZodOptional<z.ZodEnum<{
        embedded: "embedded";
        referenced: "referenced";
        placeholder: "placeholder";
    }>>;
    processing_pipeline: z.ZodOptional<z.ZodEnum<{
        fast: "fast";
        accurate: "accurate";
        default: "default";
    }>>;
    force_ocr: z.ZodOptional<z.ZodBoolean>;
    page_range: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
    extract_images: z.ZodOptional<z.ZodBoolean>;
    extract_tables: z.ZodOptional<z.ZodBoolean>;
    extract_text: z.ZodOptional<z.ZodBoolean>;
    table_cell_matching: z.ZodOptional<z.ZodBoolean>;
    document_timeout: z.ZodOptional<z.ZodNumber>;
    do_ocr: z.ZodOptional<z.ZodBoolean>;
    do_table_structure: z.ZodOptional<z.ZodBoolean>;
    do_code_enrichment: z.ZodOptional<z.ZodBoolean>;
    do_formula_enrichment: z.ZodOptional<z.ZodBoolean>;
    do_picture_classification: z.ZodOptional<z.ZodBoolean>;
    do_picture_description: z.ZodOptional<z.ZodBoolean>;
    picture_description_area_threshold: z.ZodOptional<z.ZodNumber>;
    include_images: z.ZodOptional<z.ZodBoolean>;
    images_scale: z.ZodOptional<z.ZodNumber>;
    md_page_break_placeholder: z.ZodOptional<z.ZodString>;
    abort_on_error: z.ZodOptional<z.ZodBoolean>;
    vlm_pipeline_model: z.ZodOptional<z.ZodEnum<{
        smoldocling: "smoldocling";
    }>>;
    vlm_pipeline_model_local: z.ZodOptional<z.ZodObject<{
        repo_id: z.ZodString;
        prompt: z.ZodString;
        scale: z.ZodNumber;
        response_format: z.ZodEnum<{
            doctags: "doctags";
            markdown: "markdown";
        }>;
        inference_framework: z.ZodEnum<{
            transformers: "transformers";
            mlx: "mlx";
        }>;
        transformers_model_type: z.ZodEnum<{
            "automodel-vision2seq": "automodel-vision2seq";
            automodel: "automodel";
        }>;
        extra_generation_config: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, z.core.$strip>>;
    vlm_pipeline_model_api: z.ZodOptional<z.ZodObject<{
        url: z.ZodString;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        params: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        timeout: z.ZodNumber;
        concurrency: z.ZodNumber;
        prompt: z.ZodString;
        scale: z.ZodNumber;
        response_format: z.ZodEnum<{
            doctags: "doctags";
            markdown: "markdown";
        }>;
    }, z.core.$strip>>;
    picture_description_local: z.ZodOptional<z.ZodObject<{
        repo_id: z.ZodString;
        prompt: z.ZodString;
        scale: z.ZodNumber;
        response_format: z.ZodEnum<{
            doctags: "doctags";
            markdown: "markdown";
        }>;
        inference_framework: z.ZodEnum<{
            transformers: "transformers";
            mlx: "mlx";
        }>;
        transformers_model_type: z.ZodEnum<{
            "automodel-vision2seq": "automodel-vision2seq";
            automodel: "automodel";
        }>;
        extra_generation_config: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, z.core.$strip>>;
    picture_description_api: z.ZodOptional<z.ZodObject<{
        url: z.ZodString;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        params: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        timeout: z.ZodOptional<z.ZodNumber>;
        concurrency: z.ZodOptional<z.ZodNumber>;
        prompt: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    ocr_options: z.ZodOptional<z.ZodDiscriminatedUnion<[z.ZodObject<{
        lang: z.ZodArray<z.ZodString>;
        force_full_page_ocr: z.ZodOptional<z.ZodBoolean>;
        bitmap_area_threshold: z.ZodOptional<z.ZodNumber>;
        kind: z.ZodLiteral<"easyocr">;
        use_gpu: z.ZodOptional<z.ZodBoolean>;
        confidence_threshold: z.ZodOptional<z.ZodNumber>;
        model_storage_directory: z.ZodOptional<z.ZodString>;
        recog_network: z.ZodOptional<z.ZodString>;
        download_enabled: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>, z.ZodObject<{
        lang: z.ZodArray<z.ZodString>;
        force_full_page_ocr: z.ZodOptional<z.ZodBoolean>;
        bitmap_area_threshold: z.ZodOptional<z.ZodNumber>;
        kind: z.ZodLiteral<"rapidocr">;
        text_score: z.ZodOptional<z.ZodNumber>;
        use_det: z.ZodOptional<z.ZodBoolean>;
        use_cls: z.ZodOptional<z.ZodBoolean>;
        use_rec: z.ZodOptional<z.ZodBoolean>;
        print_verbose: z.ZodOptional<z.ZodBoolean>;
        det_model_path: z.ZodOptional<z.ZodString>;
        cls_model_path: z.ZodOptional<z.ZodString>;
        rec_model_path: z.ZodOptional<z.ZodString>;
        rec_keys_path: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        lang: z.ZodArray<z.ZodString>;
        force_full_page_ocr: z.ZodOptional<z.ZodBoolean>;
        bitmap_area_threshold: z.ZodOptional<z.ZodNumber>;
        kind: z.ZodLiteral<"tesseract">;
        tesseract_cmd: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        lang: z.ZodArray<z.ZodString>;
        force_full_page_ocr: z.ZodOptional<z.ZodBoolean>;
        bitmap_area_threshold: z.ZodOptional<z.ZodNumber>;
        kind: z.ZodLiteral<"tesserocr">;
        path: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        lang: z.ZodArray<z.ZodString>;
        force_full_page_ocr: z.ZodOptional<z.ZodBoolean>;
        bitmap_area_threshold: z.ZodOptional<z.ZodNumber>;
        kind: z.ZodLiteral<"ocrmac">;
        recognition: z.ZodOptional<z.ZodString>;
        framework: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>], "kind">>;
    table_structure_options: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        do_cell_matching: z.ZodOptional<z.ZodBoolean>;
        mode: z.ZodOptional<z.ZodEnum<{
            fast: "fast";
            accurate: "accurate";
        }>>;
    }, z.core.$strip>>>;
    layout_options: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        create_orphan_clusters: z.ZodOptional<z.ZodBoolean>;
        keep_empty_clusters: z.ZodOptional<z.ZodBoolean>;
        model_spec: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    accelerator_options: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        device: z.ZodOptional<z.ZodEnum<{
            auto: "auto";
            cpu: "cpu";
            cuda: "cuda";
            mps: "mps";
        }>>;
        num_threads: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>>;
    generate_page_images: z.ZodOptional<z.ZodBoolean>;
    generate_picture_images: z.ZodOptional<z.ZodBoolean>;
    create_legacy_output: z.ZodOptional<z.ZodBoolean>;
    force_backend_text: z.ZodOptional<z.ZodBoolean>;
    enable_remote_services: z.ZodOptional<z.ZodBoolean>;
    allow_external_plugins: z.ZodOptional<z.ZodBoolean>;
    artifacts_path: z.ZodOptional<z.ZodString>;
    sources: z.ZodArray<z.ZodString>;
    input: z.ZodOptional<z.ZodString>;
    output: z.ZodOptional<z.ZodString>;
    from_formats: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        docx: "docx";
        pptx: "pptx";
        html: "html";
        image: "image";
        pdf: "pdf";
        asciidoc: "asciidoc";
        md: "md";
        csv: "csv";
        xlsx: "xlsx";
        xml_uspto: "xml_uspto";
        xml_jats: "xml_jats";
        json_docling: "json_docling";
        audio: "audio";
    }>>>;
    verbose: z.ZodOptional<z.ZodBoolean>;
    quiet: z.ZodOptional<z.ZodBoolean>;
    debug: z.ZodOptional<z.ZodBoolean>;
    config: z.ZodOptional<z.ZodString>;
    timeout: z.ZodOptional<z.ZodNumber>;
    max_retries: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
export declare const FileMetadataSchema: z.ZodObject<{
    filename: z.ZodString;
    size: z.ZodOptional<z.ZodNumber>;
    contentType: z.ZodString;
    lastModified: z.ZodOptional<z.ZodDate>;
}, z.core.$strict>;
export declare const ProgressUpdateSchema: z.ZodObject<{
    stage: z.ZodString;
    percentage: z.ZodOptional<z.ZodNumber>;
    message: z.ZodOptional<z.ZodString>;
    taskId: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodNumber;
    source: z.ZodOptional<z.ZodEnum<{
        http: "http";
        websocket: "websocket";
    }>>;
    memoryUsage: z.ZodOptional<z.ZodObject<{
        rss: z.ZodNumber;
        heapTotal: z.ZodNumber;
        heapUsed: z.ZodNumber;
        external: z.ZodNumber;
        arrayBuffers: z.ZodNumber;
    }, z.core.$strip>>;
    uploadedBytes: z.ZodOptional<z.ZodNumber>;
    totalBytes: z.ZodOptional<z.ZodNumber>;
    bytesPerSecond: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
export declare const TaskStatusResponseSchema: z.ZodObject<{
    task_id: z.ZodString;
    task_status: z.ZodEnum<{
        pending: "pending";
        started: "started";
        success: "success";
        failure: "failure";
        cancelled: "cancelled";
    }>;
    task_position: z.ZodOptional<z.ZodNumber>;
    task_meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strict>;
export declare const DocumentContentSchema: z.ZodObject<{
    md_content: z.ZodOptional<z.ZodString>;
    json_content: z.ZodOptional<z.ZodUnknown>;
    html_content: z.ZodOptional<z.ZodString>;
    text_content: z.ZodOptional<z.ZodString>;
    doctags_content: z.ZodOptional<z.ZodUnknown>;
}, z.core.$strict>;
export declare const ConversionResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    document: z.ZodOptional<z.ZodObject<{
        md_content: z.ZodOptional<z.ZodString>;
        json_content: z.ZodOptional<z.ZodUnknown>;
        html_content: z.ZodOptional<z.ZodString>;
        text_content: z.ZodOptional<z.ZodString>;
        doctags_content: z.ZodOptional<z.ZodUnknown>;
    }, z.core.$strict>>;
    processing_time: z.ZodOptional<z.ZodNumber>;
    timings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    error: z.ZodOptional<z.ZodObject<{
        message: z.ZodString;
        code: z.ZodOptional<z.ZodString>;
        details: z.ZodOptional<z.ZodUnknown>;
    }, z.core.$strip>>;
}, z.core.$strict>;
export declare const ConversionFileResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    fileMetadata: z.ZodObject<{
        filename: z.ZodString;
        size: z.ZodOptional<z.ZodNumber>;
        contentType: z.ZodString;
        lastModified: z.ZodOptional<z.ZodDate>;
    }, z.core.$strict>;
    fileStream: z.ZodOptional<z.ZodUnknown>;
    error: z.ZodOptional<z.ZodObject<{
        message: z.ZodString;
        code: z.ZodOptional<z.ZodString>;
        details: z.ZodOptional<z.ZodUnknown>;
    }, z.core.$strip>>;
}, z.core.$strict>;
export declare const ApiClientConfigSchema: z.ZodObject<{
    baseUrl: z.ZodString;
    timeout: z.ZodDefault<z.ZodNumber>;
    retries: z.ZodDefault<z.ZodNumber>;
    retryDelay: z.ZodDefault<z.ZodNumber>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    apiKey: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const CliClientConfigSchema: z.ZodObject<{
    pythonPath: z.ZodDefault<z.ZodString>;
    doclingPath: z.ZodOptional<z.ZodString>;
    timeout: z.ZodDefault<z.ZodNumber>;
    maxRetries: z.ZodDefault<z.ZodNumber>;
    retryDelay: z.ZodDefault<z.ZodNumber>;
    tempDir: z.ZodOptional<z.ZodString>;
    cleanupTemp: z.ZodDefault<z.ZodBoolean>;
    verbose: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strict>;
export declare const WebSocketConfigSchema: z.ZodObject<{
    url: z.ZodString;
    reconnectAttempts: z.ZodDefault<z.ZodNumber>;
    reconnectDelay: z.ZodDefault<z.ZodNumber>;
    timeout: z.ZodDefault<z.ZodNumber>;
    heartbeatInterval: z.ZodDefault<z.ZodNumber>;
}, z.core.$strict>;
export declare const ProgressConfigSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    interval: z.ZodDefault<z.ZodNumber>;
    useWebSocket: z.ZodDefault<z.ZodBoolean>;
    onProgress: z.ZodOptional<z.ZodAny>;
    onComplete: z.ZodOptional<z.ZodAny>;
    onError: z.ZodOptional<z.ZodAny>;
}, z.core.$strict>;
export declare const ConnectionPoolConfigSchema: z.ZodObject<{
    maxSockets: z.ZodDefault<z.ZodNumber>;
    maxFreeSockets: z.ZodDefault<z.ZodNumber>;
    timeout: z.ZodDefault<z.ZodNumber>;
    keepAliveTimeout: z.ZodDefault<z.ZodNumber>;
    keepAlive: z.ZodDefault<z.ZodBoolean>;
    maxRequestsPerSocket: z.ZodOptional<z.ZodNumber>;
    socketTimeout: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
export type InputFormat = z.infer<typeof InputFormatSchema>;
export type OutputFormat = z.infer<typeof OutputFormatSchema>;
export type OcrEngine = z.infer<typeof OcrEngineSchema>;
export type PdfBackend = z.infer<typeof PdfBackendSchema>;
export type TableMode = z.infer<typeof TableModeSchema>;
export type ImageExportMode = z.infer<typeof ImageExportModeSchema>;
export type ProcessingPipeline = z.infer<typeof ProcessingPipelineSchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type ConversionOptions = z.infer<typeof ConversionOptionsSchema>;
export type CliConvertOptions = z.infer<typeof CliConvertOptionsSchema>;
export type FileMetadata = z.infer<typeof FileMetadataSchema>;
export type ProgressUpdate = z.infer<typeof ProgressUpdateSchema>;
export type TaskStatusResponse = z.infer<typeof TaskStatusResponseSchema>;
export type DocumentContent = z.infer<typeof DocumentContentSchema>;
export type ConversionResult = z.infer<typeof ConversionResultSchema>;
export type ConversionFileResult = z.infer<typeof ConversionFileResultSchema>;
export type ApiClientConfig = z.infer<typeof ApiClientConfigSchema>;
export type CliClientConfig = z.infer<typeof CliClientConfigSchema>;
export type WebSocketConfig = z.infer<typeof WebSocketConfigSchema>;
export type ProgressConfig = z.infer<typeof ProgressConfigSchema>;
export type ConnectionPoolConfig = z.infer<typeof ConnectionPoolConfigSchema>;
export declare class ZodValidation {
    static validateConversionOptions(options: unknown): ConversionOptions;
    static safeValidateConversionOptions(options: unknown): z.ZodSafeParseResult<{
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
    static validateCliConvertOptions(options: unknown): CliConvertOptions;
    static validateApiClientConfig(config: unknown): ApiClientConfig;
    static validateCliClientConfig(config: unknown): CliClientConfig;
    static validateProgressUpdate(update: unknown): ProgressUpdate;
    static validateTaskStatusResponse(response: unknown): TaskStatusResponse;
    static validateConversionResult(result: unknown): ConversionResult;
    static isValidInputFormat(value: unknown): value is InputFormat;
    static isValidOutputFormat(value: unknown): value is OutputFormat;
    static isValidOcrEngine(value: unknown): value is OcrEngine;
    static isValidPdfBackend(value: unknown): value is PdfBackend;
    static isValidTableMode(value: unknown): value is TableMode;
    static isValidImageExportMode(value: unknown): value is ImageExportMode;
    static isValidProcessingPipeline(value: unknown): value is ProcessingPipeline;
    static isValidTaskStatus(value: unknown): value is TaskStatus;
}
