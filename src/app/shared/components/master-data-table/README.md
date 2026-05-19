# MasterDataTableComponent

A reusable, config-driven data table for master/setup screens. Built on Angular Material with sorting, filtering, pagination, row selection, and keyboard navigation out of the box.

---

## Selector

```html
<app-master-data-table />
```

---

## Inputs

| Input    | Type                       | Required | Description                              |
|----------|----------------------------|----------|------------------------------------------|
| `config` | `MasterDataTableConfig<T>` | Yes      | Column definitions and table options     |
| `data`   | `T[]`                      | No       | Rows to display (default: `[]`)          |

### `MasterDataTableConfig<T>`

| Property          | Type                  | Default       | Description                                  |
|-------------------|-----------------------|---------------|----------------------------------------------|
| `title`           | `string`              | —             | Heading displayed above the table            |
| `columns`         | `MasterDataColumn[]`  | —             | Column definitions (see below)               |
| `pageSize`        | `number`              | `10`          | Initial rows per page                        |
| `pageSizeOptions` | `number[]`            | `[5,10,20,50]`| Page size dropdown options                   |
| `showNewButton`   | `boolean`             | `false`       | Shows a **New** button in the header         |

### `MasterDataColumn<T>`

| Property   | Type               | Default  | Description                                               |
|------------|--------------------|----------|-----------------------------------------------------------|
| `key`      | `string`           | —        | Property name on the row object. Supports dot-notation for nested properties (e.g. `'address.city'`) |
| `label`    | `string`           | —        | Column header text                                        |
| `type`     | `MasterColumnType` | `'text'` | Controls how the cell value is rendered (see below)       |
| `sortable` | `boolean`          | `true`   | Set to `false` to disable sorting on this column          |

### `MasterColumnType`

| Value      | Rendered as                             |
|------------|-----------------------------------------|
| `text`     | Plain string                            |
| `number`   | Formatted number via `DecimalPipe`      |
| `boolean`  | `check_circle` / `cancel` Material icon |
| `date`     | `mediumDate` format via `DatePipe`      |
| `currency` | Currency string via `CurrencyPipe`      |

---

## Outputs

| Output       | Payload | Description                                      |
|--------------|---------|--------------------------------------------------|
| `rowSelected`| `T`     | Emits the clicked/activated row object           |
| `newClicked` | `void`  | Emits when the **New** button is clicked         |

---

## Basic Usage

```typescript
// department.component.ts
import { MasterDataTableComponent } from '../../shared/components/master-data-table/master-data-table.component';
import { MasterDataTableConfig } from '../../shared/components/master-data-table/master-data-table.config';
import { DepartmentModel } from './department.model';

@Component({
  selector: 'app-department',
  imports: [MasterDataTableComponent],
  templateUrl: './department.html',
})
export class Department {
  readonly departments = signal<DepartmentModel[]>([]);

  readonly tableConfig: MasterDataTableConfig<DepartmentModel> = {
    title: 'Departments',
    showNewButton: true,
    columns: [
      { key: 'id',       label: 'ID',     sortable: false },
      { key: 'code',     label: 'Code' },
      { key: 'name',     label: 'Name' },
      { key: 'isActive', label: 'Active', type: 'boolean' },
    ],
  };

  onRowSelected(row: DepartmentModel): void {
    // open dialog, navigate, etc.
  }

  onNewClicked(): void {
    // open create dialog
  }
}
```

```html
<!-- department.html -->
<app-master-data-table
  [config]="tableConfig"
  [data]="departments()"
  (rowSelected)="onRowSelected($event)"
  (newClicked)="onNewClicked()">
</app-master-data-table>
```

---

## Nested Property Keys

Use dot-notation in `key` to reach nested object properties:

```typescript
columns: [
  { key: 'employee.name',    label: 'Employee' },
  { key: 'department.code',  label: 'Department' },
]
```

---

## Updating Data

Pass `data` separately from `config` so rows can be refreshed independently — for example after an API call — without rebuilding the config object:

```typescript
// load once
this.departments.set(await this.api.getDepartments());

// refresh after save
this.departments.update(list => [...list, newRow]);
```

---

## Accessibility

- Sort changes are announced via Angular CDK `LiveAnnouncer`
- Rows are keyboard-navigable (`Tab`, `Enter`, `Space`)
- Boolean cells include `aria-label="Yes"` / `aria-label="No"`
- Table and region have descriptive `aria-label` derived from `config.title`
- Passes WCAG AA focus contrast via `:focus-visible` outline
