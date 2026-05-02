import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export type InsightSeverity = "positive" | "warning" | "danger" | "info";

export interface Insight {
  id: string;
  severity: InsightSeverity;
  title: string;
  message: string;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const thisStart = startOfMonth(now);
  const thisEnd = endOfMonth(now);
  const lastStart = startOfMonth(subMonths(now, 1));
  const lastEnd = endOfMonth(subMonths(now, 1));

  const [thisMonthExpenses, lastMonthExpenses, budgets, incomeSummaryData, activeEmis] =
    await Promise.all([
      prisma.expense.findMany({
        where: { userId: session.user.id, date: { gte: thisStart, lte: thisEnd } },
        select: { amount: true, category: true },
      }),
      prisma.expense.findMany({
        where: { userId: session.user.id, date: { gte: lastStart, lte: lastEnd } },
        select: { amount: true, category: true },
      }),
      prisma.budget.findMany({
        where: { userId: session.user.id, month: now.getMonth() + 1, year: now.getFullYear() },
        select: { category: true, amount: true },
      }),
      prisma.income.findMany({
        where: { userId: session.user.id, date: { gte: thisStart, lte: thisEnd } },
        select: { amountInr: true, remittanceAmount: true },
      }),
      prisma.emi.findMany({
        where: { userId: session.user.id, status: "ACTIVE" },
        select: { emiAmount: true },
      }),
    ]);

  const insights: Insight[] = [];

  // Build category totals for this month and last month
  const thisMonthByCategory: Record<string, number> = {};
  for (const e of thisMonthExpenses) {
    thisMonthByCategory[e.category] = (thisMonthByCategory[e.category] ?? 0) + e.amount;
  }
  const lastMonthByCategory: Record<string, number> = {};
  for (const e of lastMonthExpenses) {
    lastMonthByCategory[e.category] = (lastMonthByCategory[e.category] ?? 0) + e.amount;
  }

  const totalThisMonth = thisMonthExpenses.reduce((s, e) => s + e.amount, 0);
  const totalLastMonth = lastMonthExpenses.reduce((s, e) => s + e.amount, 0);

  // Overall spending change
  if (totalLastMonth > 0) {
    const pct = ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100;
    if (pct >= 20) {
      insights.push({
        id: "overall-up",
        severity: "warning",
        title: "Overall spending up",
        message: `You've spent ${pct.toFixed(0)}% more this month compared to last month.`,
      });
    } else if (pct <= -20) {
      insights.push({
        id: "overall-down",
        severity: "positive",
        title: "Great job cutting costs",
        message: `Your total spending is down ${Math.abs(pct).toFixed(0)}% compared to last month.`,
      });
    }
  }

  // Per-category change (only flag >30% moves on categories with meaningful spend)
  for (const [category, thisTotal] of Object.entries(thisMonthByCategory)) {
    const lastTotal = lastMonthByCategory[category] ?? 0;
    if (lastTotal < 500) continue; // skip tiny baseline
    const pct = ((thisTotal - lastTotal) / lastTotal) * 100;
    if (pct >= 30) {
      insights.push({
        id: `cat-up-${category}`,
        severity: "warning",
        title: `${category} spending spiked`,
        message: `You spent ${pct.toFixed(0)}% more on ${category} this month vs last month.`,
      });
    } else if (pct <= -30) {
      insights.push({
        id: `cat-down-${category}`,
        severity: "positive",
        title: `${category} spending dropped`,
        message: `${category} spending is down ${Math.abs(pct).toFixed(0)}% compared to last month.`,
      });
    }
  }

  // Budget exceeded
  for (const budget of budgets) {
    const spent = thisMonthByCategory[budget.category] ?? 0;
    if (spent > budget.amount) {
      const over = spent - budget.amount;
      insights.push({
        id: `budget-exceeded-${budget.category}`,
        severity: "danger",
        title: `${budget.category} budget exceeded`,
        message: `You're ₹${over.toFixed(0)} over your ${budget.category} budget this month.`,
      });
    } else if (spent >= budget.amount * 0.85) {
      insights.push({
        id: `budget-warning-${budget.category}`,
        severity: "warning",
        title: `${budget.category} budget nearly full`,
        message: `You've used ${((spent / budget.amount) * 100).toFixed(0)}% of your ${budget.category} budget.`,
      });
    }
  }

  // Savings rate (income vs total outflow)
  const totalIncome = incomeSummaryData.reduce((s, i) => s + i.amountInr, 0);
  const totalRemittance = incomeSummaryData.reduce((s, i) => s + (i.remittanceAmount ?? 0), 0);
  const totalEmi = activeEmis.reduce((s, e) => s + e.emiAmount, 0);

  if (totalIncome > 0) {
    const totalOutflow = totalThisMonth + totalRemittance + totalEmi;
    const savingsRate = ((totalIncome - totalOutflow) / totalIncome) * 100;
    if (savingsRate >= 20) {
      insights.push({
        id: "savings-good",
        severity: "positive",
        title: "Healthy savings rate",
        message: `You're saving ${savingsRate.toFixed(0)}% of your income this month — keep it up!`,
      });
    } else if (savingsRate < 0) {
      insights.push({
        id: "savings-negative",
        severity: "danger",
        title: "Spending exceeds income",
        message: `Your outflows this month exceed your recorded income by ₹${Math.abs(totalIncome - totalOutflow).toFixed(0)}.`,
      });
    } else if (savingsRate < 10) {
      insights.push({
        id: "savings-low",
        severity: "warning",
        title: "Low savings rate",
        message: `You're only saving ${savingsRate.toFixed(0)}% of your income this month. Consider reviewing expenses.`,
      });
    }
  }

  // Top spending category info
  const topEntry = Object.entries(thisMonthByCategory).sort((a, b) => b[1] - a[1])[0];
  if (topEntry && totalThisMonth > 0) {
    const [topCat, topAmt] = topEntry;
    const share = (topAmt / totalThisMonth) * 100;
    if (share >= 40) {
      insights.push({
        id: "top-category",
        severity: "info",
        title: `${topCat} dominates spending`,
        message: `${topCat} accounts for ${share.toFixed(0)}% of your total spend this month.`,
      });
    }
  }

  // No insights fallback
  if (insights.length === 0) {
    insights.push({
      id: "all-good",
      severity: "positive",
      title: "All looking good",
      message: "No unusual spending patterns detected this month. Stay on track!",
    });
  }

  return NextResponse.json(insights);
}
