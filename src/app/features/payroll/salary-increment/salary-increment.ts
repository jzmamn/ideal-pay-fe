import {
  ChangeDetectionStrategy, Component, DestroyRef,
  OnInit, computed, inject, signal,
} from '@angular/core';
import { DecimalPipe, DatePipe, NgClass } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';

import { API_BASE_URL } from '../../../api-url.token';
import { SalaryIncrementService } from './salary-increment.service';
import {
  IncrementStatus, IncrementType,
  SalaryIncrementDetailRequest,
  SalaryIncrementDetailResponse,
  SalaryIncrementFaRequest,
  SalaryIncrementFaResponse,
  SalaryIncrementRequest,
  SalaryIncrementResponse,
} from './salary-increment.model';

interface EmployeeOption { id: number; employeeNo: string; payrollName: string; basicSalary: number; }
interface FaOption       { id: number; code: string; name: string; }
interface EmpProfile     { employee: { basicSalary: number }; fixedAllowances: { faId: number; faCode: string; faName: string; amount: number }[]; }

/** Right-panel mode */
type PanelMode = 'empty' | 'view' | 'create' | 'edit';

@Component({
  selector: 'app-salary-increment',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, DatePipe, NgClass, ReactiveFormsModule, RouterLink,
    MatButtonModule, MatDividerModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatProgressSpinnerModule,
    MatSelectModule, MatTooltipModule,
  ],
  templateUrl: './salary-increment.html',
  styleUrl:    './salary-increment.scss',
})
export class SalaryIncrementComponent implements OnInit {

  private readonly svc        = inject(SalaryIncrementService);
  private readonly http       = inject(HttpClient);
  private readonly fb         = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly apiBase    = inject(API_BASE_URL);

  readonly MODIFIED_BY = 1; // TODO: replace with auth user id

  // ── State ──────────────────────────────────────────────────────────────────
  readonly increments   = signal<SalaryIncrementResponse[]>([]);
  readonly selected     = signal<SalaryIncrementResponse | null>(null);
  readonly panelMode    = signal<PanelMode>('empty');
  readonly loading      = signal(false);
  readonly saving       = signal(false);
  readonly acting       = signal(false);
  readonly loadingEmp   = signal(false);
  readonly filterType   = signal<IncrementType | ''>('');
  readonly filterStatus = signal<IncrementStatus | ''>('');

  readonly employees  = signal<EmployeeOption[]>([]);
  readonly faOptions  = signal<FaOption[]>([]);

  // Form-level employee increment rows
  readonly editDetails = signal<SalaryIncrementDetailResponse[]>([]);

  // ── Derived ────────────────────────────────────────────────────────────────
  readonly filtered = computed(() => {
    let list = this.increments();
    if (this.filterType())   list = list.filter(i => i.type   === this.filterType());
    if (this.filterStatus()) list = list.filter(i => i.status === this.filterStatus());
    return list;
  });

  readonly batchList      = computed(() => this.filtered().filter(i => i.type === 'BATCH'));
  readonly individualList = computed(() => this.filtered().filter(i => i.type === 'INDIVIDUAL'));

  readonly isFormMode = computed(() => this.panelMode() === 'create' || this.panelMode() === 'edit');
  readonly canApprove = computed(() => this.selected()?.status === 'DRAFT');
  readonly canExport  = computed(() => this.selected()?.status === 'APPROVED');
  readonly canCancel  = computed(() => ['DRAFT','APPROVED'].includes(this.selected()?.status ?? ''));
  readonly canEdit    = computed(() => ['DRAFT','APPROVED'].includes(this.selected()?.status ?? ''));
  readonly isExported = computed(() => this.selected()?.status === 'EXPORTED');

  // ── Header form ────────────────────────────────────────────────────────────
  readonly form = this.fb.group({
    code:           this.fb.nonNullable.control('', Validators.required),
    name:           this.fb.nonNullable.control('', Validators.required),
    type:           this.fb.nonNullable.control<IncrementType>('INDIVIDUAL', Validators.required),
    effectiveMonth: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/^\d{4}-\d{2}$/)]),
    remarks:        this.fb.nonNullable.control(''),
  });

  readonly formType = computed(() => this.form.controls.type.value);

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadIncrements();
    this.loadEmployees();
    this.loadFaOptions();
  }

  // ── Data load ──────────────────────────────────────────────────────────────
  loadIncrements(): void {
    this.loading.set(true);
    this.svc.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => { this.increments.set(data); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  loadEmployees(): void {
    this.http.get<{ data: EmployeeOption[] }>(`${this.apiBase}/employee`)
      .pipe(map(r => r.data ?? []), takeUntilDestroyed(this.destroyRef))
      .subscribe(data => this.employees.set(data));
  }

  loadFaOptions(): void {
    this.http.get<{ data: FaOption[] }>(`${this.apiBase}/fixed-allowance`)
      .pipe(map(r => r.data ?? []), takeUntilDestroyed(this.destroyRef))
      .subscribe(data => this.faOptions.set(data.filter(f => (f as any).id > 0)));
  }

  // ── Panel navigation ───────────────────────────────────────────────────────
  select(inc: SalaryIncrementResponse): void {
    this.selected.set(inc);
    this.panelMode.set('view');
  }

  openCreate(): void {
    this.selected.set(null);
    this.editDetails.set([]);
    this.form.reset({ type: 'INDIVIDUAL', code: '', name: '', effectiveMonth: '', remarks: '' });
    this.panelMode.set('create');
  }

  openEdit(): void {
    const inc = this.selected();
    if (!inc) return;
    this.form.patchValue({
      code: inc.code, name: inc.name, type: inc.type,
      effectiveMonth: inc.effectiveMonth, remarks: inc.remarks ?? '',
    });
    this.editDetails.set(structuredClone(inc.details ?? []));
    this.panelMode.set('edit');
  }

  cancelForm(): void {
    this.panelMode.set(this.selected() ? 'view' : 'empty');
  }

  // ── Employee add / remove ─────────────────────────────────────────────────

  /** Individual — single employee selected from dropdown */
  onIndividualEmpChange(empId: number): void {
    if (!empId) { this.editDetails.set([]); return; }
    this.loadEmpProfile(empId, 0);
  }

  /** Batch — add employee row by ID chosen from select */
  addBatchEmployee(empId: number): void {
    if (!empId) return;
    if (this.editDetails().some(d => d.empId === empId)) return; // already added
    this.loadEmpProfile(empId, this.editDetails().length);
  }

  removeEmployee(idx: number): void {
    this.editDetails.update(list => list.filter((_, i) => i !== idx));
  }

  /** Fetch emp-profile?assignedOnly=true and build a detail row */
  private loadEmpProfile(empId: number, insertIdx: number): void {
    this.loadingEmp.set(true);
    this.http.get<{ data: EmpProfile }>(`${this.apiBase}/emp-profile/${empId}?assignedOnly=true`)
      .pipe(map(r => r.data), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: profile => {
          const emp       = this.employees().find(e => e.id === empId);
          const basicSal  = profile?.employee?.basicSalary ?? emp?.basicSalary ?? 0;
          const faList    = (profile?.fixedAllowances ?? []).map(fa => ({
            id: 0, faId: fa.faId, faCode: fa.faCode, faName: fa.faName,
            currentAmount: fa.amount ?? 0, incrementAmount: 0, newAmount: fa.amount ?? 0,
          }));

          const newDetail: SalaryIncrementDetailResponse = {
            id: 0, incrementId: 0,
            empId, empCode: emp?.employeeNo ?? '', empName: emp?.payrollName ?? '',
            designationName: '', branchName: '',
            currentBasic: basicSal, incrementBasic: 0, newBasic: basicSal,
            isExported: false, exportedDate: null, remarks: '',
            faIncrements: faList,
          };

          if (this.formType() === 'INDIVIDUAL') {
            this.editDetails.set([newDetail]);
          } else {
            this.editDetails.update(list => {
              const copy = [...list];
              if (insertIdx < copy.length) copy[insertIdx] = newDetail;
              else copy.push(newDetail);
              return copy;
            });
          }
          this.loadingEmp.set(false);
        },
        error: () => this.loadingEmp.set(false),
      });
  }

  // ── Increment edits ───────────────────────────────────────────────────────

  updateBasicIncrement(idx: number, value: number): void {
    this.editDetails.update(list => {
      const copy = [...list];
      const d = { ...copy[idx] };
      d.incrementBasic = value;
      d.newBasic = (d.currentBasic ?? 0) + value;
      copy[idx] = d;
      return copy;
    });
  }

  addFaRow(idx: number): void {
    this.editDetails.update(list => {
      const copy = [...list];
      const d = { ...copy[idx], faIncrements: [...copy[idx].faIncrements] };
      d.faIncrements.push({ id: 0, faId: 0, faCode: '', faName: '', currentAmount: 0, incrementAmount: 0, newAmount: 0 });
      copy[idx] = d;
      return copy;
    });
  }

  updateFaField(detIdx: number, faIdx: number, field: keyof SalaryIncrementFaResponse, raw: string): void {
    const value = field === 'faId' ? Number(raw) : Number(raw);
    this.editDetails.update(list => {
      const copy = [...list];
      const d    = { ...copy[detIdx], faIncrements: [...copy[detIdx].faIncrements] };
      const fa   = { ...d.faIncrements[faIdx], [field]: value };
      if (field === 'faId') {
        const opt = this.faOptions().find(o => o.id === value);
        if (opt) { fa.faCode = opt.code; fa.faName = opt.name; }
      }
      if (field === 'incrementAmount' || field === 'currentAmount') {
        fa.newAmount = (Number(fa.currentAmount) || 0) + (Number(fa.incrementAmount) || 0);
      }
      d.faIncrements[faIdx] = fa;
      copy[detIdx] = d;
      return copy;
    });
  }

  removeFaRow(detIdx: number, faIdx: number): void {
    this.editDetails.update(list => {
      const copy = [...list];
      const d    = { ...copy[detIdx], faIncrements: [...copy[detIdx].faIncrements] };
      d.faIncrements.splice(faIdx, 1);
      copy[detIdx] = d;
      return copy;
    });
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (!this.editDetails().length) { alert('Add at least one employee.'); return; }

    this.saving.set(true);
    const v = this.form.getRawValue();

    const details: SalaryIncrementDetailRequest[] = this.editDetails().map(d => ({
      empId:          d.empId,
      currentBasic:   d.currentBasic,
      incrementBasic: d.incrementBasic,
      newBasic:       d.newBasic,
      remarks:        d.remarks ?? '',
      createdBy:      this.MODIFIED_BY,
      modifiedBy:     this.MODIFIED_BY,
      faIncrements:   d.faIncrements.filter(f => f.faId > 0).map(f => ({
        faId:            f.faId,
        currentAmount:   f.currentAmount,
        incrementAmount: f.incrementAmount,
        newAmount:       f.newAmount,
        createdBy:       this.MODIFIED_BY,
        modifiedBy:      this.MODIFIED_BY,
      } as SalaryIncrementFaRequest)),
    }));

    const req: SalaryIncrementRequest = {
      code: v.code, name: v.name, type: v.type,
      effectiveMonth: v.effectiveMonth, remarks: v.remarks,
      createdBy: this.MODIFIED_BY, modifiedBy: this.MODIFIED_BY,
      details,
    };

    const op$ = this.panelMode() === 'edit'
      ? this.svc.update(this.selected()!.id, req)
      : this.svc.create(req);

    op$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: saved => {
        this.loadIncrements();
        this.selected.set(saved);
        this.panelMode.set('view');
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  // ── Workflow actions ──────────────────────────────────────────────────────
  approve():       void { this.runAction(this.svc.approve(this.selected()!.id)); }
  cancel():        void { this.runAction(this.svc.cancel(this.selected()!.id)); }
  exportPayroll(): void { this.runAction(this.svc.exportToPayroll(this.selected()!.id)); }
  importPayroll(): void { this.runAction(this.svc.importFromPayroll(this.selected()!.id)); }

  deleteIncrement(): void {
    if (!confirm('Delete this increment?')) return;
    this.acting.set(true);
    this.svc.delete(this.selected()!.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.loadIncrements(); this.selected.set(null); this.panelMode.set('empty'); this.acting.set(false); },
      error: () => this.acting.set(false),
    });
  }

  private runAction(obs: ReturnType<typeof this.svc.approve>): void {
    this.acting.set(true);
    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: updated => {
        this.loadIncrements(); this.selected.set(updated);
        this.panelMode.set('view'); this.acting.set(false);
      },
      error: () => this.acting.set(false),
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  statusClass(s: IncrementStatus): string {
    return { DRAFT:'chip-draft', APPROVED:'chip-approved', EXPORTED:'chip-exported', CANCELLED:'chip-cancelled' }[s] ?? '';
  }

  availableEmps = computed(() => {
    const used = new Set(this.editDetails().map(d => d.empId));
    return this.employees().filter(e => !used.has(e.id));
  });

  selectedBatchEmpId = signal<number>(0);

  trackIdx = (i: number) => i;
}
