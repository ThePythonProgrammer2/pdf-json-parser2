import type { HttpClient } from "../api/http";
import { CrossEventEmitter } from "../platform/events";
export type TaskStatus = "pending" | "started" | "success" | "failure" | "revoked";
export interface TaskEvents {
    [key: string]: unknown;
    status: {
        status: TaskStatus;
        taskId: string;
    };
    progress: {
        progress: {
            stage: string;
            message?: string;
        };
        taskId: string;
    };
    success: {
        taskId: string;
    };
    failure: {
        error: string;
        taskId: string;
    };
    timeout: {
        taskId: string;
    };
    error: {
        error: Error;
        taskId: string;
    };
}
export interface TaskOptions {
    timeout?: number;
    pollInterval?: number;
    maxPolls?: number;
    waitSeconds?: number;
    pollingRetries?: number;
}
export interface TaskResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        details?: unknown;
    };
    taskId: string;
    finalStatus: TaskStatus;
    duration: number;
}
export declare class AsyncTaskManager extends CrossEventEmitter<TaskEvents> {
    private activeTasks;
    private http;
    constructor(http: HttpClient);
    submitTask(endpoint: string, parameters: Record<string, unknown>, options?: TaskOptions): Promise<string>;
    startPollingExistingTask(taskId: string, options?: TaskOptions): void;
    waitForCompletion<T = unknown>(taskId: string): Promise<TaskResult<T>>;
    getTaskResult<T = unknown>(taskId: string): Promise<T>;
    cancelTask(taskId: string): Promise<void>;
    getActiveTaskCount(): number;
    getTaskInfo(taskId: string): {
        taskId: string;
        duration: number;
        options: Required<TaskOptions>;
    } | null;
    destroy(): void;
    private normalizeOptions;
    private startPolling;
    private setTaskTimeout;
    private cleanup;
}
export interface TypedAsyncTaskManager {
    on<K extends keyof TaskEvents>(event: K, listener: (data: TaskEvents[K]) => void): this;
    emit<K extends keyof TaskEvents>(event: K, data: TaskEvents[K]): this;
    once<K extends keyof TaskEvents>(event: K, listener: (data: TaskEvents[K]) => void): this;
    off<K extends keyof TaskEvents>(event: K, listener: (data: TaskEvents[K]) => void): this;
}
