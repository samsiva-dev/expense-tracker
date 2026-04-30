"use client";

import { useState } from "react";
import { Income, IncomeSummary } from "@/types";
import { formatCurrency, INCOME_TYPE_LABELS, INCOME_TYPE_BG } from "@/lib/constants";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, TrendingUp, ArrowUpRight, Home, CreditCard } from "lucide-react";
import IncomeForm from "./IncomeForm";

interface Props {
  incomes: Income[];
  summary: IncomeSummary | null;
  loading: boolean;
  earnCurrency: string;
  onRefresh: () => void;
}

export default function IncomeList({ incomes, summary, loading, earnCurrency, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editIncome, setEditIncome] = useState<Income | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this income record?")) return;
    setDeletingId(id);
    await fetch(`/api/income/${id}`, { method: "DELETE" });
    setDeletingId(null);
    onRefresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Income & Remittance</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track earnings and money sent home</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* Monthly Summary Banner */}
      {summary && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <ArrowUpRight className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-emerald-600 font-medium">Earned This Month</p>
                <p className="text-lg font-bold text-emerald-700">{formatCurrency(summary.totalIncomeInr)}</p>
                <p className="text-xs text-emerald-500">INR equivalent</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <Home className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-amber-600 font-medium">Sent Home</p>
                <p className="text-lg font-bold text-amber-700">{formatCurrency(summary.totalRemittance)}</p>
                <p className="text-xs text-amber-500">Remittance</p>
              </div>
            </div>
            <div className={`border rounded-xl px-4 py-3 flex items-center gap-3 ${summary.netKept >= 0 ? "bg-indigo-50 border-indigo-100" : "bg-red-50 border-red-100"}`}>
              <TrendingUp className={`w-5 h-5 flex-shrink-0 ${summary.netKept >= 0 ? "text-indigo-600" : "text-red-600"}`} />
              <div>
                <p className={`text-xs font-medium ${summary.netKept >= 0 ? "text-indigo-600" : "text-red-600"}`}>Net Kept</p>
                <p className={`text-lg font-bold ${summary.netKept >= 0 ? "text-indigo-700" : "text-red-700"}`}>
                  {summary.netKept < 0 ? "-" : ""}{formatCurrency(Math.abs(summary.netKept))}
                </p>
                <p className={`text-xs ${summary.netKept >= 0 ? "text-indigo-500" : "text-red-400"}`}>After all deductions</p>
              </div>
            </div>
          </div>

          {/* Deduction breakdown */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Deductions this month</p>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-gray-600">
                <span className="flex items-center gap-1.5"><Home className="w-3.5 h-3.5 text-amber-500" /> Remittance sent home</span>
                <span className="font-medium text-rose-500">− {formatCurrency(summary.totalRemittance)}</span>
              </div>
              {summary.totalMonthlyEmi > 0 && (
                <div className="flex justify-between items-center text-gray-600">
                  <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-blue-500" /> Active EMI payments</span>
                  <span className="font-medium text-rose-500">− {formatCurrency(summary.totalMonthlyEmi)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-gray-600">
                <span>Other expenses</span>
                <span className="font-medium text-rose-500">
                  − {formatCurrency(summary.totalIncomeInr - summary.totalRemittance - summary.totalMonthlyEmi - summary.netKept)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-1.5 flex justify-between items-center font-semibold text-gray-800">
                <span>Net Kept</span>
                <span className={summary.netKept >= 0 ? "text-indigo-700" : "text-red-600"}>
                  {summary.netKept < 0 ? "-" : ""}{formatCurrency(Math.abs(summary.netKept))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Income List */}
      {incomes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <TrendingUp className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-base font-medium">No income records yet</p>
          <p className="text-sm mt-1">Tap &quot;Add&quot; to log your salary or earnings.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incomes.map((income) => {
            const typeBg = INCOME_TYPE_BG[income.type] ?? "bg-slate-100 text-slate-700";
            const typeLabel = INCOME_TYPE_LABELS[income.type] ?? income.type;
            const isForeign = income.currency !== "INR";

            return (
              <div key={income.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeBg}`}>{typeLabel}</span>
                    {income.remittanceAmount && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium flex items-center gap-1">
                        <Home className="w-3 h-3" /> Sent {formatCurrency(income.remittanceAmount)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-gray-500">
                    <span>{format(new Date(income.date), "dd MMM yyyy")}</span>
                    {income.description && <span>· {income.description}</span>}
                    {income.remittanceNote && <span>· {income.remittanceNote}</span>}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-base font-bold text-gray-900">
                    {isForeign
                      ? `${income.currency} ${income.amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                      : formatCurrency(income.amount, 0)}
                  </p>
                  {isForeign && (
                    <p className="text-xs text-gray-400">≈ {formatCurrency(income.amountInr, 0)} INR</p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={() => setEditIncome(income)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(income.id)} disabled={deletingId === income.id}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <IncomeForm
          defaultEarnCurrency={earnCurrency}
          onSuccess={() => { setShowForm(false); onRefresh(); }}
          onCancel={() => setShowForm(false)}
        />
      )}
      {editIncome && (
        <IncomeForm
          initial={editIncome}
          defaultEarnCurrency={earnCurrency}
          onSuccess={() => { setEditIncome(null); onRefresh(); }}
          onCancel={() => setEditIncome(null)}
        />
      )}
    </div>
  );
}
