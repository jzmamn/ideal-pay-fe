export type MasterColumnType = 'text' | 'number' | 'boolean' | 'date' | 'currency';

export interface MasterDataColumn<T = any> {
  key: string;
  label: string;
  type?: MasterColumnType;
  sortable?: boolean;
}

export interface MasterDataTableConfig<T = any> {
  title: string;
  columns: MasterDataColumn<T>[];
  pageSize?: number;
  pageSizeOptions?: number[];
  showNewButton?: boolean;
  showActiveFilter?: boolean;
}
