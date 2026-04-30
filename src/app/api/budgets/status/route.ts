import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";
import { CATEGORIES } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : now.getMonth() + 1;
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : now.getFullYear();

  const periodStart = startOfMonth(new Date(year, month - 1, 1));
  const periodEnd = endOfMonth(new Date(year, month - 1, 1));

  const [budgets, expenses] = await Promise.all([
    prisma.budget.findMany({ where: { userId: session.user.id, month, year } }),
    prisma.expense.findMany({
      where: { userId: session.user.id, date: { gte: periodStart, lte: periodEnd } },
      select: { category: true, amount: true },
    }),
  ]);

  const budgetMap = new Map(budgets.map((b) => [b.category, b]));
  const spentMap = new Map<string, number>();
  for (const e of expenses) {
    spentMap.set(e.category, (spentMap.get(e.category) ?? 0) + e.amount);
  }

  const statuses = CATEGORIES.map((category) => {
    const budget = budgetMap.get(category);
    const spent = spentMap.get(category) ?? 0;
    const limit = budget ? budget.amount : null;
    const percentage = limit ? Math.min((spent / limit) * 100, 200) : 0;
    const status: "ok" | "warning" | "exceeded" =
      limit === null ? "ok" : percentage >= 100 ? "exceeded" : percentage >= 80 ? "warning" : "ok";
    return { category, limit, spent, percentage, status, budgetId: budget?.id ?? null };
  }).filter((s) => s.spent > 0 || s.limit !== null);

  return NextResponse.json(statuses);
}
