import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LookupDialogDataService {

  message = signal<any>('Initial');

  setMessage(msg: any) {
    this.message.set(msg);
  }

}
