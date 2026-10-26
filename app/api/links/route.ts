import { NextResponse } from "next/server";
import { clicksByDay, listLinksByUser } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Login dulu." }, { status: 401 });
  const links = listLinksByUser(user.id);
  const ids = links.map((l) => l.id);
  const daily = clicksByDay(ids, 14);
  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
  return NextResponse.json({ links, daily, totalClicks, totalLinks: links.length });
}
