# Angular 21 — Payroll Preparation Screen Prompt

---

## Context

You are building the **Payroll Preparation** screen for an enterprise payroll system using
**Angular 21** (standalone components, Signals, Zoneless change detection, Typed Reactive
Forms). The backend is a Spring Boot 3.x REST API. The screen lives at the route
`/payroll-run/:runId/prepare` and is reached from Step 2 of the Payroll Run Wizard.

The screen has two sections:
1. **Summary bar** — always visible at the top (never remove it).
2. **Earnings / Deductions tabs** — the main editable workspace below the summary.

> **Project conventions (non-negotiable)**
> - Do **NOT** write `standalone: true` inside any `@Component` or `@Directive` decorator.
>   It is the default in Angular v20 and must be omitted.
> - Use `inject()` everywhere — never constructor injection.
> - Use `input()` / `output()` signal-based API — never `@Input()` / `@Output()` decorators.
> - Never use `@HostBinding` or `@HostListener` — put host bindings in the `host` object of
>   the decorator.
> - Never use `ngClass` or `ngStyle` — use `[class]` and `[style]` bindings directly.
> - Use native control flow (`@if`, `@for`, `@switch`) — never structural directives.
> - Every component must set `changeDetection: ChangeDetectionStrategy.OnPush`.
> - Use `computed()` for all derived state, `effect()` only for side effects.

---

## 1. Overall Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  Page header: "Prepare payroll — May 2026  (Run #42)"   │
│  Breadcrumb: Payroll runs > Run #42 > Prepare           │
│  Auto-save indicator: "Saved at 14:32"  (top-right)     │
├─────────────────────────────────────────────────────────┤
│  SUMMARY BAR  (always visible, never removed)           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Employees│ │  Gross   │ │Deductions│ │ Net Pay  │  │
│  │  1,240   │ │ ₹ 9.3Cr  │ │ ₹ 1.5Cr  │ │ ₹ 7.8Cr │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
├─────────────────────────────────────────────────────────┤
│  [  Earnings  ]  [  Deductions  ]   ← primary tabs      │
│  ─────────────────────────────────────────────────────  │
│  (tab content — see sections 2 and 3)                   │
├─────────────────────────────────────────────────────────┤
│  Footer action bar                                      │
│  [Save draft]  [Recalculate]  [Submit for review →]     │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Summary Bar

Keep four summary metric cards. Derive all values reactively via `computed()` signals
so they update zero-cost whenever any row is edited.

| Card | Value | Colour hint |
|---|---|---|
| Employees | count of active employees in this run | neutral |
| Total gross | sum of all earnings components | green |
| Total deductions | sum of all deduction components | red |
| Net pay | gross − deductions | blue |

All four values must be `computed()` properties on `PayrollPrepareService` derived from
the primary `_entries` signal. The summary bar component receives them as `input()` signals
— it does not inject the service directly.

---

## 3. Earnings Tab

The Earnings primary tab contains **six nested sub-tabs**, each wrapped in a `@defer` block
(load only when first activated). The sub-tab shell uses `@switch` on an `activeTab`
signal:

```
[ Fixed allowance ] [ Variable allowance ] [ Overtime ]
[ Bonus ] [ Salary increment ] [ Gratuity ]
```

Sub-tabs marked **"employee data-grid"** reuse `PayrollEmployeeGridComponent`
(see Section 5). Others render a specialised two-part layout.

### 3.1 Fixed Allowance _(employee data-grid)_

Pre-fill each row from the employee's active `SalaryAssignment → SalaryComponent`
of type `FIXED_ALLOWANCE`. Allow HR to override the amount for this period only
(stored as a `PayrollEntryOverride`).

Grid columns:

| # | Column | Type | Notes |
|---|---|---|---|
| 1 | Employee | display | Code + full name |
| 2 | Department | display | |
| 3 | Designation | display | |
| 4 | Allowance type | dropdown | `GET /allowance-types?category=FIXED` |
| 5 | Amount (₹) | number input | Per-month fixed value; pre-filled from salary structure |
| 6 | Effective from | date picker | Default = period start date |
| 7 | Status | toggle | ACTIVE / INACTIVE |

Inline validation: amount ≥ 0, allowance type required.

### 3.2 Variable Allowance _(employee data-grid)_

| # | Column | Type | Notes |
|---|---|---|---|
| 1 | Employee | display | |
| 2 | Department | display | |
| 3 | Designation | display | |
| 4 | Allowance type | dropdown | `GET /allowance-types?category=VARIABLE` |
| 5 | Calculation basis | dropdown | `PERCENT_OF_BASIC` / `PERCENT_OF_GROSS` / `FIXED` |
| 6 | Rate / Amount | number input | % or ₹ depending on basis |
| 7 | Computed amount (₹) | computed display | Read-only; recalculates on rate change |
| 8 | Remarks | text input | Optional; max 200 chars |

- Computed amount = `(rate / 100) × basicPay`, `(rate / 100) × grossPay`, or flat amount.
- Show a yellow warning chip when the computed amount differs by > 20 % from the previous month.

### 3.3 Overtime _(employee data-grid)_

| # | Column | Type | Notes |
|---|---|---|---|
| 1 | Employee | display | |
| 2 | Department | display | |
| 3 | OT hours | number input | Decimal allowed (e.g. 4.5 hrs) |
| 4 | OT rate (₹/hr) | number input | Pre-filled from employee grade rate |
| 5 | OT amount (₹) | computed display | `hours × rate`, updates in real time |
| 6 | Approved by | display | Manager name from attendance system |
| 7 | Remarks | text input | |

- Rows with 0 OT hours are dimmed but still present so HR can spot gaps.
- Show total OT cost in the grid footer.

### 3.4 Bonus

**Top — Bonus type selector:**
- Radio group: `Performance bonus` | `Festival bonus` | `Joining bonus` | `Retention bonus` | `Ad hoc`
- Bonus applicable period: date range picker (start – end)

**Bottom — Employee data-grid:**

| # | Column | Type | Notes |
|---|---|---|---|
| 1 | Employee | display + checkbox | Include / exclude from bonus |
| 2 | Department | display | |
| 3 | Performance rating | dropdown | 1–5 stars (for Performance bonus) |
| 4 | Bonus basis | dropdown | `FIXED` / `PERCENT_OF_ANNUAL_CTC` / `PERCENT_OF_BASIC` |
| 5 | Rate / Amount | number input | |
| 6 | Computed bonus (₹) | computed display | |
| 7 | Tax applicable | toggle | If ON, add to taxable income for this period |

- "Select all" checkbox in header row.
- "Apply same bonus to all selected" bulk-fill action in toolbar.
- Department-wise bonus totals in a collapsible group-footer row.

### 3.5 Salary Increment

**Top — Increment batch controls:**
- Increment effective date (date picker)
- Increment type: `Annual` | `Promotion` | `Merit` | `Adhoc`
- Apply to: `All employees` | `Selected department` | `Selected employees`

**Bottom — Employee data-grid:**

| # | Column | Type | Notes |
|---|---|---|---|
| 1 | Employee | display | |
| 2 | Current CTC (₹/yr) | display | |
| 3 | Current basic (₹/mo) | display | |
| 4 | Increment % | number input | Positive decimal |
| 5 | Increment amount (₹/mo) | computed display | `(% / 100) × current basic` |
| 6 | New basic (₹/mo) | computed display | `current basic + increment amount` |
| 7 | New CTC (₹/yr) | computed display | Annualised |
| 8 | Effective date | date picker | Overridable per row |
| 9 | Status | badge | `PENDING` / `APPLIED` |

- "Bulk set %" field in toolbar: enter a value and click "Apply to all".
- Highlight in amber if increment % > 30 — prompt confirmation before saving.

### 3.6 Gratuity

**Top — Policy panel:**
- Formula display (read-only): `(Basic salary × Years of service × 15) / 26`
- Toggle: `Include in this payroll run` | `Schedule separately`

**Bottom — Employee data-grid** (only employees with ≥ 5 years of service):

| # | Column | Type | Notes |
|---|---|---|---|
| 1 | Employee | display | |
| 2 | Date of joining | display | |
| 3 | Years of service | computed display | Calculated to today |
| 4 | Last drawn basic (₹/mo) | display | |
| 5 | Gratuity amount (₹) | computed display | Per formula above |
| 6 | Include in run | toggle | Default OFF — HR must explicitly opt in |
| 7 | Payment mode | dropdown | `Bank transfer` / `Cheque` |
| 8 | Remarks | text input | |

---

## 4. Deductions Tab

The Deductions primary tab contains **six nested sub-tabs** (same `@defer` pattern):

```
[ Fixed deduction ] [ Variable deduction ] [ No pay ]
[ Loans ] [ Tax ] [ Salary decrement ]
```

### 4.1 Fixed Deduction _(employee data-grid)_

Mirror of Fixed Allowance for deductions.

| # | Column | Type | Notes |
|---|---|---|---|
| 1 | Employee | display | |
| 2 | Department | display | |
| 3 | Designation | display | |
| 4 | Deduction type | dropdown | `GET /deduction-types?category=FIXED` (PF, ESI, etc.) |
| 5 | Amount (₹) | number input | Pre-filled from salary structure |
| 6 | Statutory | badge | `YES` (locked) / `NO` (editable) |
| 7 | Effective from | date picker | |

- Statutory deductions (PF, ESI) lock the amount field; show tooltip: "Statutory — computed by engine".
- Non-statutory deductions are fully editable.

### 4.2 Variable Deduction _(employee data-grid)_

Mirror of Variable Allowance for deductions.

| # | Column | Type | Notes |
|---|---|---|---|
| 1 | Employee | display | |
| 2 | Department | display | |
| 3 | Deduction type | dropdown | `GET /deduction-types?category=VARIABLE` |
| 4 | Calculation basis | dropdown | `PERCENT_OF_BASIC` / `PERCENT_OF_GROSS` / `FIXED` |
| 5 | Rate / Amount | number input | |
| 6 | Computed deduction (₹) | computed display | |
| 7 | Remarks | text input | |

### 4.3 No Pay (Loss of Pay)

Only employees who have LOP days in this period (pre-fetched from the attendance service).

| # | Column | Type | Notes |
|---|---|---|---|
| 1 | Employee | display | |
| 2 | Department | display | |
| 3 | Working days | display | Calendar days minus weekends/holidays |
| 4 | LOP days | number input | Editable; decimal allowed (half-day = 0.5) |
| 5 | Daily rate (₹) | computed display | `basic / working days` |
| 6 | LOP deduction (₹) | computed display | `LOP days × daily rate` |
| 7 | Reason | dropdown | `Absent` / `Unpaid leave` / `Disciplinary` / `Other` |
| 8 | Approved by | display | |

- Show a red chip on rows where LOP days > 5.
- "Add employee" button for employees missed by the attendance sync.
- LOP deduction feeds back into the payroll engine — recalculate net pay on save.

### 4.4 Loans _(employee data-grid)_

One employee can have multiple loan rows.

| # | Column | Type | Notes |
|---|---|---|---|
| 1 | Employee | display | |
| 2 | Loan reference | display | Loan ID + purpose |
| 3 | Loan amount (₹) | display | Original principal |
| 4 | Outstanding balance (₹) | display | |
| 5 | EMI / Month (₹) | number input | Pre-filled from loan schedule; editable for prepayment |
| 6 | Recovery this period (₹) | number input | Defaults to EMI; override for partial/full recovery |
| 7 | Remaining after recovery (₹) | computed display | `outstanding − recovery` |
| 8 | Status | badge | `ACTIVE` / `CLOSED` |

- If recovery amount > outstanding balance, show validation error: "Recovery exceeds outstanding balance".
- "View loan ledger" link opens a side panel with full repayment history.

### 4.5 Tax (TDS / Income Tax)

**Top — Tax regime controls:**
- Tax year: display only (e.g. FY 2026–27)
- Regime selector (per employee or bulk): `Old regime` | `New regime`
- TDS computation method: `Monthly projected` | `Actual (year-to-date)`

**Bottom — Employee data-grid:**

| # | Column | Type | Notes |
|---|---|---|---|
| 1 | Employee | display | |
| 2 | Regime | badge | `Old` / `New` |
| 3 | Projected annual income (₹) | display | Engine-computed |
| 4 | Taxable income (₹) | display | After exemptions |
| 5 | Annual tax (₹) | display | Per slab |
| 6 | Tax already deducted YTD (₹) | display | |
| 7 | TDS this month (₹) | number input | Editable override |
| 8 | Surcharge / Cess (₹) | computed display | |

- "Recalculate all TDS" button triggers `POST /payroll-runs/:id/recalculate-tax`.
- Rows where the manual override differs from the engine value show an orange "Override" badge.
- Click any row to open a side panel showing the full tax-slab breakdown for that employee.

### 4.6 Salary Decrement

Mirror of Salary Increment for reductions (demotion, disciplinary, role change).

**Top — Decrement batch controls:**
- Effective date, type (`Demotion` | `Disciplinary` | `Role change` | `Adhoc`), scope.

**Bottom — Employee data-grid:**

| # | Column | Type | Notes |
|---|---|---|---|
| 1 | Employee | display | |
| 2 | Current basic (₹/mo) | display | |
| 3 | Decrement % | number input | Positive decimal (represents a reduction) |
| 4 | Decrement amount (₹/mo) | computed display | `(% / 100) × current basic` |
| 5 | New basic (₹/mo) | computed display | `current basic − decrement amount` |
| 6 | Reason | dropdown | Mandatory |
| 7 | Approved by | text input | Manager / approver name |
| 8 | Effective date | date picker | |
| 9 | Status | badge | `PENDING` / `APPLIED` |

- Highlight in red if new basic < minimum wage threshold (configurable per state).
- Require reason and approver before the row can be saved.

---

## 5. Shared Employee Data-Grid Specification

Every "employee data-grid" sub-tab reuses a single `PayrollEmployeeGridComponent`.

### Component signature

```typescript
// payroll-employee-grid.component.ts
// Do NOT write standalone: true — it is the default.
@Component({
  selector: 'app-payroll-employee-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payroll-employee-grid.component.html',
})
export class PayrollEmployeeGridComponent {
  // Inputs — plain types; Angular wraps them in signals automatically
  columns    = input.required<GridColumnDef[]>();
  rows       = input.required<PayrollEntryRow[]>();   // NOT Signal<PayrollEntryRow[]>
  loading    = input<boolean>(false);
  readonlyFn = input<(row: PayrollEntryRow) => boolean>(() => false);

  // Outputs
  rowChanged = output<{ row: PayrollEntryRow; field: string; value: unknown }>();
  bulkAction = output<{ action: string; selectedIds: number[] }>();
}
```

> **Key correction:** `input()` already returns a `Signal<T>` internally. Pass a plain
> `PayrollEntryRow[]` type — do **not** wrap it in `Signal<…>`.

### Grid toolbar (always present)

```
[ Search employee name / code ]  [ Department ▾ ]  [ Designation ▾ ]
[ Show: All | Modified | Errors ]
                                    [ Bulk fill ▾ ]  [ Export CSV ]
```

### Grid behaviour

- **Pagination**: 50 rows per page; page-size selector (25 / 50 / 100).
- **Sticky header**: column headers remain visible on vertical scroll.
- **Inline editing**: click a cell to activate its input; Tab moves to the next editable cell; Enter confirms.
- **Dirty tracking**: modified rows get a blue left-border accent. Track in a `dirtyRows` signal (`Set<number>`).
- **Validation**: invalid cells show a red border + tooltip with the error message.
- **Row selection**: checkbox per row + "select all on this page" in the header.
- **Bulk fill**: select rows → "Bulk fill" → choose field → enter value → apply to all selected.
- **Keyboard shortcut**: `Ctrl + S` triggers save for the active sub-tab.
- **Empty state**: if no employees qualify (e.g. no LOP this period), show an illustrated empty-state card with an explanation.
- **Accessibility**: the table element must have `role="grid"` with correct `aria-rowindex` and `aria-colindex`; all cells must be keyboard-navigable without a mouse.

### Grid skeleton placeholder

A `GridSkeletonComponent` must exist at `shared/grid-skeleton/grid-skeleton.component.ts`.
It accepts a `rows` input (number, default `10`) and renders that many animated gray rows.
It is used exclusively inside `@defer` placeholder blocks.

---

## 6. Angular 21 Patterns to Follow

### File structure

```
payroll-prepare/
├── payroll-prepare.component.ts
├── payroll-prepare.component.html
├── payroll-prepare.routes.ts          ← lazy-loaded route config
├── earnings/
│   ├── earnings-tabs.component.ts
│   ├── earnings-tabs.component.html
│   ├── fixed-allowance/
│   │   └── fixed-allowance.component.ts
│   ├── variable-allowance/
│   │   └── variable-allowance.component.ts
│   ├── overtime/
│   │   └── overtime.component.ts
│   ├── bonus/
│   │   └── bonus.component.ts
│   ├── salary-increment/
│   │   └── salary-increment.component.ts
│   └── gratuity/
│       └── gratuity.component.ts
├── deductions/
│   ├── deductions-tabs.component.ts
│   ├── deductions-tabs.component.html
│   ├── fixed-deduction/
│   │   └── fixed-deduction.component.ts
│   ├── variable-deduction/
│   │   └── variable-deduction.component.ts
│   ├── no-pay/
│   │   └── no-pay.component.ts
│   ├── loans/
│   │   └── loans.component.ts
│   ├── tax/
│   │   └── tax.component.ts
│   └── salary-decrement/
│       └── salary-decrement.component.ts
└── shared/
    ├── payroll-employee-grid/
    │   ├── payroll-employee-grid.component.ts
    │   └── payroll-employee-grid.component.html
    ├── payroll-summary-bar/
    │   ├── payroll-summary-bar.component.ts
    │   └── payroll-summary-bar.component.html
    ├── grid-skeleton/
    │   └── grid-skeleton.component.ts
    ├── toast.service.ts
    └── payroll-prepare.service.ts
```

### Route configuration

```typescript
// payroll-prepare.routes.ts
export const PAYROLL_PREPARE_ROUTES: Routes = [
  {
    path: '',
    component: PayrollPrepareComponent,
    canDeactivate: [payrollDirtyGuard],   // see UX Rules §8.2
  },
];
```

Register in the parent feature routes as:

```typescript
{
  path: 'payroll-run/:runId/prepare',
  loadChildren: () =>
    import('./payroll-prepare/payroll-prepare.routes')
      .then(m => m.PAYROLL_PREPARE_ROUTES),
}
```

### Zoneless setup (for reference — do not change existing `main.ts`)

```typescript
// main.ts
bootstrapApplication(AppComponent, {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
  ],
});
```

### State management with Signals

```typescript
// payroll-prepare.service.ts
@Injectable({ providedIn: 'root' })
export class PayrollPrepareService {
  private readonly http   = inject(HttpClient);
  private readonly route  = inject(ActivatedRoute);

  // Derive runId from the active route snapshot
  readonly runId = toSignal(
    this.route.paramMap.pipe(map(p => Number(p.get('runId')))),
    { initialValue: 0 },
  );

  private readonly _entries = signal<PayrollEntryRow[]>([]);
  private readonly _dirty   = signal<Set<number>>(new Set());

  readonly entries    = this._entries.asReadonly();
  readonly dirtyCount = computed(() => this._dirty().size);

  readonly employeeCount  = computed(() => this._entries().length);
  readonly grossTotal     = computed(() =>
    this._entries().reduce((sum, r) => sum + r.grossPay, 0));
  readonly dedTotal       = computed(() =>
    this._entries().reduce((sum, r) => sum + r.totalDeductions, 0));
  readonly netTotal       = computed(() => this.grossTotal() - this.dedTotal());

  updateRow(id: number, field: string, value: unknown): void {
    this._entries.update(rows =>
      rows.map(r => r.id === id ? { ...r, [field]: value } : r));
    this._dirty.update(s => new Set([...s, id]));
  }

  async saveAll(): Promise<void> {
    const dirtyIds = [...this._dirty()];
    const payload  = this._entries().filter(r => dirtyIds.includes(r.id));
    await lastValueFrom(
      this.http.put(
        `/api/v1/payroll-runs/${this.runId()}/entries/bulk`,
        payload,
      )
    );
    this._dirty.set(new Set());
  }
}
```

> **Corrections vs. original:**
> - `inject(ActivatedRoute)` resolves the `runId` — it was previously undefined.
> - `.toPromise()` is deprecated; use `lastValueFrom()` from `rxjs`.

### Deferred loading for sub-tabs

Use `@defer (on interaction)` for sub-tabs that are not immediately visible, so they
load only when the user clicks that tab. Use a named trigger on the tab button:

```html
<!-- earnings-tabs.component.html -->
@switch (activeEarningsTab()) {
  @case ('fixed-allowance') {
    @defer (on idle) {
      <app-fixed-allowance />
    } @placeholder {
      <app-grid-skeleton [rows]="10" />
    } @loading (minimum 300ms) {
      <app-grid-skeleton [rows]="10" />
    }
  }
  @case ('variable-allowance') {
    @defer (on idle) {
      <app-variable-allowance />
    } @placeholder {
      <app-grid-skeleton [rows]="10" />
    }
  }
  <!-- repeat for remaining cases -->
}
```

> **Correction:** `on immediate` is not a valid `@defer` trigger. Use `on idle` (load
> during browser idle time after tab is switched into view) or `on viewport` (when the
> element enters the viewport).

### Typed Reactive Forms for row editing

Each editable row is its own typed `FormGroup`. Example for Fixed Allowance:

```typescript
type AllowanceRowForm = FormGroup<{
  allowanceTypeId : FormControl<number>;
  amount          : FormControl<number>;
  effectiveFrom   : FormControl<string>;
  isActive        : FormControl<boolean>;
}>;
```

Use `FormArray<AllowanceRowForm>` for the full grid. Sync the form array back to the
service signal via a `valueChanges` subscription in the component's `ngOnInit`.

### Auto-save side effect

Do **not** call `setInterval` directly. Use an `effect()` that schedules the interval
once and cleans it up on destroy:

```typescript
export class PayrollPrepareComponent {
  private readonly svc         = inject(PayrollPrepareService);
  private readonly destroyRef  = inject(DestroyRef);
  readonly lastSavedAt         = signal<Date | null>(null);

  constructor() {
    const id = setInterval(async () => {
      if (this.svc.dirtyCount() > 0) {
        await this.svc.saveAll();
        this.lastSavedAt.set(new Date());
      }
    }, 60_000);

    this.destroyRef.onDestroy(() => clearInterval(id));
  }
}
```

---

## 7. API Endpoints

### When to use `httpResource()` vs `HttpClient`

| Scenario | Use |
|---|---|
| Reading data on component init (GET) | `httpResource()` — handles loading/error state automatically |
| Mutations (PUT, POST) requiring `await` / `lastValueFrom` | `HttpClient` directly |

### Endpoint table

| Method | Endpoint | Used by |
|---|---|---|
| `GET` | `/api/v1/payroll-runs/:id/entries` | Load all rows on page init |
| `GET` | `/api/v1/allowance-types?category=FIXED\|VARIABLE` | Allowance type dropdowns |
| `GET` | `/api/v1/deduction-types?category=FIXED\|VARIABLE` | Deduction type dropdowns |
| `GET` | `/api/v1/payroll-runs/:id/overtime` | Pre-fill overtime rows |
| `GET` | `/api/v1/employees/:id/loans?status=ACTIVE` | Loan rows per employee |
| `GET` | `/api/v1/payroll-runs/:id/tax-summary` | Pre-fill tax tab |
| `GET` | `/api/v1/attendance/lop?runId=:id` | Pre-fill no-pay rows |
| `PUT` | `/api/v1/payroll-runs/:id/entries/bulk` | Save all dirty rows |
| `POST` | `/api/v1/payroll-runs/:id/recalculate` | Recalculate button |
| `POST` | `/api/v1/payroll-runs/:id/recalculate-tax` | Recalculate TDS |
| `POST` | `/api/v1/payroll-runs/:id/submit` | Submit for review |

All endpoints return the standard envelope:

```json
{ "success": true, "data": { }, "message": "OK", "timestamp": "..." }
```

`httpResource()` example for entries:

```typescript
readonly entriesResource = httpResource<PayrollEntryRow[]>(
  () => `/api/v1/payroll-runs/${this.runId()}/entries`,
);
```

---

## 8. UX Rules

1. **Auto-save draft every 60 seconds** — use `setInterval` inside the component constructor,
   cleaned up via `DestroyRef.onDestroy()` (see Section 6). Show "Saved at HH:MM" in the
   page header, driven by the `lastSavedAt` signal.

2. **Navigation guard** — if `dirtyCount > 0`, prompt "You have unsaved changes. Leave anyway?"
   before routing away. Implement as a functional `CanDeactivate` guard:

   ```typescript
   // payroll-prepare.routes.ts
   export const payrollDirtyGuard: CanDeactivateFn<PayrollPrepareComponent> =
     (component) => {
       if (component.svc.dirtyCount() === 0) return true;
       return confirm('You have unsaved changes. Leave anyway?');
     };
   ```

3. **Recalculate on save** — after every `saveAll()`, fire `POST /recalculate` and
   reload the entries `httpResource` so the summary signals update.

4. **Loading skeleton** — each sub-tab shows `<app-grid-skeleton>` inside the `@defer`
   placeholder while its data loads (see Section 6).

5. **Optimistic updates** — update the Signal immediately on cell edit; roll back if the
   API returns an error.

6. **Error toast** — `ToastService` (singleton, `providedIn: 'root'`) shows red error
   toasts for API failures, auto-dismissed after 5 s.

7. **Success toast** — show green "Changes saved" toast after a successful bulk PUT.

8. **Accessibility** — all grids: `role="grid"`, correct `aria-rowindex` / `aria-colindex`,
   full keyboard navigation between cells without a mouse. Must pass all AXE checks.

9. **Mobile** — the grid collapses to a card-per-employee layout below the 768 px
   breakpoint. The summary bar stacks vertically. Use `[class]` bindings, not `ngClass`.

10. **Print / Export** — each sub-tab toolbar has an "Export CSV" button. Implement
    client-side only using the current signal data; no API call required.

---

## 9. Data Interfaces (`payroll.models.ts`)

```typescript
export type ComponentType =
  | 'FIXED_ALLOWANCE' | 'VARIABLE_ALLOWANCE' | 'OVERTIME'
  | 'BONUS' | 'INCREMENT' | 'GRATUITY'
  | 'FIXED_DEDUCTION' | 'VARIABLE_DEDUCTION' | 'LOP'
  | 'LOAN_EMI' | 'TAX' | 'DECREMENT';

export interface PayrollEntryRow {
  id              : number;
  employeeId      : number;
  empCode         : string;
  fullName        : string;
  department      : string;
  designation     : string;
  basicPay        : number;
  grossPay        : number;
  totalDeductions : number;
  netPay          : number;
  overrides       : PayrollOverride[];
}

export interface PayrollOverride {
  id            : number;
  entryId       : number;
  componentType : ComponentType;
  componentId   : number;
  amount        : number;
  remarks       : string | null;
}

export interface AllowanceType {
  id       : number;
  code     : string;
  name     : string;
  category : 'FIXED' | 'VARIABLE';
  isTaxable: boolean;
}

export interface DeductionType {
  id         : number;
  code       : string;
  name       : string;
  category   : 'FIXED' | 'VARIABLE';
  isStatutory: boolean;
}

export interface LoanRecord {
  loanId      : number;
  employeeId  : number;
  purpose     : string;
  principal   : number;
  outstanding : number;
  monthlyEmi  : number;
  status      : 'ACTIVE' | 'CLOSED';
}

export interface TaxSummaryRow {
  employeeId           : number;
  regime               : 'OLD' | 'NEW';
  projectedAnnualIncome: number;
  taxableIncome        : number;
  annualTax            : number;
  taxDeductedYtd       : number;
  tdsThisMonth         : number;
  surchargeAndCess     : number;
}

export type GridColumnType =
  | 'display' | 'number' | 'dropdown' | 'date'
  | 'toggle' | 'computed' | 'badge' | 'checkbox';

export interface GridColumnDef {
  field     : string;
  header    : string;
  type      : GridColumnType;
  width?    : string;
  editable? : boolean | ((row: PayrollEntryRow) => boolean);
  options?  : Signal<{ value: unknown; label: string }[]>;
  formatter?: (value: unknown, row: PayrollEntryRow) => string;
  validator?: (value: unknown, row: PayrollEntryRow) => string | null;
}
```

> **Addition vs. original:** `DeductionType` and `TaxSummaryRow` interfaces were missing;
> added here. `GridColumnType` is now a union type for stricter typing.

---

## 10. Deliverables

Generate the following files **one at a time**, **full content, no truncation**.

| # | File | Description |
|---|---|---|
| 1 | `payroll.models.ts` | All TypeScript interfaces and types |
| 2 | `payroll-prepare.service.ts` | State signals + all API calls |
| 3 | `payroll-prepare.component.ts` + `.html` | Page shell, breadcrumb, primary tabs, footer |
| 4 | `payroll-summary-bar.component.ts` + `.html` | Summary metric cards |
| 5 | `payroll-employee-grid.component.ts` + `.html` | Shared reusable grid |
| 6 | `grid-skeleton.component.ts` | Animated loading placeholder |
| 7 | `toast.service.ts` | Singleton toast notifications |
| 8 | `earnings-tabs.component.ts` + `.html` | Earnings tab shell with `@defer` blocks |
| 9 | `fixed-allowance.component.ts` | Earnings sub-tab |
| 10 | `variable-allowance.component.ts` | Earnings sub-tab |
| 11 | `overtime.component.ts` | Earnings sub-tab |
| 12 | `bonus.component.ts` | Earnings sub-tab |
| 13 | `salary-increment.component.ts` | Earnings sub-tab |
| 14 | `gratuity.component.ts` | Earnings sub-tab |
| 15 | `deductions-tabs.component.ts` + `.html` | Deductions tab shell |
| 16 | `fixed-deduction.component.ts` | Deductions sub-tab |
| 17 | `variable-deduction.component.ts` | Deductions sub-tab |
| 18 | `no-pay.component.ts` | Deductions sub-tab |
| 19 | `loans.component.ts` | Deductions sub-tab |
| 20 | `tax.component.ts` | Deductions sub-tab |
| 21 | `salary-decrement.component.ts` | Deductions sub-tab |
| 22 | `payroll-prepare.routes.ts` | Lazy-loaded route config + `CanDeactivate` guard |

Use Angular 21 best practices throughout:

- No NgModules.
- No `standalone: true` in decorators.
- No `zone.js`; use `provideExperimentalZonelessChangeDetection()`.
- Signals for all state; `computed()` for derived values.
- `httpResource()` for GET requests; `HttpClient` + `lastValueFrom()` for mutations.
- Typed `FormGroup<T>` for editable rows.
- `ChangeDetectionStrategy.OnPush` on every component.
- `@defer` for lazy sub-tabs with `@placeholder` and `@loading` blocks.
- `inject()` everywhere; no constructor injection.
- `input()` / `output()` signal API; no `@Input()` / `@Output()` decorators.
- Native control flow (`@if`, `@for`, `@switch`); no structural directives.
- `[class]` and `[style]` bindings; no `ngClass` or `ngStyle`.
