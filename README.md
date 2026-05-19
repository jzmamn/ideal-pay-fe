# Ideal Pay — Payroll Executive Dashboard

Angular 21 + ng2-charts v10 + Angular Material 21 payroll analytics dashboard.

## Quick start

```bash
npm install
ng serve
```

Navigate to **http://localhost:4200** → click **Payroll** in the left sidebar.

## Dashboard features

| Section | Description |
|---|---|
| **KPI Cards** | 4 clickable cards (Total Cost, Headcount, Avg Cost/Employee, Overtime) — click to open monthly breakdown modal |
| **Payroll Trend** | Stacked bar chart — monthly payroll split by Base / Bonus / OT / Benefits |
| **Dept Donut** | Cost by department — click a slice to open department drill-down modal |
| **Headcount Bar** | Horizontal bar chart of headcount per department |
| **Benefits vs OT** | Dual-line chart comparing monthly benefits and overtime trends |
| **Dept Summary Table** | Material table with budget-variance badges; "Drill" opens dept modal |
| **Pivot Table** | 2-D cost breakdown — rows = departments, cols = pay types, grand total row |
| **Employee Table** | Material table with status badges; "View" opens employee modal |

## Swapping mock data for a real API

All data flows through `src/app/features/payroll-dashboard/services/payroll-data.service.ts`.

1. Inject `HttpClient` and replace each `of(...)` call with `http.get<T>(url)`.
2. All component subscriptions stay unchanged — typed against the same interfaces.

```ts
// Before (mock)
getDepts(): Observable<Department[]> { return of(this.departments); }

// After (real API)
getDepts(): Observable<Department[]> {
  return this.http.get<Department[]>('/api/payroll/departments');
}
```

## Notes

- Charts use `@defer (on idle)` to avoid SSR/hydration issues — they render client-side only.
- All components use `ChangeDetectionStrategy.OnPush` and Angular signals.
- WCAG AA: ARIA labels on interactive elements, focus-visible rings on metric cards.

---

*Original Angular CLI scaffold below.*

# IdealPayFe

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.8.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
