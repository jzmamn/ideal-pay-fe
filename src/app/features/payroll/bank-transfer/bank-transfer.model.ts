export type TransferType   = 'SALARY' | 'SALARY_ADVANCE' | 'FIXED_ALLOWANCE' | 'BONUS';
export type TransferStatus = 'PENDING' | 'TRANSFERRED' | 'FAILED';

export const TRANSFER_TYPE_LABELS: Record<TransferType, string> = {
  SALARY:           'Salary',
  SALARY_ADVANCE:   'Salary Advance',
  FIXED_ALLOWANCE:  'Fixed Allowances',
  BONUS:            'Bonus',
};

// ── Bank file template ────────────────────────────────────────────────────────

/**
 * One template per bank.  Three free-form sections rendered around each
 * detail line.  Supported tokens:
 *
 *  Header / Footer : {{date}} {{bank_name}} {{bank_code}}
 *                    {{record_count}} {{total_amount}}
 *  Detail          : {{employee_no}} {{name}} {{account_no}}
 *                    {{bank_code}} {{branch_code}} {{amount}} {{date}}
 */
export interface BankTransferTemplate {
  id?:             number;
  bankId:          number;
  bankCode:        string;
  bankName:        string;
  headerTemplate:  string;
  detailTemplate:  string;
  footerTemplate:  string;
  /** File extension without dot, e.g. "txt" or "csv". */
  fileExtension:   string;
}

export const TEMPLATE_TOKENS: Record<'header' | 'detail' | 'footer', string[]> = {
  header:  ['{{date}}', '{{bank_name}}', '{{bank_code}}', '{{record_count}}', '{{total_amount}}'],
  detail:  ['{{employee_no}}', '{{name}}', '{{account_no}}', '{{bank_code}}', '{{branch_code}}', '{{amount}}', '{{date}}'],
  footer:  ['{{record_count}}', '{{total_amount}}', '{{date}}'],
};

// ── Transfer row (one per employee per payroll run) ───────────────────────────

export interface BankTransferRow {
  runId:                number;
  empId:                number;
  employeeNo:           string;
  empName:              string;
  jobCategoryId:        number | null;
  jobCategoryName:      string | null;
  branchId:             number | null;
  branchName:           string | null;
  bankId:               number | null;
  bankCode:             string | null;
  bankName:             string | null;
  branchCode:           string | null;
  accountNo:            string | null;
  salaryAmount:         number;
  salaryAdvanceAmount:  number;
  fixedAllowanceAmount: number;
  bonusAmount:          number;
  /** Pre-computed by the service based on the selected TransferTypes. */
  totalAmount:          number;
  transferStatus:       TransferStatus;
  transferredAt?:       string | null;
}

// ── Bank group (for "by bank" view) ──────────────────────────────────────────

export interface BankGroup {
  bankId:        number | null;
  bankCode:      string | null;
  bankName:      string;
  template:      BankTransferTemplate | null;
  rows:          BankTransferRow[];
  total:         number;
  fileGenerated: boolean;
}
