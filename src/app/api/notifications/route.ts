import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subHours } from "date-fns";
import { CATEGORIES } from "@/lib/constants";

async function generateNotifications(userId: string) {
  const now = new Date();
  const oneDayAgo = subHours(now, 24);
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const periodStart = startOfMonth(now);
  const periodEnd = endOfMonth(now);

  // LOAN_OVERDUE: pending loans with past due date
  const overdueLoans = await prisma.loan.findMany({
    where: { userId, status: "PENDING", dueDate: { lt: now } },
  });

  for (const loan of overdueLoans) {
    const exists = await prisma.notification.findFirst({
      where: { userId, type: "LOAN_OVERDUE", relatedId: loan.id, createdAt: { gte: oneDayAgo } },
    });
    if (!exists) {
      await prisma.notification.create({
        data: {
          userId,
          type: "LOAN_OVERDUE",
          title: "Loan Overdue",
          message: `Loan from ${loan.lenderName} (${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(loan.amount)}) is past its due date.`,
          relatedId: loan.id,
          relatedType: "Loan",
        },
      });
    }
  }

  // BUDGET_EXCEEDED / warning: check current month spend vs limits
  const [budgets, expenses] = await Promise.all([
    prisma.budget.findMany({ where: { userId, month, year } }),
    prisma.expense.findMany({
      where: { userId, date: { gte: periodStart, lte: periodEnd } },
      select: { category: true, amount: true },
    }),
  ]);

  const spentMap = new Map<string, number>();
  for (const e of expenses) {
    spentMap.set(e.category, (spentMap.get(e.category) ?? 0) + e.amount);
  }

  for (const budget of budgets) {
    const spent = spentMap.get(budget.category) ?? 0;
    const pct = (spent / budget.amount) * 100;
    if (pct < 80) continue;

    const relatedId = `${budget.category}-${year}-${month}`;
    const type = pct >= 100 ? "BUDGET_EXCEEDED" : "BUDGET_EXCEEDED"; // both use same type
    const isExceeded = pct >= 100;
    const titleSuffix = isExceeded ? "Exceeded" : "Almost Exceeded (80%+)";

    const exists = await prisma.notification.findFirst({
      where: { userId, type: "BUDGET_EXCEEDED", relatedId, createdAt: { gte: periodStart } },
    });
    if (!exists) {
      await prisma.notification.create({
        data: {
          userId,
          type: "BUDGET_EXCEEDED",
          title: `Budget ${titleSuffix}`,
          message: `${budget.category}: spent ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(spent)} of ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(budget.amount)} limit.`,
          relatedId,
          relatedType: "Budget",
        },
      });
    }
  }

  // SUBSCRIPTION_DUE: active subscriptions due within 3 days
  const threeDaysAhead = new Date(now);
  threeDaysAhead.setDate(threeDaysAhead.getDate() + 3);

  const upcomingSubs = await prisma.subscription.findMany({
    where: { userId, isActive: true, nextDueDate: { gte: now, lte: threeDaysAhead } },
  });

  for (const sub of upcomingSubs) {
    const exists = await prisma.notification.findFirst({
      where: { userId, type: "SUBSCRIPTION_DUE", relatedId: sub.id, createdAt: { gte: oneDayAgo } },
    });
    if (!exists) {
      const daysLeft = Math.ceil((sub.nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      await prisma.notification.create({
        data: {
          userId,
          type: "SUBSCRIPTION_DUE",
          title: "Subscription Due Soon",
          message: `${sub.name} (${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(sub.amount)}) is due ${daysLeft === 0 ? "today" : `in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`}.`,
          relatedId: sub.id,
          relatedType: "Subscription",
        },
      });
    }
  }

  // Suppress unused variable warning
  void CATEGORIES;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  // Lazy generation
  await generateNotifications(session.user.id);

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id, ...(unreadOnly ? { isRead: false } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(notifications);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { ids, all } = body as Record<string, unknown>;

  if (all === true) {
    await prisma.notification.updateMany({ where: { userId: session.user.id, isRead: false }, data: { isRead: true } });
  } else if (Array.isArray(ids) && ids.length > 0) {
    await prisma.notification.updateMany({ where: { userId: session.user.id, id: { in: ids as string[] } }, data: { isRead: true } });
  }

  return NextResponse.json({ success: true });
}
