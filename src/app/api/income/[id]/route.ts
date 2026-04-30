import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.income.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { amount, currency, exchangeRate, type, date, description, remittanceAmount, remittanceNote } =
    body as Record<string, unknown>;

  if (typeof amount !== "number" || amount <= 0) return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });

  const resolvedCurrency = typeof currency === "string" ? currency : existing.currency;
  const resolvedRate = resolvedCurrency === "INR" ? 1 : (typeof exchangeRate === "number" && exchangeRate > 0 ? exchangeRate : existing.exchangeRate);
  const amountInr = (amount as number) * resolvedRate;

  const updated = await prisma.income.update({
    where: { id: params.id },
    data: {
      amount: amount as number,
      currency: resolvedCurrency,
      exchangeRate: resolvedRate,
      amountInr,
      type: typeof type === "string" ? type : existing.type,
      date: date ? new Date(date as string) : existing.date,
      description: typeof description === "string" ? description.trim() || null : existing.description,
      remittanceAmount: typeof remittanceAmount === "number" && remittanceAmount > 0 ? remittanceAmount : null,
      remittanceNote: typeof remittanceNote === "string" ? remittanceNote.trim() || null : existing.remittanceNote,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.income.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.income.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
