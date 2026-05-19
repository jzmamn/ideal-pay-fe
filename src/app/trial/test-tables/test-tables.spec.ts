import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestTables } from './test-tables';

describe('TestTables', () => {
  let component: TestTables;
  let fixture: ComponentFixture<TestTables>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestTables],
    }).compileComponents();

    fixture = TestBed.createComponent(TestTables);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
