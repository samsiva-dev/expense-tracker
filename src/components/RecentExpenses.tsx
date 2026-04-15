"use client";

import { Expense } from "@/types";
import { CATEGORY_BG, formatCurrency } from "@/lib/constants";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface RecentExpensesProps {
  expenses: Expense[];
  loading: boolean;
}

export default function RecentExpenses({ expenses, loading }: RecentExpensesProps) {
  const recent = expenses.slice(0, 5);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <h3 className="text-sm font-semibold text-gray-700">Recent Expenses</h3>
        <Link
          href="/expenses"
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="divide-y divide-gray-50">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 px-6 py-4 animate-pulse">
              <div className="w-16 h-4 bg-gray-100 rounded" />
              <div className="flex-1 h-4 bg-gray-100 rounded" />
              <div className="w-10 h-4 bg-gray-100 rounded" />
              <div className="w-16 h-4 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : recent.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="text-gray-400 text-sm">No expenses yet</p>
          <p className="text-gray-300 text-xs mt-1">
            Head to the{" "}
            <Link href="/expenses" className="text-indigo-400 hover:underline">
              Expenses
            </Link>{" "}
            page to add your first expense
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {recent.map((expense) => (
            <div key={expense.id} className="flex items-center gap-3 px-6 py-3.5">
              <span className="text-xs text-gray-400 w-20 flex-shrink-0">
                {format(new Date(expense.date), "MMM d, yyyy")}
              </span>
              <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                {expense.title}
              </span>
              <span
                className={`hidden sm:inline-flex text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                  CATEGORY_BG[expense.category] ?? "bg-slate-100 text-slate-700"
                }`}
              >
                {expense.category}
              </span>
              <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                {formatCurrency(expense.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
