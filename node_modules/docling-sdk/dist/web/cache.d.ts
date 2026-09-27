export type ProgressCallback = (progress: number, status: string) => void;
export declare function createCustomCache(onProgress?: ProgressCallback): {
    match(request: string | Request): Promise<Response | undefined>;
    put(): Promise<void>;
};
export declare function clearModelCache(): Promise<boolean>;
export declare function getModelCacheSize(): Promise<number>;
