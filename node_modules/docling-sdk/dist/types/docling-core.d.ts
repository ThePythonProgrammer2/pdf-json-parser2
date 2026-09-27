export type CoordOrigin = "TOPLEFT" | "BOTTOMLEFT";
export type ContentLayer = "body" | "furniture";
export type CodeLanguageLabel = "Ada" | "Awk" | "Bash" | "bc" | "C" | "C#" | "C++" | "CMake" | "COBOL" | "CSS" | "Ceylon" | "Clojure" | "Crystal" | "Cuda" | "Cython" | "D" | "Dart" | "dc" | "Dockerfile" | "Elixir" | "Erlang" | "FORTRAN" | "Forth" | "Go" | "HTML" | "Haskell" | "Haxe" | "Java" | "JavaScript" | "Julia" | "Kotlin" | "LaTeX" | "Lua" | "MATLAB" | "Makefile" | "Markdown" | "Nim" | "OCaml" | "PHP" | "Pascal" | "Perl" | "PowerShell" | "Python" | "R" | "Ruby" | "Rust" | "SQL" | "Scala" | "Scheme" | "Shell" | "Swift" | "TypeScript" | "VB.NET" | "Verilog" | "VHDL" | "XML" | "YAML" | "Zig";
export type ImageRefMode = "embedded" | "referenced" | "placeholder";
export interface TableCell {
    text: string;
    bbox?: BoundingBox;
    spans?: number[][];
    col_header?: boolean;
    row_header?: boolean;
    row_span?: number;
    col_span?: number;
}
export interface BoundingBox {
    l: number;
    t: number;
    r: number;
    b: number;
    coord_origin?: CoordOrigin;
}
export interface Size {
    width: number;
    height: number;
}
export interface DoclingDocument {
    schema_name?: string;
    schema_version?: string;
    name: string;
    description?: string;
    logs?: LogEntry[];
    main_text?: NodeItem[];
    tables?: TableItem[];
    pictures?: PictureItem[];
    page_dimensions?: Size[];
    page_footers?: GroupItem[];
    page_headers?: GroupItem[];
    footnotes?: GroupItem[];
    captions?: GroupItem[];
    origin?: DocumentOrigin;
}
export interface LogEntry {
    level: string;
    message: string;
}
export interface DocumentOrigin {
    filename?: string;
    mimetype?: string;
    binary_hash?: number;
}
export interface BaseItem {
    prov?: ProvenanceItem[];
    self_ref?: string;
    parent?: string;
}
export interface ProvenanceItem {
    page_no: number;
    bbox: BoundingBox;
}
export interface DocItem extends BaseItem {
    label: string;
}
export interface NodeItem extends DocItem {
    children?: NodeItem[];
}
export interface GroupItem extends BaseItem {
    name: string;
    items: DocItem[];
}
export interface TextItem extends DocItem {
    label: "caption" | "checkbox_selected" | "checkbox_unselected" | "footnote" | "page_footer" | "page_header" | "paragraph" | "reference" | "text";
    text: string;
}
export interface SectionHeaderItem extends NodeItem {
    label: "section_header";
    text: string;
    level?: number;
}
export interface ListItem extends NodeItem {
    label: "list_item";
    text: string;
    marker?: string;
    enumerated?: boolean;
}
export interface TableItem extends DocItem {
    label: "document_index" | "table";
    data: TableCell[][];
    num_rows?: number;
    num_cols?: number;
    table_cells?: TableCell[];
}
export interface PictureItem extends DocItem {
    label: "chart" | "picture";
    image?: ImageRef;
    annotations?: PictureAnnotation[];
}
export interface ImageRef {
    dpi?: number;
    size?: Size;
    uri?: string;
    mimetype?: string;
}
export interface PictureAnnotation {
    kind: string;
}
export interface PictureClassificationData extends PictureAnnotation {
    kind: "classification";
    class_name: string;
    confidence?: number;
}
export interface PictureDescriptionData extends PictureAnnotation {
    kind: "description";
    description: string;
}
export interface CodeItem extends DocItem {
    label: "code";
    text: string;
    language?: CodeLanguageLabel;
}
export interface PictureBarChartData extends PictureAnnotation {
    kind: "bar_chart_data";
}
export interface PictureLineChartData extends PictureAnnotation {
    kind: "line_chart_data";
}
export interface PicturePieChartData extends PictureAnnotation {
    kind: "pie_chart_data";
}
export interface PictureScatterChartData extends PictureAnnotation {
    kind: "scatter_chart_data";
}
export interface PictureStackedBarChartData extends PictureAnnotation {
    kind: "stacked_bar_chart_data";
}
export interface PictureMiscData extends PictureAnnotation {
    kind: "misc";
}
export interface PictureMoleculeData extends PictureAnnotation {
    kind: "molecule_data";
}
export declare const isDocItem: {
    TextItem: (item: DocItem) => item is TextItem;
    SectionHeaderItem: (item: DocItem) => item is SectionHeaderItem;
    ListItem: (item: DocItem) => item is ListItem;
    TableItem: (item: DocItem) => item is TableItem;
    PictureItem: (item: DocItem) => item is PictureItem;
    CodeItem: (item: DocItem) => item is CodeItem;
};
export declare const isPictureAnnotation: {
    Classification: (annotation: PictureAnnotation) => annotation is PictureClassificationData;
    Description: (annotation: PictureAnnotation) => annotation is PictureDescriptionData;
    BarChart: (annotation: PictureAnnotation) => annotation is PictureBarChartData;
    LineChart: (annotation: PictureAnnotation) => annotation is PictureLineChartData;
    PieChart: (annotation: PictureAnnotation) => annotation is PicturePieChartData;
    ScatterChart: (annotation: PictureAnnotation) => annotation is PictureScatterChartData;
    StackedBarChart: (annotation: PictureAnnotation) => annotation is PictureStackedBarChartData;
    Misc: (annotation: PictureAnnotation) => annotation is PictureMiscData;
    Molecule: (annotation: PictureAnnotation) => annotation is PictureMoleculeData;
};
