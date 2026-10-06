export interface WebOCRRefItem {
    $ref: string;
}
export interface WebOCRBoundingBox {
    l: number;
    t: number;
    r: number;
    b: number;
    coord_origin: "TOPLEFT" | "BOTTOMLEFT";
}
export interface WebOCRProvenanceItem {
    page_no: number;
    bbox: WebOCRBoundingBox;
    charspan: [number, number];
}
export type WebOCRContentItem = WebOCRRefItem;
export interface WebOCRBaseItem {
    self_ref: string;
    parent: WebOCRRefItem | null;
    children: WebOCRContentItem[];
    label: string;
    prov?: WebOCRProvenanceItem[];
}
export interface WebOCRTextItem extends WebOCRBaseItem {
    label: "title" | "section_header" | "text" | "code" | "formula" | "list_item" | "caption" | "footnote" | "page_header" | "page_footer";
    orig: string;
    text: string;
    level?: number;
    enumerated?: boolean;
    language?: string;
}
export interface WebOCRTableCell {
    text: string;
    row_span: number;
    col_span: number;
    start_row_offset_idx: number;
    end_row_offset_idx: number;
    start_col_offset_idx: number;
    end_col_offset_idx: number;
    col_header: boolean;
    row_header: boolean;
}
export interface WebOCRTableData {
    num_rows: number;
    num_cols: number;
    table_cells: WebOCRTableCell[];
}
export interface WebOCRTableItem extends WebOCRBaseItem {
    label: "table";
    data: WebOCRTableData;
}
export interface WebOCRPictureItem extends WebOCRBaseItem {
    label: "picture" | "chart";
    caption?: string;
    image?: string;
}
export interface WebOCRGroupItem extends WebOCRBaseItem {
    label: "body" | "group";
}
export interface WebOCRPageItem {
    size: {
        width: number;
        height: number;
    };
}
export interface WebOCRDocument {
    schema_name: "DoclingDocument";
    version: string;
    name: string;
    texts: WebOCRTextItem[];
    tables: WebOCRTableItem[];
    pictures: WebOCRPictureItem[];
    body: WebOCRGroupItem;
    pages: Record<number, WebOCRPageItem>;
}
export interface ExtractedTable {
    headers: string[];
    rows: string[][];
}
export interface ElementOverlay {
    tagType: string;
    bbox: {
        left: number;
        top: number;
        right: number;
        bottom: number;
    };
}
export interface DoclingWebConfig {
    device?: "webgpu" | "wasm" | "auto";
    modelId?: string;
    maxNewTokens?: number;
    wasmPaths?: Record<string, string>;
    workerUrl?: string;
}
export interface DoclingWebClientConfig extends DoclingWebConfig {
    type: "web";
}
export interface WebOCRResult {
    raw: string;
    html: string;
    markdown: string;
    plainText: string;
    json: WebOCRDocument;
    tables: ExtractedTable[];
    overlays: ElementOverlay[];
}
export type ImageInput = File | Blob | string | HTMLCanvasElement | HTMLImageElement | ImageBitmap | OffscreenCanvas;
export interface WebProcessOptions {
    maxNewTokens?: number;
}
export interface LoadingProgress {
    progress: number;
    status: string;
}
export interface StreamChunk {
    chunk: string;
    progress: number;
}
export interface StatusReport {
    status: string;
}
export interface WebClientError {
    message: string;
    code?: string;
}
export type WebClientEvents = {
    loading: LoadingProgress;
    ready: undefined;
    status: StatusReport;
    stream: StreamChunk;
    complete: WebOCRResult;
    error: WebClientError;
};
export type WorkerMessageToWorker = {
    type: "INIT";
    config: DoclingWebConfig;
} | {
    type: "PROCESS_FILE";
    src: string;
    maxNewTokens?: number;
};
export type WorkerMessageFromWorker = {
    type: "READY";
} | {
    type: "PROGRESS";
    progress: number;
    status: string;
} | {
    type: "REPORT";
    status: string;
} | {
    type: "STREAM";
    chunk: string;
    progress: number;
} | {
    type: "DONE";
    text: string;
    html: string;
    markdown: string;
    plainText: string;
    json: WebOCRDocument;
    tables: ExtractedTable[];
    overlays: ElementOverlay[];
} | {
    type: "ERROR";
    error: string;
};
export interface RenderedPage {
    pageNumber: number;
    dataUrl: string;
    width: number;
    height: number;
}
