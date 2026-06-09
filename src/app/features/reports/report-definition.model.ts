// ── Generic report engine metadata models (ADR-001, Option B) ───────────────
//
// These mirror the backend's report_definition / report_parameter /
// report_column registry (see ReportDefinitionDTO et al.). The whole
// reports feature is driven by this metadata: filters are generated from
// `parameters`, the table/export/print are generated from `columns`, and
// new reports require no frontend code changes — only a registry row and
// a sp_rpt_ stored procedure on the backend.

export type ReportParamType = 'STRING' | 'MONTH' | 'DATE' | 'NUMBER' | 'SELECT';
export type ReportColumnType = 'TEXT' | 'NUMBER' | 'CURRENCY' | 'DATE' | 'STATUS';

export interface ReportParameter {
  paramKey: string;
  label: string;
  paramType: ReportParamType;
  required: boolean;
  defaultValue: string | null;
}

export interface ReportColumn {
  columnKey: string;
  label: string;
  dataType: ReportColumnType;
  displayOrder: number;
}

export interface ReportDefinition {
  reportKey: string;
  label: string;
  description: string;
  icon: string;
  category: string;
  parameters: ReportParameter[];
  columns: ReportColumn[];
}

export type ReportRow = Record<string, unknown>;
