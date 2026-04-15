"use client";

import { useState } from "react";
import { Expense } from "@/types";
import { CATEGORIES, CATEGORY_BG, formatCurrency } from "@/lib/constants";
import { format } from "date-fns";
import { Pencil, Trash2, Search, SlidersHorizontal, Plus } from "lucide-react";
import ExpenseForm from "./ExpenseForm";
import DeleteModal from "./DeleteModal";

interface ExpenseListProps {
  expenses: Expense[];
  loading: boolean;
  onRefresh: () => void;
}

export default function ExpenseList({ expenses, loading, onRefresh }: ExpenseListProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const [addOpen, setAddOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = expenses
    .filter((e) => {
      const matchSearch =
        !search ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.description ?? "").toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === "all" || e.category === categoryFilter;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      const mult = sortDir === "desc" ? -1 : 1;
      if (sortBy === "date") {
        return mult * (new Date(a.date).getTime() - new Date(b.date).getTime());
      }
      return mult * (a.amount - b.amount);
    });

  const handleDelete = async () => {
    if (!deleteExpense) return;
    setDeleting(true);
    try {
      await fetch(`/api/expenses/${deleteExpense.id}`, { method: "DELETE" });
      onRefresh();
      setDeleteExpense(null);
    } finally {
      setDeleting(false);
    }
  };

  const toggleSort = (col: "date" | "amount") => {
    if (sortBy === col) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-56"
            />
          </div>
          {/* Category filter */}
          <div className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[1fr_2fr_1.2fr_1fr_80px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <button
            onClick={() => toggleSort("date")}
            className="text-left flex items-center gap-1 hover:text-gray-700"
          >
            Date {sortBy === "date" && (sortDir === "desc" ? "↓" : "↑")}
          </button>
          <span>Title</span>
          <span>Category</span>
          <button
            onClick={() => toggleSort("amount")}
            className="text-right flex items-center gap-1 justify-end hover:text-gray-700"
          >
            Amount {sortBy === "amount" && (sortDir === "desc" ? "↓" : "↑")}
          </button>
          <span className="text-center">Actions</span>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-50">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 px-6 py-4 animate-pulse">
                <div className="h-4 w-20 bg-gray-100 rounded" />
                <div className="h-4 flex-1 bg-gray-100 rounded" />
                <div className="h-4 w-24 bg-gray-100 rounded" />
                <div className="h-4 w-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 text-sm">No expenses found</p>
            {(search || categoryFilter !== "all") && (
              <button
                onClick={() => { setSearch(""); setCategoryFilter("all"); }}
                className="mt-2 text-xs text-indigo-500 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((expense) => (
              <div
                key={expense.id}
                className="hidden sm:grid grid-cols-[1fr_2fr_1.2fr_1fr_80px] gap-4 px-6 py-4 items-center hover:bg-gray-50/50 transition-colors"
              >
                <span className="text-sm text-gray-500">
                  {format(new Date(expense.date), "MMM d, yyyy")}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate">{expense.title}</p>
                  {expense.description && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{expense.description}</p>
                  )}
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium w-fit ${
                    CATEGORY_BG[expense.category] ?? "bg-slate-100 text-slate-700"
                  }`}
                >
                  {expense.category}
                </span>
                <span className="text-sm font-semibold text-gray-900 text-right">
                  {formatCurrency(expense.amount)}
                </span>
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => setEditExpense(expense)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteExpense(expense)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Mobile cards */}
            {filtered.map((expense) => (
              <div key={`m-${expense.id}`} className="sm:hidden px-4 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{expense.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(expense.date), "MMM d, yyyy")}
                    </p>
                    {expense.description && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{expense.description}</p>
                    )}
                    <span
                      className={`inline-flex mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${
                        CATEGORY_BG[expense.category] ?? "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {expense.category}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(expense.amount)}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditExpense(expense)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteExpense(expense)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer total */}
        {filtered.length > 0 && !loading && (
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              {filtered.length} expense{filtered.length !== 1 ? "s" : ""}
            </span>
            <span className="text-sm font-bold text-gray-900">
              Total: {formatCurrency(totalFiltered)}
            </span>
          </div>
        )}
      </div>

      {/* Modals */}
      {addOpen && (
        <ExpenseForm onSuccess={onRefresh} onClose={() => setAddOpen(false)} />
      )}
      {editExpense && (
        <ExpenseForm
          initial={{
            id: editExpense.id,
            title: editExpense.title,
            amount: editExpense.amount,
            category: editExpense.category,
            date: editExpense.date,
            description: editExpense.description ?? "",
          }}
          onSuccess={onRefresh}
          onClose={() => setEditExpense(null)}
        />
      )}
      {deleteExpense && (
        <DeleteModal
          title={deleteExpense.title}
          loading={deleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteExpense(null)}
        />
      )}
    </>
  );
}
