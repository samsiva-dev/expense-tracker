import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/constants";
import { format, differenceInDays } from "date-fns";

// POST /api/cron/subscriptions
// Checks for subscriptions due in the next DAYS_AHEAD days and sends Discord notifications.
// Protect with CRON_SECRET header in production.
const DAYS_AHEAD = 3;

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json({ error: "DISCORD_WEBHOOK_URL not configured" }, { status: 500 });
  }

  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + DAYS_AHEAD);

  const upcoming = await prisma.subscription.findMany({
    where: {
      isActive: true,
      nextDueDate: { gte: now, lte: cutoff },
    },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { nextDueDate: "asc" },
  });

  if (upcoming.length === 0) {
    return NextResponse.json({ sent: 0, message: "No upcoming subscriptions" });
  }

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

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Discord webhook failed", status: res.status }, { status: 502 });
  }

  return NextResponse.json({ sent: upcoming.length });
}
