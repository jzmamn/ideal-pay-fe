export interface LookupConfig<T = any> {
  title: string;

  /**
   * Columns to display in the table
   * Must be string-safe keys (Angular Material requirement)
   */
  displayedColumns: Extract<keyof T, string>[];

  /**
   * Column header labels (UI display names)
   */
  columnLabels: Record<string, string>;

  /**
   * Data source
   */
  data: T[];
}