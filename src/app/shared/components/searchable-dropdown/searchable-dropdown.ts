import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export type DropdownOption = { id: number; name: string };

@Component({
  selector: 'app-searchable-dropdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SearchableDropdown),
    multi: true,
  }],
  imports: [MatAutocompleteModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './searchable-dropdown.html',
})
export class SearchableDropdown implements ControlValueAccessor {
  readonly label       = input<string>('');
  readonly options     = input<DropdownOption[]>([]);
  readonly placeholder = input<string>('Search...');

  readonly searchCtrl = new FormControl('');
  private readonly _searchValue = toSignal(this.searchCtrl.valueChanges, { initialValue: '' });
  private readonly _selectedId = signal<number | null>(null);

  readonly filteredOptions = computed(() => {
    const query = (this._searchValue() ?? '').toLowerCase();
    if (!query) return this.options();
    return this.options().filter(o => o.name.toLowerCase().includes(query));
  });

  private onChange: (val: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // Keep display text in sync whenever options load or selection changes
    effect(() => {
      const id = this._selectedId();
      const name = id != null ? (this.options().find(o => o.id === id)?.name ?? '') : '';
      this.searchCtrl.setValue(name, { emitEvent: false });
    });
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
    // Restore display to last valid selection on blur
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
