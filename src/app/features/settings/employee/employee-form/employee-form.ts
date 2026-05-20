import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
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
import { MatTabsModule } from '@angular/material/tabs';
import { EmployeeModel } from '../employee.model';
import { EmployeeSalaryModel } from '../employee-salary.model';
import { EmployeeService, EmployeePayload } from '../employee.service';
import { EmployeeSalaryService } from '../employee-salary.service';
import { MasterDataService } from '../../../../shared/services/master-data.service';
import { Grade } from '../../../../shared/models/master-data.models';
import { LookupConfig } from '../../../../shared/components/lookup/lookup.config';
import { LookupComponent } from '../../../../shared/components/lookup/lookup.component';
import { SearchableDropdown } from '../../../../shared/components/searchable-dropdown/searchable-dropdown';
import { DistrictSelect } from '../../../../shared/components/district-select/district-select';
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

function parseDate(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(d: Date | null): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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
    DistrictSelect,
    CountrySelect,
    EmployeeAllowances,
    EmployeeDeductions,
  ],
  templateUrl: './employee-form.html',
  styleUrl: './employee-form.scss',
})
export class EmployeeForm {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly service = inject(EmployeeService);
  readonly salaryService = inject(EmployeeSalaryService);
  readonly masterSvc = inject(MasterDataService);

  readonly isEditMode = computed(() => !!this.service.selected());
  readonly selectedTabIndex = signal(0);
  readonly selectedSalaryTabIndex = signal(0);

  readonly form = this.fb.group({
    employeeNo:      ['', Validators.required],
    firstName:       ['', Validators.required],
    lastName:        ['', Validators.required],
    dateOfBirth:     [null as Date | null],
    nic:             [''],
    payrollName:     [''],
    email:           ['', [Validators.required, Validators.email]],
    phone:           [''],
    joinedDate:      [null as Date | null, Validators.required],
    isActive:        [true],
    notes:           [''],
    remarks:         [''],
    employeeTypeId:  [null as number | null, Validators.required],
    noPayDaysId:     [null as number | null],
    epfNo:           [''],
    etfNo:           [''],
    adrsLine1:       ['', Validators.required],
    adrsLine2:       [''],
    city:            [''],
    district:        [''],
    country:         [null as number | null],
    contactPerson:   [''],
    cpAddress:       [''],
    cpContactNumber: ['', [Validators.pattern(/^\+?[0-9\s\-]{7,15}$/)]],
    cpEmail:         ['', [Validators.email]],
    jobCategoryId:   [null as number | null],
    designationId:   [null as number | null],
    branchId:        [null as number | null],
    gradeId:         [null as number | null],
    basicSalary:     [0, [Validators.required, Validators.min(0)]],
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

  onGradeSelected(grade: Grade): void {
    this.form.get('gradeId')?.setValue(grade.id);
    if (grade.amount != null) {
      this.form.get('basicSalary')?.setValue(grade.amount);
    }
  }

  constructor() {
    this.masterSvc.loadAll();

    const emp = this.service.selected();
    if (emp) {
      this.form.patchValue({
        employeeNo:      emp.employeeNo,
        firstName:       emp.firstName,
        lastName:        emp.lastName,
        dateOfBirth:     parseDate(emp.dateOfBirth),
        nic:             emp.nic,
        payrollName:     emp.payrollName,
        email:           emp.email,
        phone:           emp.phone,
        joinedDate:      parseDate(emp.joinedDate),
        isActive:        emp.isActive,
        notes:           emp.notes,
        remarks:         emp.remarks,
        epfNo:           emp.epfNo,
        etfNo:           emp.etfNo,
        employeeTypeId:  emp.employeeTypeId,
        noPayDaysId:     emp.noPayDaysId,
        jobCategoryId:   emp.jobCategoryId,
        designationId:   emp.designationId,
        branchId:        emp.branchId,
        gradeId:         emp.gradeId,
        adrsLine1:       emp.adrsLine1,
        adrsLine2:       emp.adrsLine2,
        city:            emp.city,
        district:        emp.district,
        country:         emp.countryId,
        contactPerson:   emp.contactPerson,
        cpAddress:       emp.cpAddress,
        cpContactNumber: emp.cpContactNumber,
        cpEmail:         emp.cpEmail,
        basicSalary:     emp.basicSalary,
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
      ['firstName', 'lastName', 'email', 'adrsLine1'],
      ['employeeNo', 'joinedDate', 'jobCategoryId', 'designationId', 'branchId', 'employeeTypeId'],
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
    const v = this.form.getRawValue();
    const existing = this.service.selected();

    const payload: EmployeePayload = {
      employeeNo:      v.employeeNo!,
      firstName:       v.firstName!,
      lastName:        v.lastName!,
      dateOfBirth:     formatDate(v.dateOfBirth),
      nic:             v.nic ?? '',
      payrollName:     v.payrollName ?? '',
      email:           v.email!,
      phone:           v.phone ?? '',
      joinedDate:      formatDate(v.joinedDate),
      isActive:        v.isActive ?? true,
      notes:           v.notes ?? '',
      remarks:         v.remarks ?? '',
      epfNo:           v.epfNo ?? '',
      etfNo:           v.etfNo ?? '',
      employeeTypeId:  v.employeeTypeId,
      noPayDaysId:     v.noPayDaysId,
      jobCategoryId:   v.jobCategoryId,
      designationId:   v.designationId,
      branchId:        v.branchId,
      gradeId:         v.gradeId,
      adrsLine1:       v.adrsLine1 ?? '',
      adrsLine2:       v.adrsLine2 ?? '',
      city:            v.city ?? '',
      district:        v.district ?? '',
      countryId:       v.country ?? null,
      contactPerson:   v.contactPerson ?? '',
      cpAddress:       v.cpAddress ?? '',
      cpContactNumber: v.cpContactNumber ?? '',
      cpEmail:         v.cpEmail ?? '',
      basicSalary:     v.basicSalary ?? 0,
    };

    if (existing) {
      this.service.update(existing.id, payload).subscribe({
        next: () => {
          const updated: EmployeeModel = {
            ...payload,
            id:           existing.id,
            createdBy:    existing.createdBy,
            createdDate:  existing.createdDate,
            modifiedBy:   existing.modifiedBy,
            modifiedDate: existing.modifiedDate,
          };
          this.service.select(updated);
          this.salaryService.save({
            employeeId:      existing.id,
            basicSalary:     payload.basicSalary,
            fixedAllowances: this._fixedAllowances().map(a => ({ name: a.name, amount: a.amount })),
            fixedDeductions: this._fixedDeductions().map(d => ({ name: d.name, amount: d.amount })),
          });
          this.service.reload();
          this.router.navigate(['/employee/info']);
        },
      });
    } else {
      this.service.create(payload).subscribe({
        next: (created) => {
          this.service.select(created);
          this.salaryService.save({
            employeeId:      created.id,
            basicSalary:     payload.basicSalary,
            fixedAllowances: this._fixedAllowances().map(a => ({ name: a.name, amount: a.amount })),
            fixedDeductions: this._fixedDeductions().map(d => ({ name: d.name, amount: d.amount })),
          });
          this.service.reload();
          this.router.navigate(['/employee/info']);
        },
      });
    }
  }

  discard(): void {
    this.router.navigate(this.service.selected() ? ['/employee/info'] : ['/employee']);
  }
}
