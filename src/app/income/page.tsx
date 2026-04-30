"use client";

import { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import IncomeList from "@/components/IncomeList";
import { Income, IncomeSummary, UserSettings } from "@/types";

export default function IncomePage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [summary, setSummary] = useState<IncomeSummary | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <IncomeList
          incomes={incomes}
          summary={summary}
          loading={loading}
          earnCurrency={settings?.earnCurrency ?? "INR"}
          onRefresh={fetchAll}
        />
      </main>
    </div>
  );
}
