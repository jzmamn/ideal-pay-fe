import { inject, Injectable } from '@angular/core';
import { EmployeeTestForm } from './test-forms';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class TestFormService {
private http = inject(HttpClient);

  getAll() {
    return this.http.get<EmployeeTestForm[]>('/api/employees');
  }

}
