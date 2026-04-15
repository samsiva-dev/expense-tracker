"use client";

import { SummaryData } from "@/types";
import { TrendingUp, TrendingDown, Wallet, Tag, BarChart2 } from "lucide-react";
import { formatCurrency } from "@/lib/constants";

interface SummaryCardsProps {
  data: SummaryData | null;
  loading: boolean;
}

export default function SummaryCards({ data, loading }: SummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  const change = data?.monthOverMonthChange ?? 0;
  const isUp = change > 0;
  const isDown = change < 0;

  const cards = [
    {
      title: "This Month",
      value: formatCurrency(data?.totalThisMonth ?? 0),
      icon: Wallet,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      sub:
        change === 0 ? (
          <span className="text-gray-400 text-xs">No previous month data</span>
        ) : (
          <span
            className={`flex items-center gap-1 text-xs font-medium ${
              isUp ? "text-red-500" : "text-emerald-500"
            }`}
          >
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}% vs last month
          </span>
        ),
    },
    {
      title: "All Time Total",
      value: formatCurrency(data?.totalAllTime ?? 0),
      icon: BarChart2,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      sub: <span className="text-gray-400 text-xs">Lifetime expenses</span>,
    },
    {
      title: "Top Category",
      value: data?.topCategory ?? "—",
      icon: Tag,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      sub: (
        <span className="text-gray-400 text-xs">
          {data?.categoryBreakdown?.[0]
            ? `${formatCurrency(data.categoryBreakdown[0].total)} spent`
            : "No data yet"}
        </span>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map(({ title, value, icon: Icon, iconBg, iconColor, sub }) => (
        <div key={title} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-start gap-4">
          <div className={`flex-shrink-0 w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
            <div className="mt-1">{sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
