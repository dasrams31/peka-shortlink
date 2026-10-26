import { NextResponse } from "next/server";
import { createLink, getLinkByCode, guestCountToday } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { rateLimited } from "@/lib/rate-limit";
import { getClientIp, randomCode, shortUrl, validSlug, validUrl } from "@/lib/util";

export const GUEST_DAILY_LIMIT = 5;

export async function POST(req: Request) {
  const headers = req.headers;
  const ip = getClientIp(headers);
  if (rateLimited(`shorten:${ip}`, 30, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi nanti." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const targetUrl = String(body?.url || "").trim();
  const slug = String(body?.slug || "").trim().toLowerCase();
  const title = String(body?.title || "").trim().slice(0, 120);
  if (!validUrl(targetUrl)) {
    return NextResponse.json({ error: "URL tujuan tidak valid. Pakai http:// atau https://." }, { status: 400 });
  }
  let code = "";
  if (slug) {
    if (!validSlug(slug)) {
      return NextResponse.json(
        { error: "Slug tidak valid. Pakai 3-50 karakter huruf kecil, angka, atau strip, dan bukan kata yang dilindungi." },
        { status: 400 }
      );
    }
    if (getLinkByCode(slug)) {
      return NextResponse.json({ error: "Slug sudah dipakai. Pilih slug lain." }, { status: 409 });
    }
    code = slug;
  } else {
    for (let i = 0; i < 10; i++) {
      const candidate = randomCode(6);
      if (!getLinkByCode(candidate)) {
        code = candidate;
        break;
      }
    }
    if (!code) return NextResponse.json({ error: "Gagal membuat kode. Coba lagi." }, { status: 500 });
  }
  const user = await getSessionUser();
  if (!user && guestCountToday(ip) >= GUEST_DAILY_LIMIT) {
    return NextResponse.json(
      { error: "Limit tamu tercapai: maks 5 link per IP per hari. Daftar gratis untuk link unlimited." },
      { status: 429 }
    );
  }
  const id = createLink(user ? user.id : null, ip, code, targetUrl, title);
  return NextResponse.json({
    ok: true,
    id,
    code,
    short_url: shortUrl(headers, code),
    guest_remaining: user ? null : GUEST_DAILY_LIMIT - guestCountToday(ip),
  });
}
