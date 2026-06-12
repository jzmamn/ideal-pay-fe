# Payslip Template Guide

## Overview

The payslip template system lets you design a custom HTML payslip layout using
**tokens** — placeholders like `{{BASIC_SALARY}}` that are replaced with real
employee data when a PDF is generated.

---

## How It Works

```
You write HTML with {{TOKENS}}
         ↓
Employee runs payroll
         ↓
Backend replaces every {{TOKEN}} with the real value
         ↓
iText converts the HTML to a PDF
```

---

## Getting Started

### 1. Open the Template Designer

**Infrastructure → Payslip Template → New**

The designer has two panels:
- **Left sidebar** — token reference (click any token to insert it at the cursor)
- **Right panel** — HTML editor

### 2. Find Your Component Codes

Before writing the template, check what codes exist in your system:

```
GET http://localhost:8080/payroll/codes/active
```

This returns all active Fixed Allowances, Fixed Deductions, Overtime, Variable
Allowances, Variable Deductions, and No-Pay codes. The `code` field is what you
use in the template.

Example response:
```json
{
  "fixedAllowances": [
    { "id": 1, "code": "FA001", "name": "Transport Allowance" },
    { "id": 2, "code": "FA002", "name": "Meal Allowance" }
  ],
  "overtimes": [
    { "id": 1, "code": "OT001", "name": "Normal Overtime" }
  ],
  "nopayDays": [
    { "id": 1, "code": "NP001", "name": "Absent - No Pay" }
  ]
}
```

### 3. Validate Token Values for a Specific Employee

To see what every token resolves to for a real payroll run:

```
GET http://localhost:8080/payroll/payslip/tokens/{runId}
```

Find a `runId` from:
```
GET http://localhost:8080/payroll/payslip/month/2026-06
```
Look for the `id` field in the response.

The token debug response looks like:
```json
{
  "data": {
    "BASIC_SALARY": "50,000.00",
    "FA001": "3,000.00",
    "lbl_FA001": "Transport Allowance",
    "OT001_HOURS": "8",
    "OT001_AMOUNT": "1,200.00",
    "lbl_OT001": "Normal Overtime",
    "NP001_DAYS": "1",
    "NP001_AMOUNT": "1,923.08",
    "lbl_NP001": "Absent - No Pay",
    "NET_PAY": "48,276.92"
  }
}
```

If a token key is **missing** — it has no data for that employee.
If a value is **0.00** — the component exists but has a zero amount.

---

## Token Reference

### Company

| Token | Output |
|---|---|
| `{{COMPANY_NAME}}` | Company name |
| `{{COMPANY_ADDRESS}}` | Full address |
| `{{COMPANY_PHONE}}` | Phone number |
| `{{COMPANY_EMAIL}}` | Email address |
| `{{COMPANY_LOGO}}` | Logo (base64 data URI or URL) |
| `{{COMPANY_EPF_NO}}` | Company EPF number |
| `{{COMPANY_ETF_NO}}` | Company ETF number |

### Employee

| Token | Output |
|---|---|
| `{{EMPLOYEE_NO}}` | Employee number |
| `{{EMPLOYEE_NAME}}` | Full name |
| `{{PAYROLL_NAME}}` | Payroll name |
| `{{DESIGNATION}}` | Job title |
| `{{DEPARTMENT}}` | Department |
| `{{EMPLOYEE_EPF_NO}}` | Employee EPF number |
| `{{BANK_NAME}}` | Bank name |
| `{{BANK_BRANCH}}` | Branch name |
| `{{ACCOUNT_NO}}` | Account number |

### Payroll Period

| Token | Output |
|---|---|
| `{{PAYROLL_MONTH}}` | e.g. "June 2026" |
| `{{WORKING_DAYS}}` | e.g. "26" |

### Financial Totals

| Token | Output |
|---|---|
| `{{BASIC_SALARY}}` | Basic salary |
| `{{GROSS_PAY}}` | Gross pay |
| `{{TOTAL_DEDUCTIONS}}` | Total deductions |
| `{{NET_PAY}}` | Net pay |
| `{{EPF_EMPLOYEE}}` | Employee EPF (8%) |
| `{{EPF_EMPLOYER}}` | Employer EPF (12%) |
| `{{ETF}}` | ETF (3%) |
| `{{PAYE_TAX}}` | PAYE tax |

### Allowance / Deduction Aggregates

| Token | Output |
|---|---|
| `{{FIXED_ALLOWANCE}}` | Sum of all fixed allowances |
| `{{FIXED_DEDUCTION}}` | Sum of all fixed deductions |
| `{{VARIABLE_ALLOWANCE}}` | Sum of all variable allowances |
| `{{VARIABLE_DEDUCTION}}` | Sum of all variable deductions |
| `{{BONUS}}` | Sum of VA components with "BONUS" in the code |
| `{{INCREMENT}}` | Sum of VA components with "INCREMENT" in the code |
| `{{GRATUITY}}` | Sum of VA components with "GRATUITY" in the code |

### Overtime Aggregates

| Token | Output |
|---|---|
| `{{OVERTIME}}` / `{{OT_AMOUNT}}` | Total OT amount |
| `{{OT_HOURS}}` | Total OT hours |

### No-Pay Aggregates

| Token | Output |
|---|---|
| `{{NOPAY}}` / `{{NOPAY_AMOUNT}}` | Total no-pay deduction |
| `{{NOPAY_DAYS}}` | Total no-pay days |
| `{{LATE_DEDUCTION}}` | Total late deduction amount |

---

## Per-Component Tokens

These use the **actual code** from your database.

### Fixed Allowances / Deductions / Variable Allowances / Variable Deductions

```
{{FA001}}        → amount      e.g. 3,000.00
{{lbl_FA001}}    → name        e.g. Transport Allowance
```

Use the same pattern for other types:
- `{{FA001}}` / `{{lbl_FA001}}` — Fixed Allowance
- `{{FD001}}` / `{{lbl_FD001}}` — Fixed Deduction
- `{{VA001}}` / `{{lbl_VA001}}` — Variable Allowance
- `{{VD001}}` / `{{lbl_VD001}}` — Variable Deduction

### Overtime

```
{{lbl_OT001}}      → name        e.g. Normal Overtime
{{OT001_HOURS}}    → hours       e.g. 8
{{OT001_AMOUNT}}   → amount      e.g. 1,200.00
```

### No-Pay

```
{{lbl_NP001}}      → name        e.g. Absent - No Pay
{{NP001_DAYS}}     → days        e.g. 1
{{NP001_AMOUNT}}   → amount      e.g. 1,923.08
```

---

## Label Tokens

Every field has a matching label token so you can translate or rename labels
without editing the HTML structure.

| Label Token | Default Output |
|---|---|
| `{{lblBasicSalary}}` | Basic Salary |
| `{{lblGrossPay}}` | Gross Pay |
| `{{lblNetPay}}` | Net Pay |
| `{{lblTotalDeductions}}` | Total Deductions |
| `{{lblEpfEmployee}}` | EPF (Employee 8%) |
| `{{lblEpfEmployer}}` | EPF (Employer 12%) |
| `{{lblEtf}}` | ETF (Employer 3%) |
| `{{lblPayeTax}}` | PAYE Tax |
| `{{lblNopay}}` | No-Pay |
| `{{lblLateDeduction}}` | Late Deduction |
| `{{lblFixedAllowance}}` | Fixed Allowance |
| `{{lblFixedDeduction}}` | Fixed Deduction |
| `{{lblOvertime}}` | Overtime |
| `{{lblVariableAllowance}}` | Variable Allowance |
| `{{lblBonus}}` | Bonus |
| `{{lblIncrement}}` | Increment |
| `{{lblGratuity}}` | Gratuity |
| `{{lblVariableDeduction}}` | Variable Deduction |
| `{{lblWorkingDays}}` | Working Days |
| `{{lblPayrollMonth}}` | Payroll Month |
| `{{lblCompanyName}}` | Company |
| `{{lblEmployeeNo}}` | Employee No |
| `{{lblEmployeeName}}` | Employee Name |
| `{{lblDesignation}}` | Designation |
| `{{lblDepartment}}` | Department |
| `{{lblEpfNo}}` | EPF No |
| `{{lblBankName}}` | Bank |
| `{{lblBankBranch}}` | Branch |
| `{{lblAccountNo}}` | Account No |

---

## Dynamic Table Rows

These tokens auto-generate a full set of `<tr>` rows — one row per component.
Drop them inside a `<tbody>`.

| Token | Generates |
|---|---|
| `{{EARNINGS_ROWS}}` | One `<tr>` per earning (basic + FA + OT + VA) |
| `{{DEDUCTIONS_ROWS}}` | One `<tr>` per deduction (FD + VD + NOPAY + LATE + EPF + PAYE) |
| `{{EMPLOYER_ROWS}}` | One `<tr>` for EPF employer + ETF |

**Example:**
```html
<table>
  <tbody>{{EARNINGS_ROWS}}</tbody>
</table>
```

Use these when you want all components listed automatically without knowing the
codes in advance. Use per-component tokens when you want a fixed layout.

---

## Template Approaches

### Approach 1 — Fixed Layout (per-component tokens)

Best when you know exactly which allowances/deductions apply and want full
control over layout.

```html
<table>
  <tr>
    <td>{{lblBasicSalary}}</td>
    <td>{{BASIC_SALARY}}</td>
  </tr>
  <tr>
    <td>{{lbl_FA001}}</td>
    <td>{{FA001}}</td>
  </tr>
  <tr>
    <td>{{lbl_FA002}}</td>
    <td>{{FA002}}</td>
  </tr>
</table>
```

**Limitation:** If an employee doesn't have a particular component, the token
resolves to `0.00` or an empty label — it does not hide the row automatically.

### Approach 2 — Dynamic Layout (EARNINGS_ROWS / DEDUCTIONS_ROWS)

Best when different employees have different components.

```html
<table>
  <thead>
    <tr><th>Description</th><th>Amount</th></tr>
  </thead>
  <tbody>{{EARNINGS_ROWS}}</tbody>
</table>
```

Only components with a non-zero amount are included.

### Approach 3 — Mixed

Show fixed rows for known items (basic, EPF, net pay) and use dynamic rows for
the variable components in between.

```html
<tr><td>{{lblBasicSalary}}</td><td>{{BASIC_SALARY}}</td></tr>
{{EARNINGS_ROWS}}
<tr><td>{{lblGrossPay}}</td><td>{{GROSS_PAY}}</td></tr>
```

---

## Overtime & No-Pay Table Example

```html
<!-- Overtime detail -->
<table>
  <thead>
    <tr>
      <th>OT Type</th>
      <th>Hours</th>
      <th>Amount</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>{{lbl_OT001}}</td>
      <td>{{OT001_HOURS}}</td>
      <td>{{OT001_AMOUNT}}</td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <td colspan="2">{{lblOvertime}}</td>
      <td>{{OT_AMOUNT}}</td>
    </tr>
  </tfoot>
</table>

<!-- No-Pay detail -->
<table>
  <thead>
    <tr>
      <th>No-Pay Type</th>
      <th>Days</th>
      <th>Amount</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>{{lbl_NP001}}</td>
      <td>{{NP001_DAYS}}</td>
      <td>{{NP001_AMOUNT}}</td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <td colspan="2">{{lblNopay}}</td>
      <td>{{NOPAY_AMOUNT}}</td>
    </tr>
  </tfoot>
</table>
```

---

## Tips

**Tokens are case-sensitive.**
`{{basic_salary}}` will NOT work — always use uppercase: `{{BASIC_SALARY}}`.

**Unresolved tokens stay as-is.**
If a token has no value, it is left in the output literally (e.g. `{{FA999}}`).
Use the debug endpoint to confirm a token resolves before publishing the template.

**Logo rendering.**
`{{COMPANY_LOGO}}` outputs a base64 data URI. Use it as an `<img src>`:
```html
<img src="{{COMPANY_LOGO}}" alt="{{COMPANY_NAME}}" style="max-height:60px;"/>
```

**iText CSS support.**
The template is rendered by iText HTML2PDF which supports a subset of CSS.
Avoid `flexbox` and `grid` — use `display:table` / `display:table-cell` for
multi-column layouts. Inline styles are the most reliable.

**Page size.**
Set the page size in CSS:
```css
@page { size: A4 portrait; margin: 14mm; }
```

**Preview before saving.**
Click the **Preview** button (↗ icon) in the editor to open the raw HTML in a
new browser tab. Note: tokens won't be replaced in this preview — it shows the
HTML structure only. For a real PDF preview with actual values, use the
Pay Slip page and select an employee.
