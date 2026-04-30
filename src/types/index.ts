export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  description?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseFormData {
  title: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  color: string;
}

export interface MonthlyTrend {
  month: string;
  total: number;
}

export interface SummaryData {
  totalThisMonth: number;
  totalLastMonth: number;
  totalAllTime: number;
  monthOverMonthChange: number;
  topCategory: string;
  categoryBreakdown: CategoryBreakdown[];
  monthlyTrend: MonthlyTrend[];
}

export interface Loan {
  id: string;
  lenderName: string;
  amount: number;
  borrowedDate: string;
  dueDate?: string | null;
  status: "PENDING" | "PAID";
  notes?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoanFormData {
  lenderName: string;
  amount: number;
  borrowedDate: string;
  dueDate?: string;
  notes?: string;
}

export type BillingCycle = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: BillingCycle;
  nextDueDate: string;
  category: string;
  description?: string | null;
  isActive: boolean;
  trackInExpenses: boolean;
  minimumCharge?: number | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionFormData {
  name: string;
  amount: number;
  billingCycle: BillingCycle;
  nextDueDate: string;
  category: string;
  description?: string;
  isActive: boolean;
  trackInExpenses: boolean;
  minimumCharge?: number;
}

// Budget
export interface Budget {
  id: string;
  category: string;
  amount: number;
  month: number;
  year: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetStatus {
  category: string;
  limit: number | null;
  spent: number;
  percentage: number;
  status: "ok" | "warning" | "exceeded";
}

// Notifications
export type NotificationType = "SUBSCRIPTION_DUE" | "BUDGET_EXCEEDED" | "LOAN_OVERDUE";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string | null;
  relatedType?: string | null;
  createdAt: string;
}

// Income
export type IncomeType = "SALARY" | "FREELANCE" | "BONUS" | "OTHER";

export interface Income {
  id: string;
  amount: number;
  currency: string;
  amountInr: number;
  exchangeRate: number;
  type: IncomeType;
  date: string;
  description?: string | null;
  remittanceAmount?: number | null;
  remittanceNote?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeFormData {
  amount: number;
  currency: string;
  exchangeRate: number;
  type: IncomeType;
  date: string;
  description?: string;
  remittanceAmount?: number;
  remittanceNote?: string;
}

export interface IncomeSummary {
  totalIncomeInr: number;
  totalRemittance: number;
  totalMonthlyEmi: number;
  netKept: number;
}

// User Settings
export interface UserSettings {
  id: string;
  userId: string;
  baseCurrency: string;
  earnCurrency: string;
}

// EMI
export type LoanType = "PERSONAL" | "HOME" | "CAR";

export interface Emi {
  id: string;
  loanName: string;
  lenderName: string;
  loanType: LoanType;
  principal: number;
  interestRate: number;
  tenureMonths: number;
  startDate: string;
  emiAmount: number;
  paidMonths: number;
  status: "ACTIVE" | "CLOSED";
  notes?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmiFormData {
  loanName: string;
  lenderName: string;
  loanType: LoanType;
  principal: number;
  interestRate: number;
  tenureMonths: number;
  startDate: string;
  paidMonths: number;
  notes?: string;
}

export interface AmortizationRow {
  month: number;
  date: string;
  emiAmount: number;
  principalComponent: number;
  interestComponent: number;
  remainingBalance: number;
}
