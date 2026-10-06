import type { ExtractedTable } from "../../types/web";
export declare function extractTables(doctags: string): ExtractedTable[];
export declare function tableToCSV(table: ExtractedTable): string;
export declare function tablesToCSV(tables: ExtractedTable[]): string;
