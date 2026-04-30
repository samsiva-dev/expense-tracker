"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Emi, EmiFormData, LoanType } from "@/types";
import { LOAN_TYPES, LOAN_TYPE_LABELS, formatCurrency } from "@/lib/constants";
import { calculateEmi } from "@/lib/emi";
import { format } from "date-fns";

interface Props {
  initial?: Emi;
  onSuccess: () => void;
  onCancel: () => void;
}

const defaultForm: EmiFormData = {
  loanName: "",
  lenderName: "",
  loanType: "PERSONAL",
  principal: 0,
  interestRate: 0,
  tenureMonths: 12,
  startDate: format(new Date(), "yyyy-MM-dd"),
  paidMonths: 0,
  notes: "",
};

export default function EmiForm({ initial, onSuccess, onCancel }: Props) {
  const isEdit = !!initial;
  const [form, setForm] = useState<EmiFormData>(
    initial
      ? {
          loanName: initial.loanName,
          lenderName: initial.lenderName,
          loanType: initial.loanType as LoanType,
          principal: initial.principal,
          interestRate: initial.interestRate,
          tenureMonths: initial.tenureMonths,
          startDate: format(new Date(initial.startDate), "yyyy-MM-dd"),
          paidMonths: initial.paidMonths,
          notes: initial.notes ?? "",
        }
      : defaultForm
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
    if (["principal", "interestRate", "tenureMonths", "paidMonths"].includes(name)) {
      setForm((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  }

  const emiPreview = form.principal > 0 && form.tenureMonths > 0
    ? calculateEmi(form.principal, form.interestRate, form.tenureMonths)
    : 0;
  const totalPayment = emiPreview * form.tenureMonths;
  const totalInterest = totalPayment - form.principal;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.loanName.trim()) return setError("Loan name is required.");
    if (!form.lenderName.trim()) return setError("Lender name is required.");
    if (!form.principal || form.principal <= 0) return setError("Principal must be greater than 0.");
    if (form.interestRate < 0) return setError("Interest rate cannot be negative.");
    if (!form.tenureMonths || form.tenureMonths < 1) return setError("Tenure must be at least 1 month.");
    if (!form.startDate) return setError("Start date is required.");
    setLoading(true);
    setError("");
    try {
      const url = isEdit ? `/api/emis/${initial!.id}` : "/api/emis";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanName: form.loanName.trim(),
          lenderName: form.lenderName.trim(),
          loanType: form.loanType,
          principal: form.principal,
          interestRate: form.interestRate,
          tenureMonths: form.tenureMonths,
          startDate: form.startDate,
          paidMonths: form.paidMonths || 0,
          notes: form.notes || undefined,
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
          <h2 className="text-lg font-semibold text-gray-900">{isEdit ? "Edit EMI" : "Add EMI"}</h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

          {/* Loan Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loan Name <span className="text-red-400">*</span></label>
            <input name="loanName" value={form.loanName} onChange={handleChange}
              placeholder="e.g. HDFC Home Loan"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {/* Lender + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lender <span className="text-red-400">*</span></label>
              <input name="lenderName" value={form.lenderName} onChange={handleChange}
                placeholder="e.g. HDFC Bank"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-400">*</span></label>
              <select name="loanType" value={form.loanType} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {LOAN_TYPES.map((t) => <option key={t} value={t}>{LOAN_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
          </div>

          {/* Principal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Principal Amount (₹) <span className="text-red-400">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
              <input name="principal" type="number" min="1" step="1" value={form.principal || ""} onChange={handleChange}
                placeholder="e.g. 500000"
                className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          {/* Rate + Tenure */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Annual Rate (%) <span className="text-red-400">*</span></label>
              <input name="interestRate" type="number" min="0" step="0.01" value={form.interestRate || ""} onChange={handleChange}
                placeholder="e.g. 10.5"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tenure (months) <span className="text-red-400">*</span></label>
              <input name="tenureMonths" type="number" min="1" step="1" value={form.tenureMonths || ""} onChange={handleChange}
                placeholder="e.g. 240"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              {form.tenureMonths >= 12 && (
                <p className="text-xs text-gray-400 mt-1">{(form.tenureMonths / 12).toFixed(1)} years</p>
              )}
            </div>
          </div>

          {/* Start Date + Already Paid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First EMI Date <span className="text-red-400">*</span></label>
              <input name="startDate" type="date" value={form.startDate} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Already Paid (months)</label>
              <input name="paidMonths" type="number" min="0" step="1" value={form.paidMonths || 0} onChange={handleChange}
                placeholder="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <p className="text-xs text-gray-400 mt-1">
                {form.tenureMonths - (form.paidMonths || 0)} months remaining
              </p>
            </div>
          </div>

          {/* EMI Preview */}
          {emiPreview > 0 && (
            <div className="bg-indigo-50 rounded-xl px-4 py-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly EMI</span>
                <span className="font-bold text-indigo-700">{formatCurrency(emiPreview, 2)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Total Payment</span>
                <span>{formatCurrency(totalPayment, 0)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Total Interest</span>
                <span className="text-rose-500">{formatCurrency(totalInterest, 0)}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
              placeholder="Account number, purpose, etc."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {loading ? "Saving…" : isEdit ? "Update" : "Add EMI"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
