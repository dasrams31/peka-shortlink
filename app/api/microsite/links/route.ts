import { NextResponse } from "next/server";
import { addMicrositeLink, getMicrositeByUser } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { validUrl } from "@/lib/util";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Login dulu." }, { status: 401 });
  const site = getMicrositeByUser(user.id);
  if (!site) return NextResponse.json({ error: "Buat microsite dulu." }, { status: 400 });
  const body = await req.json().catch(() => null);
  const title = String(body?.title || "").trim().slice(0, 80);
  const url = String(body?.url || "").trim();
  if (!title) return NextResponse.json({ error: "Judul link wajib diisi." }, { status: 400 });
  if (!validUrl(url)) return NextResponse.json({ error: "URL tidak valid." }, { status: 400 });
  const id = addMicrositeLink(site.id, title, url);
  return NextResponse.json({ ok: true, id });
}
