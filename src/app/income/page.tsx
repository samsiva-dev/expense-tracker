"use client";

import { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import IncomeList from "@/components/IncomeList";
import IncomeChart, { IncomeTrend } from "@/components/IncomeChart";
import { Income, IncomeSummary, UserSettings } from "@/types";

export default function IncomePage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [summary, setSummary] = useState<IncomeSummary | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [trend, setTrend] = useState<IncomeTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTrend, setLoadingTrend] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [incomeRes, summaryRes, settingsRes] = await Promise.all([
        fetch("/api/income"),
        fetch("/api/income/summary"),
        fetch("/api/settings"),
      ]);
      if (incomeRes.ok) setIncomes(await incomeRes.json());
      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (settingsRes.ok) setSettings(await settingsRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrend = useCallback(async () => {
    setLoadingTrend(true);
    try {
      const res = await fetch("/api/income/trend");
      if (res.ok) setTrend(await res.json());
    } finally {
      setLoadingTrend(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    fetchTrend();
  }, [fetchAll, fetchTrend]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <IncomeChart data={trend} loading={loadingTrend} />
        <div className="mt-6">
          <IncomeList
            incomes={incomes}
            summary={summary}
            loading={loading}
            earnCurrency={settings?.earnCurrency ?? "INR"}
            onRefresh={fetchAll}
          />
        </div>
      </main>
    </div>
  );
}
