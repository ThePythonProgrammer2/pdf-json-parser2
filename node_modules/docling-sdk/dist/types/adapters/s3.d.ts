import type { S3Source, S3Target } from "../api";
import type { S3Config } from "../client";
export declare function toOpenApiS3Source(config: S3Config): S3Source;
export declare function toOpenApiS3Target(config: S3Config): S3Target;
export declare function isUserFriendlyS3Config(config: Record<string, unknown>): boolean;
