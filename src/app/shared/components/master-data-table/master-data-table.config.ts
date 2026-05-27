export type MasterColumnType = 'text' | 'number' | 'boolean' | 'date' | 'currency' | 'icon';

export interface MasterDataColumn<T = any> {
  key: string;
  label: string;
  type?: MasterColumnType;
  sortable?: boolean;
  icon?: string;
  iconTooltip?: string;
}

export interface MasterDataTableConfig<T = any> {
  title: string;
  columns: MasterDataColumn<T>[];
  pageSize?: number;
  pageSizeOptions?: number[];
  showNewButton?: boolean;
  showActiveFilter?: boolean;
}
