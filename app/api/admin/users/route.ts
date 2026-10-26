import { NextResponse } from "next/server";
import { listUsersAdmin, setUserActive } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Khusus admin." }, { status: 403 });
  }
  return NextResponse.json({ users: listUsersAdmin() });
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Khusus admin." }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const id = Number(body?.id);
  const active = body?.is_active === true || body?.is_active === 1;
  if (!id || id === user.id) {
    return NextResponse.json({ error: "Tidak bisa mengubah akun sendiri." }, { status: 400 });
  }
  setUserActive(id, active);
  return NextResponse.json({ ok: true });
}
