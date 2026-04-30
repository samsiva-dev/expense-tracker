import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : now.getMonth() + 1;
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : now.getFullYear();

  const periodStart = startOfMonth(new Date(year, month - 1, 1));
  const periodEnd = endOfMonth(new Date(year, month - 1, 1));

  const [incomes, expenses, activeEmis] = await Promise.all([
    prisma.income.findMany({
      where: { userId: session.user.id, date: { gte: periodStart, lte: periodEnd } },
      select: { amountInr: true, remittanceAmount: true },
    }),
    prisma.expense.findMany({
      where: { userId: session.user.id, date: { gte: periodStart, lte: periodEnd } },
      select: { amount: true },
    }),
    prisma.emi.findMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      select: { emiAmount: true },
    }),
  ]);

  const totalIncomeInr = incomes.reduce((s, i) => s + i.amountInr, 0);
  const totalRemittance = incomes.reduce((s, i) => s + (i.remittanceAmount ?? 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalMonthlyEmi = activeEmis.reduce((s, e) => s + e.emiAmount, 0);
  const netKept = totalIncomeInr - totalRemittance - totalExpenses - totalMonthlyEmi;

  return NextResponse.json({ totalIncomeInr, totalRemittance, totalMonthlyEmi, netKept });
}
