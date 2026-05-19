import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeHome } from './employee-home';

describe('EmployeeHome', () => {
  let component: EmployeeHome;
  let fixture: ComponentFixture<EmployeeHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeHome],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
