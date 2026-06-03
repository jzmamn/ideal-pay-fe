import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Bank,
  BankBranch,
  Branch,
  Company,
  Country,
  Department,
  Designation,
  District,
  EmployeeStatus,
  EmployeeType,
  Grade,
  JobCategory,
  MasterEntity,
  NoPayDays,
} from '../models/master-data.models';
import { BranchService } from '../../features/infrastructure/branches/branch.service';
import { BankService } from '../../features/infrastructure/banks/bank.service';
import { BankBranchService } from '../../features/infrastructure/banks/bank-branch.service';
import { CompanyService } from '../../features/infrastructure/company/company.service';
import { DepartmentService } from '../../features/infrastructure/department/department.service';
import { GradeService } from '../../features/infrastructure/grades/grade.service';
import { DesignationService } from '../../features/infrastructure/designations/designation.service';
import { EmployeeTypeService } from '../../features/infrastructure/type/type.service';
import { JobCategoryService } from '../../features/infrastructure/job-categories/job-category.service';
import { NopayDaysService } from '../../features/settings/nopay/nopay-days.service';
import { CountryService } from '../../features/infrastructure/country/country.service';
import { DistrictService } from '../../features/infrastructure/district/district.service';
import { StatusService } from '../../features/infrastructure/status/status.service';

export type EntitySlug =
  | 'companies'
  | 'countries'
  | 'departments'
  | 'districts'
  | 'job-categories'
  | 'branches'
  | 'grades'
  | 'designations'
  | 'nopay'
  | 'employee-types'
  | 'statuses'
  | 'banks'
  | 'bank-branches';

@Injectable({ providedIn: 'root' })
export class MasterDataService {
  private readonly http            = inject(HttpClient);
  private readonly companySvc      = inject(CompanyService);
  private readonly departmentSvc   = inject(DepartmentService);
  private readonly branchSvc       = inject(BranchService);
  private readonly bankSvc         = inject(BankService);
  private readonly bankBranchSvc   = inject(BankBranchService);
  private readonly gradeSvc        = inject(GradeService);
  private readonly designationSvc  = inject(DesignationService);
  private readonly employeeTypeSvc = inject(EmployeeTypeService);
  private readonly jobCategorySvc  = inject(JobCategoryService);
  private readonly nopaySvc        = inject(NopayDaysService);
  private readonly countrySvc      = inject(CountryService);
  private readonly districtSvc     = inject(DistrictService);
  private readonly statusSvc       = inject(StatusService);

  private readonly _banks         = signal<Bank[]>([]);
  private readonly _bankBranches  = signal<BankBranch[]>([]);
  private readonly _countries     = signal<Country[]>([]);
  private readonly _companies     = signal<Company[]>([]);
  private readonly _departments   = signal<Department[]>([]);
  private readonly _jobCategories = signal<JobCategory[]>([]);
  private readonly _branches      = signal<Branch[]>([]);
  private readonly _grades        = signal<Grade[]>([]);
  private readonly _designations  = signal<Designation[]>([]);
  private readonly _districts     = signal<District[]>([]);
  private readonly _nopayDays     = signal<NoPayDays[]>([]);
  private readonly _employeeTypes = signal<EmployeeType[]>([]);
  private readonly _statuses      = signal<EmployeeStatus[]>([]);

  readonly banks         = this._banks.asReadonly();
  readonly bankBranches  = this._bankBranches.asReadonly();
  readonly countries     = this._countries.asReadonly();
  readonly companies     = this._companies.asReadonly();
  readonly departments   = this._departments.asReadonly();
  readonly jobCategories = this._jobCategories.asReadonly();
  readonly branches      = this._branches.asReadonly();
  readonly grades        = this._grades.asReadonly();
  readonly designations  = this._designations.asReadonly();
  readonly districts     = this._districts.asReadonly();
  readonly nopayDays     = this._nopayDays.asReadonly();
  readonly employeeTypes = this._employeeTypes.asReadonly();
  readonly statuses      = this._statuses.asReadonly();

  readonly activeBanks         = computed(() => this._banks().filter(x => x.isActive));
  readonly activeBankBranches  = computed(() => this._bankBranches().filter(x => x.isActive));
  readonly activeCountries     = computed(() => this._countries().filter(x => x.isActive));
  readonly activeCompanies     = computed(() => this._companies().filter(x => x.isActive));
  readonly activeDepartments   = computed(() => this._departments().filter(x => x.isActive));
  readonly activeJobCategories = computed(() => this._jobCategories().filter(x => x.isActive));
  readonly activeBranches      = computed(() => this._branches().filter(x => x.isActive));
  readonly activeGrades        = computed(() => this._grades().filter(x => x.isActive));
  readonly activeDesignations  = computed(() => this._designations().filter(x => x.isActive));
  readonly activeDistricts     = computed(() => this._districts().filter(x => x.isActive));
  readonly activeNopayDays     = computed(() => this._nopayDays().filter(x => x.isActive));
  readonly activeEmployeeTypes = computed(() => this._employeeTypes().filter(x => x.isActive));
  readonly activeStatuses      = this._statuses.asReadonly();

  private readonly reloadFns: Record<EntitySlug, () => void> = {
    'banks':          () => this.bankSvc.getAll().subscribe({ next: d => this._banks.set(d), error: () => {} }),
    'bank-branches':  () => this.bankBranchSvc.getAll().subscribe({ next: d => this._bankBranches.set(d), error: () => {} }),
    'countries':      () => this.countrySvc.getAll().subscribe({ next: d => this._countries.set(d), error: () => {} }),
    'companies':      () => this.companySvc.getAll().subscribe({ next: d => this._companies.set(d), error: () => {} }),
    'departments':    () => this.departmentSvc.getAll().subscribe({ next: d => this._departments.set(d), error: () => {} }),
    'job-categories': () => this.jobCategorySvc.getAll().subscribe({ next: d => this._jobCategories.set(d), error: () => {} }),
    'branches':       () => this.branchSvc.getAll().subscribe({ next: d => this._branches.set(d), error: () => {} }),
    'grades':         () => this.gradeSvc.getAll().subscribe({ next: d => this._grades.set(d), error: () => {} }),
    'designations':   () => this.designationSvc.getAll().subscribe({ next: d => this._designations.set(d), error: () => {} }),
    'districts':      () => this.districtSvc.getAll().subscribe({ next: d => this._districts.set(d), error: () => {} }),
    'nopay':     () => this.nopaySvc.getAll().subscribe({ next: d => this._nopayDays.set(d), error: () => {} }),
    'employee-types': () => this.employeeTypeSvc.getAll().subscribe({ next: d => this._employeeTypes.set(d), error: () => {} }),
    'statuses':       () => this.statusSvc.getActive().subscribe({ next: d => this._statuses.set(d), error: () => {} }),
  };

  loadAll(): void {
    Object.values(this.reloadFns).forEach(fn => fn());
  }

  reload(entity: EntitySlug): void {
    this.reloadFns[entity]();
  }

  createMaster<T extends MasterEntity>(entity: string, dto: Partial<T>): Observable<T> {
    switch (entity as EntitySlug) {
      case 'countries':      return this.countrySvc.create(dto as Omit<Country, 'id'>) as Observable<T>;
      case 'companies':      return this.companySvc.create(dto as unknown as Omit<Company, 'id'>) as unknown as Observable<T>;
      case 'departments':    return this.departmentSvc.create(dto as Omit<Department, 'id'>) as Observable<T>;
      case 'branches':       return this.branchSvc.create(dto as Omit<Branch, 'id'>) as Observable<T>;
      case 'grades':         return this.gradeSvc.create(dto as Omit<Grade, 'id'>) as Observable<T>;
      case 'designations':   return this.designationSvc.create(dto as Omit<Designation, 'id'>) as Observable<T>;
      case 'districts':      return this.districtSvc.create(dto as Omit<District, 'id'>) as Observable<T>;
      case 'employee-types': return this.employeeTypeSvc.create(dto as unknown as Omit<EmployeeType, 'id'>) as unknown as Observable<T>;
      case 'job-categories': return this.jobCategorySvc.create(dto as Omit<JobCategory, 'id'>) as Observable<T>;
      case 'nopay':     return this.nopaySvc.create(dto as unknown as Omit<NoPayDays, 'id'>) as unknown as Observable<T>;
      default:               return this.http.post<T>(`/api/master/${entity}`, dto);
    }
  }

  updateMaster<T extends MasterEntity>(entity: string, id: number, dto: Partial<T>): Observable<T> {
    switch (entity as EntitySlug) {
      case 'countries':      return this.countrySvc.update(id, dto as Country).pipe(map(() => dto as T));
      case 'companies':      return this.companySvc.update(id, dto as unknown as Company).pipe(map(() => dto as T));
      case 'departments':    return this.departmentSvc.update(id, dto as Department).pipe(map(() => dto as T));
      case 'branches':       return this.branchSvc.update(id, dto as Branch).pipe(map(() => dto as T));
      case 'grades':         return this.gradeSvc.update(id, dto as Grade).pipe(map(() => dto as T));
      case 'designations':   return this.designationSvc.update(id, dto as Designation).pipe(map(() => dto as T));
      case 'districts':      return this.districtSvc.update(id, dto as District).pipe(map(() => dto as T));
      case 'employee-types': return this.employeeTypeSvc.update(id, dto as unknown as EmployeeType).pipe(map(() => dto as T));
      case 'job-categories': return this.jobCategorySvc.update(id, dto as JobCategory).pipe(map(() => dto as T));
      case 'nopay':     return this.nopaySvc.update(id, dto as unknown as NoPayDays).pipe(map(() => dto as T));
      default:               return this.http.put<T>(`/api/master/${entity}/${id}`, dto);
    }
  }

  deleteMaster(entity: string, id: number): Observable<void> {
    switch (entity as EntitySlug) {
      case 'countries':      return this.countrySvc.delete(id);
      case 'companies':      return this.companySvc.delete(id);
      case 'departments':    return this.departmentSvc.delete(id);
      case 'branches':       return this.branchSvc.delete(id);
      case 'grades':         return this.gradeSvc.delete(id);
      case 'designations':   return this.designationSvc.delete(id);
      case 'districts':      return this.districtSvc.delete(id);
      case 'employee-types': return this.employeeTypeSvc.delete(id);
      case 'job-categories': return this.jobCategorySvc.delete(id);
      case 'nopay':     return this.nopaySvc.delete(id);
      default:               return this.http.delete<void>(`/api/master/${entity}/${id}`);
    }
  }
}
