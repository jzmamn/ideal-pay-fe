import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MasterDataTableComponent } from '../../../shared/components/master-data-table/master-data-table.component';
import { MasterDataTableConfig } from '../../../shared/components/master-data-table/master-data-table.config';
import { AllowanceDialog, AllowanceDialogResult } from './allowance-dialog';
import { AllowanceModel } from './allowance.model';
import { AllowanceType } from './allowance.types';
import { FixedAllowanceService } from './fixed/fixed-allowance.service';
import { VariableAllowanceService } from './variable/variable-allowance.service';


@Component({
  selector: 'app-allowances',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MasterDataTableComponent],
  templateUrl: './allowances.html',
  styleUrl: './allowances.scss',
})
export class Allowances implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly fixedAllowanceService = inject(FixedAllowanceService);
  private readonly variableAllowanceService = inject(VariableAllowanceService);

  readonly allowanceType = input<AllowanceType | null>(null);

  private readonly allAllowances = signal<AllowanceModel[]>([]);

  readonly allowances = computed(() => {
    const type = this.allowanceType();
    return type === null
      ? this.allAllowances()
      : this.allAllowances().filter(a => a.type === type);
  });

  readonly tableConfig = computed<MasterDataTableConfig<AllowanceModel>>(() => ({
    title: this.resolveTitle(),
    showNewButton: true,
    showActiveFilter: true,
    columns: [
      { key: 'id',            label: 'ID',              sortable: false },
      { key: 'code',          label: 'Code' },
      { key: 'name',          label: 'Name' },
      ...(this.allowanceType() === AllowanceType.FIXED
        ? [
            { key: 'formulaEnabled' as const, label: 'Formula', type: 'icon' as const, icon: 'functions', iconTooltip: 'Formula enabled', sortable: false },
          ]
        : []),
      { key: 'isActive',      label: 'Active',          type: 'boolean' as const },
      { key: 'isTaxable',     label: 'Taxable',         type: 'boolean' as const },
      { key: 'liableForEpf',  label: 'Liable for EPF',  type: 'boolean' as const },
      { key: 'liableForEtf',  label: 'Liable for ETF',  type: 'boolean' as const },
      { key: 'liableForPaye', label: 'Liable for PAYE', type: 'boolean' as const },
      { key: 'liableNoPay',   label: 'Liable No Pay',   type: 'boolean' as const },
    ],
  }));

  ngOnInit(): void {
    this.activeService()?.getAll().subscribe({
      next: data => this.allAllowances.set(data),
      error: err => console.error('Failed to load allowances', err),
    });
  }

  private resolveTitle(): string {
    switch (this.allowanceType()) {
      case AllowanceType.FIXED:    return 'Fixed Allowances';
      case AllowanceType.VARIABLE: return 'Variable Allowances';
      default:                     return 'Allowances';
    }
  }

  private activeService() {
    switch (this.allowanceType()) {
      case AllowanceType.FIXED:    return this.fixedAllowanceService;
      case AllowanceType.VARIABLE: return this.variableAllowanceService;
      default:                     return null;
    }
  }

  onRowSelected(row: AllowanceModel): void {
    this.openDialog(row);
  }

  onNewClicked(): void {
    this.openDialog(null);
  }

  private openDialog(row: AllowanceModel | null): void {
    const dialogRef = this.dialog.open(AllowanceDialog, {
      panelClass: 'square-dialog',
      width: '600px',
      data: { row, allowanceType: this.allowanceType() ?? AllowanceType.FIXED },
    });

    dialogRef.afterClosed().subscribe((result: AllowanceDialogResult | undefined) => {
      if (!result) return;
      this.handleDialogResult(result);
    });
  }

  private handleDialogResult(result: AllowanceDialogResult): void {
    const service = this.activeService();
    if (!service) return;

    const type = this.allowanceType() ?? AllowanceType.FIXED;

    switch (result.action) {
      case 'create':
        service.create(result.data).subscribe(created => {
          this.allAllowances.update(list => [...list, created]);
        });
        break;
      case 'update':
        service.update(result.data.id, result.data).subscribe(() => {
          const updated = new AllowanceModel(
            result.data.id, result.data.code, result.data.name, result.data.description,
            result.data.isActive, result.data.isTaxable,
            result.data.liableForEpf, result.data.liableForEtf, result.data.liableForPaye,
            result.data.liableNoPay, type,
            result.data.formula, result.data.formulaEnabled,
          );
          this.allAllowances.update(list => list.map(a => a.id === updated.id ? updated : a));
        });
        break;
      case 'delete':
        service.delete(result.id).subscribe(() => {
          this.allAllowances.update(list => list.filter(a => a.id !== result.id));
        });
        break;
    }
  }
}
