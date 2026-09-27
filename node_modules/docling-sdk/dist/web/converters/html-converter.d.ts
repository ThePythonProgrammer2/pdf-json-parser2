export declare class DoclingConverter {
    private simpleTagMap;
    private selfClosingTagMap;
    private TABLE_TAG_CONFIG;
    private TABLE_TAG_REGEX;
    private combinedTagRegex;
    private startTagOverrides;
    private inlineTagConverters;
    private tagConverters;
    constructor();
    private escapeHtml;
    convert(docling: string): string;
    private processTags;
    private convertSingleTag;
    private getStartTag;
    private convertInlineContent;
    private convertBlockCode;
    private convertTable;
    private convertPictureOrChart;
    private sanitizeLanguageName;
    private cleanupMetadataTokens;
}
export declare function doclingToHtml(docling: string): string;
