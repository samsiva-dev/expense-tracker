import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    update: {},
    create: { userId: session.user.id, baseCurrency: "INR", earnCurrency: "INR" },
  });

  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { baseCurrency, earnCurrency } = body as Record<string, unknown>;

  const settings = await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    update: {
      ...(typeof baseCurrency === "string" && { baseCurrency }),
      ...(typeof earnCurrency === "string" && { earnCurrency }),
    },
    create: {
      userId: session.user.id,
      baseCurrency: (baseCurrency as string) ?? "INR",
      earnCurrency: (earnCurrency as string) ?? "INR",
    },
  });

  return NextResponse.json(settings);
}
