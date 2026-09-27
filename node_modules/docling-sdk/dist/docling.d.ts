import { DoclingAPIClient } from "./clients/api-client";
import { DoclingCLIClient } from "./clients/cli-client";
import { DoclingWebClient } from "./clients/web-client";
import type { DoclingAPIConfig, DoclingCLIConfig, DoclingConfig } from "./types/client";
import type { DoclingWebClientConfig } from "./types/web";
type ApiVariant = Extract<DoclingConfig, {
    api: unknown;
}>;
type CliVariant = Extract<DoclingConfig, {
    cli: unknown;
}>;
type WebVariant = Extract<DoclingConfig, {
    web: unknown;
}>;
interface DoclingConstructor {
    new (config: ApiVariant): DoclingAPIClient;
    new (config: CliVariant): DoclingCLIClient;
    new (config: WebVariant): DoclingWebClient;
    new (config: DoclingConfig): DoclingAPIClient | DoclingCLIClient | DoclingWebClient;
}
export declare const Docling: DoclingConstructor;
export type DoclingClientType<T extends DoclingConfig> = T extends DoclingAPIConfig ? DoclingAPIClient : T extends DoclingCLIConfig ? DoclingCLIClient : T extends DoclingWebClientConfig ? DoclingWebClient : never;
export declare function isAPIClient(client: DoclingAPIClient | DoclingCLIClient | DoclingWebClient): client is DoclingAPIClient;
export declare function isCLIClient(client: DoclingAPIClient | DoclingCLIClient | DoclingWebClient): client is DoclingCLIClient;
export declare function isWebClient(client: DoclingAPIClient | DoclingCLIClient | DoclingWebClient): client is DoclingWebClient;
export declare function createWebClient(options?: Partial<Omit<DoclingWebClientConfig, "type">>): DoclingWebClient;
export declare function createAPIClient(baseUrl: string, options?: Partial<Omit<DoclingAPIConfig, "type" | "baseUrl">>): DoclingAPIClient;
export declare function createCLIClient(options?: Partial<Omit<DoclingCLIConfig, "type">>): DoclingCLIClient;
export type { DoclingConfig, DoclingAPIConfig, DoclingCLIConfig, } from "./types/client";
export type { DoclingWebClientConfig } from "./types/web";
export { DoclingWebClient } from "./clients/web-client";
export default Docling;
