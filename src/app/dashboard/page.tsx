"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import SummaryCards from "@/components/SummaryCards";
import CategoryChart from "@/components/CategoryChart";
import MonthlyChart from "@/components/MonthlyChart";
import RecentExpenses from "@/components/RecentExpenses";
import BudgetProgressList from "@/components/BudgetProgressList";
import { SummaryData, Expense, Loan, IncomeSummary } from "@/types";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/constants";
import Link from "next/link";
import { Landmark, ChevronDown, ChevronUp } from "lucide-react";

interface BudgetStatusItem {
  category: string;
  limit: number | null;
  spent: number;
  percentage: number;
  status: "ok" | "warning" | "exceeded";
  budgetId: string | null;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [budgetStatuses, setBudgetStatuses] = useState<BudgetStatusItem[]>([]);
  const [incomeSummary, setIncomeSummary] = useState<IncomeSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [loadingBudgets, setLoadingBudgets] = useState(true);
  const [budgetOpen, setBudgetOpen] = useState(true);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch("/api/summary");
      if (res.ok) setSummary(await res.json());
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    setLoadingExpenses(true);
    try {
      const res = await fetch("/api/expenses");
      if (res.ok) setExpenses(await res.json());
    } finally {
      setLoadingExpenses(false);
    }
  }, []);

  const fetchLoans = useCallback(async () => {
    try {
      const res = await fetch("/api/loans");
      if (res.ok) setLoans(await res.json());
    } catch { /* non-critical */ }
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

  const fetchIncomeSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/income/summary");
      if (res.ok) setIncomeSummary(await res.json());
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => {
    fetchSummary();
    fetchExpenses();
    fetchLoans();
    fetchBudgets();
    fetchIncomeSummary();
  }, [fetchSummary, fetchExpenses, fetchLoans, fetchBudgets, fetchIncomeSummary]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const pendingLoans = loans.filter((l) => l.status === "PENDING");
  const overdueLoans = loans.filter((l) => l.status === "PENDING" && l.dueDate && new Date(l.dueDate) < now);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting()}, {session?.user?.name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {format(new Date(), "EEEE, MMMM d, yyyy")} — Here&apos;s your financial overview.
          </p>
        </div>

        {/* Summary Cards */}
        <SummaryCards data={summary} loading={loadingSummary} incomeSummary={incomeSummary} />

        {/* Banners */}
        <div className="mt-4 space-y-2">
          {overdueLoans.length > 0 && (
            <Link href="/loans" className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 hover:bg-red-100 transition-colors">
              <Landmark className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div className="flex-1 text-sm">
                <span className="font-semibold text-red-800">{overdueLoans.length} overdue loan{overdueLoans.length > 1 ? "s" : ""}</span>
                <span className="text-red-700"> — past their due date</span>
              </div>
              <span className="text-xs text-red-600 font-medium">View →</span>
            </Link>
          )}
          {pendingLoans.length > 0 && (
            <Link href="/loans" className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 hover:bg-amber-100 transition-colors">
              <Landmark className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1 text-sm">
                <span className="font-semibold text-amber-800">You have {pendingLoans.length} pending loan{pendingLoans.length > 1 ? "s" : ""}</span>
                <span className="text-amber-700"> totalling </span>
                <span className="font-semibold text-rose-600">{formatCurrency(pendingLoans.reduce((s, l) => s + l.amount, 0), 2)}</span>
              </div>
              <span className="text-xs text-amber-600 font-medium">View →</span>
            </Link>
          )}
        </div>

        {/* Charts */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryChart data={summary?.categoryBreakdown ?? []} loading={loadingSummary} />
          <MonthlyChart data={summary?.monthlyTrend ?? []} loading={loadingSummary} />
        </div>

        {/* Budget Status */}
        {(budgetStatuses.length > 0 || loadingBudgets) && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
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
        )}

        {/* Recent Expenses */}
        <div className="mt-6">
          <RecentExpenses expenses={expenses} loading={loadingExpenses} />
        </div>
      </main>
    </div>
  );
}
