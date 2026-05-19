import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Department {
  id: number;
  name: string;
  hc: number;
  base: number;
  bonus: number;
  ot: number;
  ben: number;
  budget: number;
}

export interface MonthlyData {
  month: string;
  base: number;
  bonus: number;
  ot: number;
  ben: number;
}

export type EmployeeStatus = 'Active' | 'Leave' | 'Terminated';

export interface Employee {
  id: number;
  name: string;
  dept: string;
  role: string;
  base: number;
  ytdBonus: number;
  status: EmployeeStatus;
  payReviewDate: string;
  lastIncrease: number;
  ben: number;
}

export interface Metric {
  id: string;
  title: string;
  value: string;
  change: string;
  changeSign: 'positive' | 'negative';
  subtitle: string;
  icon: string;
}

export interface MetricMonthlyBreakdown {
  month: string;
  value: number;
}

@Injectable({ providedIn: 'root' })
export class PayrollDataService {
  private departments: Department[] = [
    { id: 1, name: 'Engineering',  hc: 78, base: 1120000, bonus: 195000, ot: 46000, ben: 168000, budget: 1620000 },
    { id: 2, name: 'Sales',        hc: 65, base:  945000, bonus: 242000, ot: 31000, ben: 126000, budget: 1300000 },
    { id: 3, name: 'Marketing',    hc: 42, base:  588000, bonus:  98000, ot: 18000, ben:  82000, budget:  830000 },
    { id: 4, name: 'Operations',   hc: 55, base:  715000, bonus:  82000, ot: 38000, ben:  96000, budget:  950000 },
    { id: 5, name: 'Finance',      hc: 38, base:  618000, bonus: 112000, ot: 22000, ben:  88000, budget:  870000 },
    { id: 6, name: 'HR',           hc: 28, base:  374000, bonus:  56000, ot: 14000, ben:  52000, budget:  520000 },
    { id: 7, name: 'Legal',        hc: 36, base:  512000, bonus:  92000, ot: 14000, ben:  70000, budget:  720000 },
  ];

  private monthly: MonthlyData[] = [
    { month: 'Jan', base: 700000, bonus: 100000, ot: 32000, ben: 98000 },
    { month: 'Feb', base: 710000, bonus: 102000, ot: 34000, ben: 99000 },
    { month: 'Mar', base: 718000, bonus: 118000, ot: 38000, ben: 100000 },
    { month: 'Apr', base: 724000, bonus: 125000, ot: 45000, ben: 101000 },
    { month: 'May', base: 718000, bonus: 130000, ot: 34000, ben: 100000 },
  ];

  private employees: Employee[] = [
    { id: 1, name: 'Alex Johnson',    dept: 'Engineering', role: 'Senior Engineer',    base:  95000, ytdBonus: 18000, status: 'Active',     payReviewDate: '2025-09-01', lastIncrease: 8.5,  ben: 14200 },
    { id: 2, name: 'Maria Santos',    dept: 'Sales',       role: 'Account Executive',  base:  72000, ytdBonus: 32000, status: 'Active',     payReviewDate: '2025-07-15', lastIncrease: 5.0,  ben: 10800 },
    { id: 3, name: 'David Kim',       dept: 'Engineering', role: 'Lead Engineer',      base: 112000, ytdBonus: 22000, status: 'Active',     payReviewDate: '2025-11-01', lastIncrease: 10.2, ben: 16800 },
    { id: 4, name: 'Sarah Chen',      dept: 'Finance',     role: 'Financial Analyst',  base:  68000, ytdBonus:  9500, status: 'Leave',      payReviewDate: '2025-08-20', lastIncrease: 3.5,  ben: 10200 },
    { id: 5, name: 'James Wilson',    dept: 'Marketing',   role: 'Marketing Manager',  base:  82000, ytdBonus: 14000, status: 'Active',     payReviewDate: '2025-10-01', lastIncrease: 6.8,  ben: 12300 },
    { id: 6, name: 'Emily Davis',     dept: 'HR',          role: 'HR Specialist',      base:  58000, ytdBonus:  6000, status: 'Active',     payReviewDate: '2025-06-30', lastIncrease: 4.2,  ben:  8700 },
    { id: 7, name: 'Robert Lee',      dept: 'Legal',       role: 'Legal Counsel',      base:  98000, ytdBonus: 16000, status: 'Terminated', payReviewDate: '2025-03-15', lastIncrease: 0,    ben: 14700 },
    { id: 8, name: 'Jennifer Park',   dept: 'Operations',  role: 'Operations Lead',    base:  74000, ytdBonus: 11000, status: 'Active',     payReviewDate: '2025-12-01', lastIncrease: 7.1,  ben: 11100 },
    { id: 9, name: 'Michael Brown',   dept: 'Engineering', role: 'DevOps Engineer',    base:  88000, ytdBonus: 15000, status: 'Active',     payReviewDate: '2025-09-15', lastIncrease: 9.0,  ben: 13200 },
    { id: 10, name: 'Linda Torres',   dept: 'Sales',       role: 'Sales Director',     base: 130000, ytdBonus: 48000, status: 'Active',     payReviewDate: '2026-01-01', lastIncrease: 12.0, ben: 19500 },
  ];

  getDepts(): Observable<Department[]> {
    return of(this.departments);
  }

  getMonthly(): Observable<MonthlyData[]> {
    return of(this.monthly);
  }

  getEmployees(): Observable<Employee[]> {
    return of(this.employees);
  }

  getDeptById(id: number): Observable<Department | undefined> {
    return of(this.departments.find(d => d.id === id));
  }

  getMetrics(): Observable<Metric[]> {
    return of([
      {
        id: 'total-cost',
        title: 'Total Payroll Cost',
        value: '$4.82M',
        change: '+3.2%',
        changeSign: 'negative',
        subtitle: 'vs prior period',
        icon: 'payments',
      },
      {
        id: 'headcount',
        title: 'Total Headcount',
        value: '342',
        change: '+8',
        changeSign: 'positive',
        subtitle: 'new hires this period',
        icon: 'group',
      },
      {
        id: 'avg-cost',
        title: 'Avg Cost / Employee',
        value: '$14,094',
        change: '-0.8%',
        changeSign: 'positive',
        subtitle: 'vs prior period',
        icon: 'person',
      },
      {
        id: 'overtime',
        title: 'Overtime Cost',
        value: '$183K',
        change: '+12.4%',
        changeSign: 'negative',
        subtitle: 'vs prior period',
        icon: 'schedule',
      },
    ]);
  }

  getMetricBreakdown(metricId: string): Observable<MetricMonthlyBreakdown[]> {
    const map: Record<string, number[]> = {
      'total-cost':  [930000, 945000, 974000, 995000, 982000],
      'headcount':   [325, 328, 333, 338, 342],
      'avg-cost':    [14215, 14130, 14068, 14036, 14094],
      'overtime':    [32000, 34000, 38000, 45000, 34000],
    };
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
    const values = map[metricId] ?? [0, 0, 0, 0, 0];
    return of(months.map((month, i) => ({ month, value: values[i] })));
  }

  getMetricNarrative(metricId: string): string {
    const narratives: Record<string, string> = {
      'total-cost':  'Total payroll has grown 3.2% vs the prior period, driven primarily by Q1 bonus payouts and 8 new hires added in March. Engineering headcount expansion accounts for 42% of the incremental cost.',
      'headcount':   '8 new hires joined this period — 5 in Engineering, 2 in Sales, and 1 in Operations. Attrition remained at 1.2%, below the industry benchmark of 2.1%.',
      'avg-cost':    'Average cost per employee decreased 0.8% as the new hire cohort skews to mid-band roles. Senior-level open roles filled in Engineering pushed the departmental average up but were offset across the org.',
      'overtime':    'Overtime spiked 12.4% vs prior period, concentrated in Operations (47%) and Engineering (31%). A project deadline in March drove the March–April peak. Levels normalised in May.',
    };
    return narratives[metricId] ?? '';
  }
}
