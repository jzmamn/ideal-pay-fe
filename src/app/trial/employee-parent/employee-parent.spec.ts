import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeParent } from './employee-parent';

describe('EmployeeParent', () => {
  let component: EmployeeParent;
  let fixture: ComponentFixture<EmployeeParent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeParent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeParent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
