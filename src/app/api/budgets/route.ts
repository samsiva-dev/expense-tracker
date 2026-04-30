import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined;
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;

  const budgets = await prisma.budget.findMany({
    where: {
      userId: session.user.id,
      ...(month !== undefined && year !== undefined ? { month, year } : {}),
    },
    orderBy: { category: "asc" },
  });

  return NextResponse.json(budgets);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { category, amount, month, year } = body as Record<string, unknown>;

  if (!category || typeof category !== "string") return NextResponse.json({ error: "Category is required" }, { status: 400 });
  if (typeof amount !== "number" || amount <= 0) return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
  if (typeof month !== "number" || month < 1 || month > 12) return NextResponse.json({ error: "Invalid month" }, { status: 400 });
  if (typeof year !== "number" || year < 2000) return NextResponse.json({ error: "Invalid year" }, { status: 400 });

  const budget = await prisma.budget.upsert({
    where: { userId_category_month_year: { userId: session.user.id, category: category as string, month: month as number, year: year as number } },
    update: { amount: amount as number },
    create: { category: category as string, amount: amount as number, month: month as number, year: year as number, userId: session.user.id },
  });

  return NextResponse.json(budget, { status: 201 });
}
