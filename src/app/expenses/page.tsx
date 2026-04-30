"use client";

import { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ExpenseList from "@/components/ExpenseList";
import BudgetProgressList from "@/components/BudgetProgressList";
import { Expense } from "@/types";
import { Receipt, ChevronDown, ChevronUp } from "lucide-react";

interface BudgetStatusItem {
  category: string;
  limit: number | null;
  spent: number;
  percentage: number;
  status: "ok" | "warning" | "exceeded";
  budgetId: string | null;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [budgetStatuses, setBudgetStatuses] = useState<BudgetStatusItem[]>([]);
  const [loadingBudgets, setLoadingBudgets] = useState(true);
  const [budgetOpen, setBudgetOpen] = useState(true);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/expenses");
      if (res.ok) setExpenses(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBudgets = useCallback(async () => {
    setLoadingBudgets(true);
    try {
      const res = await fetch(`/api/budgets/status?month=${month}&year=${year}`);
      if (res.ok) setBudgetStatuses(await res.json());
    } finally {
      setLoadingBudgets(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchExpenses();
    fetchBudgets();
  }, [fetchExpenses, fetchBudgets]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <Receipt className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
            <p className="text-sm text-gray-500">Manage all your expense records</p>
          </div>
        </div>

        {/* Budget Status Panel */}
        <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <button
            onClick={() => setBudgetOpen((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4"
          >
            <h2 className="text-sm font-semibold text-gray-700">Monthly Budget Status</h2>
            {budgetOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {budgetOpen && (
            <div className="px-6 pb-5">
              <BudgetProgressList
                statuses={budgetStatuses}
                loading={loadingBudgets}
                month={month}
                year={year}
                onRefresh={fetchBudgets}
              />
            </div>
          )}
        </div>

        <ExpenseList expenses={expenses} loading={loading} onRefresh={fetchExpenses} />
      </main>
    </div>
  );
}
