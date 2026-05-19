# Lookup Component

A reusable search-and-select widget that renders an input field with a search button. Clicking the button opens a Material dialog containing a filterable, sortable, paginated table. Selecting a row closes the dialog and emits the chosen record.

## Files

| File | Purpose |
|---|---|
| `lookup.component.ts / .html` | Host component — search field + dialog trigger |
| `lookup-dialog.ts / .html` | Dialog — table with filter, sort, pagination |
| `lookup-data.service.ts` | Singleton signal store for the last selected row |
| `lookup.config.ts` | `LookupConfig<T>` interface |

## API

### `LookupConfig<T>`

```ts
interface LookupConfig<T> {
  title: string;                              // Dialog heading
  displayedColumns: Extract<keyof T, string>[]; // Columns to show
  columnLabels: Record<string, string>;       // Header display names
  data: T[];                                  // Row data
}
```

### `LookupComponent<T>`

| Name | Type | Direction | Description |
|---|---|---|---|
| `config` | `LookupConfig<T>` | input | Table configuration |
| `selected` | `T` | output | Emits the row the user clicked |

### `LookupDataService<T>`

| Member | Type | Description |
|---|---|---|
| `sharedMessage` | `Signal<T \| string>` | Read-only signal of the last selected row |
| `setSelectedRow(row)` | `void` | Called internally by the dialog on selection |

## Usage

**1. Define your data type and config**

```ts
interface Employee {
  id: number;
  name: string;
  department: string;
}

employeeConfig: LookupConfig<Employee> = {
  title: 'Select Employee',
  displayedColumns: ['id', 'name', 'department'],
  columnLabels: { id: 'ID', name: 'Full Name', department: 'Department' },
  data: this.employees,
};

## sample data structure
  lookupConfig: LookupConfig<EmployeeTestForm> = {
    title: 'Employee Lookup',
    displayedColumns: ['id', 'name', 'department', 'salary'],
    columnLabels: {
      id: 'ID',
      name: 'Employee Name',
      department: 'Department',
      salary: 'Salary'
    },
    data: [
      { id: 1, name: 'Jezeem', department: 'IT', salary: 5000 },
      { id: 2, name: 'Aymen', department: 'IT', salary: 5000 },
      { id: 3, name: 'Zaid', department: 'IT', salary: 5000 },
      { id: 4, name: 'Raiyan', department: 'IT', salary: 5000 },
      { id: 5, name: 'Shaamil', department: 'IT', salary: 5000 },
      { id: 6, name: 'Amris', department: 'IT', salary: 5000 },
      { id: 7, name: 'Mariyam', department: 'HR', salary: 4500 }
    ]
  };

```

**2. Add the component to your template**

```html
<app-lookup
  [config]="employeeConfig"
  (selected)="onEmployeeSelected($event)"
/>
```

**3. Handle the selection**

```ts
onEmployeeSelected(employee: Employee) {
  console.log('Selected:', employee);
}
```

**4. (Optional) Read the selected row from the service**

```ts
private lookupDataService = inject(LookupDataService);

// Reactive signal — updates whenever the user picks a row
selectedRow = this.lookupDataService.sharedMessage;
```

## Dialog Behaviour

- Opens at **600 × 400 px**.
- **Filter** — live text filter applied across all displayed columns.
- **Sort** — click any column header to sort; announces direction to screen readers via `LiveAnnouncer`.
- **Pagination** — page sizes: 5, 10, 20 rows.
- **Row selection** — clicking a row emits it via `LookupDataService`, closes the dialog, and updates the search field with the selected value.

## Nested Column Keys

`displayedColumns` supports dot-notation paths for nested properties:

```ts
displayedColumns: ['address.city']
columnLabels: { 'address.city': 'City' }
```

The `getValue` helper resolves the path at render time.
