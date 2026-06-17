import { Directive, ElementRef, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: 'input[numericFormat]',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => NumericFormatDirective),
    multi: true,
  }],
  host: {
    'type': 'text',
    'inputmode': 'decimal',
    '(input)': 'onInput($event)',
    '(focus)': 'onFocus()',
    '(blur)': 'onBlur()',
  },
})
export class NumericFormatDirective implements ControlValueAccessor {
  private readonly el = inject(ElementRef<HTMLInputElement>);
  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};
  private numericValue: number | null = null;

  writeValue(value: number | null): void {
    this.numericValue = value;
    this.el.nativeElement.value = value != null ? this.format(value) : '';
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.el.nativeElement.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value.replace(/,/g, '');
    const parsed = parseFloat(raw);
    this.numericValue = isNaN(parsed) ? null : parsed;
    this.onChange(this.numericValue);
  }

  onFocus(): void {
    this.el.nativeElement.value = this.numericValue != null ? String(this.numericValue) : '';
    this.el.nativeElement.select();
  }

  onBlur(): void {
    this.onTouched();
    this.el.nativeElement.value = this.numericValue != null ? this.format(this.numericValue) : '';
  }

  private format(value: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
}
