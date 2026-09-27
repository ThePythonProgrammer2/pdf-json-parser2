import type { RenderedPage } from "../types/web";
export declare function renderPdfToImages(data: Uint8Array | ArrayBuffer, options?: {
    scale?: number;
}): Promise<RenderedPage[]>;
