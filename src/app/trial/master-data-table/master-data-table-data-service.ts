import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MasterDataTableDataService<T> {

  rowSignal = signal<any>('Initial');
  sharedMessage = this.rowSignal.asReadonly();

  setSelectedRow(row: T) {
    this.rowSignal.set(row);
  }

}
