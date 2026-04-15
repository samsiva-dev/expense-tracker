"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import SummaryCards from "@/components/SummaryCards";
import CategoryChart from "@/components/CategoryChart";
import MonthlyChart from "@/components/MonthlyChart";
import RecentExpenses from "@/components/RecentExpenses";
import { SummaryData, Expense } from "@/types";
import { format } from "date-fns";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
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

  useEffect(() => {
    fetchSummary();
    fetchExpenses();
  }, [fetchSummary, fetchExpenses]);

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
