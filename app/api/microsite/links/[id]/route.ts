import { NextResponse } from "next/server";
import {
  deleteMicrositeLink,
  getMicrositeByUser,
  moveMicrositeLink,
  updateMicrositeLink,
} from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { validUrl } from "@/lib/util";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Login dulu." }, { status: 401 });
  const site = getMicrositeByUser(user.id);
  if (!site) return NextResponse.json({ error: "Microsite tidak ditemukan." }, { status: 404 });
  const id = Number((await params).id);
  const body = await req.json().catch(() => null);
  if (typeof body?.move === "number") {
    const ok = moveMicrositeLink(id, site.id, body.move === 1 ? 1 : -1);
    return NextResponse.json({ ok });
  }
  const title = String(body?.title || "").trim().slice(0, 80);
  const url = String(body?.url || "").trim();
  const active = body?.is_active !== false && body?.is_active !== 0;
  if (!title || !validUrl(url)) {
    return NextResponse.json({ error: "Judul dan URL tidak valid." }, { status: 400 });
  }
  const ok = updateMicrositeLink(id, site.id, title, url, active);
  if (!ok) return NextResponse.json({ error: "Link tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Login dulu." }, { status: 401 });
  const site = getMicrositeByUser(user.id);
  if (!site) return NextResponse.json({ error: "Microsite tidak ditemukan." }, { status: 404 });
  const ok = deleteMicrositeLink(Number((await params).id), site.id);
  if (!ok) return NextResponse.json({ error: "Link tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
