"use client";

import { useState, useEffect } from "react";
import { Loan, LoanFormData } from "@/types";
import { X } from "lucide-react";
import { format } from "date-fns";

interface LoanFormProps {
  initial?: Loan;
  onSuccess: () => void;
  onCancel: () => void;
}

const defaultForm: LoanFormData = {
  lenderName: "",
  amount: 0,
  borrowedDate: format(new Date(), "yyyy-MM-dd"),
  dueDate: "",
  notes: "",
};

export default function LoanForm({ initial, onSuccess, onCancel }: LoanFormProps) {
  const isEdit = !!initial;
  const [form, setForm] = useState<LoanFormData>(
    initial
      ? {
          lenderName: initial.lenderName,
          amount: initial.amount,
          borrowedDate: format(new Date(initial.borrowedDate), "yyyy-MM-dd"),
          dueDate: initial.dueDate ? format(new Date(initial.dueDate), "yyyy-MM-dd") : "",
          notes: initial.notes ?? "",
        }
      : defaultForm
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === "amount" ? parseFloat(value) || 0 : value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.lenderName.trim()) return setError("Lender name is required.");
    if (!form.amount || form.amount <= 0) return setError("Amount must be greater than 0.");
    if (!form.borrowedDate) return setError("Borrowed date is required.");

    setLoading(true);
    try {
      const url = isEdit ? `/api/loans/${initial!.id}` : "/api/loans";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lenderName: form.lenderName.trim(),
          amount: form.amount,
          borrowedDate: form.borrowedDate,
          dueDate: form.dueDate || undefined,
          notes: form.notes || undefined,
          ...(isEdit && { status: initial!.status }),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
        return;
      }
      onSuccess();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Loan" : "Add Loan"}
          </h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Lender Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lender Name <span className="text-red-400">*</span>
            </label>
            <input
              name="lenderName"
              value={form.lenderName}
              onChange={handleChange}
              placeholder="e.g. Rahul, Priya"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (INR) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
              <input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                value={form.amount || ""}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Borrowed Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Borrowed Date <span className="text-red-400">*</span>
            </label>
            <input
              name="borrowedDate"
              type="date"
              value={form.borrowedDate}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              name="dueDate"
              type="date"
              value={form.dueDate}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Why you borrowed, purpose, etc."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Saving…" : isEdit ? "Update" : "Add Loan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
