# Payroll Management System — Enhancement Design

> **Date:** 2026-05-15  
> **Scope:** Settings Module + Employee Master Form Enhancements  
> **Stack:** Angular 20 (signals, standalone), Angular Material, TypeScript strict, Reactive Forms  

---

## 1. Requirements Summary

### 1.1 Settings Module
- Add `liableForEPF`, `liableForETF`, `liableForNopay` boolean fields to Allowance, Deduction, and Overtime master forms.
- Create five new CRUD master-data sections: **Job Category, Branch, Grade, Designation, Nopay Days**.
- All five masters must power dropdowns in the Employee Master form.
- Reuse the existing `MasterDataTableComponent` pattern for all new masters.

### 1.2 Employee Master Form
- Add **Payroll Name** free-text field.
- Add **Employee Type** dropdown (Casual, Permanent, Contract, Intern, Part-time) — static enum.
- Add **Nopay Days** dropdown — dynamic from Settings.
- Replace single `address` field with structured address (Address Line 1/2, City, District, Country).
- Add **Emergency Contact Information** section (Contact Person, Address, Phone, Email).
- Add **Job Information** section (Job Category, Designation, Branch, Grade) — all dynamic from Settings.
- Reorganise form into **5 tabs**: Personal Details | Salary | Allowances | Job Information | Emergency Contacts.

### 1.3 Non-Functional
- Maintain backward compatibility with existing employee records.
- All new dropdowns load from API (signal-based caching).
- Pass AXE / WCAG AA accessibility checks.
- DB migrations included for all new tables and columns.

---

## 2. Data Model Design

### 2.1 TypeScript Interfaces — New Entities

```typescript
// src/app/shared/models/master-data.models.ts

export interface MasterEntity {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

export interface JobCategory extends MasterEntity {}
export interface Branch      extends MasterEntity {}
export interface Grade       extends MasterEntity {}
export interface Designation extends MasterEntity {}

export interface NoPayDays extends MasterEntity {
  days: number;       // e.g. 0.5, 1, 1.5, 2 ...
  description: string;
}
```

### 2.2 Updated AllowanceModel / DeductionModel / OvertimeModel

```typescript
// src/app/features/settings/allowances/allowance.model.ts  (updated)
export interface AllowanceModel {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  liableForEPF:   boolean;   // ★ new
  liableForETF:   boolean;   // ★ new
  liableForNopay: boolean;   // ★ new
}

// Same additions apply to DeductionModel and OvertimeModel
```

### 2.3 Updated EmployeeModel

```typescript
// src/app/features/settings/employee/employee.model.ts  (updated)

export interface EmergencyContact {
  contactPerson: string;
  address:       string;
  contactNumber: string;
  email:         string;
}

export interface StructuredAddress {
  line1:    string;
  line2:    string;
  city:     string;
  district: string;
  country:  string;
}

export type EmployeeType = 'Casual' | 'Permanent' | 'Contract' | 'Intern' | 'Part-time';

export interface EmployeeLineItem {
  name:   string;
  amount: number;
}

export interface EmployeeModel {
  id:              number;
  employeeNo:      string;
  firstName:       string;
  lastName:        string;
  payrollName:     string;          // ★ new
  email:           string;
  phone:           string;
  joinDate:        string;
  isActive:        boolean;
  notes:           string;

  // Payroll
  basicSalary:     number;
  epfNo:           string;
  etfNo:           string;
  allowances:      EmployeeLineItem[];
  overtimes:       EmployeeLineItem[];
  deductions:      EmployeeLineItem[];

  // ★ New scalar fields
  employeeType:    EmployeeType;
  noPayDaysId:     number | null;   // FK → nopay_days.id

  // ★ Job Info (FK references to master tables)
  jobCategoryId:   number | null;
  designationId:   number | null;
  branchId:        number | null;
  gradeId:         number | null;

  // ★ Structured address (replaces flat address: string)
  address:         StructuredAddress;

  // ★ Emergency contact
  emergencyContact: EmergencyContact;

  // Deprecated — keep for migration compatibility
  /** @deprecated use address.line1 */
  legacyAddress?:  string;
}
```

---

## 3. Database Schema

### 3.1 New Master Tables

```sql
-- job_categories
CREATE TABLE job_categories (
  id         SERIAL PRIMARY KEY,
  code       VARCHAR(20)  NOT NULL UNIQUE,
  name       VARCHAR(100) NOT NULL,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- branches
CREATE TABLE branches (
  id         SERIAL PRIMARY KEY,
  code       VARCHAR(20)  NOT NULL UNIQUE,
  name       VARCHAR(100) NOT NULL,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- grades
CREATE TABLE grades (
  id         SERIAL PRIMARY KEY,
  code       VARCHAR(20)  NOT NULL UNIQUE,
  name       VARCHAR(100) NOT NULL,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- designations
CREATE TABLE designations (
  id         SERIAL PRIMARY KEY,
  code       VARCHAR(20)  NOT NULL UNIQUE,
  name       VARCHAR(100) NOT NULL,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- nopay_days
CREATE TABLE nopay_days (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(20)   NOT NULL UNIQUE,
  name        VARCHAR(100)  NOT NULL,
  days        DECIMAL(4,2)  NOT NULL,
  description VARCHAR(255),
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);
```

### 3.2 ALTER Existing Tables

```sql
-- allowances
ALTER TABLE allowances
  ADD COLUMN IF NOT EXISTS liable_for_epf   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS liable_for_etf   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS liable_for_nopay BOOLEAN NOT NULL DEFAULT FALSE;

-- deductions (same pattern)
ALTER TABLE deductions
  ADD COLUMN IF NOT EXISTS liable_for_epf   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS liable_for_etf   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS liable_for_nopay BOOLEAN NOT NULL DEFAULT FALSE;

-- overtime_types (same pattern)
ALTER TABLE overtime_types
  ADD COLUMN IF NOT EXISTS liable_for_epf   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS liable_for_etf   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS liable_for_nopay BOOLEAN NOT NULL DEFAULT FALSE;

-- employees — new scalar fields
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS payroll_name     VARCHAR(150),
  ADD COLUMN IF NOT EXISTS employee_type    VARCHAR(20) CHECK (employee_type IN
                                             ('Casual','Permanent','Contract','Intern','Part-time')),
  ADD COLUMN IF NOT EXISTS nopay_days_id    INTEGER REFERENCES nopay_days(id),
  ADD COLUMN IF NOT EXISTS job_category_id  INTEGER REFERENCES job_categories(id),
  ADD COLUMN IF NOT EXISTS designation_id   INTEGER REFERENCES designations(id),
  ADD COLUMN IF NOT EXISTS branch_id        INTEGER REFERENCES branches(id),
  ADD COLUMN IF NOT EXISTS grade_id         INTEGER REFERENCES grades(id),
  -- structured address (replace flat address column gradually)
  ADD COLUMN IF NOT EXISTS addr_line1       VARCHAR(200),
  ADD COLUMN IF NOT EXISTS addr_line2       VARCHAR(200),
  ADD COLUMN IF NOT EXISTS addr_city        VARCHAR(100),
  ADD COLUMN IF NOT EXISTS addr_district    VARCHAR(100),
  ADD COLUMN IF NOT EXISTS addr_country     VARCHAR(100),
  -- emergency contact
  ADD COLUMN IF NOT EXISTS ec_contact_person VARCHAR(150),
  ADD COLUMN IF NOT EXISTS ec_address        VARCHAR(300),
  ADD COLUMN IF NOT EXISTS ec_contact_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS ec_email          VARCHAR(150);

-- Backfill: copy existing flat address into addr_line1 for existing rows
UPDATE employees SET addr_line1 = address WHERE addr_line1 IS NULL AND address IS NOT NULL;
```

> **Migration strategy:** Keep the existing `address` column during transition. The application reads `addr_line1` if present, falls back to `address`. The legacy column can be dropped in a follow-up migration after all clients are updated.

---

## 4. API Contracts

### 4.1 Master Data Endpoints (generic pattern for all 5 entities)

```
GET    /api/master/{entity}           → MasterEntity[]
GET    /api/master/{entity}/{id}      → MasterEntity
POST   /api/master/{entity}           → MasterEntity   (body: CreateMasterDto)
PUT    /api/master/{entity}/{id}      → MasterEntity   (body: UpdateMasterDto)
DELETE /api/master/{entity}/{id}      → 204 No Content

{entity} values: job-categories | branches | grades | designations | nopay-days
```

**Request DTO (shared):**
```typescript
interface CreateMasterDto {
  code:   string;   // max 20 chars, unique
  name:   string;   // max 100 chars
  isActive?: boolean; // defaults to true
  // NoPayDays only:
  days?:        number;
  description?: string;
}
```

**Response DTO:**
```typescript
interface MasterEntityDto {
  id:        number;
  code:      string;
  name:      string;
  isActive:  boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 4.2 Updated Allowance / Deduction / Overtime Settings Endpoints

```
GET    /api/settings/allowances         → AllowanceDto[]
POST   /api/settings/allowances         → AllowanceDto
PUT    /api/settings/allowances/{id}    → AllowanceDto
DELETE /api/settings/allowances/{id}    → 204

// Same pattern for /deductions and /overtime
```

**AllowanceDto:**
```typescript
interface AllowanceDto {
  id:             number;
  code:           string;
  name:           string;
  isActive:       boolean;
  liableForEPF:   boolean;   // ★ new
  liableForETF:   boolean;   // ★ new
  liableForNopay: boolean;   // ★ new
}
```

### 4.3 Updated Employee Endpoints

```
GET    /api/employees           → EmployeeDto[]
GET    /api/employees/{id}      → EmployeeDto
POST   /api/employees           → EmployeeDto
PUT    /api/employees/{id}      → EmployeeDto
DELETE /api/employees/{id}      → 204
```

**EmployeeDto (key new fields):**
```typescript
interface EmployeeDto {
  id:              number;
  employeeNo:      string;
  firstName:       string;
  lastName:        string;
  payrollName:     string;          // ★
  email:           string;
  phone:           string;
  employeeType:    string;          // ★
  noPayDaysId:     number | null;   // ★
  jobCategoryId:   number | null;   // ★
  designationId:   number | null;   // ★
  branchId:        number | null;   // ★
  gradeId:         number | null;   // ★
  address: {                        // ★ structured
    line1:    string;
    line2:    string;
    city:     string;
    district: string;
    country:  string;
  };
  emergencyContact: {               // ★
    contactPerson: string;
    address:       string;
    contactNumber: string;
    email:         string;
  };
  // ... existing salary, allowances[], overtimes[], deductions[]
}
```

---

## 5. Frontend Architecture

### 5.1 New Files to Create

```
src/app/
├── shared/
│   ├── models/
│   │   └── master-data.models.ts           ★ new interfaces
│   ├── services/
│   │   └── master-data.service.ts          ★ signal-based API service
│   ├── components/
│   │   ├── searchable-dropdown/            ★ reusable searchable select
│   │   │   ├── searchable-dropdown.ts
│   │   │   └── searchable-dropdown.html
│   │   ├── country-select/                 ★ reusable country dropdown
│   │   │   └── country-select.ts
│   │   ├── district-select/                ★ Sri Lanka districts dropdown
│   │   │   └── district-select.ts
│   │   └── emergency-contact-form/         ★ reusable contact group
│   │       ├── emergency-contact-form.ts
│   │       └── emergency-contact-form.html
│
├── features/settings/
│   ├── job-category/                       ★ new CRUD page
│   │   └── job-category.ts
│   ├── branch/                             ★ new CRUD page
│   │   └── branch.ts
│   ├── grade/                              ★ new CRUD page
│   │   └── grade.ts
│   ├── designation/                        ★ new CRUD page
│   │   └── designation.ts
│   ├── nopay-days/                         ★ new CRUD page
│   │   └── nopay-days.ts
│   ├── allowances/
│   │   └── allowance.model.ts              (updated — add 3 boolean fields)
│   ├── deductions/
│   │   └── deduction.model.ts              (updated)
│   └── overtime/
│       └── overtime.model.ts               (updated)
│
└── features/settings/employee/
    ├── employee.model.ts                   (updated — see §2.3)
    ├── employee.service.ts                 (updated — API integration)
    └── employee-form/
        ├── employee-form.ts                (updated — tabs, new fields)
        └── employee-form.html              (updated — restructured)
```

### 5.2 MasterDataService

```typescript
// src/app/shared/services/master-data.service.ts

@Injectable({ providedIn: 'root' })
export class MasterDataService {
  private readonly http = inject(HttpClient);

  // Signal-based cache per entity
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

  // Active-only computed selectors for dropdowns
  readonly activeJobCategories = computed(() => this._jobCategories().filter(x => x.isActive));
  readonly activeBranches      = computed(() => this._branches().filter(x => x.isActive));
  readonly activeGrades        = computed(() => this._grades().filter(x => x.isActive));
  readonly activeDesignations  = computed(() => this._designations().filter(x => x.isActive));
  readonly activeNopayDays     = computed(() => this._nopayDays().filter(x => x.isActive));

  loadAll(): void {
    // Parallel load of all masters on app init or first form open
    this.http.get<JobCategory[]>('/api/master/job-categories')
      .subscribe(d => this._jobCategories.set(d));
    this.http.get<Branch[]>('/api/master/branches')
      .subscribe(d => this._branches.set(d));
    this.http.get<Grade[]>('/api/master/grades')
      .subscribe(d => this._grades.set(d));
    this.http.get<Designation[]>('/api/master/designations')
      .subscribe(d => this._designations.set(d));
    this.http.get<NoPayDays[]>('/api/master/nopay-days')
      .subscribe(d => this._nopayDays.set(d));
  }

  // CRUD helpers (same signature for each entity)
  createMaster<T extends MasterEntity>(entity: string, dto: Partial<T>): Observable<T> {
    return this.http.post<T>(`/api/master/${entity}`, dto);
  }
  updateMaster<T extends MasterEntity>(entity: string, id: number, dto: Partial<T>): Observable<T> {
    return this.http.put<T>(`/api/master/${entity}/${id}`, dto);
  }
  deleteMaster(entity: string, id: number): Observable<void> {
    return this.http.delete<void>(`/api/master/${entity}/${id}`);
  }
}
```

### 5.3 Reusable Master CRUD Page Pattern

Each new master (Job Category, Branch, Grade, Designation, Nopay Days) follows this pattern, reusing `MasterDataTableComponent`:

```typescript
// Example: src/app/features/settings/job-category/job-category.ts

@Component({
  selector: 'app-job-category',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MasterDataTableComponent, MatDialogModule],
  template: `
    <app-master-data-table
      [config]="tableConfig"
      [data]="items()"
      (newClicked)="openDialog()"
      (editClicked)="openDialog($event)"
      (deleteClicked)="delete($event)" />
  `
})
export class JobCategory {
  private readonly masterSvc = inject(MasterDataService);
  private readonly dialog    = inject(MatDialog);

  readonly items = this.masterSvc.jobCategories;

  readonly tableConfig: MasterDataTableConfig = {
    title: 'Job Categories',
    columns: [
      { key: 'code',     label: 'Code',   type: 'text' },
      { key: 'name',     label: 'Name',   type: 'text' },
      { key: 'isActive', label: 'Active', type: 'boolean' },
    ],
    showNewButton: true,
  };

  openDialog(item?: JobCategory): void {
    // Open shared MasterDataDialogComponent with entity = 'job-categories'
  }

  delete(item: JobCategory): void {
    this.masterSvc.deleteMaster('job-categories', item.id)
      .subscribe(() => this.masterSvc.loadAll());
  }
}
```

> All five masters use the same `MasterDataDialogComponent` — parameterised by entity slug and optional extra fields (e.g. `days` for Nopay Days).

### 5.4 Employee Form — Reactive Form Shape (Updated)

```typescript
readonly form = this.fb.group({
  // ── Personal Details ──────────────────────────────────────
  employeeNo:   ['', Validators.required],
  firstName:    ['', Validators.required],
  lastName:     ['', Validators.required],
  payrollName:  [''],                                         // ★ new
  email:        ['', [Validators.required, Validators.email]],
  phone:        [''],
  joinDate:     ['', Validators.required],
  isActive:     [true],
  notes:        [''],
  employeeType: ['', Validators.required],                   // ★ new
  noPayDaysId:  [null as number | null],                     // ★ new

  // ★ Structured address group
  address: this.fb.group({
    line1:    ['', Validators.required],
    line2:    [''],
    city:     [''],
    district: [''],
    country:  ['LK'],       // default Sri Lanka
  }),

  // ★ Emergency contact group
  emergencyContact: this.fb.group({
    contactPerson: [''],
    address:       [''],
    contactNumber: ['', Validators.pattern(/^\+?[0-9\s\-]{7,15}$/)],
    email:         ['', Validators.email],
  }),

  // ── Salary ────────────────────────────────────────────────
  basicSalary: [0, [Validators.required, Validators.min(0)]],
  epfNo:       [''],
  etfNo:       [''],
  deductions:  this.fb.array([]),
  overtimes:   this.fb.array([]),

  // ── Allowances ────────────────────────────────────────────
  allowances:  this.fb.array([]),

  // ── Job Information ───────────────────────────────────────
  jobCategoryId:  [null as number | null],                   // ★ new
  designationId:  [null as number | null],                   // ★ new
  branchId:       [null as number | null],                   // ★ new
  gradeId:        [null as number | null],                   // ★ new
});
```

### 5.5 Employee Form — Tab Structure

```html
<mat-tab-group [dynamicHeight]="true" (selectedTabChange)="onTabChange($event)">

  <!-- Tab 1: Personal Details -->
  <mat-tab label="Personal Details">
    <!-- employeeNo, firstName, lastName, payrollName -->
    <!-- email, phone, joinDate, employeeType, noPayDaysId -->
    <!-- Address sub-section: line1, line2, city, district, country -->
    <!-- Emergency Contact card -->
  </mat-tab>

  <!-- Tab 2: Salary -->
  <mat-tab label="Salary">
    <!-- basicSalary, epfNo, etfNo -->
    <!-- Deductions FormArray table -->
    <!-- Overtime FormArray table -->
  </mat-tab>

  <!-- Tab 3: Allowances -->
  <mat-tab label="Allowances">
    <!-- Allowances FormArray table -->
  </mat-tab>

  <!-- Tab 4: Job Information -->
  <mat-tab label="Job Information">
    <!-- jobCategory, designation, branch, grade dropdowns -->
  </mat-tab>

  <!-- Tab 5: Emergency Contacts -->
  <!-- (Can be folded into Tab 1 or kept separate per preference) -->
  <mat-tab label="Emergency Contacts">
    <!-- EmergencyContactForm group -->
  </mat-tab>

</mat-tab-group>
```

**Cross-tab validation** — on Save, call `form.markAllAsTouched()` then iterate tabs to find which contain invalid controls and auto-navigate to the first invalid tab:

```typescript
save(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    this.navigateToFirstInvalidTab();   // see implementation below
    return;
  }
  // ...
}

private navigateToFirstInvalidTab(): void {
  const tabGroups = [
    ['employeeNo','firstName','lastName','email','address','emergencyContact','employeeType'],
    ['basicSalary','epfNo','etfNo','deductions','overtimes'],
    ['allowances'],
    ['jobCategoryId','designationId','branchId','gradeId'],
  ];
  const index = tabGroups.findIndex(keys =>
    keys.some(k => this.form.get(k)?.invalid)
  );
  if (index >= 0) this.selectedTabIndex.set(index);
}
```

### 5.6 Shared Dropdown Components

#### SearchableDropdownComponent

A generic `MatSelect` + `MatInput` filter wrapper for any `{ id, name }[]` list:

```typescript
// Usage in template:
<app-searchable-dropdown
  label="Designation"
  [options]="masterSvc.activeDesignations()"
  formControlName="designationId" />
```

#### DistrictSelectComponent

Pre-loaded list of 25 Sri Lankan districts. Implements `ControlValueAccessor` for use inside reactive forms.

```typescript
readonly SL_DISTRICTS = [
  'Ampara','Anuradhapura','Badulla','Batticaloa','Colombo',
  'Galle','Gampaha','Hambantota','Jaffna','Kalutara',
  'Kandy','Kegalle','Kilinochchi','Kurunegala','Mannar',
  'Matale','Matara','Monaragala','Mullaitivu','Nuwara Eliya',
  'Polonnaruwa','Puttalam','Ratnapura','Trincomalee','Vavuniya'
];
```

#### CountrySelectComponent

ISO 3166-1 country list, searchable. Defaults to 'LK' (Sri Lanka). Implements `ControlValueAccessor`.

---

## 6. Routing Updates

```typescript
// app.routes.ts additions inside the authGuard parent

{ path: 'job-category',  loadComponent: () => import('./features/settings/job-category/job-category').then(m => m.JobCategory) },
{ path: 'branch',        loadComponent: () => import('./features/settings/branch/branch').then(m => m.Branch) },
{ path: 'grade',         loadComponent: () => import('./features/settings/grade/grade').then(m => m.Grade) },
{ path: 'designation',   loadComponent: () => import('./features/settings/designation/designation').then(m => m.Designation) },
{ path: 'nopay-days',    loadComponent: () => import('./features/settings/nopay-days/nopay-days').then(m => m.NopayDays) },
```

Also update the navigation sidebar to include these five new settings links.

---

## 7. Backward Compatibility Strategy

| Concern | Approach |
|---|---|
| Existing `address: string` field | Keep DB column; backfill into `addr_line1`; read new columns with null-safe fallback |
| Existing `EmployeeModel` class | Migrate to interface; add optional fields with defaults |
| Existing employee records | `payrollName`, `employeeType`, FKs all nullable — no data loss |
| Allowance/Deduction/OT records | New boolean columns default `FALSE` — existing records unaffected |
| API consumers | Additive changes only; no breaking field removals |

---

## 8. Static Data

### Employee Types (enum — no API needed)

```typescript
export const EMPLOYEE_TYPES = ['Casual', 'Permanent', 'Contract', 'Intern', 'Part-time'] as const;
export type EmployeeType = typeof EMPLOYEE_TYPES[number];
```

### Sri Lankan Districts (client-side constant)

Seed as a `const` array in `district-select.ts` — 25 districts listed in §5.6.

---

## 9. Accessibility Checklist

- All form fields have `<label>` or `aria-label`.
- `MatSelect` elements include `aria-describedby` for error messages.
- Tab navigation: each `mat-tab` panel has `role="tabpanel"` with `id` linked from the tab via `aria-controls`.
- Emergency contact fieldset uses `<fieldset>` + `<legend>` for screen-reader grouping.
- Error messages use `mat-error` (announced via `aria-live="polite"`).
- Country and District dropdowns support keyboard navigation natively via `MatSelect`.
- Color contrast: use `mat-form-field` with outlined appearance; rely on Material tokens for compliance.

---

## 10. Implementation Plan

### Phase 1 — Foundation (shared services + models)
1. Create `src/app/shared/models/master-data.models.ts`
2. Create `MasterDataService` with signal cache and CRUD helpers
3. Create `SearchableDropdownComponent` (ControlValueAccessor)
4. Create `DistrictSelectComponent` and `CountrySelectComponent`
5. Create `EmergencyContactFormGroup` shared component

### Phase 2 — Settings Masters
6. Create five CRUD pages (Job Category, Branch, Grade, Designation, Nopay Days) using `MasterDataTableComponent`
7. Create shared `MasterDataDialogComponent` (parameterised)
8. Add routes + navigation links for all five
9. Update Allowance / Deduction / Overtime forms to include the three liability checkboxes

### Phase 3 — Employee Master Form Refactor
10. Update `employee.model.ts` to new interface shape
11. Expand `employee-form.ts` reactive form with new field groups
12. Restructure template into 5 tabs; wire cross-tab validation
13. Inject `MasterDataService`; bind Job Info dropdowns to signals
14. Wire Nopay Days dropdown
15. Add Employee Type static dropdown

### Phase 4 — DB Migrations & API DTOs
16. Write and test SQL migration script (ALTER + new tables)
17. Update backend DTOs for Allowance, Deduction, Overtime, Employee
18. Implement CRUD endpoints for the five new master entities
19. Update Employee GET/POST/PUT endpoints to include new fields
20. Backfill existing `address` → `addr_line1`

### Phase 5 — QA
21. Run AXE accessibility scan on all updated pages
22. Test backward compatibility: load an existing employee record and verify no data loss
23. Verify all dropdowns load from API (mock then real)
24. Test cross-tab validation flow

---

## 11. Trade-off Analysis

| Decision | Choice | Rationale | Trade-off |
|---|---|---|---|
| Master data caching | Signal-based in-memory cache | Simple, reactive, no extra lib | Cache invalidated on page reload; acceptable for master data |
| Address migration | Additive columns + backfill | Zero data loss, rollback safe | Temporary duplication of address data |
| Generic MasterDataService | Single service for all 5 entities | Less code, consistent pattern | Less type-safety per entity — mitigated by generic type params |
| Employee Type | Static enum (no API) | Never changes; saves a round-trip | Requires redeploy to add new types — low risk |
| District list | Client-side constant | Fast, no API needed | Must redeploy to add districts — acceptable |
| Country list | Client-side ISO list | Standard, stable | ~250 country entries in bundle — negligible size |
| Tab validation | Navigate to first invalid tab on save | Best UX for multi-tab forms | Slight complexity in `navigateToFirstInvalidTab()` |

---

## 12. What to Revisit as the System Grows

- **Payroll calculation engine:** Once `liableForEPF/ETF/Nopay` flags are live, the payroll entry screen needs to filter and aggregate correctly — design that separately.
- **Audit trail:** Master data changes (branch rename, etc.) should be logged if payroll records reference them by ID.
- **Multi-company support:** If `Branch` evolves to belong to a `Company`, the master table needs a `company_id` FK.
- **Country/District API:** If the system expands internationally, replace client-side constants with a `/api/geo/districts` endpoint.
- **Form state persistence:** For long employee forms, consider `localStorage` draft saving to prevent data loss on accidental navigation.
