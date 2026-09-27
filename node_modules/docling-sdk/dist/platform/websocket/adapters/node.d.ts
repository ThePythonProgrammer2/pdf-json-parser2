import type { WebSocketAdapter, WebSocketAdapterOptions, WebSocketHooks, WebSocketPeer } from "../types";
export declare class NodeWebSocketAdapter implements WebSocketAdapter {
    private options;
    private hooks;
    private peer;
    private ws;
    constructor(options: WebSocketAdapterOptions);
    connect(): Promise<WebSocketPeer>;
    isConnected(): boolean;
    getPeer(): WebSocketPeer | null;
    close(code?: number, reason?: string): void;
    setHooks(hooks: WebSocketHooks): void;
    getHooks(): WebSocketHooks;
    getType(): "browser" | "node" | "universal";
}
export declare function createNodeWebSocketAdapter(options: WebSocketAdapterOptions): NodeWebSocketAdapter;
