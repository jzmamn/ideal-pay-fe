import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { EmployeeRequest, EmployeeResponse } from '../employee.model';
import { EmployeeService } from '../employee.service';
import { EmployeeSalaryService } from '../employee-salary.service';
import { MasterDataService } from '../../../../shared/services/master-data.service';
import { Grade } from '../../../../shared/models/master-data.models';
import { LookupConfig } from '../../../../shared/components/lookup/lookup.config';
import { LookupComponent } from '../../../../shared/components/lookup/lookup.component';
import { SearchableDropdown } from '../../../../shared/components/searchable-dropdown/searchable-dropdown';
import { CountrySelect } from '../../../../shared/components/country-select/country-select';
import { EmployeeAllowances, FixedAllowance } from '../employee-allowances/employee-allowances.component';
import { EmployeeDeductions, FixedDeduction } from '../employee-deductions/employee-deductions.component';

const DATE_FORMATS: MatDateFormats = {
  parse: { dateInput: { year: 'numeric', month: 'numeric', day: 'numeric' } },
  display: {
    dateInput: { year: 'numeric', month: '2-digit', day: '2-digit' },
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};

function parseDate(s: string | undefined): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function orUndef(s: string): string | undefined {
  return s || undefined;
}

@Component({
  selector: 'app-employee-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'en-CA' },
    { provide: MAT_DATE_FORMATS, useValue: DATE_FORMATS },
  ],
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSlideToggleModule,
    MatTabsModule,
    LookupComponent,
    SearchableDropdown,
    CountrySelect,
    EmployeeAllowances,
    EmployeeDeductions,
  ],
  templateUrl: './employee-form.html',
  styleUrl: './employee-form.scss',
})
export class EmployeeForm {
  private readonly router     = inject(Router);
  private readonly fb         = inject(FormBuilder);
  private readonly snackBar   = inject(MatSnackBar);
  readonly service            = inject(EmployeeService);
  readonly salaryService      = inject(EmployeeSalaryService);
  readonly masterSvc          = inject(MasterDataService);

  readonly isEditMode         = computed(() => !!this.service.selected());
  readonly selectedTabIndex   = signal(0);
  readonly selectedSalaryTabIndex = signal(0);

  readonly form = this.fb.group({
    employeeNo:    ['', Validators.required],
    firstName:     ['', Validators.required],
    lastName:      ['', Validators.required],
    dateOfBirth:   [null as Date | null],
    nic:           [''],
    payrollName:   [''],
    email:         ['', Validators.email],
    phone:         [''],
    joinedDate:    [null as Date | null, Validators.required],
    isActive:      [true],
    remarks:       [''],

    employeeTypeId: [null as number | null, Validators.required],
    contractFrom:   [{ value: null as Date | null, disabled: true }],
    contractTo:     [{ value: null as Date | null, disabled: true }],

    nopayDaysId:   [null as number | null, Validators.required],
    epfNo:         [''],
    etfNo:         [''],

    jobCategoryId: [null as number | null, Validators.required],
    designationId: [null as number | null, Validators.required],
    branchId:      [null as number | null, Validators.required],
    gradeId:       [null as number | null],
    basicSalary:   [0, [Validators.required, Validators.min(0)]],

    statusId:      [null as number | null, Validators.required],
    statDate:      [{ value: null as Date | null, disabled: true }],

    adrsLine1:       [''],
    adrsLine2:       [''],
    city:            [''],
    districtId:      [null as number | null],
    country:         [null as number | null, Validators.required],
    contactPerson:   [''],
    cpAddress:       [''],
    cpContactNumber: ['', Validators.pattern(/^\+?[0-9\s\-]{7,15}$/)],
  });

  private readonly _fixedAllowances = signal<FixedAllowance[]>([]);
  private readonly _fixedDeductions = signal<FixedDeduction[]>([]);

  readonly fixedAllowancesCount = computed(() => this._fixedAllowances().length);
  readonly fixedDeductionsCount = computed(() => this._fixedDeductions().length);

  readonly nopayDaysOptions = computed(() =>
    this.masterSvc.activeNopayDays().map(n => ({ id: n.id, name: `${n.name} (${n.days}d)` }))
  );

  readonly gradeLookupConfig = computed<LookupConfig<Grade>>(() => ({
    title: 'Select Grade',
    displayedColumns: ['code', 'name', 'amount'],
    columnLabels: { code: 'Code', name: 'Name', amount: 'Amount' },
    data: this.masterSvc.activeGrades(),
  }));

  private readonly _empTypeId = toSignal(
    this.form.controls.employeeTypeId.valueChanges,
    { initialValue: this.form.controls.employeeTypeId.value },
  );

  private readonly _statusId = toSignal(
    this.form.controls.statusId.valueChanges,
    { initialValue: this.form.controls.statusId.value },
  );
  onGradeSelected(grade: Grade): void {
    this.form.controls.gradeId.setValue(grade.id);
    if (grade.amount != null) {
      this.form.controls.basicSalary.setValue(grade.amount);
    }
  }

  constructor() {
    this.masterSvc.loadAll();

    effect(() => {
      const type  = this.masterSvc.activeEmployeeTypes().find(t => t.id === this._empTypeId());
      const start = this.form.controls.contractFrom;
      const end   = this.form.controls.contractTo;
      if (type?.dateRange) {
        start.enable({ emitEvent: false });
        end.enable({ emitEvent: false });
        const emp = this.service.selected();
        if (emp && this._empTypeId() === emp.employeeTypeId) {
          start.setValue(parseDate(emp.contractFrom), { emitEvent: false });
          end.setValue(parseDate(emp.contractTo),   { emitEvent: false });
        }
      } else {
        start.disable({ emitEvent: false });
        end.disable({ emitEvent: false });
      }
    });

    effect(() => {
      const status   = this.masterSvc.activeStatuses().find(s => s.id === this._statusId());
      const statDate = this.form.controls.statDate;
      if (status?.dateOnly) {
        statDate.enable({ emitEvent: false });
        const emp = this.service.selected();
        if (emp && this._statusId() === emp.statusId) {
          statDate.setValue(parseDate(emp.statDate), { emitEvent: false });
        }
      } else {
        statDate.setValue(null, { emitEvent: false });
        statDate.disable({ emitEvent: false });
      }
    });

    const emp = this.service.selected();
    if (emp) {
      this.form.patchValue({
        employeeNo:    emp.employeeNo,
        firstName:     emp.firstName,
        lastName:      emp.lastName,
        dateOfBirth:   parseDate(emp.dateOfBirth),
        nic:           emp.nic,
        payrollName:   emp.payrollName,
        email:         emp.email,
        phone:         emp.phone,
        joinedDate:    parseDate(emp.joinedDate),
        isActive:      emp.isActive,
        remarks:       emp.remarks,
        epfNo:         emp.epfNo,
        etfNo:         emp.etfNo,

        employeeTypeId: emp.employeeTypeId,
        contractFrom:   parseDate(emp.contractFrom),
        contractTo:     parseDate(emp.contractTo),

        nopayDaysId:   emp.nopayDaysId,
        jobCategoryId: emp.jobCategoryId,
        designationId: emp.designationId,
        branchId:      emp.branchId,
        gradeId:       emp.gradeId,
        basicSalary:   emp.basicSalary,

        statusId:  emp.statusId,
        statDate:  parseDate(emp.statDate),

        adrsLine1:       emp.adrsLine1,
        adrsLine2:       emp.adrsLine2,
        city:            emp.city,
        districtId:      emp.districtId,
        country:         emp.countryId,
        contactPerson:   emp.contactPerson,
        cpAddress:       emp.cpAddress,
        cpContactNumber: emp.cpContactNumber,
      });
    }
  }

  onAllowancesChange(list: FixedAllowance[]): void {
    this._fixedAllowances.set(list);
  }

  onDeductionsChange(list: FixedDeduction[]): void {
    this._fixedDeductions.set(list);
  }

  private navigateToFirstInvalidTab(): void {
    const tabGroups = [
      ['firstName', 'lastName', 'country'],
      ['employeeNo', 'joinedDate', 'employeeTypeId', 'nopayDaysId', 'jobCategoryId', 'designationId', 'branchId', 'statusId'],
      ['basicSalary'],
    ];
    const index = tabGroups.findIndex(keys =>
      keys.some(k => this.form.get(k)?.invalid)
    );
    if (index >= 0) this.selectedTabIndex.set(index);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.navigateToFirstInvalidTab();
      return;
    }
    const v       = this.form.getRawValue();
    const existing = this.service.selected();

    const payload: EmployeeRequest = {
      employeeNo:    v.employeeNo!,
      firstName:     v.firstName!,
      lastName:      v.lastName!,
      dateOfBirth:   orUndef(formatDate(v.dateOfBirth)),
      nic:           orUndef(v.nic ?? ''),
      isActive:      v.isActive ?? true,
      remarks:       orUndef(v.remarks ?? ''),
      payrollName:   v.payrollName ?? '',
      epfNo:         orUndef(v.epfNo ?? ''),
      etfNo:         orUndef(v.etfNo ?? ''),
      basicSalary:   v.basicSalary ?? 0,
      joinedDate:    formatDate(v.joinedDate)!,

      employeeTypeId: v.employeeTypeId!,
      contractFrom:   orUndef(formatDate(v.contractFrom)),
      contractTo:     orUndef(formatDate(v.contractTo)),

      nopayDaysId:   v.nopayDaysId!,
      jobCategoryId: v.jobCategoryId!,
      designationId: v.designationId!,
      branchId:      v.branchId!,
      gradeId:       v.gradeId!,

      statusId:  v.statusId!,
      statDate:  orUndef(formatDate(v.statDate)),

      phone:           orUndef(v.phone ?? ''),
      email:           orUndef(v.email ?? ''),
      adrsLine1:       orUndef(v.adrsLine1 ?? ''),
      adrsLine2:       orUndef(v.adrsLine2 ?? ''),
      city:            orUndef(v.city ?? ''),
      districtId:      v.districtId ?? undefined,
      countryId:       v.country!,
      contactPerson:   orUndef(v.contactPerson ?? ''),
      cpAddress:       orUndef(v.cpAddress ?? ''),
      cpContactNumber: orUndef(v.cpContactNumber ?? ''),

      createdBy:  1,
      modifiedBy: 1,
    };

    if (existing) {
      this.service.update(existing.id, payload).subscribe({
        next: () => {
          this.salaryService.save({
            employeeId:      existing.id,
            basicSalary:     payload.basicSalary ?? 0,
            fixedAllowances: this._fixedAllowances().map(a => ({ name: a.name, amount: a.amount })),
            fixedDeductions: this._fixedDeductions().map(d => ({ name: d.name, amount: d.amount })),
          });
          this.service.reload();
          this.router.navigate(['/employee/info']);
        },
        error: () => {
          this.snackBar.open('Failed to update employee. Please try again.', 'Close', { duration: 4000 });
        },
      });
    } else {
      this.service.create(payload).subscribe({
        next: (created: EmployeeResponse) => {
          this.service.select(created);
          this.salaryService.save({
            employeeId:      created.id,
            basicSalary:     payload.basicSalary ?? 0,
            fixedAllowances: this._fixedAllowances().map(a => ({ name: a.name, amount: a.amount })),
            fixedDeductions: this._fixedDeductions().map(d => ({ name: d.name, amount: d.amount })),
          });
          this.service.reload();
          this.router.navigate(['/employee/info']);
        },
        error: () => {
          this.snackBar.open('Failed to create employee. Please try again.', 'Close', { duration: 4000 });
        },
      });
    }
  }

  discard(): void {
    this.router.navigate(this.service.selected() ? ['/employee/info'] : ['/employee']);
  }
}
