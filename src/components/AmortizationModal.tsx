"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Emi, AmortizationRow } from "@/types";
import { formatCurrency } from "@/lib/constants";

interface Props {
  emiId: string;
  paidMonths: number;
  onClose: () => void;
}

export default function AmortizationModal({ emiId, paidMonths, onClose }: Props) {
  const [schedule, setSchedule] = useState<AmortizationRow[]>([]);
  const [emi, setEmi] = useState<Emi | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/emis/${emiId}/schedule`)
      .then((r) => r.json())
      .then((d) => { setSchedule(d.schedule ?? []); setEmi(d.emi ?? null); })
      .finally(() => setLoading(false));
  }, [emiId]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const totalPrincipal = schedule.reduce((s, r) => s + r.principalComponent, 0);
  const totalInterest = schedule.reduce((s, r) => s + r.interestComponent, 0);
  const totalPayment = totalPrincipal + totalInterest;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">{emi?.loanName ?? "Amortization Schedule"}</h2>
            {emi && <p className="text-sm text-gray-500">{emi.lenderName} · {emi.tenureMonths} months</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Month</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Date</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">EMI</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Principal</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Interest</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((row) => {
                    const isPaid = row.month <= paidMonths;
                    return (
                      <tr key={row.month} className={`border-b border-gray-50 ${isPaid ? "opacity-40" : "hover:bg-gray-50"}`}>
                        <td className="px-4 py-2.5 text-gray-500">
                          {row.month}
                          {isPaid && <span className="ml-1 text-xs text-emerald-500">✓</span>}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{row.date}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-gray-900">{formatCurrency(row.emiAmount, 0)}</td>
                        <td className="px-4 py-2.5 text-right text-emerald-600">{formatCurrency(row.principalComponent, 0)}</td>
                        <td className="px-4 py-2.5 text-right text-rose-500">{formatCurrency(row.interestComponent, 0)}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{formatCurrency(row.remainingBalance, 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-100 px-6 py-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400">Total Principal</p>
                <p className="font-semibold text-emerald-600">{formatCurrency(totalPrincipal, 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Interest</p>
                <p className="font-semibold text-rose-500">{formatCurrency(totalInterest, 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Payment</p>
                <p className="font-semibold text-gray-900">{formatCurrency(totalPayment, 0)}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
