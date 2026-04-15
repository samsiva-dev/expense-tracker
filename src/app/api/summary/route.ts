import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { CATEGORY_COLORS } from "@/lib/constants";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const [thisMonthExpenses, lastMonthExpenses, allExpenses] = await Promise.all([
    prisma.expense.findMany({
      where: {
        userId: session.user.id,
        date: { gte: thisMonthStart, lte: thisMonthEnd },
      },
    }),
    prisma.expense.findMany({
      where: {
        userId: session.user.id,
        date: { gte: lastMonthStart, lte: lastMonthEnd },
      },
    }),
    prisma.expense.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
    }),
  ]);

  const totalThisMonth = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalLastMonth = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalAllTime = allExpenses.reduce((sum, e) => sum + e.amount, 0);

  const monthOverMonthChange =
    totalLastMonth === 0
      ? 0
      : ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100;

  // Category breakdown across all time
  const categoryMap: Record<string, number> = {};
  allExpenses.forEach((e) => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
  });

  const categoryBreakdown = Object.entries(categoryMap)
    .map(([category, total]) => ({
      category,
      total,
      color: CATEGORY_COLORS[category] ?? "#94A3B8",
    }))
    .sort((a, b) => b.total - a.total);

  const topCategory = categoryBreakdown[0]?.category ?? "N/A";

  // Monthly trend — last 6 months
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const total = allExpenses
      .filter((e) => e.date >= start && e.date <= end)
      .reduce((sum, e) => sum + e.amount, 0);
    monthlyTrend.push({ month: format(monthDate, "MMM yyyy"), total });
  }

  return NextResponse.json({
    totalThisMonth,
    totalLastMonth,
    totalAllTime,
    monthOverMonthChange,
    topCategory,
    categoryBreakdown,
    monthlyTrend,
  });
}
