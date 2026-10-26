import { NextResponse } from "next/server";
import { createUser, getUserByEmail } from "@/lib/db";
import { hashPassword, normalizeEmail, startSession, validEmail } from "@/lib/auth";
import { rateLimited } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
  if (rateLimited(`register:${ip}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi nanti." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const email = normalizeEmail(String(body?.email || ""));
  const password = String(body?.password || "");
  const name = String(body?.name || "").trim();
  if (!validEmail(email)) return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });
  if (password.length < 8) {
    return NextResponse.json({ error: "Password minimal 8 karakter." }, { status: 400 });
  }
  if (getUserByEmail(email)) {
    return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
  }
  const id = createUser(email, hashPassword(password), name);
  const res = NextResponse.json({ ok: true, id });
  await startSession(res, id);
  return res;
}
