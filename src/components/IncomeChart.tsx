"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/constants";

export interface IncomeTrend {
  month: string;
  SALARY: number;
  FREELANCE: number;
  BONUS: number;
  OTHER: number;
  total: number;
}

interface IncomeChartProps {
  data: IncomeTrend[];
  loading: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  SALARY: "#6366f1",
  FREELANCE: "#7c3aed",
  BONUS: "#10b981",
  OTHER: "#94a3b8",
};

const TYPE_LABELS: Record<string, string> = {
  SALARY: "Salary",
  FREELANCE: "Freelance",
  BONUS: "Bonus",
  OTHER: "Other",
};

export default function IncomeChart({ data, loading }: IncomeChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 h-72 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const hasData = data?.some((d) => d.total > 0);

  if (!data || !hasData) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 h-72 flex flex-col items-center justify-center gap-2">
        <p className="text-gray-400 text-sm">No income data yet</p>
        <p className="text-gray-300 text-xs">Income will appear here over time</p>
      </div>
    );
  }

  const activeTypes = (["SALARY", "FREELANCE", "BONUS", "OTHER"] as const).filter((t) =>
    data.some((d) => d[t] > 0)
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Income Trend (Last 6 Months)</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: string) => v.split(" ")[0]}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `₹${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              TYPE_LABELS[name] ?? name,
            ]}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              fontSize: "12px",
            }}
          />
          <Legend
            formatter={(value) => (
              <span style={{ fontSize: 11, color: "#64748b" }}>{TYPE_LABELS[value] ?? value}</span>
            )}
          />
          {activeTypes.map((type) => (
            <Bar
              key={type}
              dataKey={type}
              stackId="income"
              fill={TYPE_COLORS[type]}
              radius={type === activeTypes[activeTypes.length - 1] ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
