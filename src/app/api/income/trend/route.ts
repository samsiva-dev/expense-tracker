import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();

  const allIncomes = await prisma.income.findMany({
    where: {
      userId: session.user.id,
      date: { gte: startOfMonth(subMonths(now, 5)) },
    },
    select: { amountInr: true, type: true, date: true },
  });

  const trend = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);

    const monthIncomes = allIncomes.filter((inc) => inc.date >= start && inc.date <= end);

    const SALARY = monthIncomes.filter((inc) => inc.type === "SALARY").reduce((s, inc) => s + inc.amountInr, 0);
    const FREELANCE = monthIncomes.filter((inc) => inc.type === "FREELANCE").reduce((s, inc) => s + inc.amountInr, 0);
    const BONUS = monthIncomes.filter((inc) => inc.type === "BONUS").reduce((s, inc) => s + inc.amountInr, 0);
    const OTHER = monthIncomes.filter((inc) => inc.type === "OTHER").reduce((s, inc) => s + inc.amountInr, 0);

    trend.push({
      month: format(monthDate, "MMM yyyy"),
      SALARY,
      FREELANCE,
      BONUS,
      OTHER,
      total: SALARY + FREELANCE + BONUS + OTHER,
    });
  }

  return NextResponse.json(trend);
}
