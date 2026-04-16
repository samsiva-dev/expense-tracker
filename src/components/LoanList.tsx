"use client";

import { useState } from "react";
import { Loan } from "@/types";
import { formatCurrency } from "@/lib/constants";
import { format } from "date-fns";
import { Pencil, Trash2, CheckCircle2, Clock, Plus, Wallet } from "lucide-react";
import LoanForm from "./LoanForm";

interface LoanListProps {
  loans: Loan[];
  loading: boolean;
  onRefresh: () => void;
}

async function markPaid(loan: Loan): Promise<void> {
  await fetch(`/api/loans/${loan.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lenderName: loan.lenderName,
      amount: loan.amount,
      borrowedDate: loan.borrowedDate,
      dueDate: loan.dueDate ?? undefined,
      notes: loan.notes ?? undefined,
      status: "PAID",
    }),
  });
}

export default function LoanList({ loans, loading, onRefresh }: LoanListProps) {
  const [editLoan, setEditLoan] = useState<Loan | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const pending = loans.filter((l) => l.status === "PENDING");
  const paid = loans.filter((l) => l.status === "PAID");
  const totalPending = pending.reduce((s, l) => s + l.amount, 0);

  async function handleDelete(id: string) {
    if (!confirm("Delete this loan?")) return;
    setDeletingId(id);
    await fetch(`/api/loans/${id}`, { method: "DELETE" });
    setDeletingId(null);
    onRefresh();
  }

  async function handleTogglePaid(loan: Loan) {
    setTogglingId(loan.id);
    await fetch(`/api/loans/${loan.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lenderName: loan.lenderName,
        amount: loan.amount,
        borrowedDate: loan.borrowedDate,
        dueDate: loan.dueDate ?? undefined,
        notes: loan.notes ?? undefined,
        status: loan.status === "PAID" ? "PENDING" : "PAID",
      }),
    });
    setTogglingId(null);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loans</h1>
          {pending.length > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              You owe <span className="font-semibold text-rose-600">{formatCurrency(totalPending, 2)}</span> across {pending.length} pending loan{pending.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Loan
        </button>
      </div>

      {loans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Wallet className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-base font-medium">No loans recorded</p>
          <p className="text-sm mt-1">Tap &quot;Add Loan&quot; to record money you borrowed.</p>
        </div>
      ) : (
        <>
          {/* Pending */}
          {pending.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" /> Pending ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map((loan) => (
                  <LoanCard
                    key={loan.id}
                    loan={loan}
                    onEdit={setEditLoan}
                    onDelete={handleDelete}
                    onToggle={handleTogglePaid}
                    deletingId={deletingId}
                    togglingId={togglingId}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Paid */}
          {paid.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Paid ({paid.length})
              </h2>
              <div className="space-y-3">
                {paid.map((loan) => (
                  <LoanCard
                    key={loan.id}
                    loan={loan}
                    onEdit={setEditLoan}
                    onDelete={handleDelete}
                    onToggle={handleTogglePaid}
                    deletingId={deletingId}
                    togglingId={togglingId}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Add / Edit modals */}
      {showForm && (
        <LoanForm
          onSuccess={() => { setShowForm(false); onRefresh(); }}
          onCancel={() => setShowForm(false)}
        />
      )}
      {editLoan && (
        <LoanForm
          initial={editLoan}
          onSuccess={() => { setEditLoan(null); onRefresh(); }}
          onCancel={() => setEditLoan(null)}
        />
      )}
    </div>
  );
}

interface LoanCardProps {
  loan: Loan;
  onEdit: (l: Loan) => void;
  onDelete: (id: string) => void;
  onToggle: (l: Loan) => void;
  deletingId: string | null;
  togglingId: string | null;
}

function LoanCard({ loan, onEdit, onDelete, onToggle, deletingId, togglingId }: LoanCardProps) {
  const isPaid = loan.status === "PAID";
  const isOverdue =
    !isPaid && loan.dueDate && new Date(loan.dueDate) < new Date();

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${isPaid ? "border-gray-100 opacity-70" : isOverdue ? "border-rose-200" : "border-gray-100"}`}>
      {/* Status indicator */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isPaid ? "bg-emerald-50" : isOverdue ? "bg-rose-50" : "bg-amber-50"}`}>
        {isPaid
          ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          : <Clock className={`w-5 h-5 ${isOverdue ? "text-rose-500" : "text-amber-500"}`} />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900">{loan.lenderName}</span>
          {isOverdue && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-medium">Overdue</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap text-xs text-gray-500">
          <span>Borrowed {format(new Date(loan.borrowedDate), "dd MMM yyyy")}</span>
          {loan.dueDate && <span>· Due {format(new Date(loan.dueDate), "dd MMM yyyy")}</span>}
          {loan.notes && <span>· {loan.notes}</span>}
        </div>
      </div>

      {/* Amount */}
      <div className={`text-base font-bold ${isPaid ? "text-gray-400 line-through" : "text-gray-900"}`}>
        {formatCurrency(loan.amount, 2)}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onToggle(loan)}
          disabled={togglingId === loan.id}
          title={isPaid ? "Mark as Pending" : "Mark as Paid"}
          className={`p-1.5 rounded-lg transition-colors text-sm ${isPaid ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50" : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"}`}
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onEdit(loan)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(loan.id)}
          disabled={deletingId === loan.id}
          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
