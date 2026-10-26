import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { randomBytes, createHash, scryptSync } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "shortlink.db");

let db: DatabaseSync | null = null;

export type PublicUser = {
  id: number;
  email: string;
  name: string;
  wa: string;
  role: string;
  is_active: number;
  created_at: string;
};

export type LinkRow = {
  id: number;
  user_id: number | null;
  code: string;
  target_url: string;
  title: string;
  is_active: number;
  clicks: number;
  created_at: string;
  last_clicked_at: string | null;
  owner_email: string | null;
};

export type MicrositeRow = {
  id: number;
  user_id: number;
  slug: string;
  title: string;
  bio: string;
  avatar_url: string;
  theme: string;
  is_active: number;
  views: number;
  created_at: string;
};

export type MicrositeLinkRow = {
  id: number;
  microsite_id: number;
  title: string;
  url: string;
  position: number;
  is_active: number;
};

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function getDb(): DatabaseSync {
  if (db) return db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      wa TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'user',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS user_sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      ip_hash TEXT NOT NULL DEFAULT '',
      code TEXT UNIQUE NOT NULL,
      target_url TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      clicks INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_clicked_at TEXT DEFAULT NULL
    );
    CREATE TABLE IF NOT EXISTS clicks (
      id INTEGER PRIMARY KEY,
      link_id INTEGER NOT NULL REFERENCES links(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      referer TEXT NOT NULL DEFAULT '',
      ua TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS microsites (
      id INTEGER PRIMARY KEY,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      bio TEXT NOT NULL DEFAULT '',
      avatar_url TEXT NOT NULL DEFAULT '',
      theme TEXT NOT NULL DEFAULT 'peka',
      is_active INTEGER NOT NULL DEFAULT 1,
      views INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS microsite_links (
      id INTEGER PRIMARY KEY,
      microsite_id INTEGER NOT NULL REFERENCES microsites(id),
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1
    );
  `);
  // Seed admin from env on first boot only.
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "";
  if (adminEmail && adminPassword) {
    const existing = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(adminEmail) as { id: number } | undefined;
    if (!existing) {
      db.prepare(
        "INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'admin')"
      ).run(adminEmail, hashPassword(adminPassword), "Admin Peka");
    }
  }
  return db;
}

export function ipHash(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

// ----- users -----

export function createUser(email: string, passwordHash: string, name: string): number {
  const r = getDb()
    .prepare("INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)")
    .run(email, passwordHash, name);
  return Number(r.lastInsertRowid);
}

export function getUserByEmail(email: string) {
  return getDb().prepare("SELECT * FROM users WHERE email = ?").get(email) as
    | (PublicUser & { password_hash: string })
    | undefined;
}

export function getUserById(id: number): PublicUser | undefined {
  return getDb()
    .prepare("SELECT id, email, name, wa, role, is_active, created_at FROM users WHERE id = ?")
    .get(id) as PublicUser | undefined;
}

export function updateUserProfile(id: number, name: string, wa: string): void {
  getDb().prepare("UPDATE users SET name = ?, wa = ? WHERE id = ?").run(name, wa, id);
}

export function updateUserPassword(id: number, passwordHash: string): void {
  getDb().prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, id);
}

export function listUsersAdmin(): (PublicUser & { links: number; clicks: number })[] {
  return getDb()
    .prepare(
      `SELECT u.id, u.email, u.name, u.wa, u.role, u.is_active, u.created_at,
        (SELECT COUNT(*) FROM links l WHERE l.user_id = u.id) AS links,
        (SELECT COALESCE(SUM(l.clicks), 0) FROM links l WHERE l.user_id = u.id) AS clicks
       FROM users u ORDER BY u.created_at DESC`
    )
    .all() as (PublicUser & { links: number; clicks: number })[];
}

export function setUserActive(id: number, active: boolean): void {
  getDb().prepare("UPDATE users SET is_active = ? WHERE id = ?").run(active ? 1 : 0, id);
}

export function countUsers(): number {
  const r = getDb().prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  return r.n;
}

// ----- sessions -----

export function createUserSession(token: string, userId: number, expires: string): void {
  getDb()
    .prepare("INSERT INTO user_sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
    .run(token, userId, expires);
}

export function getSessionUserId(token: string): number | null {
  const r = getDb()
    .prepare("SELECT user_id, expires_at FROM user_sessions WHERE token = ?")
    .get(token) as { user_id: number; expires_at: string } | undefined;
  if (!r) return null;
  if (new Date(r.expires_at).getTime() < Date.now()) return null;
  return r.user_id;
}

export function deleteUserSession(token: string): void {
  getDb().prepare("DELETE FROM user_sessions WHERE token = ?").run(token);
}

// ----- links -----

export function createLink(
  userId: number | null,
  ip: string,
  code: string,
  targetUrl: string,
  title: string
): number {
  const r = getDb()
    .prepare(
      "INSERT INTO links (user_id, ip_hash, code, target_url, title) VALUES (?, ?, ?, ?, ?)"
    )
    .run(userId, ipHash(ip), code, targetUrl, title);
  return Number(r.lastInsertRowid);
}

export function getLinkByCode(code: string): LinkRow | undefined {
  return getDb()
    .prepare(
      `SELECT l.*, u.email AS owner_email FROM links l
       LEFT JOIN users u ON u.id = l.user_id WHERE l.code = ?`
    )
    .get(code) as LinkRow | undefined;
}

export function guestCountToday(ip: string): number {
  const r = getDb()
    .prepare(
      "SELECT COUNT(*) AS n FROM links WHERE user_id IS NULL AND ip_hash = ? AND date(created_at) = date('now')"
    )
    .get(ipHash(ip)) as { n: number };
  return r.n;
}

export function listLinksByUser(userId: number): LinkRow[] {
  return getDb()
    .prepare("SELECT *, NULL AS owner_email FROM links WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as LinkRow[];
}

export function listAllLinksAdmin(limit = 200): LinkRow[] {
  return getDb()
    .prepare(
      `SELECT l.*, u.email AS owner_email FROM links l
       LEFT JOIN users u ON u.id = l.user_id ORDER BY l.created_at DESC LIMIT ?`
    )
    .all(limit) as LinkRow[];
}

export function deleteLink(id: number, userId: number | null): boolean {
  const sql =
    userId === null
      ? "DELETE FROM links WHERE id = ?"
      : "DELETE FROM links WHERE id = ? AND user_id = ?";
  const args = userId === null ? [id] : [id, userId];
  const r = getDb().prepare(sql).run(...args);
  return r.changes > 0;
}

export function setLinkActive(id: number, userId: number | null, active: boolean): boolean {
  const sql =
    userId === null
      ? "UPDATE links SET is_active = ? WHERE id = ?"
      : "UPDATE links SET is_active = ? WHERE id = ? AND user_id = ?";
  const args = userId === null ? [active ? 1 : 0, id] : [active ? 1 : 0, id, userId];
  const r = getDb().prepare(sql).run(...args);
  return r.changes > 0;
}

export function recordClick(linkId: number, referer: string, ua: string): void {
  const d = getDb();
  d.prepare("INSERT INTO clicks (link_id, referer, ua) VALUES (?, ?, ?)").run(
    linkId,
    referer.slice(0, 300),
    ua.slice(0, 300)
  );
  d.prepare(
    "UPDATE links SET clicks = clicks + 1, last_clicked_at = datetime('now') WHERE id = ?"
  ).run(linkId);
}

export function clicksByDay(linkIds: number[], days: number): { day: string; n: number }[] {
  if (linkIds.length === 0) return [];
  const placeholders = linkIds.map(() => "?").join(",");
  return getDb()
    .prepare(
      `SELECT date(created_at) AS day, COUNT(*) AS n FROM clicks
       WHERE link_id IN (${placeholders}) AND date(created_at) >= date('now', ?)
       GROUP BY day ORDER BY day ASC`
    )
    .all(...linkIds, `-${days - 1} days`) as { day: string; n: number }[];
}

export function countLinks(): number {
  return (getDb().prepare("SELECT COUNT(*) AS n FROM links").get() as { n: number }).n;
}

export function countClicks(): number {
  return (getDb().prepare("SELECT COUNT(*) AS n FROM clicks").get() as { n: number }).n;
}

export function clicksToday(): number {
  return (
    getDb().prepare("SELECT COUNT(*) AS n FROM clicks WHERE date(created_at) = date('now')").get() as {
      n: number;
    }
  ).n;
}

export function guestLinksToday(): number {
  return (
    getDb()
      .prepare(
        "SELECT COUNT(*) AS n FROM links WHERE user_id IS NULL AND date(created_at) = date('now')"
      )
      .get() as { n: number }
  ).n;
}

export function topLinks(limit = 10): LinkRow[] {
  return getDb()
    .prepare(
      `SELECT l.*, u.email AS owner_email FROM links l
       LEFT JOIN users u ON u.id = l.user_id ORDER BY l.clicks DESC LIMIT ?`
    )
    .all(limit) as LinkRow[];
}

export function recentClicks(limit = 50): { created_at: string; code: string; referer: string }[] {
  return getDb()
    .prepare(
      `SELECT c.created_at, l.code, c.referer FROM clicks c
       JOIN links l ON l.id = c.link_id ORDER BY c.created_at DESC LIMIT ?`
    )
    .all(limit) as { created_at: string; code: string; referer: string }[];
}

// ----- microsites -----

export function getMicrositeByUser(userId: number): MicrositeRow | undefined {
  return getDb().prepare("SELECT * FROM microsites WHERE user_id = ?").get(userId) as
    | MicrositeRow
    | undefined;
}

export function getMicrositeBySlug(slug: string): MicrositeRow | undefined {
  return getDb().prepare("SELECT * FROM microsites WHERE slug = ?").get(slug) as
    | MicrositeRow
    | undefined;
}

export function upsertMicrosite(
  userId: number,
  slug: string,
  title: string,
  bio: string,
  avatarUrl: string,
  theme: string
): void {
  const d = getDb();
  const existing = d.prepare("SELECT id FROM microsites WHERE user_id = ?").get(userId) as
    | { id: number }
    | undefined;
  if (existing) {
    d.prepare(
      "UPDATE microsites SET slug = ?, title = ?, bio = ?, avatar_url = ?, theme = ? WHERE user_id = ?"
    ).run(slug, title, bio, avatarUrl, theme, userId);
  } else {
    d.prepare(
      "INSERT INTO microsites (user_id, slug, title, bio, avatar_url, theme) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(userId, slug, title, bio, avatarUrl, theme);
  }
}

export function setMicrositeActive(userId: number, active: boolean): void {
  getDb().prepare("UPDATE microsites SET is_active = ? WHERE user_id = ?").run(active ? 1 : 0, userId);
}

export function bumpMicrositeViews(id: number): void {
  getDb().prepare("UPDATE microsites SET views = views + 1 WHERE id = ?").run(id);
}

export function countMicrosites(): number {
  return (getDb().prepare("SELECT COUNT(*) AS n FROM microsites").get() as { n: number }).n;
}

export function listMicrositeLinks(micrositeId: number): MicrositeLinkRow[] {
  return getDb()
    .prepare("SELECT * FROM microsite_links WHERE microsite_id = ? ORDER BY position ASC, id ASC")
    .all(micrositeId) as MicrositeLinkRow[];
}

export function addMicrositeLink(micrositeId: number, title: string, url: string): number {
  const max = getDb()
    .prepare("SELECT COALESCE(MAX(position), -1) AS m FROM microsite_links WHERE microsite_id = ?")
    .get(micrositeId) as { m: number };
  const r = getDb()
    .prepare(
      "INSERT INTO microsite_links (microsite_id, title, url, position) VALUES (?, ?, ?, ?)"
    )
    .run(micrositeId, title, url, max.m + 1);
  return Number(r.lastInsertRowid);
}

export function updateMicrositeLink(
  id: number,
  micrositeId: number,
  title: string,
  url: string,
  active: boolean
): boolean {
  const r = getDb()
    .prepare(
      "UPDATE microsite_links SET title = ?, url = ?, is_active = ? WHERE id = ? AND microsite_id = ?"
    )
    .run(title, url, active ? 1 : 0, id, micrositeId);
  return r.changes > 0;
}

export function deleteMicrositeLink(id: number, micrositeId: number): boolean {
  const r = getDb()
    .prepare("DELETE FROM microsite_links WHERE id = ? AND microsite_id = ?")
    .run(id, micrositeId);
  return r.changes > 0;
}

export function moveMicrositeLink(id: number, micrositeId: number, dir: number): boolean {
  const d = getDb();
  const items = d
    .prepare("SELECT id, position FROM microsite_links WHERE microsite_id = ? ORDER BY position ASC, id ASC")
    .all(micrositeId) as { id: number; position: number }[];
  const idx = items.findIndex((x) => x.id === id);
  if (idx < 0) return false;
  const swap = idx + dir;
  if (swap < 0 || swap >= items.length) return false;
  d.prepare("UPDATE microsite_links SET position = ? WHERE id = ?").run(items[swap].position, id);
  d.prepare("UPDATE microsite_links SET position = ? WHERE id = ?").run(items[idx].position, items[swap].id);
  return true;
}
