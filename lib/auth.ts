import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import {
  createUserSession,
  deleteUserSession,
  getSessionUserId,
  getUserById,
  type PublicUser,
} from "./db";

const SESSION_COOKIE = "ps_short";
const SESSION_DAYS = 30;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [algo, salt, hash] = stored.split(":");
    if (algo !== "scrypt" || !salt || !hash) return false;
    const check = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return check.length === expected.length && timingSafeEqual(check, expected);
  } catch {
    return false;
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function startSession(res: NextResponse, userId: number): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  createUserSession(token, userId, expires.toISOString());
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function endSession(res: NextResponse): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) deleteUserSession(token);
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", expires: new Date(0) });
}

export async function getSessionUser(): Promise<PublicUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = getSessionUserId(token);
  if (!userId) return null;
  const user = getUserById(userId);
  if (!user || user.is_active !== 1) return null;
  return user;
}
