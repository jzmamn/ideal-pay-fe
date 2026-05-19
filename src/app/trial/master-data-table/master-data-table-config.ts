export interface MasterDataTableConfig<T = any> {
    /**
     * The title of the table
     */

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