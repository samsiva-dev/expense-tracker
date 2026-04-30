"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Income, IncomeFormData, IncomeType } from "@/types";
import { SUPPORTED_CURRENCIES, INCOME_TYPES, INCOME_TYPE_LABELS, formatCurrency } from "@/lib/constants";
import { format } from "date-fns";

interface Props {
  initial?: Income;
  defaultEarnCurrency?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const defaultForm: IncomeFormData = {
  amount: 0,
  currency: "INR",
  exchangeRate: 1,
  type: "SALARY",
  date: format(new Date(), "yyyy-MM-dd"),
  description: "",
  remittanceAmount: undefined,
  remittanceNote: "",
};

export default function IncomeForm({ initial, defaultEarnCurrency = "INR", onSuccess, onCancel }: Props) {
  const isEdit = !!initial;
  const [form, setForm] = useState<IncomeFormData>(
    initial
      ? {
          amount: initial.amount,
          currency: initial.currency,
          exchangeRate: initial.exchangeRate,
          type: initial.type as IncomeType,
          date: format(new Date(initial.date), "yyyy-MM-dd"),
          description: initial.description ?? "",
          remittanceAmount: initial.remittanceAmount ?? undefined,
          remittanceNote: initial.remittanceNote ?? "",
        }
      : { ...defaultForm, currency: defaultEarnCurrency }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    if (["amount", "exchangeRate", "remittanceAmount"].includes(name)) {
      setForm((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else if (name === "currency") {
      setForm((prev) => ({ ...prev, currency: value, exchangeRate: value === "INR" ? 1 : prev.exchangeRate }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  }

  const amountInrPreview = form.currency === "INR" ? form.amount : form.amount * (form.exchangeRate || 1);
  const isForeignCurrency = form.currency !== "INR";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || form.amount <= 0) return setError("Amount must be greater than 0.");
    if (!form.date) return setError("Date is required.");
    if (isForeignCurrency && (!form.exchangeRate || form.exchangeRate <= 0)) return setError("Enter a valid exchange rate.");
    setLoading(true);
    setError("");
    try {
      const url = isEdit ? `/api/income/${initial!.id}` : "/api/income";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: form.amount,
          currency: form.currency,
          exchangeRate: form.currency === "INR" ? 1 : form.exchangeRate,
          type: form.type,
          date: form.date,
          description: form.description || undefined,
          remittanceAmount: form.remittanceAmount && form.remittanceAmount > 0 ? form.remittanceAmount : undefined,
          remittanceNote: form.remittanceNote || undefined,
        }),
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900">{isEdit ? "Edit Income" : "Add Income"}</h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Income Type <span className="text-red-400">*</span></label>
            <select name="type" value={form.type} onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              {INCOME_TYPES.map((t) => <option key={t} value={t}>{INCOME_TYPE_LABELS[t]}</option>)}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-400">*</span></label>
            <input type="date" name="date" value={form.date} onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {/* Amount + Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount <span className="text-red-400">*</span></label>
              <input type="number" name="amount" min="0" step="0.01" value={form.amount || ""} onChange={handleChange}
                placeholder="0.00"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select name="currency" value={form.currency} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {SUPPORTED_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Exchange Rate (only for foreign currency) */}
          {isForeignCurrency && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exchange Rate (1 {form.currency} = ? INR)</label>
              <input type="number" name="exchangeRate" min="0" step="0.0001" value={form.exchangeRate || ""} onChange={handleChange}
                placeholder="e.g. 22.5 for AED"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <p className="text-xs text-indigo-600 mt-1">
                ≈ {formatCurrency(amountInrPreview, 0)} INR
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="text" name="description" value={form.description} onChange={handleChange}
              placeholder="e.g. April salary, bonus"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {/* Remittance */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Amount Sent Home (Remittance)</p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Amount in INR <span className="text-gray-400">(optional)</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <input type="number" name="remittanceAmount" min="0" step="0.01"
                  value={form.remittanceAmount || ""} onChange={handleChange}
                  placeholder="0.00"
                  className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-xs text-gray-500 mb-1">Note <span className="text-gray-400">(optional)</span></label>
              <input type="text" name="remittanceNote" value={form.remittanceNote} onChange={handleChange}
                placeholder="e.g. via Western Union, for parents"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {loading ? "Saving…" : isEdit ? "Update" : "Add Income"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
