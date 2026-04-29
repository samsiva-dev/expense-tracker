import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: session.user.id },
    orderBy: { nextDueDate: "asc" },
  });

  return NextResponse.json(subscriptions);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, amount, billingCycle, nextDueDate, category, description, isActive, trackInExpenses } =
    body as Record<string, unknown>;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (typeof amount !== "number" || amount <= 0 || !isFinite(amount)) {
    return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
  }
  if (!billingCycle || !["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"].includes(billingCycle as string)) {
    return NextResponse.json({ error: "Invalid billing cycle" }, { status: 400 });
  }
  if (!nextDueDate || typeof nextDueDate !== "string") {
    return NextResponse.json({ error: "Next due date is required" }, { status: 400 });
  }
  if (!category || typeof category !== "string") {
    return NextResponse.json({ error: "Category is required" }, { status: 400 });
  }

  const parsedDate = new Date(nextDueDate);
  if (isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const subscription = await prisma.subscription.create({
    data: {
      name: (name as string).trim(),
      amount: amount as number,
      billingCycle: billingCycle as string,
      nextDueDate: parsedDate,
      category: category as string,
      description: typeof description === "string" ? description.trim() : undefined,
      isActive: typeof isActive === "boolean" ? isActive : true,
      trackInExpenses: typeof trackInExpenses === "boolean" ? trackInExpenses : true,
      userId: session.user.id,
    },
  });

  return NextResponse.json(subscription, { status: 201 });
}
