import type { BinaryData } from "../binary";
export declare const WebSocketReadyState: {
    readonly CONNECTING: 0;
    readonly OPEN: 1;
    readonly CLOSING: 2;
    readonly CLOSED: 3;
};
export type WebSocketReadyState = (typeof WebSocketReadyState)[keyof typeof WebSocketReadyState];
export interface WebSocketCloseEvent {
    code: number;
    reason: string;
    wasClean: boolean;
}
export interface WebSocketMessageEvent {
    data: string | BinaryData;
    type: "text" | "binary";
}
export interface WebSocketErrorEvent {
    message: string;
    error?: Error;
}
export interface WebSocketPeer {
    id: string;
    url: string;
    readyState: WebSocketReadyState;
    protocol: string;
    send(data: string | BinaryData): void;
    sendText(data: string): void;
    sendBinary(data: BinaryData): void;
    close(code?: number, reason?: string): void;
    ping?(data?: BinaryData): void;
    pong?(data?: BinaryData): void;
    subscribe(event: string, handler: (...args: unknown[]) => void): void;
    unsubscribe(event: string, handler: (...args: unknown[]) => void): void;
    terminate(): void;
    getRaw(): unknown;
}
export interface WebSocketMessage {
    data: string | BinaryData;
    type: "text" | "binary";
    json<T = unknown>(): T;
    text(): string;
    binary(): BinaryData;
}
export interface WebSocketHooks {
    open?: (peer: WebSocketPeer) => void | Promise<void>;
    message?: (peer: WebSocketPeer, message: WebSocketMessage) => void | Promise<void>;
    close?: (peer: WebSocketPeer, event: WebSocketCloseEvent) => void | Promise<void>;
    error?: (peer: WebSocketPeer, error: WebSocketErrorEvent) => void | Promise<void>;
    ping?: (peer: WebSocketPeer, data?: BinaryData) => void | Promise<void>;
    pong?: (peer: WebSocketPeer, data?: BinaryData) => void | Promise<void>;
}
export interface WebSocketAdapterOptions {
    url: string;
    protocols?: string | string[];
    timeout?: number;
    hooks?: WebSocketHooks;
}
export interface WebSocketAdapter {
    connect(): Promise<WebSocketPeer>;
    isConnected(): boolean;
    getPeer(): WebSocketPeer | null;
    close(code?: number, reason?: string): void;
    setHooks(hooks: WebSocketHooks): void;
    getHooks(): WebSocketHooks;
    getType(): "browser" | "node" | "universal";
}
export type WebSocketAdapterFactory = (options: WebSocketAdapterOptions) => WebSocketAdapter;
