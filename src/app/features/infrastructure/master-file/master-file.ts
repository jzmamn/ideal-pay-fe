import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { Branches } from '../branches/branches';
import { Designations } from '../designations/designations';
import { Grades } from '../grades/grades';
import { JobCategories } from '../job-categories/job-categories';
import { NopayDays } from '../nopay-days/nopay-days';
import { Countries } from '../country/countries';

@Component({
  selector: 'app-master-file',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTabsModule, JobCategories, Branches, Grades, Designations, NopayDays, Countries],
  templateUrl: './master-file.html',
})
export class MasterFile {}
