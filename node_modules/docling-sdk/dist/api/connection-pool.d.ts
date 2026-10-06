import { Agent as HttpAgent } from "node:http";
import { Agent as HttpsAgent } from "node:https";
import { URL } from "node:url";
export interface ConnectionPoolConfig {
    maxSockets: number;
    maxFreeSockets: number;
    timeout: number;
    keepAliveTimeout: number;
    keepAlive: boolean;
    maxRequestsPerSocket?: number;
    socketTimeout?: number;
}
export interface PoolStats {
    totalSockets: number;
    freeSockets: number;
    activeSockets: number;
    pendingRequests: number;
    totalRequests: number;
    totalConnections: number;
    totalTimeouts: number;
    totalErrors: number;
}
export declare class ConnectionPool {
    private httpAgent;
    private httpsAgent;
    private config;
    private stats;
    private requestCount;
    private connectionCount;
    private timeoutCount;
    private errorCount;
    constructor(config?: Partial<ConnectionPoolConfig>);
    private createHttpAgent;
    private createHttpsAgent;
    private setupAgentEventListeners;
    getAgent(url: string | URL): HttpAgent | HttpsAgent;
    private updateStats;
    getStats(): PoolStats;
    getHealth(): {
        healthy: boolean;
        issues: string[];
        utilization: number;
        efficiency: number;
    };
    updateConfig(newConfig: Partial<ConnectionPoolConfig>): void;
    destroy(): void;
    closeIdleConnections(): void;
    getConnectionDetails(): {
        http: {
            hosts: string[];
            totalSockets: number;
            freeSockets: number;
            pendingRequests: number;
        };
        https: {
            hosts: string[];
            totalSockets: number;
            freeSockets: number;
            pendingRequests: number;
        };
    };
}
