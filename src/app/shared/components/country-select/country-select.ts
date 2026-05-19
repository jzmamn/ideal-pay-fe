import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  signal,
} from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export type Country = { code: string; name: string };

export const COUNTRIES: Country[] = [
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'IN', name: 'India' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'NP', name: 'Nepal' },
  { code: 'MV', name: 'Maldives' },
  { code: 'BT', name: 'Bhutan' },
  { code: 'MM', name: 'Myanmar' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'KH', name: 'Cambodia' },
  { code: 'LA', name: 'Laos' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'BN', name: 'Brunei' },
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'MN', name: 'Mongolia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'QA', name: 'Qatar' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'OM', name: 'Oman' },
  { code: 'JO', name: 'Jordan' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'IE', name: 'Ireland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'EG', name: 'Egypt' },
  { code: 'KE', name: 'Kenya' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CO', name: 'Colombia' },
].sort((a, b) => a.name.localeCompare(b.name));

@Component({
  selector: 'app-country-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => CountrySelect),
    multi: true,
  }],
  imports: [MatAutocompleteModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  template: `
    <mat-form-field appearance="outline" style="width:100%">
      <mat-label>Country</mat-label>
      <input
        matInput
        [formControl]="searchCtrl"
        placeholder="Search country..."
        [matAutocomplete]="auto"
        (blur)="onBlur()"
        aria-autocomplete="list"
      >
      <mat-autocomplete #auto (optionSelected)="onOptionSelected($event)">
        @if (filteredCountries().length === 0) {
          <mat-option disabled>No results</mat-option>
        } @else {
          @for (c of filteredCountries(); track c.code) {
            <mat-option [value]="c.code">{{ c.name }}</mat-option>
          }
        }
      </mat-autocomplete>
    </mat-form-field>
  `,
})
export class CountrySelect implements ControlValueAccessor {
  readonly searchCtrl = new FormControl('');
  private readonly _searchValue = toSignal(this.searchCtrl.valueChanges, { initialValue: '' });
  private readonly _selectedCode = signal<string | null>(null);

  readonly filteredCountries = computed(() => {
    const query = (this._searchValue() ?? '').toLowerCase();
    if (!query) return COUNTRIES;
    return COUNTRIES.filter(c => c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query));
  });

  private onChange: (val: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    effect(() => {
      const code = this._selectedCode();
      const name = code != null ? (COUNTRIES.find(c => c.code === code)?.name ?? '') : '';
      this.searchCtrl.setValue(name, { emitEvent: false });
    });
  }

  writeValue(code: string | null): void {
    this._selectedCode.set(code);
  }

  registerOnChange(fn: (val: string | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  setDisabledState(disabled: boolean): void {
    disabled ? this.searchCtrl.disable({ emitEvent: false }) : this.searchCtrl.enable({ emitEvent: false });
  }

  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const code = event.option.value as string;
    this._selectedCode.set(code);
    this.onChange(code);
    this.onTouched();
  }

  onBlur(): void {
    const code = this._selectedCode();
    const name = code != null ? (COUNTRIES.find(c => c.code === code)?.name ?? '') : '';
    this.searchCtrl.setValue(name, { emitEvent: false });
    this.onTouched();
  }
}
