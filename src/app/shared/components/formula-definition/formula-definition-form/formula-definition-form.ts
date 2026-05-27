import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  input,
  output,
  signal,
  inject,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime } from 'rxjs/operators';
import { FormulaDefinitionFormValue } from '../formula-definition.models';
import { FormulaDefinitionFieldsService } from '../formula-definition-fields.service';

type LocalEvalResult = { result?: number; userFriendlyError?: string; technicalError?: string };

@Component({
  selector: 'app-formula-definition-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  templateUrl: './formula-definition-form.html',
  styleUrl: './formula-definition-form.scss',
})
export class FormulaDefinitionForm {
  // ── Inputs ────────────────────────────────────────────────────────────────
  readonly initialExpression = input('');
  readonly initialIsActive   = input(true);
  readonly saving            = input(false);
  readonly saveError         = input<string | null>(null);

  // ── Outputs ───────────────────────────────────────────────────────────────
  readonly saveRequested = output<FormulaDefinitionFormValue>();
  readonly valueChanged  = output<FormulaDefinitionFormValue>();

  // ── DI ────────────────────────────────────────────────────────────────────
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb         = inject(FormBuilder);

  readonly expressionTextareaRef = viewChild<ElementRef<HTMLTextAreaElement>>('expressionTextarea');

  // ── State ─────────────────────────────────────────────────────────────────
  readonly insertFieldValue    = signal<string | null>(null);
  readonly localEvalResult     = signal<LocalEvalResult | null>(null);
  readonly showLocalTechDetail = signal(false);

  readonly insertOptionGroups = toSignal(
    inject(FormulaDefinitionFieldsService).getFields(),
    { initialValue: [] },
  );

  readonly form = this.fb.nonNullable.group({
    expression:     ['', Validators.required],
    isActive:       [true],
    testExpression: [''],
  });

  constructor() {
    effect(() => {
      this.form.patchValue({
        expression: this.initialExpression(),
        isActive:   this.initialIsActive(),
      }, { emitEvent: false });
    });

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      const v = this.form.getRawValue();
      this.valueChanged.emit({ expression: v.expression, isActive: v.isActive });
    });

    this.setupLocalEval();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  getCurrentValues(): FormulaDefinitionFormValue {
    const v = this.form.getRawValue();
    return { expression: v.expression, isActive: v.isActive };
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saveRequested.emit({ expression: v.expression, isActive: v.isActive });
  }

  onInsertSelect(value: string): void {
    const el      = this.expressionTextareaRef()?.nativeElement;
    const ctrl    = this.form.controls.expression;
    const current = ctrl.value ?? '';

    if (el) {
      const start = el.selectionStart ?? current.length;
      const end   = el.selectionEnd   ?? current.length;
      let newValue: string;
      let newCursor: number;

      if (value === '()') {
        const selected = current.substring(start, end);
        newValue  = current.substring(0, start) + '(' + selected + ')' + current.substring(end);
        newCursor = start + selected.length + 2;
      } else {
        newValue  = current.substring(0, start) + value + current.substring(end);
        newCursor = start + value.length;
      }

      ctrl.setValue(newValue);
      setTimeout(() => {
        el.setSelectionRange(newCursor, newCursor);
        el.focus();
      });
    } else {
      ctrl.setValue(current + value);
    }

    setTimeout(() => this.insertFieldValue.set(null));
  }

  copyToTestExpression(): void {
    this.form.controls.testExpression.setValue(this.form.controls.expression.value);
  }

  toggleLocalTechDetail(): void { this.showLocalTechDetail.update(v => !v); }

  // ── Private ───────────────────────────────────────────────────────────────

  private setupLocalEval(): void {
    this.form.controls.testExpression.valueChanges.pipe(
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(expr => {
      this.showLocalTechDetail.set(false);
      this.localEvalResult.set(this.evaluateLocally(expr ?? ''));
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  private evaluateLocally(expression: string): LocalEvalResult | null {
    if (!expression.trim()) return null;
    try {
      // Intentional Function() for sandboxed arithmetic evaluation in a developer tool
      // eslint-disable-next-line no-new-func
      const fn = new Function(`"use strict"; return (${expression.trim()});`);
      const result: unknown = fn();
      if (typeof result !== 'number' || !isFinite(result)) {
        return { userFriendlyError: `Result is not a valid number: ${String(result)}` };
      }
      return { result };
    } catch (e: unknown) {
      return {
        userFriendlyError: 'Could not evaluate. Ensure all variables are replaced with literal numbers.',
        technicalError:    e instanceof Error ? e.message : String(e),
      };
    }
  }
}
