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
