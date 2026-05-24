import { Injectable, signal, computed } from '@angular/core';

export interface Toast {
  id     : number;
  message: string;
  type   : 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _nextId  = 0;
  private _toasts  = signal<Toast[]>([]);

  readonly toasts  = this._toasts.asReadonly();

  success(message: string): void { this._add(message, 'success'); }
  error(message: string)  : void { this._add(message, 'error');   }
  info(message: string)   : void { this._add(message, 'info');    }

  dismiss(id: number): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  private _add(message: string, type: Toast['type']): void {
    const id = ++this._nextId;
    this._toasts.update(list => [...list, { id, message, type }]);
    setTimeout(() => this.dismiss(id), 5000);
  }
}
