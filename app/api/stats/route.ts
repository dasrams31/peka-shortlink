import { NextResponse } from "next/server";
import { clicksByDay, listLinksByUser } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Login dulu." }, { status: 401 });
  const links = listLinksByUser(user.id);
  const ids = links.map((l) => l.id);
  const daily = clicksByDay(ids, 30);
  const today = new Date().toISOString().slice(0, 10);
  const todayClicks = daily.find((d) => d.day === today)?.n || 0;
  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
  const top = [...links].sort((a, b) => b.clicks - a.clicks).slice(0, 5);
  return NextResponse.json({
    totalLinks: links.length,
    totalClicks,
    todayClicks,
    daily,
    top,
  });
}
