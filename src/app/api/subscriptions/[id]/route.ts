import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addWeeks, addMonths, addQuarters, addYears } from "date-fns";

function advanceDueDate(current: Date, billingCycle: string): Date {
  switch (billingCycle) {
    case "WEEKLY":
      return addWeeks(current, 1);
    case "QUARTERLY":
      return addQuarters(current, 1);
    case "YEARLY":
      return addYears(current, 1);
    default:
      return addMonths(current, 1);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.subscription.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, amount, billingCycle, nextDueDate, category, description, isActive, trackInExpenses, markPaid } =
    body as Record<string, unknown>;

  if (!name || typeof name !== "string" || (name as string).trim() === "") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (typeof amount !== "number" || amount <= 0 || !isFinite(amount as number)) {
    return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
  }

  const cycleValue = (billingCycle as string) ?? existing.billingCycle;
  const dueDateStr = (nextDueDate as string) ?? existing.nextDueDate.toISOString();
  const parsedDate = new Date(dueDateStr);
  if (isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  // markPaid: advance the due date to next cycle and optionally create an expense
  let finalDueDate = parsedDate;
  if (markPaid === true && existing.nextDueDate <= new Date()) {
    finalDueDate = advanceDueDate(existing.nextDueDate, existing.billingCycle);
  }

  const updated = await prisma.subscription.update({
    where: { id: params.id },
    data: {
      name: (name as string).trim(),
      amount: amount as number,
      billingCycle: cycleValue,
      nextDueDate: finalDueDate,
      category: category as string ?? existing.category,
      description: typeof description === "string" ? description.trim() : existing.description,
      isActive: typeof isActive === "boolean" ? isActive : existing.isActive,
      trackInExpenses: typeof trackInExpenses === "boolean" ? trackInExpenses : existing.trackInExpenses,
    },
  });

  // Auto-create expense when marking paid if trackInExpenses is enabled
  if (markPaid === true && (typeof trackInExpenses === "boolean" ? trackInExpenses : existing.trackInExpenses)) {
    await prisma.expense.create({
      data: {
        title: `${(name as string).trim()} (subscription)`,
        amount: amount as number,
        category: (category as string) ?? existing.category,
        date: existing.nextDueDate,
        description: `Auto-logged from subscription payment`,
        userId: session.user.id,
      },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.subscription.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.subscription.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
