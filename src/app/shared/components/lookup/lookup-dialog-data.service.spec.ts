import { TestBed } from '@angular/core/testing';

import { LookupDialogDataService } from './lookup-dialog-data.service';

describe('LookupDialogDataService', () => {
  let service: LookupDialogDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LookupDialogDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
