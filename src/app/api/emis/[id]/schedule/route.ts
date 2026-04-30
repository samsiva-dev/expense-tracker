import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildAmortizationSchedule } from "@/lib/emi";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const emi = await prisma.emi.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!emi) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const schedule = buildAmortizationSchedule(emi.principal, emi.interestRate, emi.tenureMonths, emi.startDate);

  return NextResponse.json({ emi, schedule });
}
