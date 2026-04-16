"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import LoanList from "@/components/LoanList";
import { Loan } from "@/types";

export default function LoansPage() {
  const { data: session } = useSession();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/loans");
      if (res.ok) {
        const data = await res.json();
        setLoans(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) fetchLoans();
  }, [session, fetchLoans]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoanList loans={loans} loading={loading} onRefresh={fetchLoans} />
      </main>
    </div>
  );
}
