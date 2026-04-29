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
}
