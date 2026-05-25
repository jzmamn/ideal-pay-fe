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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EMPTY, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, finalize, switchMap } from 'rxjs/operators';
import {
  FormulaDefinitionFormValue,
  FormulaValidateResponseDTO,
} from '../formula-definition.models';
import { FormulaDefinitionService } from '../formula-definition.service';

const INSERT_OPTION_GROUPS = [
  {
    group: 'Standard payroll fields',
    items: [
      { label: 'basicSalary',  value: 'basicSalary',  hint: "Employee's basic salary" },
      { label: 'workingDays',  value: 'workingDays',  hint: 'Working days in period (default 26)' },
      { label: 'nopayDays',    value: 'nopayDays',    hint: 'No-pay days taken' },
      { label: 'otHours',      value: 'otHours',      hint: 'Overtime hours worked' },
      { label: 'otRate',       value: 'otRate',       hint: 'Overtime multiplier (e.g. 1.5)' },
    ],
  },
  {
    group: 'Operators',
    items: [
      { label: '+',   value: ' + ',   hint: 'Addition' },
      { label: '-',   value: ' - ',   hint: 'Subtraction' },
      { label: '*',   value: ' * ',   hint: 'Multiplication' },
      { label: '/',   value: ' / ',   hint: 'Division' },
      { label: '( )', value: '()',    hint: 'Wrap selection in parentheses' },
      { label: '?:',  value: ' ? : ', hint: 'Ternary: condition ? ifTrue : ifFalse' },
    ],
  },
  {
    group: 'Common constants',
    items: [
      { label: '0.08 — EPF employee 8%',  value: '0.08', hint: 'EPF employee 8%' },
      { label: '0.12 — EPF employer 12%', value: '0.12', hint: 'EPF employer 12%' },
      { label: '0.03 — ETF 3%',           value: '0.03', hint: 'ETF 3%' },
      { label: '0.10 — 10%',              value: '0.10', hint: '10% rate' },
      { label: '8 — hours per day',       value: '8',    hint: '8 hours per day' },
    ],
  },
];

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
    MatProgressSpinnerModule,
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

  // ── DI ────────────────────────────────────────────────────────────────────
  private readonly service    = inject(FormulaDefinitionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb         = inject(FormBuilder);

  readonly expressionTextareaRef = viewChild<ElementRef<HTMLTextAreaElement>>('expressionTextarea');

  // ── State ─────────────────────────────────────────────────────────────────
  readonly insertFieldValue    = signal<string | null>(null);
  readonly validating          = signal(false);
  readonly validateResult      = signal<FormulaValidateResponseDTO | null>(null);
  readonly localEvalResult     = signal<LocalEvalResult | null>(null);
  readonly showLocalTechDetail = signal(false);

  readonly insertOptionGroups = INSERT_OPTION_GROUPS;

  readonly form = this.fb.nonNullable.group({
    expression:     ['', Validators.required],
    isActive:       [true],
    testExpression: [''],
  });

  private readonly expressionValidate$ = new Subject<string>();

  constructor() {
    effect(() => {
      this.form.patchValue({
        expression: this.initialExpression(),
        isActive:   this.initialIsActive(),
      });
    });

    this.setupExpressionValidation();
    this.setupLocalEval();
  }

  // ── Public API ────────────────────────────────────────────────────────────

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

  private setupExpressionValidation(): void {
    this.expressionValidate$.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      switchMap(expr => {
        if (!expr?.trim()) {
          this.validateResult.set(null);
          return EMPTY;
        }
        this.validating.set(true);
        return this.service.validate(expr).pipe(
          catchError(() => {
            this.validating.set(false);
            this.validateResult.set({ valid: false, error: 'Validation request failed' });
            return EMPTY;
          }),
          finalize(() => this.validating.set(false)),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((result: FormulaValidateResponseDTO) => this.validateResult.set(result));

    this.form.controls.expression.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(val => {
      this.expressionValidate$.next(val ?? '');
    });
  }

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
