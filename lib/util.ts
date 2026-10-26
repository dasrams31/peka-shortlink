import { randomBytes } from "node:crypto";

export const RESERVED_CODES = new Set([
  "admin",
  "api",
  "dashboard",
  "login",
  "logout",
  "register",
  "pengaturan",
  "microsite",
  "m",
  "s",
  "peka",
  "link",
  "links",
  "short",
  "buat",
  "masuk",
  "daftar",
  "favicon.ico",
  "robots.txt",
]);

const CODE_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

export function randomCode(length = 6): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  return out;
}

export function validSlug(slug: string): boolean {
  if (slug.length < 3 || slug.length > 50) return false;
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) return false;
  if (RESERVED_CODES.has(slug)) return false;
  return true;
}

export function validUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") || "127.0.0.1";
}

export function baseUrl(headers: Headers): string {
  const host = headers.get("x-forwarded-host") || headers.get("host") || "s.peka.ai.id";
  const proto = headers.get("x-forwarded-proto") || (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}

export function shortUrl(headers: Headers, code: string): string {
  return `${baseUrl(headers)}/${code}`;
}

export function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}
