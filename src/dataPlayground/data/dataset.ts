export type DataRow = Record<string, string | number | null>;

export interface ColumnInfo {
  name: string;
  type: "numeric" | "categorical";
  missingCount: number;
  uniqueCount: number;
}

export interface Dataset {
  columns: ColumnInfo[];
  rows: DataRow[];
  rowIds: string[];
}
