import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : null;
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : null;

  const incomes = await prisma.income.findMany({
    where: {
      userId: session.user.id,
      ...(month && year
        ? {
            date: {
              gte: startOfMonth(new Date(year, month - 1, 1)),
              lte: endOfMonth(new Date(year, month - 1, 1)),
            },
          }
        : {}),
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(incomes);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { amount, currency, exchangeRate, type, date, description, remittanceAmount, remittanceNote } =
    body as Record<string, unknown>;

  if (typeof amount !== "number" || amount <= 0) return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
  if (!date || typeof date !== "string") return NextResponse.json({ error: "Date is required" }, { status: 400 });
  if (!["SALARY", "FREELANCE", "BONUS", "OTHER"].includes(type as string)) return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  const resolvedCurrency = typeof currency === "string" ? currency : "INR";
  const resolvedRate = resolvedCurrency === "INR" ? 1 : (typeof exchangeRate === "number" && exchangeRate > 0 ? exchangeRate : 1);
  const amountInr = amount * resolvedRate;

  const income = await prisma.income.create({
    data: {
      amount: amount as number,
      currency: resolvedCurrency,
      exchangeRate: resolvedRate,
      amountInr,
      type: type as string,
      date: new Date(date as string),
      description: typeof description === "string" ? description.trim() || null : null,
      remittanceAmount: typeof remittanceAmount === "number" && remittanceAmount > 0 ? remittanceAmount : null,
      remittanceNote: typeof remittanceNote === "string" ? remittanceNote.trim() || null : null,
      userId: session.user.id,
    },
  });

  return NextResponse.json(income, { status: 201 });
}
