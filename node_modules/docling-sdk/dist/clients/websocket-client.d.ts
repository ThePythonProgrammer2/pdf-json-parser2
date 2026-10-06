import { CrossEventEmitter } from "../platform/events";
import type { ProcessingError, TaskStatusResponse, WebSocketMessage } from "../types/api";
export interface WebSocketConfig {
    baseUrl: string;
    timeout?: number;
    reconnectAttempts?: number;
    reconnectDelay?: number;
    heartbeatInterval?: number;
}
export type ConnectionState = "connecting" | "connected" | "disconnected" | "error";
interface DoclingWebSocketEvents {
    [key: string]: unknown;
    connecting: string;
    connected: string;
    disconnected: {
        code: number;
        reason: string;
    };
    error: Error;
    connection: WebSocketMessage;
    taskUpdate: TaskStatusResponse;
    task_update: WebSocketMessage;
    taskComplete: TaskStatusResponse;
    taskFailed: TaskStatusResponse;
    taskStarted: TaskStatusResponse;
    taskError: ProcessingError;
    unknownMessage: WebSocketMessage;
    reconnecting: {
        attempt: number;
        delay: number;
    };
    reconnectFailed: {
        attempt: number;
        error: unknown;
    };
    progress: {
        stage: string;
        percentage?: number;
        message?: string;
        taskId: string;
        position?: number;
        status?: string;
        timestamp: number;
    };
    status: [string, string];
}
export declare class DoclingWebSocketClient extends CrossEventEmitter<DoclingWebSocketEvents> {
    private config;
    private ws;
    private connectionState;
    private reconnectAttempts;
    private heartbeatTimer;
    private reconnectAbortController;
    private _currentTaskId;
    constructor(config: WebSocketConfig);
    connectToTask(taskId: string): Promise<void>;
    disconnect(): void;
    getConnectionState(): ConnectionState;
    getCurrentTaskId(): string | null;
    monitorTask(taskId: string, onProgress?: (progress: {
        stage: string;
        percentage?: number;
        message?: string;
        taskId: string;
        position?: number;
        status: string;
        timestamp: number;
    }) => void): Promise<TaskStatusResponse>;
    private calculateProgress;
    isConnected(): boolean;
    private static readonly STATUS_EVENTS;
    private readonly messageHandlers;
    private handleMessage;
    private startHeartbeat;
    private stopHeartbeat;
    private scheduleReconnect;
    private clearReconnectTimer;
    updateConfig(config: Partial<WebSocketConfig>): void;
    getConfig(): WebSocketConfig;
}
interface WebSocketAsyncTaskEvents {
    [key: string]: unknown;
    progress: TaskStatusResponse;
    complete: TaskStatusResponse;
    failed: TaskStatusResponse;
    error: ProcessingError | Error;
    disconnected: undefined;
}
export declare class WebSocketAsyncTask extends CrossEventEmitter<WebSocketAsyncTaskEvents> {
    taskId: string;
    status: string;
    position?: number | undefined;
    meta?: Record<string, unknown> | undefined;
    private wsClient;
    private isMonitoring;
    constructor(taskId: string, status: string, position?: number | undefined, meta?: Record<string, unknown> | undefined, wsConfig?: WebSocketConfig);
    startMonitoring(): Promise<void>;
    stopMonitoring(): void;
    isCurrentlyMonitoring(): boolean;
    private setupWebSocketListeners;
    getWebSocketClient(): DoclingWebSocketClient;
}
export {};
