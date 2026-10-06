import type { HttpClient } from "../api/http";
import { CrossEventEmitter } from "../platform/events";
import type { ProgressConfig, ProgressUpdate } from "../types/client";
export interface ProgressEvents {
    [key: string]: unknown;
    progress: ProgressUpdate;
    complete: unknown;
    error: Error;
}
export declare class ProgressTracker extends CrossEventEmitter<ProgressEvents> {
    private config;
    private wsClient;
    private httpClient;
    private pollTimer;
    private isActive;
    private currentTaskId;
    private lastProgressTime;
    constructor(httpClient: HttpClient, baseUrl: string, config?: ProgressConfig);
    startTracking(taskId: string): Promise<void>;
    stopTracking(): Promise<void>;
    private startWebSocketTracking;
    private startHttpPolling;
    private setupWebSocketTimeout;
    private handleProgress;
    private handleCompletion;
    private handleError;
}
