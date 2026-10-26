import { NextResponse } from "next/server";
import { listAllLinksAdmin } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Khusus admin." }, { status: 403 });
  }
  return NextResponse.json({ links: listAllLinksAdmin(300) });
}
