"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { formatCurrency } from "@/lib/constants";

interface Props {
  category: string;
  currentLimit: number | null;
  budgetId: string | null;
  month: number;
  year: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function BudgetForm({ category, currentLimit, budgetId, month, year, onSuccess, onCancel }: Props) {
  const [amount, setAmount] = useState<string>(currentLimit ? currentLimit.toString() : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return setError("Enter a valid amount.");
    setLoading(true);
    setError("");
    try {
      const res = await fetch(budgetId ? `/api/budgets/${budgetId}` : "/api/budgets", {
        method: budgetId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, amount: val, month, year }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to save.");
        return;
      }
      onSuccess();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!budgetId) return;
    if (!confirm("Remove this budget limit?")) return;
    setLoading(true);
    await fetch(`/api/budgets/${budgetId}`, { method: "DELETE" });
    onSuccess();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">{budgetId ? "Edit" : "Set"} Budget Limit</h2>
            <p className="text-sm text-gray-500">{category}</p>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Limit (INR)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>
            {currentLimit && (
              <p className="text-xs text-gray-400 mt-1">Current limit: {formatCurrency(currentLimit)}</p>
            )}
          </div>

          <div className="flex gap-2">
            {budgetId && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
              >
                Remove
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
