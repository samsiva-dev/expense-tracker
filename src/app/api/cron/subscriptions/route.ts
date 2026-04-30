import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/constants";
import { format, differenceInDays, startOfDay, endOfDay } from "date-fns";
import { advanceDueDate } from "@/lib/billing";

const DAYS_AHEAD = 3;

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + DAYS_AHEAD);

  // === Discord notifications for upcoming subscriptions ===
  let notified = 0;
  if (process.env.DISCORD_WEBHOOK_URL) {
    const upcoming = await prisma.subscription.findMany({
      where: {
        isActive: true,
        nextDueDate: { gte: now, lte: cutoff },
      },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { nextDueDate: "asc" },
    });

    if (upcoming.length > 0) {
      const lines = upcoming.map((sub) => {
        const daysLeft = differenceInDays(new Date(sub.nextDueDate), now);
        const dueLabel = daysLeft === 0 ? "**due today**" : `due in **${daysLeft} day${daysLeft > 1 ? "s" : ""}**`;
        return `• **${sub.name}** — ${formatCurrency(sub.amount, 2)} — ${dueLabel} (${format(new Date(sub.nextDueDate), "dd MMM yyyy")})`;
      });

      const embed = {
        title: "📅 Upcoming Subscription Payments",
        description: lines.join("\n"),
        color: 0x6366f1,
        footer: { text: "ExpenseTracker · Subscription Reminder" },
        timestamp: new Date().toISOString(),
      };

      const discordRes = await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [embed] }),
      });

      if (discordRes.ok) notified = upcoming.length;
    }
  }

  // === Auto-create expenses for overdue/due-today subscriptions ===
  const overdue = await prisma.subscription.findMany({
    where: {
      isActive: true,
      trackInExpenses: true,
      nextDueDate: { lte: startOfDay(now) },
    },
  });

  let autoCreated = 0;
  for (const sub of overdue) {
    // Dedup guard: skip if expense already created for this sub on this due date
    const exists = await prisma.expense.findFirst({
      where: {
        userId: sub.userId,
        title: `${sub.name} (subscription)`,
        date: {
          gte: startOfDay(sub.nextDueDate),
          lte: endOfDay(sub.nextDueDate),
        },
      },
    });

    if (!exists) {
      const expenseAmount = Math.max(sub.minimumCharge ?? 0, sub.amount);
      await prisma.expense.create({
        data: {
          title: `${sub.name} (subscription)`,
          amount: expenseAmount,
          category: sub.category,
          date: sub.nextDueDate,
          description: "Auto-logged by cron",
          userId: sub.userId,
        },
      });
      autoCreated++;
    }

    // Advance due date by one cycle (only one cycle per run)
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { nextDueDate: advanceDueDate(sub.nextDueDate, sub.billingCycle) },
    });
  }

  return NextResponse.json({ notified, autoCreated });
}
