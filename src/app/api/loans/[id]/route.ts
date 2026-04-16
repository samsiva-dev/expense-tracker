import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.loan.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Loan not found" }, { status: 404 });
  if (existing.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { lenderName, amount, borrowedDate, dueDate, notes, status } = body as Record<string, unknown>;

  if (!lenderName || typeof lenderName !== "string" || lenderName.trim() === "") {
    return NextResponse.json({ error: "Lender name is required" }, { status: 400 });
  }
  if (typeof amount !== "number" || amount <= 0 || !isFinite(amount)) {
    return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
  }
  if (!borrowedDate || typeof borrowedDate !== "string") {
    return NextResponse.json({ error: "Borrowed date is required" }, { status: 400 });
  }

  const parsedBorrowedDate = new Date(borrowedDate);
  if (isNaN(parsedBorrowedDate.getTime())) {
    return NextResponse.json({ error: "Invalid borrowed date" }, { status: 400 });
  }

  let parsedDueDate: Date | null = null;
  if (dueDate && typeof dueDate === "string") {
    parsedDueDate = new Date(dueDate);
    if (isNaN(parsedDueDate.getTime())) {
      return NextResponse.json({ error: "Invalid due date" }, { status: 400 });
    }
  }

  const loan = await prisma.loan.update({
    where: { id: params.id },
    data: {
      lenderName: (lenderName as string).trim(),
      amount: amount as number,
      borrowedDate: parsedBorrowedDate,
      dueDate: parsedDueDate,
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
      status: status === "PAID" ? "PAID" : "PENDING",
    },
  });

  return NextResponse.json(loan);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.loan.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Loan not found" }, { status: 404 });
  if (existing.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.loan.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
