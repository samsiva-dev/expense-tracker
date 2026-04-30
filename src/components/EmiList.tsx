"use client";

import { useState } from "react";
import { Emi } from "@/types";
import { formatCurrency, LOAN_TYPE_LABELS, LOAN_TYPE_BG } from "@/lib/constants";
import { format, addMonths } from "date-fns";
import { Plus, Pencil, Trash2, CheckCircle2, List, CreditCard, CheckCheck } from "lucide-react";
import EmiForm from "./EmiForm";
import AmortizationModal from "./AmortizationModal";

interface Props {
  emis: Emi[];
  loading: boolean;
  onRefresh: () => void;
}

export default function EmiList({ emis, loading, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editEmi, setEditEmi] = useState<Emi | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [scheduleEmiId, setScheduleEmiId] = useState<string | null>(null);
  const [scheduleEmiPaid, setScheduleEmiPaid] = useState(0);

  const active = emis.filter((e) => e.status === "ACTIVE");
  const closed = emis.filter((e) => e.status === "CLOSED");
  const monthlyTotal = active.reduce((s, e) => s + e.emiAmount, 0);

  async function handleDelete(id: string) {
    if (!confirm("Delete this EMI record?")) return;
    setDeletingId(id);
    await fetch(`/api/emis/${id}`, { method: "DELETE" });
    setDeletingId(null);
    onRefresh();
  }

  async function handleMarkEmiPaid(emi: Emi) {
    setMarkingId(emi.id);
    await fetch(`/api/emis/${emi.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markEmiPaid: true }),
    });
    setMarkingId(null);
    onRefresh();
  }

  async function handleClose(emi: Emi) {
    await fetch(`/api/emis/${emi.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CLOSED", paidMonths: emi.tenureMonths }),
    });
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
          <h1 className="text-2xl font-bold text-gray-900">EMIs</h1>
          {active.length > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              {active.length} active ·{" "}
              <span className="font-semibold text-indigo-600">{formatCurrency(monthlyTotal, 0)}/mo</span> total commitment
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add EMI
        </button>
      </div>

      {emis.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <CreditCard className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-base font-medium">No EMIs yet</p>
          <p className="text-sm mt-1">Add a home loan, car loan, or personal loan EMI.</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Active ({active.length})</h2>
              <div className="space-y-4">
                {active.map((emi) => (
                  <EmiCard
                    key={emi.id}
                    emi={emi}
                    onEdit={setEditEmi}
                    onDelete={handleDelete}
                    onMarkPaid={handleMarkEmiPaid}
                    onClose={handleClose}
                    onViewSchedule={(e) => { setScheduleEmiId(e.id); setScheduleEmiPaid(e.paidMonths); }}
                    deletingId={deletingId}
                    markingId={markingId}
                  />
                ))}
              </div>
            </section>
          )}
          {closed.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Closed ({closed.length})</h2>
              <div className="space-y-4">
                {closed.map((emi) => (
                  <EmiCard
                    key={emi.id}
                    emi={emi}
                    onEdit={setEditEmi}
                    onDelete={handleDelete}
                    onMarkPaid={handleMarkEmiPaid}
                    onClose={handleClose}
                    onViewSchedule={(e) => { setScheduleEmiId(e.id); setScheduleEmiPaid(e.paidMonths); }}
                    deletingId={deletingId}
                    markingId={markingId}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {showForm && (
        <EmiForm onSuccess={() => { setShowForm(false); onRefresh(); }} onCancel={() => setShowForm(false)} />
      )}
      {editEmi && (
        <EmiForm initial={editEmi} onSuccess={() => { setEditEmi(null); onRefresh(); }} onCancel={() => setEditEmi(null)} />
      )}
      {scheduleEmiId && (
        <AmortizationModal
          emiId={scheduleEmiId}
          paidMonths={scheduleEmiPaid}
          onClose={() => setScheduleEmiId(null)}
        />
      )}
    </div>
  );
}

interface EmiCardProps {
  emi: Emi;
  onEdit: (e: Emi) => void;
  onDelete: (id: string) => void;
  onMarkPaid: (e: Emi) => void;
  onClose: (e: Emi) => void;
  onViewSchedule: (e: Emi) => void;
  deletingId: string | null;
  markingId: string | null;
}

function EmiCard({ emi, onEdit, onDelete, onMarkPaid, onClose, onViewSchedule, deletingId, markingId }: EmiCardProps) {
  const typeBg = LOAN_TYPE_BG[emi.loanType] ?? "bg-blue-100 text-blue-700";
  const typeLabel = LOAN_TYPE_LABELS[emi.loanType] ?? emi.loanType;
  const progress = emi.tenureMonths > 0 ? (emi.paidMonths / emi.tenureMonths) * 100 : 0;
  const remaining = Math.max(emi.tenureMonths - emi.paidMonths, 0);
  const nextDueDate = addMonths(new Date(emi.startDate), emi.paidMonths);
  const isClosed = emi.status === "CLOSED";

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 ${isClosed ? "border-gray-100 opacity-70" : "border-gray-100"}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{emi.loanName}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeBg}`}>{typeLabel}</span>
            {isClosed && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">Closed</span>}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{emi.lenderName} · {emi.interestRate}% p.a. · {emi.tenureMonths} months</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl font-bold text-gray-900">{formatCurrency(emi.emiAmount, 0)}<span className="text-sm font-normal text-gray-400">/mo</span></p>
          <p className="text-xs text-gray-400">Principal: {formatCurrency(emi.principal, 0)}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{emi.paidMonths} of {emi.tenureMonths} paid</span>
          {!isClosed && <span>Next: {format(nextDueDate, "MMM yyyy")}</span>}
          <span>{remaining} remaining</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isClosed ? "bg-gray-400" : "bg-indigo-500"}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => onViewSchedule(emi)}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <List className="w-3.5 h-3.5" /> Schedule
        </button>
        {!isClosed && (
          <button
            onClick={() => onMarkPaid(emi)}
            disabled={markingId === emi.id}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-50 disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Mark EMI Paid
          </button>
        )}
        {!isClosed && emi.paidMonths >= emi.tenureMonths && (
          <button
            onClick={() => onClose(emi)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Close Loan
          </button>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => onEdit(emi)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(emi.id)} disabled={deletingId === emi.id}
            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
