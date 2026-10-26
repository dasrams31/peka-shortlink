"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Site = {
  slug: string;
  title: string;
  bio: string;
  avatar_url: string;
  theme: string;
  is_active: number;
  views: number;
};

type MLink = { id: number; title: string; url: string; position: number; is_active: number };

export default function MicrositePage() {
  const [site, setSite] = useState<Site | null>(null);
  const [links, setLinks] = useState<MLink[]>([]);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [theme, setTheme] = useState("peka");
  const [active, setActive] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/microsite");
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      setSite(data.site || null);
      setLinks(data.links || []);
      if (data.site) {
        setSlug(data.site.slug);
        setTitle(data.site.title);
        setBio(data.site.bio);
        setAvatar(data.site.avatar_url);
        setTheme(data.site.theme);
        setActive(data.site.is_active === 1);
      }
    } catch {
      setError("Gagal memuat microsite.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    const res = await fetch("/api/microsite", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, title, bio, avatar_url: avatar, theme, is_active: active }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Gagal menyimpan.");
      return;
    }
    setNotice("Microsite tersimpan.");
    load();
  }

  async function addLink(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/microsite/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, url: newUrl }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Gagal menambah link.");
      return;
    }
    setNewTitle("");
    setNewUrl("");
    load();
  }

  async function saveLink(id: number) {
    const res = await fetch(`/api/microsite/links/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, url: editUrl }),
    });
    if (res.ok) {
      setEditing(null);
      load();
    }
  }

  async function move(id: number, dir: number) {
    await fetch(`/api/microsite/links/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ move: dir }),
    });
    load();
  }

  async function remove(id: number) {
    await fetch(`/api/microsite/links/${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    load();
  }

  return (
    <main className="wrap-wide">
      <section className="hero">
        <h1>Microsite</h1>
        <p>Satu halaman untuk semua link kamu. Atur slug, judul, bio, tema, dan daftar linknya.</p>
      </section>

      <nav className="tabs">
        <Link href="/dashboard">Link & Statistik</Link>
        <Link href="/dashboard/microsite" className="active">Microsite</Link>
        <Link href="/dashboard/pengaturan">Pengaturan</Link>
      </nav>

      {error && <div className="error">{error}</div>}
      {notice && <div className="success">{notice}</div>}

      {loading ? (
        <p className="note">Memuat...</p>
      ) : (
        <>
          <form className="card" onSubmit={saveProfile}>
            <h2>Halaman microsite</h2>
            <p className="sub">
              {site ? (
                <>
                  Halaman publik kamu: <a href={`/m/${site.slug}`} target="_blank" rel="noreferrer">s.peka.ai.id/m/{site.slug}</a>
                  {" "}· {site.views} kunjungan
                </>
              ) : (
                "Isi formulir ini untuk membuat microsite pertama kamu."
              )}
            </p>
            <div className="field">
              <label htmlFor="ms-slug">Slug halaman</label>
              <div className="row" style={{ flexWrap: "nowrap" }}>
                <span className="mono" style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>s.peka.ai.id/m/</span>
                <input id="ms-slug" className="input" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} required />
              </div>
            </div>
            <div className="field">
              <label htmlFor="ms-title">Judul halaman</label>
              <input id="ms-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nama kamu atau nama brand" />
            </div>
            <div className="field">
              <label htmlFor="ms-bio">Bio singkat</label>
              <input id="ms-bio" className="input" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Satu kalimat tentang kamu" />
            </div>
            <div className="field">
              <label htmlFor="ms-avatar">URL avatar (opsional)</label>
              <input id="ms-avatar" className="input" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." />
            </div>
            <div className="field">
              <label htmlFor="ms-theme">Tema</label>
              <select id="ms-theme" className="input" value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="peka">Peka Kuning (hitam + kuning)</option>
                <option value="terang">Terang (krem + hitam)</option>
                <option value="gelap">Gelap (hitam + putih)</option>
              </select>
            </div>
            <div className="field">
              <label>
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Halaman aktif (bisa dibuka publik)
              </label>
            </div>
            <button className="btn" type="submit">Simpan microsite</button>
          </form>

          {site && (
            <div className="card">
              <h2>Daftar link di microsite</h2>
              <p className="sub">Urutkan dengan tombol naik dan turun. Link nonaktif tidak tampil di halaman publik.</p>
              {links.length === 0 ? (
                <div className="empty"><strong>Belum ada link.</strong>Tambahkan link pertama di bawah.</div>
              ) : (
                <ul className="list">
                  {links.map((l, i) => (
                    <li key={l.id}>
                      {editing === l.id ? (
                        <div>
                          <input className="input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ marginBottom: 8 }} />
                          <input className="input" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} style={{ marginBottom: 8 }} />
                          <div className="row">
                            <button className="btn btn-sm" onClick={() => saveLink(l.id)}>Simpan</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>Batal</button>
                          </div>
                        </div>
                      ) : (
                        <div className="row-between">
                          <div>
                            <strong>{l.title}</strong>
                            <span className="mono" style={{ display: "block", wordBreak: "break-all" }}>{l.url}</span>
                          </div>
                          <div className="row">
                            <button className="btn btn-ghost btn-sm" disabled={i === 0} onClick={() => move(l.id, -1)}>Naik</button>
                            <button className="btn btn-ghost btn-sm" disabled={i === links.length - 1} onClick={() => move(l.id, 1)}>Turun</button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                setEditing(l.id);
                                setEditTitle(l.title);
                                setEditUrl(l.url);
                              }}
                            >
                              Edit
                            </button>
                            {confirmDelete === l.id ? (
                              <>
                                <button className="btn btn-danger btn-sm" onClick={() => remove(l.id)}>Yakin?</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(null)}>Batal</button>
                              </>
                            ) : (
                              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(l.id)}>Hapus</button>
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <form onSubmit={addLink} style={{ marginTop: 16 }}>
                <div className="field">
                  <label htmlFor="new-title">Judul link baru</label>
                  <input id="new-title" className="input" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
                </div>
                <div className="field">
                  <label htmlFor="new-url">URL link baru</label>
                  <input id="new-url" className="input" type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} required />
                </div>
                <button className="btn" type="submit">Tambah link</button>
              </form>
            </div>
          )}
        </>
      )}
    </main>
  );
}
