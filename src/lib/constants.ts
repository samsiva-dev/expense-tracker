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
