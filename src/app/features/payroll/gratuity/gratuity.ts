import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { Observable } from 'rxjs';

import { MatButtonModule }          from '@angular/material/button';
import { MatDividerModule }         from '@angular/material/divider';
import { MatFormFieldModule }       from '@angular/material/form-field';
import { MatIconModule }            from '@angular/material/icon';
import { MatInputModule }           from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule }         from '@angular/material/tooltip';

import { API_BASE_URL }      from '../../../api-url.token';
import { TableAutocomplete, type TableColumn } from '../../../shared/components/table-autocomplete/table-autocomplete';
import { GratuityService }         from './gratuity.service';
import { GratuityRequest, GratuityResponse, GratuityStatus } from './gratuity.model';
import { GratuityConfigService }   from '../../settings/gratuity-config/gratuity-config.service';
import { GratuityConfigModel }     from '../../settings/gratuity-config/gratuity-config.model';

interface EmployeeOption {
  id: number; employeeNo: string;
  firstName: string; lastName: string; payrollName: string;
  basicSalary: number; joinedDate: string;
}

type PanelMode = 'empty' | 'view' | 'create' | 'edit';

const MODIFIED_BY = 1;

@Component({
  selector: 'app-gratuity',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    MatButtonModule, MatDividerModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatProgressSpinnerModule, MatTooltipModule,
    TableAutocomplete,
  ],
  templateUrl: './gratuity.html',
  styleUrl:    './gratuity.scss',
})
export class GratuityComponent implements OnInit {

  private readonly svc           = inject(GratuityService);
  private readonly configSvc     = inject(GratuityConfigService);
  private readonly http          = inject(HttpClient);
  private readonly destroyRef    = inject(DestroyRef);
  readonly apiBase               = inject(API_BASE_URL);

  // ── State ──────────────────────────────────────────────────────────────────
  readonly records    = signal<GratuityResponse[]>([]);
  readonly selected   = signal<GratuityResponse | null>(null);
  readonly panelMode  = signal<PanelMode>('empty');
  readonly loading    = signal(false);
  readonly saving     = signal(false);
  readonly acting     = signal(false);
  readonly calculating = signal(false);

  /** Active gratuity config loaded on init */
  readonly activeConfig = signal<GratuityConfigModel | null>(null);

  // ── Filter ─────────────────────────────────────────────────────────────────
  readonly filterStatus = signal<GratuityStatus | ''>('');

  readonly filtered = computed(() => {
    const s = this.filterStatus();
    return s ? this.records().filter(r => r.status === s) : this.records();
  });

  // ── Form state ─────────────────────────────────────────────────────────────
  readonly formCode            = signal('');
  readonly formEmpId           = signal(0);
  readonly formEmpName         = signal('');
  readonly formJoinedDate      = signal('');
  readonly formTerminationDate = signal('');
  readonly formYears           = signal<number>(0);
  readonly formBasicSalary     = signal<number>(0);
  readonly formGratuityAmount  = signal<number>(0);
  readonly formRemarks         = signal('');

  readonly isFormMode = computed(() => this.panelMode() === 'create' || this.panelMode() === 'edit');
  readonly canEdit    = computed(() => !['PAID','CANCELLED'].includes(this.selected()?.status ?? ''));
  readonly canApprove = computed(() => this.selected()?.status === 'DRAFT');
  readonly canPay     = computed(() => this.selected()?.status === 'APPROVED');
  readonly canCancel  = computed(() => ['DRAFT','APPROVED'].includes(this.selected()?.status ?? ''));

  readonly empCols: TableColumn<EmployeeOption>[] = [
    { key: 'employeeNo', label: 'Emp #'      },
    { key: 'firstName',  label: 'First Name' },
    { key: 'lastName',   label: 'Last Name'  },
  ];
  readonly empDisplayFn = (e: EmployeeOption) =>
    e ? `${e.payrollName} — ${e.employeeNo}` : '';

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.load();
    // Load active gratuity config once
    this.configSvc.getActive()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(cfg => this.activeConfig.set(cfg));
  }

  load(): void {
    this.loading.set(true);
    this.svc.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => { this.records.set(data); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  // ── Panel navigation ───────────────────────────────────────────────────────
  select(r: GratuityResponse): void {
    this.selected.set(r);
    this.panelMode.set('view');
  }

  openCreate(): void {
    this.resetForm();
    this.svc.nextCode().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(c => this.formCode.set(c));
    this.selected.set(null);
    this.panelMode.set('create');
  }

  openEdit(): void {
    const r = this.selected();
    if (!r) return;
    this.formCode.set(r.code);
    this.formEmpId.set(r.empId);
    this.formEmpName.set(r.empName);
    this.formJoinedDate.set(r.joinedDate);
    this.formTerminationDate.set(r.terminationDate);
    this.formYears.set(r.yearsOfService);
    this.formBasicSalary.set(r.basicSalary);
    this.formGratuityAmount.set(r.gratuityAmount);
    this.formRemarks.set(r.remarks ?? '');
    this.panelMode.set('edit');
  }

  cancelForm(): void {
    this.panelMode.set(this.selected() ? 'view' : 'empty');
  }

  // ── Employee selected — fetch most recent basic salary from emp-profile ────
  onEmpSelected(emp: unknown): void {
    const e = emp as EmployeeOption;
    if (!e?.id) return;
    this.formEmpId.set(e.id);
    this.formEmpName.set(e.payrollName);
    this.formJoinedDate.set(e.joinedDate ?? '');

    // Fetch most recent basic salary from profile endpoint
    this.http.get<{ data: { employee: { basicSalary: number } } }>(
      `${this.apiBase}/emp-profile/${e.id}`
    ).pipe(
      map(r => r.data?.employee?.basicSalary ?? e.basicSalary ?? 0),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(basic => {
      this.formBasicSalary.set(basic);
      this.recalcYears();
      this.recalcGratuity();
    });
  }

  onTerminationDateChange(v: string): void {
    this.formTerminationDate.set(v);
    this.recalcYears();
    this.recalcGratuity();
  }

  onBasicSalaryChange(v: string): void {
    this.formBasicSalary.set(Number(v) || 0);
    this.recalcGratuity();
  }

  onYearsChange(v: string): void {
    this.formYears.set(Number(v) || 0);
    this.recalcGratuity();
  }

  // ── Calculation ────────────────────────────────────────────────────────────
  private recalcYears(): void {
    const joined = this.formJoinedDate();
    const term   = this.formTerminationDate();
    if (!joined || !term) return;
    const diff = (new Date(term).getTime() - new Date(joined).getTime()) /
                 (365.25 * 24 * 3600 * 1000);
    this.formYears.set(Math.max(0, Math.floor(diff * 100) / 100));
  }

  private recalcGratuity(): void {
    const cfg = this.activeConfig();
    const basic = this.formBasicSalary();
    const years = this.formYears();

    if (cfg?.id && cfg.formulaEnabled && cfg.formula) {
      // Use server-side formula evaluation
      this.calculating.set(true);
      this.configSvc.calculate(cfg.id, basic, years)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: res => {
            this.formGratuityAmount.set(res.result ?? 0);
            this.calculating.set(false);
          },
          error: () => {
            // Fallback to default formula on error
            this.formGratuityAmount.set(Math.round((basic / 2) * years * 100) / 100);
            this.calculating.set(false);
          },
        });
    } else {
      // Default formula: basicSalary / 2 * yearsOfService
      this.formGratuityAmount.set(Math.round((basic / 2) * years * 100) / 100);
    }
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  save(): void {
    if (!this.formEmpId())           { alert('Select an employee.');         return; }
    if (!this.formTerminationDate()) { alert('Termination date is required.'); return; }
    if (!this.formJoinedDate())      { alert('Joined date is required.');      return; }

    this.saving.set(true);
    const req: GratuityRequest = {
      empId:           this.formEmpId(),
      terminationDate: this.formTerminationDate(),
      joinedDate:      this.formJoinedDate(),
      yearsOfService:  this.formYears(),
      basicSalary:     this.formBasicSalary(),
      gratuityAmount:  this.formGratuityAmount(),
      remarks:         this.formRemarks(),
      createdBy:       MODIFIED_BY,
      modifiedBy:      MODIFIED_BY,
    };

    const op$ = this.panelMode() === 'edit'
      ? this.svc.update(this.selected()!.id, req)
      : this.svc.create(req);

    op$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: saved => {
        this.load(); this.selected.set(saved);
        this.panelMode.set('view'); this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  // ── Workflow actions ───────────────────────────────────────────────────────
  approve():   void { this.runAction(this.svc.approve(this.selected()!.id)); }
  markPaid():  void { this.runAction(this.svc.markPaid(this.selected()!.id)); }
  cancel():    void { this.runAction(this.svc.cancel(this.selected()!.id)); }

  deleteRecord(): void {
    if (!confirm('Delete this gratuity record?')) return;
    this.acting.set(true);
    this.svc.delete(this.selected()!.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.load(); this.selected.set(null);
        this.panelMode.set('empty'); this.acting.set(false);
      },
      error: () => this.acting.set(false),
    });
  }

  private runAction(obs: Observable<GratuityResponse>): void {
    this.acting.set(true);
    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: u => { this.load(); this.selected.set(u); this.panelMode.set('view'); this.acting.set(false); },
      error: () => this.acting.set(false),
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  statusClass(s: GratuityStatus): string {
    return { DRAFT:'chip-draft', APPROVED:'chip-approved', PAID:'chip-paid', CANCELLED:'chip-cancelled' }[s] ?? '';
  }

  formulaHint(): string {
    const cfg = this.activeConfig();
    if (cfg?.formulaEnabled && cfg.formula) return cfg.formula;
    return 'basicSalary / 2 × yearsOfService  (default)';
  }

  private resetForm(): void {
    this.formCode.set('');
    this.formEmpId.set(0);
    this.formEmpName.set('');
    this.formJoinedDate.set('');
    this.formTerminationDate.set('');
    this.formYears.set(0);
    this.formBasicSalary.set(0);
    this.formGratuityAmount.set(0);
    this.formRemarks.set('');
  }
}
