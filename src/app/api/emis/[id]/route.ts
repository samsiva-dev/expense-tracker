import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateEmi } from "@/lib/emi";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.emi.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { loanName, lenderName, loanType, principal, interestRate, tenureMonths, startDate, notes, paidMonths, status, markEmiPaid } =
    body as Record<string, unknown>;

  // Quick action: mark one EMI as paid
  if (markEmiPaid === true) {
    const newPaid = Math.min(existing.paidMonths + 1, existing.tenureMonths);
    const updated = await prisma.emi.update({
      where: { id: params.id },
      data: {
        paidMonths: newPaid,
        status: newPaid >= existing.tenureMonths ? "CLOSED" : "ACTIVE",
      },
    });
    return NextResponse.json(updated);
  }

  const resolvedPrincipal = typeof principal === "number" && principal > 0 ? principal : existing.principal;
  const resolvedRate = typeof interestRate === "number" && interestRate >= 0 ? interestRate : existing.interestRate;
  const resolvedTenure = typeof tenureMonths === "number" && tenureMonths >= 1 ? tenureMonths : existing.tenureMonths;
  const emiAmount = calculateEmi(resolvedPrincipal, resolvedRate, resolvedTenure);

  const updated = await prisma.emi.update({
    where: { id: params.id },
    data: {
      loanName: typeof loanName === "string" ? loanName.trim() : existing.loanName,
      lenderName: typeof lenderName === "string" ? lenderName.trim() : existing.lenderName,
      loanType: typeof loanType === "string" ? loanType : existing.loanType,
      principal: resolvedPrincipal,
      interestRate: resolvedRate,
      tenureMonths: resolvedTenure,
      startDate: startDate ? new Date(startDate as string) : existing.startDate,
      emiAmount,
      paidMonths: typeof paidMonths === "number" ? paidMonths : existing.paidMonths,
      status: typeof status === "string" ? status : existing.status,
      notes: typeof notes === "string" ? notes.trim() || null : existing.notes,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.emi.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.emi.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
