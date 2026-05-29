import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DoCheck,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export type DropdownOption = { id: number; name: string };

@Component({
  selector: 'app-searchable-dropdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatAutocompleteModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './searchable-dropdown.html',
})
export class SearchableDropdown implements ControlValueAccessor, DoCheck {
  readonly label       = input<string>('');
  readonly options     = input<DropdownOption[]>([]);
  readonly placeholder = input<string>('Search...');

  readonly ngControl   = inject(NgControl, { optional: true, self: true });

  readonly searchCtrl = new FormControl('');
  private readonly _searchValue = toSignal(this.searchCtrl.valueChanges, { initialValue: '' });
  private readonly _selectedId = signal<number | null>(null);

  readonly errorStateMatcher: ErrorStateMatcher = {
    isErrorState: () => !!(this.ngControl?.invalid && this.ngControl?.touched),
  };

  readonly filteredOptions = computed(() => {
    const raw = this._searchValue();
    const query = typeof raw === 'string' ? raw.toLowerCase() : '';
    if (!query) return this.options();
    return this.options().filter(o => o.name.toLowerCase().includes(query));
  });

  private onChange: (val: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }

    effect(() => {
      const id = this._selectedId();
      const name = id != null ? (this.options().find(o => o.id === id)?.name ?? '') : '';
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

  onFocus(): void {
    this.searchCtrl.setValue('');
  }

  onBlur(): void {
    const id = this._selectedId();
    const name = id != null ? (this.options().find(o => o.id === id)?.name ?? '') : '';
    this.searchCtrl.setValue(name, { emitEvent: false });
    this.onTouched();
  }

  onClear(): void {
    this._selectedId.set(null);
    this.searchCtrl.setValue('', { emitEvent: false });
    this.onChange(null);
    this.onTouched();
  }
}
