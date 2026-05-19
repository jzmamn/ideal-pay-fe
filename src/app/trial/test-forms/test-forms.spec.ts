import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestForms } from './test-forms';

describe('TestForms', () => {
  let component: TestForms;
  let fixture: ComponentFixture<TestForms>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestForms],
    }).compileComponents();

    fixture = TestBed.createComponent(TestForms);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
