import { NextResponse } from "next/server";
import { updateUserPassword, updateUserProfile } from "@/lib/db";
import { getSessionUser, hashPassword, verifyPassword } from "@/lib/auth";
import { getUserByEmail } from "@/lib/db";

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Login dulu." }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (body?.action === "profile") {
    const name = String(body?.name || "").trim().slice(0, 80);
    const wa = String(body?.wa || "").trim().slice(0, 20);
    if (wa && !/^[0-9+]{9,16}$/.test(wa)) {
      return NextResponse.json({ error: "Nomor WA tidak valid." }, { status: 400 });
    }
    updateUserProfile(user.id, name, wa);
    return NextResponse.json({ ok: true });
  }
  if (body?.action === "password") {
    const current = String(body?.current || "");
    const next = String(body?.next || "");
    if (next.length < 8) {
      return NextResponse.json({ error: "Password baru minimal 8 karakter." }, { status: 400 });
    }
    const full = getUserByEmail(user.email);
    if (!full || !verifyPassword(current, full.password_hash)) {
      return NextResponse.json({ error: "Password lama salah." }, { status: 401 });
    }
    updateUserPassword(user.id, hashPassword(next));
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Aksi tidak dikenal." }, { status: 400 });
}
