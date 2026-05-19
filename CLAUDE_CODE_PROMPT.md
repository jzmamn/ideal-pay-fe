# Claude Code Implementation Prompt — Payroll Enhancement

> Copy everything below the divider and paste it into Claude Code.

---

You are working inside an Angular 20 project (`ideal-pay-fe`). Follow the `CLAUDE.md` rules strictly throughout. Implement all changes described below in order. After each phase, confirm which files were created or modified before moving on.

---

## CONTEXT — Read First

Read these files before writing any code so you understand the existing patterns:

- `src/app/features/settings/employee/employee.model.ts`
- `src/app/features/settings/employee/employee-form/employee-form.ts`
- `src/app/features/settings/employee/employee-form/employee-form.html`
- `src/app/features/settings/allowances/allowance.model.ts`
- `src/app/shared/components/master-data-table/master-data-table.config.ts`
- `src/app/shared/components/master-data-table/master-data-table.component.ts`
- `src/app/app.routes.ts`
- `SYSTEM_DESIGN.md`

---

## PHASE 1 — Shared Models & Interfaces

### 1.1 Create `src/app/shared/models/master-data.models.ts`

```typescript
export interface MasterEntity {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

export interface JobCategory  extends MasterEntity {}
export interface Branch       extends MasterEntity {}
export interface Grade        extends MasterEntity {}
export interface Designation  extends MasterEntity {}

export interface NoPayDays extends MasterEntity {
  days: number;
  description: string;
}
```

### 1.2 Update `src/app/features/settings/allowances/allowance.model.ts`

Add three boolean fields to `AllowanceModel`:
- `liableForEPF: boolean`
- `liableForETF: boolean`
- `liableForNopay: boolean`

Apply the same three fields to `DeductionModel` (wherever it lives) and `OvertimeModel` (wherever it lives). Find the exact file paths first with a glob/grep.

### 1.3 Update `src/app/features/settings/employee/employee.model.ts`

Replace the existing class with an interface plus a helper class. The new shape must have:

```typescript
export type EmployeeType = 'Casual' | 'Permanent' | 'Contract' | 'Intern' | 'Part-time';
export const EMPLOYEE_TYPES: EmployeeType[] = ['Casual','Permanent','Contract','Intern','Part-time'];

export interface StructuredAddress {
  line1:    string;
  line2:    string;
  city:     string;
  district: string;
  country:  string;
}

export interface EmergencyContact {
  contactPerson: string;
  address:       string;
  contactNumber: string;
  email:         string;
}

export interface EmployeeLineItem {
  name:   string;
  amount: number;
}

export interface EmployeeModel {
  id:               number;
  employeeNo:       string;
  firstName:        string;
  lastName:         string;
  payrollName:      string;
  email:            string;
  phone:            string;
  joinDate:         string;
  isActive:         boolean;
  notes:            string;
  basicSalary:      number;
  epfNo:            string;
  etfNo:            string;
  allowances:       EmployeeLineItem[];
  overtimes:        EmployeeLineItem[];
  deductions:       EmployeeLineItem[];
  employeeType:     EmployeeType | null;
  noPayDaysId:      number | null;
  jobCategoryId:    number | null;
  designationId:    number | null;
  branchId:         number | null;
  gradeId:          number | null;
  address:          StructuredAddress;
  emergencyContact: EmergencyContact;
}

export function emptyEmployee(): EmployeeModel { /* return a zeroed-out object */ }
export function grossSalary(e: EmployeeModel): number { /* basicSalary + sum(allowances) + sum(overtimes) - sum(deductions) */ }
```

After changing to interface, fix all usages of `new EmployeeModel(...)` in `employee.service.ts` and `employee-form.ts` — replace with object literals matching the interface.

---

## PHASE 2 — MasterDataService

### 2.1 Create `src/app/shared/services/master-data.service.ts`

```typescript
import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Branch, Designation, Grade, JobCategory, MasterEntity, NoPayDays } from '../models/master-data.models';

@Injectable({ providedIn: 'root' })
export class MasterDataService {
  private readonly http = inject(HttpClient);

  private readonly _jobCategories = signal<JobCategory[]>([]);
  private readonly _branches      = signal<Branch[]>([]);
  private readonly _grades        = signal<Grade[]>([]);
  private readonly _designations  = signal<Designation[]>([]);
  private readonly _nopayDays     = signal<NoPayDays[]>([]);

  readonly jobCategories  = this._jobCategories.asReadonly();
  readonly branches       = this._branches.asReadonly();
  readonly grades         = this._grades.asReadonly();
  readonly designations   = this._designations.asReadonly();
  readonly nopayDays      = this._nopayDays.asReadonly();

  readonly activeJobCategories = computed(() => this._jobCategories().filter(x => x.isActive));
  readonly activeBranches      = computed(() => this._branches().filter(x => x.isActive));
  readonly activeGrades        = computed(() => this._grades().filter(x => x.isActive));
  readonly activeDesignations  = computed(() => this._designations().filter(x => x.isActive));
  readonly activeNopayDays     = computed(() => this._nopayDays().filter(x => x.isActive));

  loadAll(): void {
    this.http.get<JobCategory[]>('/api/master/job-categories').subscribe(d => this._jobCategories.set(d));
    this.http.get<Branch[]>('/api/master/branches').subscribe(d => this._branches.set(d));
    this.http.get<Grade[]>('/api/master/grades').subscribe(d => this._grades.set(d));
    this.http.get<Designation[]>('/api/master/designations').subscribe(d => this._designations.set(d));
    this.http.get<NoPayDays[]>('/api/master/nopay-days').subscribe(d => this._nopayDays.set(d));
  }

  createMaster<T extends MasterEntity>(entity: string, dto: Partial<T>): Observable<T> {
    return this.http.post<T>(`/api/master/${entity}`, dto);
  }
  updateMaster<T extends MasterEntity>(entity: string, id: number, dto: Partial<T>): Observable<T> {
    return this.http.put<T>(`/api/master/${entity}/${id}`, dto);
  }
  deleteMaster(entity: string, id: number): Observable<void> {
    return this.http.delete<void>(`/api/master/${entity}/${id}`);
  }

  /** Reload a single entity list after a mutation */
  reload(entity: 'job-categories' | 'branches' | 'grades' | 'designations' | 'nopay-days'): void {
    // implement per-entity reload
  }
}
```

Until the real API is ready, seed each signal with realistic mock data (3–5 items per entity) so the UI works immediately.

---

## PHASE 3 — Shared Dropdown Components

### 3.1 Create `src/app/shared/components/searchable-dropdown/`

A reusable standalone component that accepts:
- `@Input() label: string`
- `@Input() options: { id: number; name: string }[]`
- `@Input() placeholder?: string`
- Implements `ControlValueAccessor` so it works with `formControlName`
- Has an internal text filter input above the options list using `MatSelect` + custom panel or `MatAutocomplete`
- Shows "No results" when filter yields empty

### 3.2 Create `src/app/shared/components/district-select/district-select.ts`

A simple `MatSelect` wrapper that implements `ControlValueAccessor`. Pre-load all 25 Sri Lankan districts as a `readonly` constant:

```
Ampara, Anuradhapura, Badulla, Batticaloa, Colombo, Galle, Gampaha,
Hambantota, Jaffna, Kalutara, Kandy, Kegalle, Kilinochchi, Kurunegala,
Mannar, Matale, Matara, Monaragala, Mullaitivu, Nuwara Eliya,
Polonnaruwa, Puttalam, Ratnapura, Trincomalee, Vavuniya
```

### 3.3 Create `src/app/shared/components/country-select/country-select.ts`

A searchable `MatSelect` or `MatAutocomplete` for ISO 3166-1 countries. Hardcode at minimum 50 common countries; default value `LK`. Implements `ControlValueAccessor`.

---

## PHASE 4 — Five New Master CRUD Pages

For each of the five entities below, create a standalone component at the specified path. Each must:

1. Use `MasterDataTableComponent` with appropriate column config.
2. Open a `MatDialog` for create/edit with a reactive form (code, name, isActive).
3. Call `MasterDataService.createMaster / updateMaster / deleteMaster`.
4. Use `ChangeDetectionStrategy.OnPush`.
5. Load data from the corresponding signal in `MasterDataService`.

### Entities to scaffold

| Component class | Path | API entity slug | Extra fields |
|---|---|---|---|
| `JobCategory` | `src/app/features/settings/job-category/job-category.ts` | `job-categories` | — |
| `Branch` | `src/app/features/settings/branch/branch.ts` | `branches` | — |
| `Grade` | `src/app/features/settings/grade/grade.ts` | `grades` | — |
| `Designation` | `src/app/features/settings/designation/designation.ts` | `designations` | — |
| `NopayDays` | `src/app/features/settings/nopay-days/nopay-days.ts` | `nopay-days` | `days: number`, `description: string` |

Create a single shared dialog `src/app/shared/components/master-data-dialog/master-data-dialog.ts` that accepts `MAT_DIALOG_DATA: { entity: string; item?: MasterEntity; extraFields?: FieldDef[] }` and renders the form dynamically. Do not create five separate dialogs.

---

## PHASE 5 — Settings Forms — Add Liability Checkboxes

Find the Allowance form dialog/component, the Deduction form dialog/component, and the Overtime form dialog/component (use grep if paths are unclear).

Add three `MatCheckbox` fields to each form:

```html
<mat-checkbox formControlName="liableForEPF">Liable for EPF</mat-checkbox>
<mat-checkbox formControlName="liableForETF">Liable for ETF</mat-checkbox>
<mat-checkbox formControlName="liableForNopay">Liable for Nopay</mat-checkbox>
```

Wire them to the reactive form groups with `[false]` as default. Ensure the form submit maps them to the DTO.

---

## PHASE 6 — Employee Form Refactor

This is the largest change. Edit `employee-form.ts` and its template.

### 6.1 Updated form group

Replace the existing `form` declaration with:

```typescript
readonly form = this.fb.group({
  // Personal Details tab
  employeeNo:   ['', Validators.required],
  firstName:    ['', Validators.required],
  lastName:     ['', Validators.required],
  payrollName:  [''],
  email:        ['', [Validators.required, Validators.email]],
  phone:        [''],
  joinDate:     ['', Validators.required],
  isActive:     [true],
  notes:        [''],
  employeeType: [null as EmployeeType | null, Validators.required],
  noPayDaysId:  [null as number | null],

  address: this.fb.group({
    line1:    ['', Validators.required],
    line2:    [''],
    city:     [''],
    district: [''],
    country:  ['LK'],
  }),

  emergencyContact: this.fb.group({
    contactPerson: [''],
    address:       [''],
    contactNumber: ['', [Validators.pattern(/^\+?[0-9\s\-]{7,15}$/)]],
    email:         ['', [Validators.email]],
  }),

  // Salary tab
  basicSalary: [0, [Validators.required, Validators.min(0)]],
  epfNo:       [''],
  etfNo:       [''],
  deductions:  this.fb.array([]),
  overtimes:   this.fb.array([]),

  // Allowances tab
  allowances: this.fb.array([]),

  // Job Information tab
  jobCategoryId: [null as number | null],
  designationId: [null as number | null],
  branchId:      [null as number | null],
  gradeId:       [null as number | null],
});
```

### 6.2 Inject MasterDataService

```typescript
readonly masterSvc = inject(MasterDataService);
```

Call `this.masterSvc.loadAll()` in the constructor (or `ngOnInit`).

### 6.3 Add cross-tab validation

Add a `selectedTabIndex = signal(0)` and this method:

```typescript
private navigateToFirstInvalidTab(): void {
  const tabGroups = [
    ['employeeNo','firstName','lastName','email','address','employeeType'],
    ['basicSalary','deductions','overtimes'],
    ['allowances'],
    ['jobCategoryId','designationId','branchId','gradeId'],
  ];
  const index = tabGroups.findIndex(keys =>
    keys.some(k => this.form.get(k)?.invalid)
  );
  if (index >= 0) this.selectedTabIndex.set(index);
}
```

In `save()`, call `this.navigateToFirstInvalidTab()` when form is invalid.

### 6.4 Patch existing employee data on edit

Update the constructor patch to also set the new fields from `EmployeeModel`.

### 6.5 Template restructure

Rewrite `employee-form.html` to use `<mat-tab-group [selectedIndex]="selectedTabIndex()">` with 5 tabs:

**Tab 1 — Personal Details**
- employeeNo, firstName, lastName (row of 3)
- payrollName (full width, placeholder: "Display EPF, ETF, Salary, Tax..")
- email, phone (row of 2)
- joinDate, employeeType (MatSelect with EMPLOYEE_TYPES), noPayDaysId (MatSelect bound to `masterSvc.activeNopayDays()`)
- isActive toggle
- **Address sub-section** (use `formGroupName="address"`): line1, line2, city (row of 3), then district (DistrictSelectComponent) and country (CountrySelectComponent) side by side
- **Emergency Contact card** (`<mat-card>` with heading "Emergency Contact Information", `formGroupName="emergencyContact"`): contactPerson, address, contactNumber, email

**Tab 2 — Salary**
- basicSalary, epfNo, etfNo
- Deductions FormArray (existing table pattern)
- Overtime FormArray (existing table pattern)

**Tab 3 — Allowances**
- Allowances FormArray (existing table pattern)

**Tab 4 — Job Information**
- jobCategoryId: MatSelect bound to `masterSvc.activeJobCategories()`
- designationId: MatSelect bound to `masterSvc.activeDesignations()`
- branchId: MatSelect bound to `masterSvc.activeBranches()`
- gradeId: MatSelect bound to `masterSvc.activeGrades()`

**Tab 5 — Emergency Contacts** *(can be inline in Tab 1 instead — your call based on form length)*

Keep all existing computed totals, add/remove row logic, and save/discard navigation working.

---

## PHASE 7 — Routing Updates

In `app.routes.ts`, inside the `authGuard` parent, add lazy routes for all five new settings pages:

```typescript
{ path: 'job-category', loadComponent: () => import('./features/settings/job-category/job-category').then(m => m.JobCategory) },
{ path: 'branch',       loadComponent: () => import('./features/settings/branch/branch').then(m => m.Branch) },
{ path: 'grade',        loadComponent: () => import('./features/settings/grade/grade').then(m => m.Grade) },
{ path: 'designation',  loadComponent: () => import('./features/settings/designation/designation').then(m => m.Designation) },
{ path: 'nopay-days',   loadComponent: () => import('./features/settings/nopay-days/nopay-days').then(m => m.NopayDays) },
```

Also add navigation links for these five routes to the sidebar/navigation component (find its path with a grep for `routerLink`).

---

## PHASE 8 — Database Migration Script

Create `src/migrations/001_payroll_enhancement.sql` with:

1. CREATE TABLE for: `job_categories`, `branches`, `grades`, `designations`, `nopay_days` (schema from `SYSTEM_DESIGN.md §3.1`)
2. ALTER TABLE `allowances` — add `liable_for_epf`, `liable_for_etf`, `liable_for_nopay` BOOLEAN columns
3. ALTER TABLE `deductions` — same three columns
4. ALTER TABLE `overtime_types` — same three columns
5. ALTER TABLE `employees` — add all new columns from `SYSTEM_DESIGN.md §3.2`
6. Backfill: `UPDATE employees SET addr_line1 = address WHERE addr_line1 IS NULL`

Use `IF NOT EXISTS` / `IF NOT EXISTS` everywhere so it is safe to re-run.

---

## PHASE 9 — Final Checks

After all changes:

1. Run `ng build --configuration=development` and fix any TypeScript or template compilation errors.
2. Search for any remaining usages of `new EmployeeModel(` and replace with object literals.
3. Search for `address: string` in the employee context and confirm it has been replaced with `StructuredAddress`.
4. Verify `standalone: true` is NOT used in any `@Component` or `@Directive` decorator (Angular 20 default).
5. Verify no `@HostBinding` or `@HostListener` decorators are used — use `host: {}` in `@Component` instead.
6. Verify no `ngClass` or `ngStyle` directives — use `[class]` and `[style]` bindings.
7. Confirm all new components use `ChangeDetectionStrategy.OnPush`.
8. Confirm all new services use `providedIn: 'root'` and `inject()` (not constructor injection).

Report a summary of all created and modified files when done.
