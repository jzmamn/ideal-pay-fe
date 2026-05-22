import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { fromEvent, of } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../models/api-response.model';

/**
 * Use this in .ts files when defining columns — key is checked against T
 * and cellFn receives a typed item. Structurally assignable to the component's
 * internal column type, so no cast is needed at the binding site.
 */
export interface TableColumn<T> {
  key: keyof T & string;
  label: string;
  cellFn?: (item: T) => string;
}

/**
 * Non-generic shape used by the component inputs.
 * TableColumn<T> is structurally assignable here because:
 *   - key: keyof T & string  ⊆  string  ✓
 *   - (item: T) => string  is assignable to  (item: never) => string  by contravariance  ✓
 */
interface InternalColumn {
  key: string;
  label: string;
  // never in parameter position lets callers pass (item: T) => string without a cast
  cellFn?: (item: never) => string;
}

interface SrcResult {
  items: unknown[];
  loading: boolean;
}

@Component({
  selector: 'app-table-autocomplete',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatInputModule, MatIconModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TableAutocomplete),
      multi: true,
    },
  ],
  host: { class: 'tac-host' },
  templateUrl: './table-autocomplete.html',
  styleUrl: './table-autocomplete.scss',
})
export class TableAutocomplete implements ControlValueAccessor {
  private static _uid = 0;

  private readonly elRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL, { optional: true }) ?? '';

  // unknown[] accepts any typed array (EmployeeModel[], ProductModel[], …) without a cast
  readonly items = input<unknown[]>([]);
  readonly columns = input<InternalColumn[]>([]);
  readonly valueKey = input<string>('id');
  // never parameter lets callers pass (item: T) => string directly
  readonly displayFn = input<((item: never) => string) | undefined>(undefined);
  readonly label = input('');
  readonly placeholder = input('Search…');
  /** URL path to fetch items from, e.g. '/employee?isActive=true'. Supersedes [items]. */
  readonly src = input<string | undefined>(undefined);

  /** Emits the full selected item object on every selection. */
  readonly itemSelected = output<unknown>();

  protected readonly uid = `tac-${++TableAutocomplete._uid}`;
  protected readonly panelOpen = signal(false);
  protected readonly activeIndex = signal(-1);
  protected readonly searchText = signal('');
  protected readonly isDisabled = signal(false);
  protected readonly _value = signal<unknown>(null);

  private _onChange: (v: unknown) => void = () => {};
  private _onTouched: () => void = () => {};

  private readonly _srcLoad = toSignal(
    toObservable(this.src).pipe(
      switchMap(src => {
        if (!src) return of<SrcResult>({ items: [], loading: false });
        return this.http
          .get<ApiResponse<unknown[]>>(`${this.baseUrl}${src}`)
          .pipe(
            map(res => ({ items: res.data, loading: false } satisfies SrcResult)),
            catchError(() => of<SrcResult>({ items: [], loading: false })),
            startWith<SrcResult>({ items: [], loading: true }),
          );
      }),
    ),
    { initialValue: { items: [], loading: false } satisfies SrcResult },
  );

  protected readonly loading = computed(() => this._srcLoad().loading);

  private readonly _effectiveItems = computed(() =>
    this.src() != null ? this._srcLoad().items : this.items(),
  );

  protected readonly selectedDisplay = computed(() => {
    const val = this._value();
    if (val == null) return '';
    const item = this._effectiveItems().find(i => this._itemValue(i) === val);
    return item ? this._getDisplay(item) : '';
  });

  protected readonly filteredItems = computed((): unknown[] => {
    const q = this.searchText().toLowerCase().trim();
    if (!q) return this._effectiveItems();
    return this._effectiveItems().filter(item => {
      const obj = item as Record<string, unknown>;
      return this.columns().some(col =>
        String(obj[col.key] ?? '').toLowerCase().includes(q),
      );
    });
  });

  constructor() {
    fromEvent<MouseEvent>(document, 'click')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(e => {
        if (!this.elRef.nativeElement.contains(e.target as Node)) {
          this._closePanel();
        }
      });
  }

  protected onFocus(): void {
    if (this.isDisabled()) return;
    this.searchText.set('');
    this.panelOpen.set(true);
  }

  protected onInput(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
    this.activeIndex.set(-1);
    this.panelOpen.set(true);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const items = this.filteredItems();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.panelOpen()) { this.panelOpen.set(true); return; }
        this.activeIndex.update(i => Math.min(i + 1, items.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.update(i => Math.max(i - 1, 0));
        break;
      case 'Enter': {
        const idx = this.activeIndex();
        if (this.panelOpen() && idx >= 0 && idx < items.length) {
          event.preventDefault();
          this.selectItem(items[idx]);
        }
        break;
      }
      case 'Escape':
        if (this.panelOpen()) {
          event.preventDefault();
          this._closePanel();
        }
        break;
      case 'Tab':
        this._closePanel();
        break;
    }
  }

  protected selectItem(item: unknown): void {
    const val = this._itemValue(item);
    this._value.set(val);
    this._onChange(val);
    this.itemSelected.emit(item);
    this._closePanel();
  }

  protected trackItem(item: unknown): unknown {
    return this._itemValue(item);
  }

  protected isSelected(item: unknown): boolean {
    return this._itemValue(item) === this._value();
  }

  protected getCellValue(item: unknown, col: InternalColumn): string {
    if (col.cellFn) return col.cellFn(item as never);
    return String((item as Record<string, unknown>)[col.key] ?? '');
  }

  private _itemValue(item: unknown): unknown {
    return (item as Record<string, unknown>)[this.valueKey()];
  }

  private _closePanel(): void {
    this.panelOpen.set(false);
    this.activeIndex.set(-1);
    this.searchText.set('');
    this._onTouched();
  }

  private _getDisplay(item: unknown): string {
    const fn = this.displayFn();
    return fn ? fn(item as never) : String(this._itemValue(item) ?? '');
  }

  writeValue(val: unknown): void { this._value.set(val); }
  registerOnChange(fn: (v: unknown) => void): void { this._onChange = fn; }
  registerOnTouched(fn: () => void): void { this._onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.isDisabled.set(isDisabled); }
}
