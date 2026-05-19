import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeInfo } from './employee-info';

describe('EmployeeInfo', () => {
  let component: EmployeeInfo;
  let fixture: ComponentFixture<EmployeeInfo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeInfo],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeInfo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
