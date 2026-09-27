import { type ChildProcess } from "node:child_process";
import type { CliAsyncOptions, CliConfig, CliExecutionOptions, CliProgressCallback, CliResult } from "../types";
export declare class CliUtils {
    private config;
    constructor(config?: CliConfig);
    private normalizeExecutable;
    private forwardSignals;
    private gracefulTerminate;
    private forceTerminateAfter;
    checkAvailability(): Promise<boolean>;
    getVersion(): Promise<string>;
    execute(args: string[], options?: CliExecutionOptions): Promise<CliResult>;
    executeTools(args: string[], options?: CliExecutionOptions): Promise<CliResult>;
    private executeCommand;
    executeAsync(args: string[], options?: CliAsyncOptions): Promise<CliResult>;
    executeToolsAsync(args: string[], options?: CliAsyncOptions): Promise<CliResult>;
    private executeCommandAsync;
    buildArgs(command: string, options?: Record<string, unknown>): string[];
    private camelToKebab;
    escapeArg(arg: string): string;
    parseOutput(stdout: string, format?: "json" | "text"): unknown;
    extractOutputFiles(stdout: string): string[];
    monitorProgress(child: ChildProcess, onProgress?: CliProgressCallback): void;
    validateConfig(): void;
    updateConfig(newConfig: Partial<CliConfig>): void;
    getConfig(): CliConfig;
}
