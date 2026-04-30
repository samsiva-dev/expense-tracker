"use client";

import { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import EmiList from "@/components/EmiList";
import { Emi } from "@/types";

export default function EmisPage() {
  const [emis, setEmis] = useState<Emi[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmis = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/emis");
      if (res.ok) setEmis(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmis(); }, [fetchEmis]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EmiList emis={emis} loading={loading} onRefresh={fetchEmis} />
      </main>
    </div>
  );
}
