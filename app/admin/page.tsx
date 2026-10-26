"use client";

import { useEffect, useState } from "react";

type Stats = {
  users: number;
  links: number;
  clicks: number;
  clicksToday: number;
  microsites: number;
  guestLinksToday: number;
  top: { id: number; code: string; target_url: string; clicks: number; owner_email: string | null }[];
  recent: { created_at: string; code: string; referer: string }[];
};

type AdminUser = {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active: number;
  created_at: string;
  links: number;
  clicks: number;
};

type AdminLink = {
  id: number;
  code: string;
  target_url: string;
  clicks: number;
  is_active: number;
  created_at: string;
  owner_email: string | null;
};

export default function AdminPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [links, setLinks] = useState<AdminLink[]>([]);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  async function load() {
    try {
      const me = await (await fetch("/api/auth/me")).json();
      if (!me.user || me.user.role !== "admin") {
        setAllowed(false);
        return;
      }
      setAllowed(true);
      const [s, u, l] = await Promise.all([
        fetch("/api/admin/stats").then((r) => r.json()),
        fetch("/api/admin/users").then((r) => r.json()),
        fetch("/api/admin/links").then((r) => r.json()),
      ]);
      setStats(s);
      setUsers(u.users || []);
      setLinks(l.links || []);
    } catch {
      setError("Gagal memuat panel admin.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleUser(u: AdminUser) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, is_active: u.is_active !== 1 }),
    });
    load();
  }

  async function toggleLink(l: AdminLink) {
    await fetch(`/api/links/${l.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: l.is_active !== 1 }),
    });
    load();
  }

  async function removeLink(id: number) {
    const res = await fetch(`/api/links/${id}`, { method: "DELETE" });
    if (res.ok) {
      setNotice("Link dihapus admin.");
      setConfirmDelete(null);
      load();
    }
  }

  if (allowed === false) {
    return (
      <main className="wrap">
        <section className="hero">
          <h1>Khusus admin</h1>
          <p>Halaman ini hanya bisa dibuka akun admin. Masuk dengan akun admin dulu.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="wrap-wide">
      <section className="hero">
        <h1>Panel admin</h1>
        <p>Pantau seluruh pengguna, link, klik, dan microsite. Nonaktifkan akun atau link yang disalahgunakan.</p>
      </section>

      {error && <div className="error">{error}</div>}
      {notice && <div className="success">{notice}</div>}

      {stats && (
        <div className="stats">
          <div className="stat"><div className="num">{stats.users}</div><div className="lbl">Pengguna</div></div>
          <div className="stat"><div className="num">{stats.links}</div><div className="lbl">Total link</div></div>
          <div className="stat"><div className="num">{stats.clicks}</div><div className="lbl">Total klik</div></div>
          <div className="stat"><div className="num">{stats.clicksToday}</div><div className="lbl">Klik hari ini</div></div>
          <div className="stat"><div className="num">{stats.microsites}</div><div className="lbl">Microsite</div></div>
          <div className="stat"><div className="num">{stats.guestLinksToday}</div><div className="lbl">Link tamu hari ini</div></div>
        </div>
      )}

      <div className="card">
        <h2>Link teratas</h2>
        {stats && stats.top.length === 0 ? (
          <p className="note">Belum ada klik.</p>
        ) : (
          <ul className="list">
            {(stats?.top || []).map((t) => (
              <li key={t.id}>
                <strong className="mono">s.peka.ai.id/{t.code} — {t.clicks} klik</strong>
                <span className="mono">{t.target_url}</span>
                <span> oleh {t.owner_email || "tamu"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h2>Pengguna</h2>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Email</th><th>Nama</th><th>Peran</th><th>Link</th><th>Klik</th><th>Daftar</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="mono">{u.email}</td>
                  <td>{u.name || "-"}</td>
                  <td>{u.role === "admin" ? <span className="badge badge-yellow">Admin</span> : "User"}</td>
                  <td>{u.links}</td>
                  <td>{u.clicks}</td>
                  <td>{u.created_at.slice(0, 10)}</td>
                  <td>
                    {u.role !== "admin" && (
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleUser(u)}>
                        {u.is_active === 1 ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>Semua link</h2>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Kode</th><th>Tujuan</th><th>Pemilik</th><th>Klik</th><th>Status</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {links.map((l) => (
                <tr key={l.id}>
                  <td className="mono">{l.code}</td>
                  <td className="mono" style={{ maxWidth: 260, wordBreak: "break-all" }}>
                    {l.target_url.length > 50 ? l.target_url.slice(0, 50) + "…" : l.target_url}
                  </td>
                  <td className="mono">{l.owner_email || "tamu"}</td>
                  <td>{l.clicks}</td>
                  <td>{l.is_active === 1 ? <span className="badge badge-yellow">Aktif</span> : <span className="badge badge-off">Nonaktif</span>}</td>
                  <td>
                    <div className="row">
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleLink(l)}>
                        {l.is_active === 1 ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                      {confirmDelete === l.id ? (
                        <>
                          <button className="btn btn-danger btn-sm" onClick={() => removeLink(l.id)}>Yakin?</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(null)}>Batal</button>
                        </>
                      ) : (
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(l.id)}>Hapus</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>Klik terbaru</h2>
        <ul className="list">
          {(stats?.recent || []).map((c, i) => (
            <li key={i}>
              <strong className="mono">s.peka.ai.id/{c.code}</strong>
              <span>{c.created_at.replace("T", " ").slice(0, 19)} · {c.referer ? `dari ${c.referer}` : "langsung"}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
