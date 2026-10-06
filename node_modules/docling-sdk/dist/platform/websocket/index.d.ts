import type { WebSocketAdapter, WebSocketAdapterOptions, WebSocketHooks, WebSocketPeer } from "./types";
export type { WebSocketAdapter, WebSocketAdapterOptions, WebSocketCloseEvent, WebSocketErrorEvent, WebSocketHooks, WebSocketMessage, WebSocketMessageEvent, WebSocketPeer, } from "./types";
export type { WebSocketAdapterFactory, WebSocketReadyState as WebSocketReadyStateType, } from "./types";
export declare function createWebSocketAdapter(options: WebSocketAdapterOptions): Promise<WebSocketAdapter>;
export declare class CrossWebSocket {
    private adapter;
    private options;
    private hooks;
    private connectionPromise;
    constructor(url: string, options?: Omit<WebSocketAdapterOptions, "url">);
    connect(): Promise<WebSocketPeer>;
    isConnected(): boolean;
    getPeer(): WebSocketPeer | null;
    send(data: string | Uint8Array): void;
    sendText(data: string): void;
    sendJson(data: unknown): void;
    close(code?: number, reason?: string): void;
    setHooks(hooks: WebSocketHooks): void;
    on<K extends keyof WebSocketHooks>(event: K, handler: NonNullable<WebSocketHooks[K]>): this;
    off<K extends keyof WebSocketHooks>(event: K): this;
    getAdapterType(): "browser" | "node" | "universal" | null;
    getAdapter(): WebSocketAdapter | null;
}
export declare function createCrossWebSocket(url: string, options?: Omit<WebSocketAdapterOptions, "url">): CrossWebSocket;
export declare function connectWebSocket(url: string, hooks?: WebSocketHooks, options?: Omit<WebSocketAdapterOptions, "url" | "hooks">): Promise<WebSocketPeer>;
