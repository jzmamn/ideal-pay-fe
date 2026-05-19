import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Allowances } from './allowances';

describe('Allowances', () => {
  let component: Allowances;
  let fixture: ComponentFixture<Allowances>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Allowances],
    }).compileComponents();

    fixture = TestBed.createComponent(Allowances);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
