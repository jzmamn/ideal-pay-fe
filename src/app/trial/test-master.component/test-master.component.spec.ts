import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestMasterComponent } from './test-master.component';

describe('TestMasterComponent', () => {
  let component: TestMasterComponent;
  let fixture: ComponentFixture<TestMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestMasterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestMasterComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
