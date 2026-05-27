import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MasterDataTableComponent } from '../../../shared/components/master-data-table/master-data-table.component';
import { MasterDataTableConfig } from '../../../shared/components/master-data-table/master-data-table.config';
import { DeductionDialog, DeductionDialogResult } from './deduction-dialog';
import { DeductionModel } from './deduction.model';
import { DeductionType } from './deduction.types';
import { FixedDeductionService } from './fixed-deduction.service';
import { VariableDeductionService } from './variable-deduction.service';

@Component({
  selector: 'app-deduction',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MasterDataTableComponent],
  templateUrl: './deduction.html',
  styleUrl: './deduction.scss',
})
export class Deduction implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly fixedDeductionService = inject(FixedDeductionService);
  private readonly variableDeductionService = inject(VariableDeductionService);

  readonly deductionType = input<DeductionType | null>(null);

  private readonly allDeductions = signal<DeductionModel[]>([]);

  readonly deductions = computed(() => {
    const type = this.deductionType();
    return type === null
      ? this.allDeductions()
      : this.allDeductions().filter(d => d.type === type);
  });

  readonly tableConfig = computed<MasterDataTableConfig<DeductionModel>>(() => ({
    title: this.resolveTitle(),
    showNewButton: true,
    showActiveFilter: true,
    columns: [
      { key: 'id',             label: 'ID',             sortable: false },
      { key: 'code',           label: 'Code' },
      { key: 'name',           label: 'Name' },
      ...(this.deductionType() === DeductionType.FIXED
        ? [
            { key: 'amount' as const, label: 'Amount', type: 'currency' as const },
            { key: 'formulaEnabled' as const, label: 'Formula', type: 'icon' as const, icon: 'functions', iconTooltip: 'Formula enabled', sortable: false },
          ]
        : []),
      { key: 'isActive',       label: 'Active',         type: 'boolean' as const },
      { key: 'liableForEpf',  label: 'Liable for EPF',  type: 'boolean' as const },
      { key: 'liableForEtf',  label: 'Liable for ETF',  type: 'boolean' as const },
      { key: 'liableForPaye', label: 'Liable for PAYE', type: 'boolean' as const },
      { key: 'liableNoPay',   label: 'Liable No Pay',   type: 'boolean' as const },
    ],
  }));

  ngOnInit(): void {
    this.activeService()?.getAll().subscribe({
      next: data => this.allDeductions.set(data),
      error: err => console.error('Failed to load deductions', err),
    });
  }

  private resolveTitle(): string {
    switch (this.deductionType()) {
      case DeductionType.FIXED:    return 'Fixed Deductions';
      case DeductionType.VARIABLE: return 'Variable Deductions';
      default:                     return 'Deductions';
    }
  }

  private activeService() {
    switch (this.deductionType()) {
      case DeductionType.FIXED:    return this.fixedDeductionService;
      case DeductionType.VARIABLE: return this.variableDeductionService;
      default:                     return null;
    }
  }

  onRowSelected(row: DeductionModel): void {
    this.openDialog(row);
  }

  onNewClicked(): void {
    this.openDialog(null);
  }

  private openDialog(row: DeductionModel | null): void {
    const dialogRef = this.dialog.open(DeductionDialog, {
      panelClass: 'square-dialog',
      width: '600px',
      data: { row, deductionType: this.deductionType() ?? DeductionType.FIXED },
    });

    dialogRef.afterClosed().subscribe((result: DeductionDialogResult | undefined) => {
      if (!result) return;
      this.handleDialogResult(result);
    });
  }

  private handleDialogResult(result: DeductionDialogResult): void {
    const service = this.activeService();
    if (!service) return;

    const type = this.deductionType() ?? DeductionType.FIXED;

    switch (result.action) {
      case 'create':
        service.create(result.data).subscribe(created => {
          this.allDeductions.update(list => [...list, created]);
        });
        break;
      case 'update':
        service.update(result.data.id, result.data).subscribe(() => {
          const updated = new DeductionModel(
            result.data.id, result.data.code, result.data.name,
            result.data.description, result.data.isActive, type, result.data.amount,
            result.data.liableForEpf, result.data.liableForEtf, result.data.liableForPaye,
            result.data.liableNoPay, result.data.formula, result.data.formulaEnabled,
          );
          this.allDeductions.update(list => list.map(d => d.id === updated.id ? updated : d));
        });
        break;
      case 'delete':
        service.delete(result.id).subscribe(() => {
          this.allDeductions.update(list => list.filter(d => d.id !== result.id));
        });
        break;
    }
  }
}
