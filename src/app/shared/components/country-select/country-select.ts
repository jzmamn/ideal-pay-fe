import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DoCheck,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MasterDataService } from '../../services/master-data.service';

@Component({
  selector: 'app-country-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatAutocompleteModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  template: `
    <mat-form-field appearance="outline" style="width:100%">
      <mat-label>Country</mat-label>
      <input
        matInput
        [formControl]="searchCtrl"
        placeholder="Search country..."
        [matAutocomplete]="auto"
        [errorStateMatcher]="errorStateMatcher"
        (blur)="onBlur()"
        aria-autocomplete="list"
      >
      <mat-autocomplete #auto (optionSelected)="onOptionSelected($event)">
        @if (filteredCountries().length === 0) {
          <mat-option disabled>No results</mat-option>
        } @else {
          @for (c of filteredCountries(); track c.id) {
            <mat-option [value]="c.id">{{ c.name }}</mat-option>
          }
        }
      </mat-autocomplete>
      <mat-error>Required</mat-error>
    </mat-form-field>
  `,
})
export class CountrySelect implements ControlValueAccessor, DoCheck {
  private readonly masterSvc = inject(MasterDataService);
  readonly ngControl = inject(NgControl, { optional: true, self: true });

  readonly searchCtrl = new FormControl('');
  private readonly _searchValue = toSignal(this.searchCtrl.valueChanges, { initialValue: '' });
  private readonly _selectedId = signal<number | null>(null);

  readonly errorStateMatcher: ErrorStateMatcher = {
    isErrorState: () => !!(this.ngControl?.invalid && this.ngControl?.touched),
  };

  readonly filteredCountries = computed(() => {
    const countries = this.masterSvc.activeCountries();
    const raw = this._searchValue();
    const query = typeof raw === 'string' ? raw.toLowerCase() : '';
    if (!query) return countries;
    return countries.filter(c =>
      c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query)
    );
  });

  private onChange: (val: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
    this.masterSvc.reload('countries');
    effect(() => {
      const id = this._selectedId();
      const name = id != null
        ? (this.masterSvc.countries().find(c => c.id === id)?.name ?? '')
        : '';
      this.searchCtrl.setValue(name, { emitEvent: false });
    });
  }

  ngDoCheck(): void {
    if (this.ngControl?.touched && !this.searchCtrl.touched) {
      this.searchCtrl.markAsTouched();
    }
  }

  writeValue(id: number | null): void {
    this._selectedId.set(id);
  }

  registerOnChange(fn: (val: number | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  setDisabledState(disabled: boolean): void {
    disabled ? this.searchCtrl.disable({ emitEvent: false }) : this.searchCtrl.enable({ emitEvent: false });
  }

  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const id = event.option.value as number;
    this._selectedId.set(id);
    this.onChange(id);
    this.onTouched();
  }

  onBlur(): void {
    const id = this._selectedId();
    const name = id != null
      ? (this.masterSvc.countries().find(c => c.id === id)?.name ?? '')
      : '';
    this.searchCtrl.setValue(name, { emitEvent: false });
    this.onTouched();
  }
}
