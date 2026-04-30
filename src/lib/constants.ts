export function formatCurrency(value: number, decimals = 0, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export const CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Health & Medical",
  "Education",
  "Travel",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_COLORS: Record<string, string> = {
  "Food & Dining": "#FF6B6B",
  Transportation: "#4ECDC4",
  Shopping: "#45B7D1",
  Entertainment: "#96CEB4",
  "Bills & Utilities": "#F59E0B",
  "Health & Medical": "#DDA0DD",
  Education: "#6EE7B7",
  Travel: "#FCD34D",
  Other: "#94A3B8",
};

export const CATEGORY_BG: Record<string, string> = {
  "Food & Dining": "bg-red-100 text-red-700",
  Transportation: "bg-teal-100 text-teal-700",
  Shopping: "bg-sky-100 text-sky-700",
  Entertainment: "bg-green-100 text-green-700",
  "Bills & Utilities": "bg-amber-100 text-amber-700",
  "Health & Medical": "bg-purple-100 text-purple-700",
  Education: "bg-emerald-100 text-emerald-700",
  Travel: "bg-yellow-100 text-yellow-700",
  Other: "bg-slate-100 text-slate-700",
};

export const SUPPORTED_CURRENCIES = ["INR", "AED", "USD", "GBP", "EUR", "SGD"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const INCOME_TYPES = ["SALARY", "FREELANCE", "BONUS", "OTHER"] as const;
export type IncomeTypeConst = (typeof INCOME_TYPES)[number];

export const LOAN_TYPES = ["PERSONAL", "HOME", "CAR"] as const;
export type LoanTypeConst = (typeof LOAN_TYPES)[number];

export const LOAN_TYPE_LABELS: Record<string, string> = {
  PERSONAL: "Personal Loan",
  HOME: "Home Loan",
  CAR: "Car / Vehicle Loan",
};

export const LOAN_TYPE_BG: Record<string, string> = {
  PERSONAL: "bg-blue-100 text-blue-700",
  HOME: "bg-green-100 text-green-700",
  CAR: "bg-orange-100 text-orange-700",
};

export const INCOME_TYPE_LABELS: Record<string, string> = {
  SALARY: "Salary",
  FREELANCE: "Freelance",
  BONUS: "Bonus",
  OTHER: "Other",
};

export const INCOME_TYPE_BG: Record<string, string> = {
  SALARY: "bg-indigo-100 text-indigo-700",
  FREELANCE: "bg-violet-100 text-violet-700",
  BONUS: "bg-emerald-100 text-emerald-700",
  OTHER: "bg-slate-100 text-slate-700",
};
