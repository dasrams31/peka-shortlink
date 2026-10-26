import { NextResponse } from "next/server";
import { deleteLink, setLinkActive } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Login dulu." }, { status: 401 });
  const id = Number((await params).id);
  const body = await req.json().catch(() => null);
  const active = body?.is_active === true || body?.is_active === 1;
  const ok = setLinkActive(id, user.role === "admin" ? null : user.id, active);
  if (!ok) return NextResponse.json({ error: "Link tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Login dulu." }, { status: 401 });
  const id = Number((await params).id);
  const ok = deleteLink(id, user.role === "admin" ? null : user.id);
  if (!ok) return NextResponse.json({ error: "Link tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
