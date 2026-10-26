"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ShortenForm from "@/components/ShortenForm";

type LinkRow = {
  id: number;
  code: string;
  target_url: string;
  title: string;
  is_active: number;
  clicks: number;
  created_at: string;
  last_clicked_at: string | null;
};

type Daily = { day: string; n: number };

export default function DashboardPage() {
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [daily, setDaily] = useState<Daily[]>([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [todayClicks, setTodayClicks] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [linksRes, statsRes] = await Promise.all([fetch("/api/links"), fetch("/api/stats")]);
      if (linksRes.status === 401 || statsRes.status === 401) {
        window.location.href = "/login";
        return;
      }
      const linksData = await linksRes.json();
      const statsData = await statsRes.json();
      setLinks(linksData.links || []);
      setDaily((linksData.daily || []).slice(-14));
      setTotalClicks(statsData.totalClicks || 0);
      setTodayClicks(statsData.todayClicks || 0);
    } catch {
      setError("Gagal memuat dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(link: LinkRow) {
    await fetch(`/api/links/${link.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: link.is_active !== 1 }),
    });
    load();
  }

  async function remove(id: number) {
    const res = await fetch(`/api/links/${id}`, { method: "DELETE" });
    if (res.ok) {
      setNotice("Link dihapus.");
      setConfirmDelete(null);
      load();
    }
  }

  const filtered = links.filter(
    (l) =>
      l.code.includes(search.toLowerCase()) ||
      l.target_url.toLowerCase().includes(search.toLowerCase())
  );
  const maxDaily = Math.max(1, ...daily.map((d) => d.n));

  return (
    <main className="wrap-wide">
      <section className="hero">
        <h1>Dashboard</h1>
        <p>Semua link kamu, statistik kliknya, dan microsite, dalam satu tempat.</p>
      </section>

      <nav className="tabs">
        <Link href="/dashboard" className="active">Link & Statistik</Link>
        <Link href="/dashboard/microsite">Microsite</Link>
        <Link href="/dashboard/pengaturan">Pengaturan</Link>
      </nav>

      {error && <div className="error">{error}</div>}
      {notice && <div className="success">{notice}</div>}

      <div className="stats">
        <div className="stat"><div className="num">{links.length}</div><div className="lbl">Total link</div></div>
        <div className="stat"><div className="num">{totalClicks}</div><div className="lbl">Total klik</div></div>
        <div className="stat"><div className="num">{todayClicks}</div><div className="lbl">Klik hari ini</div></div>
        <div className="stat"><div className="num">{links.filter((l) => l.is_active === 1).length}</div><div className="lbl">Link aktif</div></div>
      </div>

      <div className="card">
        <h2>Klik 14 hari terakhir</h2>
        {daily.length === 0 ? (
          <div className="empty"><strong>Belum ada klik.</strong>Bagikan link kamu, lalu statistik muncul di sini.</div>
        ) : (
          <div className="chart">
            {daily.map((d) => (
              <div className="bar-wrap" key={d.day} title={`${d.day}: ${d.n} klik`}>
                <span style={{ fontSize: 11 }}>{d.n}</span>
                <div className="bar" style={{ height: `${Math.max(2, (d.n / maxDaily) * 90)}px` }} />
                <span className="bar-lbl">{d.day.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2>Buat link baru</h2>
        <p className="sub">Akun gratis: unlimited, tanpa batas harian.</p>
        <ShortenForm loggedIn={true} />
      </div>

      <div className="card">
        <div className="row-between">
          <h2>Daftar link</h2>
          <input
            className="input"
            style={{ maxWidth: 280 }}
            placeholder="Cari kode atau URL tujuan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <p className="note">Memuat...</p>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <strong>Belum ada link.</strong>
            Buat link pertama kamu dari formulir di atas atau dari beranda.
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Link pendek</th>
                  <th>Tujuan</th>
                  <th>Klik</th>
                  <th>Dibuat</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <span className="mono">s.peka.ai.id/{l.code}</span>
                      <br />
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ marginTop: 6 }}
                        onClick={() => navigator.clipboard.writeText(`https://s.peka.ai.id/${l.code}`)}
                      >
                        Salin
                      </button>
                    </td>
                    <td className="mono" style={{ maxWidth: 260, wordBreak: "break-all" }}>
                      {l.target_url.length > 60 ? l.target_url.slice(0, 60) + "…" : l.target_url}
                    </td>
                    <td><strong>{l.clicks}</strong></td>
                    <td>{l.created_at.slice(0, 10)}</td>
                    <td>
                      {l.is_active === 1 ? (
                        <span className="badge badge-yellow">Aktif</span>
                      ) : (
                        <span className="badge badge-off">Nonaktif</span>
                      )}
                    </td>
                    <td>
                      <div className="row">
                        <button className="btn btn-ghost btn-sm" onClick={() => toggle(l)}>
                          {l.is_active === 1 ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                        {confirmDelete === l.id ? (
                          <>
                            <button className="btn btn-danger btn-sm" onClick={() => remove(l.id)}>Yakin hapus?</button>
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
        )}
      </div>
    </main>
  );
}
