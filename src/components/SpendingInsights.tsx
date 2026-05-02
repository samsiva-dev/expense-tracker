"use client";

import { TrendingUp, TrendingDown, AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";
import type { Insight, InsightSeverity } from "@/app/api/insights/route";

interface SpendingInsightsProps {
  insights: Insight[];
  loading: boolean;
}

const SEVERITY_STYLES: Record<InsightSeverity, { bg: string; border: string; icon: string; text: string }> = {
  positive: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600", text: "text-emerald-800" },
  warning: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600", text: "text-amber-800" },
  danger: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-600", text: "text-red-800" },
  info: { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-600", text: "text-blue-800" },
};

function InsightIcon({ id, severity }: { id: string; severity: InsightSeverity }) {
  const cls = `w-4 h-4 flex-shrink-0 mt-0.5 ${SEVERITY_STYLES[severity].icon}`;
  if (severity === "danger") return <AlertCircle className={cls} />;
  if (severity === "warning") return <AlertTriangle className={cls} />;
  if (id.includes("down") || id.includes("savings-good")) return <TrendingDown className={cls} />;
  if (id.includes("up") || id.includes("spiked")) return <TrendingUp className={cls} />;
  if (id === "all-good") return <CheckCircle className={cls} />;
  return <Info className={cls} />;
}

export default function SpendingInsights({ insights, loading }: SpendingInsightsProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Spending Insights</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!insights || insights.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Spending Insights</h3>
      <div className="space-y-3">
        {insights.map((insight) => {
          const styles = SEVERITY_STYLES[insight.severity];
          return (
            <div
              key={insight.id}
              className={`flex gap-3 rounded-lg border px-4 py-3 ${styles.bg} ${styles.border}`}
            >
              <InsightIcon id={insight.id} severity={insight.severity} />
              <div>
                <p className={`text-xs font-semibold ${styles.text}`}>{insight.title}</p>
                <p className={`text-xs mt-0.5 ${styles.text} opacity-80`}>{insight.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
