"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import SummaryCards from "@/components/SummaryCards";
import CategoryChart from "@/components/CategoryChart";
import MonthlyChart from "@/components/MonthlyChart";
import RecentExpenses from "@/components/RecentExpenses";
import { SummaryData, Expense, Loan } from "@/types";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/constants";
import Link from "next/link";
import { Landmark } from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(true);

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch("/api/summary");
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    setLoadingExpenses(true);
    try {
      const res = await fetch("/api/expenses");
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
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

  useEffect(() => {
    fetchSummary();
    fetchExpenses();
    fetchLoans();
  }, [fetchSummary, fetchExpenses, fetchLoans]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

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
        <SummaryCards data={summary} loading={loadingSummary} />

        {/* Loans banner */}
        {(() => {
          const pending = loans.filter((l) => l.status === "PENDING");
          if (pending.length === 0) return null;
          const total = pending.reduce((s, l) => s + l.amount, 0);
          return (
            <Link href="/loans" className="mt-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 hover:bg-amber-100 transition-colors">
              <Landmark className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1 text-sm">
                <span className="font-semibold text-amber-800">You have {pending.length} pending loan{pending.length > 1 ? "s" : ""}</span>
                <span className="text-amber-700"> totalling </span>
                <span className="font-semibold text-rose-600">{formatCurrency(total, 2)}</span>
              </div>
              <span className="text-xs text-amber-600 font-medium">View →</span>
            </Link>
          );
        })()}

        {/* Charts */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryChart
            data={summary?.categoryBreakdown ?? []}
            loading={loadingSummary}
          />
          <MonthlyChart
            data={summary?.monthlyTrend ?? []}
            loading={loadingSummary}
          />
        </div>

        {/* Recent Expenses */}
        <div className="mt-6">
          <RecentExpenses expenses={expenses} loading={loadingExpenses} />
        </div>
      </main>
    </div>
  );
}
