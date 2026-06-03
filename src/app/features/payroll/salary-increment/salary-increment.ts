import {
  ChangeDetectionStrategy, Component, DestroyRef,
  ElementRef, OnInit, ViewChild, computed, inject, signal,
} from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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
import { TableAutocomplete, type TableColumn } from '../../../shared/components/table-autocomplete/table-autocomplete';
import { SalaryIncrementService } from './salary-increment.service';
import {
  IncrementStatus,
  SalaryIncrementDetailRequest,
  SalaryIncrementDetailResponse,
  SalaryIncrementFaRequest,
  SalaryIncrementFaResponse,
  SalaryIncrementRequest,
  SalaryIncrementResponse,
} from './salary-increment.model';

// ── Shared types ──────────────────────────────────────────────────────────────
interface EmployeeOption {
  id: number; employeeNo: string;
  firstName: string; lastName: string; payrollName: string; basicSalary: number;
}
interface FaOption   { id: number; code: string; name: string; }
interface EmpProfile {
  employee: { basicSalary: number };
  fixedAllowances: { faId: number; faCode: string; faName: string; amount: number }[];
}
type PanelMode = 'empty' | 'view' | 'create' | 'edit';

const MONTHS = [
  { value:  1, label: 'January'   }, { value:  2, label: 'February'  },
  { value:  3, label: 'March'     }, { value:  4, label: 'April'     },
  { value:  5, label: 'May'       }, { value:  6, label: 'June'      },
  { value:  7, label: 'July'      }, { value:  8, label: 'August'    },
  { value:  9, label: 'September' }, { value: 10, label: 'October'   },
  { value: 11, label: 'November'  }, { value: 12, label: 'December'  },
];
const NOW   = new Date();
const YEARS = [NOW.getFullYear() - 1, NOW.getFullYear(), NOW.getFullYear() + 1];

@Component({
  selector: 'app-salary-increment',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, NgClass, ReactiveFormsModule, RouterLink,
    MatButtonModule, MatDividerModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatProgressSpinnerModule,
    MatSelectModule, MatTooltipModule,
    TableAutocomplete,
  ],
  templateUrl: './salary-increment.html',
  styleUrl:    './salary-increment.scss',
})
export class SalaryIncrementComponent implements OnInit {

  @ViewChild('csvFileInput') csvFileInput!: ElementRef<HTMLInputElement>;

  private readonly svc        = inject(SalaryIncrementService);
  private readonly http       = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly apiBase    = inject(API_BASE_URL);

  readonly MODIFIED_BY = 1;
  readonly MONTHS      = MONTHS;
  readonly YEARS       = YEARS;

  // ── State ──────────────────────────────────────────────────────────────────
  readonly increments   = signal<SalaryIncrementResponse[]>([]);
  readonly selected     = signal<SalaryIncrementResponse | null>(null);
  readonly panelMode    = signal<PanelMode>('empty');
  readonly loading      = signal(false);
  readonly saving       = signal(false);
  readonly acting       = signal(false);
  readonly loadingEmp   = signal(false);
  readonly importError  = signal('');
  readonly generatedCode = signal('');

  // ── Form state ────────────────────────────────────────────────────────────
  readonly formName          = signal('');
  readonly formRemarks       = signal('');
  readonly formMonth         = signal<number>(NOW.getMonth() + 1);
  readonly formYear          = signal<number>(NOW.getFullYear());
  readonly formEffectiveMonth = computed(() =>
    `${this.formYear()}-${String(this.formMonth()).padStart(2, '0')}`);

  readonly editDetails = signal<SalaryIncrementDetailResponse[]>([]);
  readonly addEmpCtrl  = new FormControl<EmployeeOption | null>(null);

  // ── List-level filters ────────────────────────────────────────────────────
  readonly filterStatus   = signal<IncrementStatus | ''>('');
  readonly filterEmpCtrl  = new FormControl<EmployeeOption | null>(null);
  readonly filterEmpId    = signal<number>(0);
  readonly filterIncrType = signal<'ALL' | 'BASIC' | 'FA' | 'BOTH'>('ALL');

  // ── Detail-level filters (inside a selected increment) ────────────────────
  readonly detailEmpSearch  = signal('');
  readonly detailTypeFilter = signal<string>('ALL');

  // ── Reference data ────────────────────────────────────────────────────────
  readonly faOptions = signal<FaOption[]>([]);

  readonly employeeCols: TableColumn<EmployeeOption>[] = [
    { key: 'employeeNo', label: 'Emp #'      },
    { key: 'firstName',  label: 'First Name' },
    { key: 'lastName',   label: 'Last Name'  },
  ];
  readonly empDisplayFn = (e: EmployeeOption) =>
    e ? `${e.payrollName} — ${e.employeeNo}` : '';

  // ── Derived ────────────────────────────────────────────────────────────────
  readonly filtered = computed(() => {
    let list = this.increments();

    // Status filter
    if (this.filterStatus())
      list = list.filter(i => i.status === this.filterStatus());

    // Employee filter
    const fEmpId = this.filterEmpId();
    if (fEmpId)
      list = list.filter(i => i.details?.some(d => d.empId === fEmpId));

    // Increment type filter
    const ft = this.filterIncrType();
    if (ft !== 'ALL') {
      list = list.filter(i => {
        const hasBasic = i.details?.some(d => (d.incrementBasic ?? 0) > 0);
        const hasFa    = i.details?.some(d => d.faIncrements?.some(f => (f.incrementAmount ?? 0) > 0));
        if (ft === 'BASIC') return hasBasic;
        if (ft === 'FA')    return hasFa;
        if (ft === 'BOTH')  return hasBasic && hasFa;
        return true;
      });
    }
    return list;
  });

  readonly isFormMode  = computed(() => this.panelMode() === 'create' || this.panelMode() === 'edit');

  // ── Filtered rows inside the detail view ──────────────────────────────────
  private filterByEmp<T extends { empName?: string; empCode?: string }>(list: T[], q: string): T[] {
    const lq = q.trim().toLowerCase();
    return lq ? list.filter(d =>
      d.empName?.toLowerCase().includes(lq) || d.empCode?.toLowerCase().includes(lq)) : list;
  }

  /** Filtered rows shown in VIEW mode */
  readonly filteredViewDetails = computed(() =>
    this.filterByEmp(this.selected()?.details ?? [], this.detailEmpSearch()));

  /** Filtered rows shown in FORM/EDIT mode */
  readonly filteredEditDetails = computed(() =>
    this.filterByEmp(this.editDetails(), this.detailEmpSearch()));
  readonly canEdit     = computed(() => !['POSTED','CANCELLED'].includes(this.selected()?.status ?? ''));
  readonly canApprove  = computed(() => this.selected()?.status === 'DRAFT');
  readonly canExport   = computed(() => this.selected()?.status === 'APPROVED');
  readonly canPost     = computed(() => this.selected()?.status === 'EXPORTED');
  readonly canCancel   = computed(() => ['DRAFT','APPROVED','EXPORTED'].includes(this.selected()?.status ?? ''));
  readonly isPosted    = computed(() => this.selected()?.status === 'POSTED');

  readonly availableEmps = computed(() => {
    const used = new Set(this.editDetails().map(d => d.empId));
    // filtered in TableAutocomplete via src; we just need to block duplicates on add
    return used;
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadIncrements();
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

  loadFaOptions(): void {
    this.http.get<{ data: FaOption[] }>(`${this.apiBase}/fixed-allowance`)
      .pipe(map(r => (r.data ?? []).filter((f: any) => f.id > 0)), takeUntilDestroyed(this.destroyRef))
      .subscribe(d => this.faOptions.set(d));
  }

  // ── Panel navigation ───────────────────────────────────────────────────────
  select(inc: SalaryIncrementResponse): void {
    this.selected.set(inc);
    this.panelMode.set('view');
    this.detailEmpSearch.set('');
    this.detailTypeFilter.set('ALL');
  }

  openCreate(): void {
    this.selected.set(null);
    this.editDetails.set([]);
    this.formName.set('');
    this.formRemarks.set('');
    this.formMonth.set(NOW.getMonth() + 1);
    this.formYear.set(NOW.getFullYear());
    this.generatedCode.set('');
    this.importError.set('');
    this.addEmpCtrl.reset();
    this.fetchNextCode();
    this.panelMode.set('create');
  }

  openEdit(): void {
    const inc = this.selected();
    if (!inc) return;
    this.formName.set(inc.name);
    this.formRemarks.set(inc.remarks ?? '');
    const [yr, mo] = inc.effectiveMonth.split('-');
    this.formMonth.set(Number(mo));
    this.formYear.set(Number(yr));
    this.generatedCode.set(inc.code);
    this.importError.set('');
    this.editDetails.set(structuredClone(inc.details ?? []));
    this.addEmpCtrl.reset();
    this.detailEmpSearch.set('');
    this.detailTypeFilter.set('ALL');
    this.panelMode.set('edit');
  }

  cancelForm(): void {
    this.panelMode.set(this.selected() ? 'view' : 'empty');
  }

  // ── Code generation ───────────────────────────────────────────────────────
  fetchNextCode(): void {
    this.svc.nextCode(this.formEffectiveMonth())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(code => this.generatedCode.set(code));
  }

  onMonthChange(v: number): void {
    this.formMonth.set(v);
    if (this.panelMode() === 'create') this.fetchNextCode();
  }

  onYearChange(v: number): void {
    this.formYear.set(v);
    if (this.panelMode() === 'create') this.fetchNextCode();
  }

  // ── Employee add / remove ─────────────────────────────────────────────────
  onEmpSelected(emp: unknown): void {
    const e = emp as EmployeeOption;
    if (!e?.id) return;
    if (this.availableEmps().has(e.id)) { this.addEmpCtrl.reset(); return; }
    this.addEmpCtrl.reset();
    this.fetchAndAppendProfile(e.id);
  }

  removeEmployee(empId: number): void {
    this.editDetails.update(list => list.filter(d => d.empId !== empId));
  }

  private fetchAndAppendProfile(empId: number): void {
    this.loadingEmp.set(true);
    this.http.get<{ data: EmpProfile }>(`${this.apiBase}/emp-profile/${empId}?assignedOnly=true`)
      .pipe(map(r => r.data), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: profile => {
          const basic  = profile?.employee?.basicSalary ?? 0;
          const faList = (profile?.fixedAllowances ?? []).map(fa => ({
            id: 0, faId: fa.faId, faCode: fa.faCode, faName: fa.faName,
            currentAmount: fa.amount ?? 0, incrementAmount: 0, newAmount: fa.amount ?? 0,
          }));
          this.editDetails.update(list => [...list, {
            id: 0, incrementId: 0, empId,
            empCode: '', empName: '',   // will be filled by backend on save
            designationName: '', branchName: '',
            currentBasic: basic, incrementBasic: 0, newBasic: basic,
            isExported: false, exportedDate: null, remarks: '',
            faIncrements: faList,
          }]);
          this.loadingEmp.set(false);
        },
        error: () => this.loadingEmp.set(false),
      });
  }

  // ── Increment edits (keyed by empId so filtered index ≠ full-list index) ──
  updateBasicIncrement(empId: number, value: number): void {
    this.editDetails.update(list => list.map(d =>
      d.empId === empId
        ? { ...d, incrementBasic: value, newBasic: (d.currentBasic ?? 0) + value }
        : d));
  }

  addFaRow(empId: number): void {
    this.editDetails.update(list => list.map(d =>
      d.empId === empId
        ? { ...d, faIncrements: [...d.faIncrements,
            { id:0, faId:0, faCode:'', faName:'', currentAmount:0, incrementAmount:0, newAmount:0 }] }
        : d));
  }

  updateFaField(empId: number, fi: number, field: keyof SalaryIncrementFaResponse, rawVal: string): void {
    const num = Number(rawVal);
    this.editDetails.update(list => list.map(d => {
      if (d.empId !== empId) return d;
      const faList = [...d.faIncrements];
      const fa = { ...faList[fi], [field]: num };
      if (field === 'faId') {
        const opt = this.faOptions().find(o => o.id === num);
        if (opt) { fa.faCode = opt.code; fa.faName = opt.name; }
      }
      if (field === 'incrementAmount' || field === 'currentAmount') {
        fa.newAmount = (fa.currentAmount || 0) + (fa.incrementAmount || 0);
      }
      faList[fi] = fa;
      return { ...d, faIncrements: faList };
    }));
  }

  removeFaRow(empId: number, fi: number): void {
    this.editDetails.update(list => list.map(d =>
      d.empId === empId
        ? { ...d, faIncrements: d.faIncrements.filter((_, i) => i !== fi) }
        : d));
  }

  // ── CSV export ────────────────────────────────────────────────────────────
  exportCsv(): void {
    const details = this.editDetails();
    if (!details.length) return;
    const faCodes = [...new Set(details.flatMap(d => d.faIncrements.map(f => f.faCode)).filter(Boolean))];
    const header  = ['employeeNo','currentBasic','incrementBasic','newBasic',
      ...faCodes.flatMap(c => [`${c}_current`,`${c}_increment`,`${c}_new`])];
    const rows = details.map(d => {
      const base = [d.empCode, d.currentBasic, d.incrementBasic, d.newBasic];
      const faVals = faCodes.flatMap(code => {
        const fa = d.faIncrements.find(f => f.faCode === code);
        return [fa?.currentAmount ?? 0, fa?.incrementAmount ?? 0, fa?.newAmount ?? 0];
      });
      return [...base, ...faVals];
    });
    const csv  = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href: url, download: `SI-${this.formEffectiveMonth()}.csv` });
    a.click(); URL.revokeObjectURL(url);
  }

  downloadTemplate(): void {
    const csv  = 'employeeNo,incrementBasic,FA001_increment,FA002_increment\nEMP001,5000,2000,1000\nEMP002,4000,1500,';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: 'si_template.csv' });
    a.click(); URL.revokeObjectURL(url);
  }

  // ── CSV import ────────────────────────────────────────────────────────────
  triggerCsvUpload(): void {
    this.csvFileInput.nativeElement.value = '';
    this.csvFileInput.nativeElement.click();
  }

  onCsvFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.importError.set('');
    const reader = new FileReader();
    reader.onload = e => {
      try { this.parseCsvAndLoad(e.target!.result as string); }
      catch (err: any) { this.importError.set(`CSV error: ${err.message}`); }
    };
    reader.readAsText(file);
  }

  private parseCsvAndLoad(csvText: string): void {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) throw new Error('CSV must have a header and at least one row.');
    const headers     = lines[0].split(',').map(h => h.trim());
    const empNoIdx    = headers.indexOf('employeeNo');
    const incrIdx     = headers.indexOf('incrementBasic');
    if (empNoIdx === -1 || incrIdx === -1)
      throw new Error('CSV must have "employeeNo" and "incrementBasic" columns.');

    const faIncrCols = headers.map((h, i) => ({ h, i }))
      .filter(({ h }) => h.endsWith('_increment') && h !== 'incrementBasic');

    this.editDetails.set([]);
    let pending = lines.slice(1).filter(l => l.trim()).length;
    if (!pending) return;

    lines.slice(1).filter(l => l.trim()).forEach(line => {
      const cells    = line.split(',').map(c => c.trim());
      const empNo    = cells[empNoIdx];
      const incrAmt  = Number(cells[incrIdx]) || 0;
      const faAmts   = faIncrCols.map(({ h, i }) => ({ code: h.replace('_increment',''), increment: Number(cells[i])||0 }));

      this.loadingEmp.set(true);
      // Fetch employee by code via API to get id
      this.http.get<{ data: EmployeeOption[] }>(`${this.apiBase}/employee`)
        .pipe(map(r => r.data ?? []), takeUntilDestroyed(this.destroyRef))
        .subscribe(emps => {
          const emp = emps.find(e => e.employeeNo === empNo);
          if (!emp) {
            this.importError.update(e => e + `\nEmployee not found: ${empNo}`);
            pending--;
            if (!pending) this.loadingEmp.set(false);
            return;
          }
          this.http.get<{ data: EmpProfile }>(`${this.apiBase}/emp-profile/${emp.id}?assignedOnly=true`)
            .pipe(map(r => r.data), takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: profile => {
                const basic  = profile?.employee?.basicSalary ?? emp.basicSalary ?? 0;
                const faMap  = new Map<number, SalaryIncrementFaResponse>();
                (profile?.fixedAllowances ?? []).forEach(fa =>
                  faMap.set(fa.faId, { id:0, faId:fa.faId, faCode:fa.faCode, faName:fa.faName,
                    currentAmount:fa.amount??0, incrementAmount:0, newAmount:fa.amount??0 }));
                faAmts.forEach(({ code, increment }) => {
                  const opt = this.faOptions().find(o => o.code === code);
                  if (!opt) return;
                  const ex = faMap.get(opt.id);
                  if (ex) { ex.incrementAmount = increment; ex.newAmount = ex.currentAmount + increment; }
                  else faMap.set(opt.id, { id:0, faId:opt.id, faCode:opt.code, faName:opt.name,
                    currentAmount:0, incrementAmount:increment, newAmount:increment });
                });
                this.editDetails.update(list => [...list, {
                  id:0, incrementId:0, empId:emp.id, empCode:emp.employeeNo, empName:emp.payrollName,
                  designationName:'', branchName:'', currentBasic:basic,
                  incrementBasic:incrAmt, newBasic:basic+incrAmt,
                  isExported:false, exportedDate:null, remarks:'', faIncrements:[...faMap.values()],
                }]);
                pending--;
                if (!pending) this.loadingEmp.set(false);
              },
              error: () => { pending--; if (!pending) this.loadingEmp.set(false); },
            });
        });
    });
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  save(): void {
    if (!this.formName().trim()) { alert('Name is required.'); return; }
    if (!this.editDetails().length) { alert('Add at least one employee.'); return; }

    this.saving.set(true);
    const details: SalaryIncrementDetailRequest[] = this.editDetails().map(d => ({
      empId: d.empId, currentBasic: d.currentBasic, incrementBasic: d.incrementBasic,
      newBasic: d.newBasic, remarks: d.remarks ?? '',
      createdBy: this.MODIFIED_BY, modifiedBy: this.MODIFIED_BY,
      faIncrements: d.faIncrements.filter(f => f.faId > 0).map(f => ({
        faId: f.faId, currentAmount: f.currentAmount,
        incrementAmount: f.incrementAmount, newAmount: f.newAmount,
        createdBy: this.MODIFIED_BY, modifiedBy: this.MODIFIED_BY,
      } as SalaryIncrementFaRequest)),
    }));

    const req: SalaryIncrementRequest = {
      code: this.generatedCode(), name: this.formName(),
      type: 'BATCH', effectiveMonth: this.formEffectiveMonth(),
      remarks: this.formRemarks(), createdBy: this.MODIFIED_BY, modifiedBy: this.MODIFIED_BY,
      details,
    };

    const op$ = this.panelMode() === 'edit'
      ? this.svc.update(this.selected()!.id, req)
      : this.svc.create(req);

    op$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: saved => {
        this.loadIncrements(); this.selected.set(saved);
        this.panelMode.set('view'); this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  // ── Workflow actions ──────────────────────────────────────────────────────
  approve():       void { this.runAction(this.svc.approve(this.selected()!.id)); }
  cancel():        void { this.runAction(this.svc.cancel(this.selected()!.id)); }
  exportPayroll(): void { this.runAction(this.svc.exportToPayroll(this.selected()!.id)); }
  postIncrement(): void { this.runAction(this.svc.post(this.selected()!.id)); }
  syncPayroll():   void { this.runAction(this.svc.importFromPayroll(this.selected()!.id)); }

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
      next: u => { this.loadIncrements(); this.selected.set(u); this.panelMode.set('view'); this.acting.set(false); },
      error: () => this.acting.set(false),
    });
  }

  // ── Filter helpers ────────────────────────────────────────────────────────
  onFilterEmpSelected(emp: unknown): void {
    const e = emp as EmployeeOption;
    this.filterEmpId.set(e?.id ?? 0);
  }
  clearEmpFilter(): void {
    this.filterEmpCtrl.reset();
    this.filterEmpId.set(0);
  }

  // ── Misc helpers ──────────────────────────────────────────────────────────
  statusClass(s: IncrementStatus): string {
    return {
      DRAFT:'chip-draft', APPROVED:'chip-approved',
      EXPORTED:'chip-exported', POSTED:'chip-posted', CANCELLED:'chip-cancelled',
    }[s] ?? '';
  }

  monthLabel(m: number): string {
    return MONTHS.find(x => x.value === m)?.label ?? String(m);
  }

  trackIdx = (i: number) => i;
}
