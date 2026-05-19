import { ChangeDetectionStrategy, Component, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

export const SL_DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
  'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
  'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
  'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya',
] as const;

@Component({
  selector: 'app-district-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DistrictSelect),
    multi: true,
  }],
  imports: [MatFormFieldModule, MatSelectModule],
  template: `
    <mat-form-field appearance="outline" style="width:100%">
      <mat-label>District</mat-label>
      <mat-select
        [value]="value()"
        [disabled]="isDisabled()"
        (selectionChange)="onSelect($event.value)"
        aria-label="Select district"
      >
        @for (d of DISTRICTS; track d) {
          <mat-option [value]="d">{{ d }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
})
export class DistrictSelect implements ControlValueAccessor {
  readonly DISTRICTS = SL_DISTRICTS;
  readonly value = signal<string | null>(null);
  readonly isDisabled = signal(false);

  private onChange: (val: string | null) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: string | null): void { this.value.set(val); }
  registerOnChange(fn: (val: string | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.isDisabled.set(disabled); }

  onSelect(val: string | null): void {
    this.value.set(val);
    this.onChange(val);
    this.onTouched();
  }
}
