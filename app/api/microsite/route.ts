import { NextResponse } from "next/server";
import {
  getMicrositeBySlug,
  getMicrositeByUser,
  listMicrositeLinks,
  setMicrositeActive,
  upsertMicrosite,
} from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { validSlug } from "@/lib/util";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Login dulu." }, { status: 401 });
  const site = getMicrositeByUser(user.id);
  return NextResponse.json({
    site,
    links: site ? listMicrositeLinks(site.id) : [],
  });
}

export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Login dulu." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const slug = String(body?.slug || "").trim().toLowerCase();
  const title = String(body?.title || "").trim().slice(0, 80);
  const bio = String(body?.bio || "").trim().slice(0, 300);
  const avatarUrl = String(body?.avatar_url || "").trim().slice(0, 500);
  const theme = ["peka", "terang", "gelap"].includes(String(body?.theme)) ? String(body.theme) : "peka";
  if (!validSlug(slug)) {
    return NextResponse.json({ error: "Slug microsite tidak valid (3-50 karakter, huruf kecil, angka, strip)." }, { status: 400 });
  }
  const taken = getMicrositeBySlug(slug);
  if (taken && taken.user_id !== user.id) {
    return NextResponse.json({ error: "Slug microsite sudah dipakai." }, { status: 409 });
  }
  if (avatarUrl && !/^https?:\/\//.test(avatarUrl)) {
    return NextResponse.json({ error: "URL avatar harus http:// atau https://." }, { status: 400 });
  }
  upsertMicrosite(user.id, slug, title, bio, avatarUrl, theme);
  if (typeof body?.is_active === "boolean" || body?.is_active === 0 || body?.is_active === 1) {
    setMicrositeActive(user.id, body.is_active === true || body.is_active === 1);
  }
  return NextResponse.json({ ok: true });
}
