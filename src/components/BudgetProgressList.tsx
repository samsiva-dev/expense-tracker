"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/constants";
import BudgetForm from "./BudgetForm";

interface BudgetStatusItem {
  category: string;
  limit: number | null;
  spent: number;
  percentage: number;
  status: "ok" | "warning" | "exceeded";
  budgetId: string | null;
}

interface Props {
  statuses: BudgetStatusItem[];
  loading: boolean;
  month: number;
  year: number;
  onRefresh: () => void;
}

export default function BudgetProgressList({ statuses, loading, month, year, onRefresh }: Props) {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (statuses.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-2">No spending recorded this month yet.</p>
    );
  }

  const editingItem = statuses.find((s) => s.category === editingCategory);

  return (
    <>
      <div className="space-y-3">
        {statuses.map((s) => {
          const barColor =
            s.status === "exceeded"
              ? "bg-red-500"
              : s.status === "warning"
              ? "bg-amber-400"
              : "bg-emerald-500";
          const barWidth = s.limit ? `${Math.min(s.percentage, 100)}%` : "0%";

          return (
            <div key={s.category} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 truncate">{s.category}</span>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-xs text-gray-500">
                      {formatCurrency(s.spent)}{s.limit ? ` / ${formatCurrency(s.limit)}` : ""}
                    </span>
                    {s.status === "exceeded" && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Over</span>
                    )}
                    {s.status === "warning" && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">80%+</span>
                    )}
                  </div>
                </div>
                {s.limit ? (
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: barWidth }}
                    />
                  </div>
                ) : (
                  <div className="h-2 bg-gray-50 rounded-full border border-dashed border-gray-200" />
                )}
              </div>
              <button
                onClick={() => setEditingCategory(s.category)}
                className="flex-shrink-0 p-1 rounded text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                title={s.limit ? "Edit budget" : "Set budget limit"}
              >
                {s.limit ? <Pencil className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </button>
            </div>
          );
        })}
      </div>

      {editingCategory && editingItem && (
        <BudgetForm
          category={editingCategory}
          currentLimit={editingItem.limit}
          budgetId={editingItem.budgetId}
          month={month}
          year={year}
          onSuccess={() => { setEditingCategory(null); onRefresh(); }}
          onCancel={() => setEditingCategory(null)}
        />
      )}
    </>
  );
}
