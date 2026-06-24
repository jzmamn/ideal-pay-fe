import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { LateDeductionConfigDialog } from './late-deduction-config-dialog';
import { LateDeductionConfigModel } from './late-deduction-config.model';
import { LateDeductionConfigService } from './late-deduction-config.service';

@Component({
  selector: 'app-late-deduction-config',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './late-deduction-config.html',
  styleUrl:    './late-deduction-config.scss',
})
export class LateDeductionConfig implements OnInit {
  private readonly dialog    = inject(MatDialog);
  private readonly configSvc = inject(LateDeductionConfigService);

  readonly config = signal<LateDeductionConfigModel | null>(null);

  ngOnInit(): void {
    this.load();
  }

  openEdit(): void {
    this.dialog.open(LateDeductionConfigDialog, {
      panelClass: 'square-dialog',
      width:      '900px',
      maxWidth:   '96vw',
      data:       this.config(),
    }).afterClosed().subscribe(saved => { if (saved) this.load(); });
  }

  private load(): void {
    this.configSvc.get().subscribe(data => this.config.set(data));
  }
}
