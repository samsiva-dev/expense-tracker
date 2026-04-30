import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateEmi } from "@/lib/emi";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const emis = await prisma.emi.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(emis);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { loanName, lenderName, loanType, principal, interestRate, tenureMonths, startDate, notes } =
    body as Record<string, unknown>;

  if (!loanName || typeof loanName !== "string" || (loanName as string).trim() === "") return NextResponse.json({ error: "Loan name is required" }, { status: 400 });
  if (!lenderName || typeof lenderName !== "string") return NextResponse.json({ error: "Lender name is required" }, { status: 400 });
  if (!["PERSONAL", "HOME", "CAR"].includes(loanType as string)) return NextResponse.json({ error: "Invalid loan type" }, { status: 400 });
  if (typeof principal !== "number" || principal <= 0) return NextResponse.json({ error: "Principal must be positive" }, { status: 400 });
  if (typeof interestRate !== "number" || interestRate < 0) return NextResponse.json({ error: "Invalid interest rate" }, { status: 400 });
  if (typeof tenureMonths !== "number" || tenureMonths < 1) return NextResponse.json({ error: "Tenure must be at least 1 month" }, { status: 400 });
  if (!startDate || typeof startDate !== "string") return NextResponse.json({ error: "Start date is required" }, { status: 400 });

  const emiAmount = calculateEmi(principal as number, interestRate as number, tenureMonths as number);

  const emi = await prisma.emi.create({
    data: {
      loanName: (loanName as string).trim(),
      lenderName: (lenderName as string).trim(),
      loanType: loanType as string,
      principal: principal as number,
      interestRate: interestRate as number,
      tenureMonths: tenureMonths as number,
      startDate: new Date(startDate as string),
      emiAmount,
      notes: typeof notes === "string" ? notes.trim() || null : null,
      userId: session.user.id,
    },
  });

  return NextResponse.json(emi, { status: 201 });
}
