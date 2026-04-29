"use client";

import { useState } from "react";
import { Subscription } from "@/types";
import { formatCurrency, CATEGORY_BG } from "@/lib/constants";
import { format, differenceInDays, isPast } from "date-fns";
import {
  Pencil,
  Trash2,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  BellOff,
  Bell,
  CreditCard,
} from "lucide-react";
import SubscriptionForm from "./SubscriptionForm";

interface SubscriptionListProps {
  subscriptions: Subscription[];
  loading: boolean;
  onRefresh: () => void;
}

const CYCLE_LABELS: Record<string, string> = {
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
};

export default function SubscriptionList({ subscriptions, loading, onRefresh }: SubscriptionListProps) {
  const [editSub, setEditSub] = useState<Subscription | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifMsg, setNotifMsg] = useState<string | null>(null);

  const active = subscriptions.filter((s) => s.isActive);
  const inactive = subscriptions.filter((s) => !s.isActive);
  const monthlyTotal = active.reduce((sum, s) => {
    if (s.billingCycle === "WEEKLY") return sum + s.amount * 4.33;
    if (s.billingCycle === "QUARTERLY") return sum + s.amount / 3;
    if (s.billingCycle === "YEARLY") return sum + s.amount / 12;
    return sum + s.amount;
  }, 0);

  async function handleDelete(id: string) {
    if (!confirm("Delete this subscription?")) return;
    setDeletingId(id);
    await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
    setDeletingId(null);
    onRefresh();
  }

  async function handleMarkPaid(sub: Subscription) {
    setMarkingPaidId(sub.id);
    await fetch(`/api/subscriptions/${sub.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: sub.name,
        amount: sub.amount,
        billingCycle: sub.billingCycle,
        nextDueDate: sub.nextDueDate,
        category: sub.category,
        description: sub.description ?? undefined,
        isActive: sub.isActive,
        trackInExpenses: sub.trackInExpenses,
        markPaid: true,
      }),
    });
    setMarkingPaidId(null);
    onRefresh();
  }

  async function handleSendReminder() {
    setNotifLoading(true);
    setNotifMsg(null);
    try {
      const res = await fetch("/api/cron/subscriptions", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setNotifMsg(data.sent > 0 ? `Discord notified: ${data.sent} upcoming subscription(s).` : "No subscriptions due in the next 3 days.");
      } else {
        setNotifMsg(`Error: ${data.error}`);
      }
    } catch {
      setNotifMsg("Network error sending notification.");
    } finally {
      setNotifLoading(false);
      setTimeout(() => setNotifMsg(null), 5000);
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          {active.length > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              {active.length} active ·{" "}
              <span className="font-semibold text-indigo-600">{formatCurrency(monthlyTotal, 0)}/mo</span> estimated
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleSendReminder}
            disabled={notifLoading}
            title="Send Discord reminder for upcoming subscriptions"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Bell className="w-4 h-4" />
            <span className="hidden sm:block">Remind</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Notification feedback */}
      {notifMsg && (
        <div className="text-sm px-4 py-2.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
          {notifMsg}
        </div>
      )}

      {subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <CreditCard className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-base font-medium">No subscriptions yet</p>
          <p className="text-sm mt-1">Tap &quot;Add&quot; to track recurring services.</p>
        </div>
      ) : (
        <>
          {/* Active */}
          {active.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-500" /> Active ({active.length})
              </h2>
              <div className="space-y-3">
                {active.map((sub) => (
                  <SubscriptionCard
                    key={sub.id}
                    sub={sub}
                    onEdit={setEditSub}
                    onDelete={handleDelete}
                    onMarkPaid={handleMarkPaid}
                    deletingId={deletingId}
                    markingPaidId={markingPaidId}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Inactive */}
          {inactive.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <BellOff className="w-4 h-4 text-gray-400" /> Paused ({inactive.length})
              </h2>
              <div className="space-y-3">
                {inactive.map((sub) => (
                  <SubscriptionCard
                    key={sub.id}
                    sub={sub}
                    onEdit={setEditSub}
                    onDelete={handleDelete}
                    onMarkPaid={handleMarkPaid}
                    deletingId={deletingId}
                    markingPaidId={markingPaidId}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {showForm && (
        <SubscriptionForm
          onSuccess={() => { setShowForm(false); onRefresh(); }}
          onCancel={() => setShowForm(false)}
        />
      )}
      {editSub && (
        <SubscriptionForm
          initial={editSub}
          onSuccess={() => { setEditSub(null); onRefresh(); }}
          onCancel={() => setEditSub(null)}
        />
      )}
    </div>
  );
}

interface SubscriptionCardProps {
  sub: Subscription;
  onEdit: (s: Subscription) => void;
  onDelete: (id: string) => void;
  onMarkPaid: (s: Subscription) => void;
  deletingId: string | null;
  markingPaidId: string | null;
}

function SubscriptionCard({ sub, onEdit, onDelete, onMarkPaid, deletingId, markingPaidId }: SubscriptionCardProps) {
  const dueDate = new Date(sub.nextDueDate);
  const isOverdue = isPast(dueDate);
  const daysLeft = differenceInDays(dueDate, new Date());
  const isDueSoon = !isOverdue && daysLeft <= 3;
  const categoryBg = CATEGORY_BG[sub.category] ?? "bg-slate-100 text-slate-700";

  let statusBadge: React.ReactNode = null;
  if (isOverdue) {
    statusBadge = (
      <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-medium flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> Overdue
      </span>
    );
  } else if (isDueSoon) {
    statusBadge = (
      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
        Due in {daysLeft === 0 ? "today" : `${daysLeft}d`}
      </span>
    );
  }

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
        !sub.isActive
          ? "border-gray-100 opacity-60"
          : isOverdue
          ? "border-rose-200"
          : isDueSoon
          ? "border-amber-200"
          : "border-gray-100"
      }`}
    >
      {/* Icon */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          !sub.isActive ? "bg-gray-50" : isOverdue ? "bg-rose-50" : "bg-indigo-50"
        }`}
      >
        <RefreshCw
          className={`w-5 h-5 ${
            !sub.isActive ? "text-gray-400" : isOverdue ? "text-rose-500" : "text-indigo-500"
          }`}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900">{sub.name}</span>
          {statusBadge}
          {sub.trackInExpenses && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
              Tracked
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-gray-500">
          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${categoryBg}`}>{sub.category}</span>
          <span>· {CYCLE_LABELS[sub.billingCycle] ?? sub.billingCycle}</span>
          <span>· Due {format(dueDate, "dd MMM yyyy")}</span>
          {sub.description && <span>· {sub.description}</span>}
        </div>
      </div>

      {/* Amount */}
      <div className="text-base font-bold text-gray-900">{formatCurrency(sub.amount, 2)}</div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {sub.isActive && (
          <button
            onClick={() => onMarkPaid(sub)}
            disabled={markingPaidId === sub.id}
            title="Mark as paid & advance to next cycle"
            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onEdit(sub)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(sub.id)}
          disabled={deletingId === sub.id}
          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
