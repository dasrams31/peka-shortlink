import { NextResponse } from "next/server";
import {
  clicksToday,
  countClicks,
  countLinks,
  countMicrosites,
  countUsers,
  guestLinksToday,
  recentClicks,
  topLinks,
} from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Khusus admin." }, { status: 403 });
  }
  return NextResponse.json({
    users: countUsers(),
    links: countLinks(),
    clicks: countClicks(),
    clicksToday: clicksToday(),
    microsites: countMicrosites(),
    guestLinksToday: guestLinksToday(),
    top: topLinks(10),
    recent: recentClicks(50),
  });
}
