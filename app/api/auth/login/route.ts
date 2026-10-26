import { NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/db";
import { normalizeEmail, startSession, verifyPassword } from "@/lib/auth";
import { rateLimited } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
  if (rateLimited(`login:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan login. Coba lagi 15 menit." },
      { status: 429 }
    );
  }
  const body = await req.json().catch(() => null);
  const email = normalizeEmail(String(body?.email || ""));
  const password = String(body?.password || "");
  const user = getUserByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: "Email atau password salah." }, { status: 401 });
  }
  if (user.is_active !== 1) {
    return NextResponse.json({ error: "Akun dinonaktifkan. Hubungi admin." }, { status: 403 });
  }
  const res = NextResponse.json({ ok: true, role: user.role });
  await startSession(res, user.id);
  return res;
}
