"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [wa, setWa] = useState("");
  const [email, setEmail] = useState("");
  const [current, setCurrent] = useState("");
  const [nextPw, setNextPw] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) {
          window.location.href = "/login";
          return;
        }
        setName(d.user.name || "");
        setWa(d.user.wa || "");
        setEmail(d.user.email || "");
      })
      .catch(() => {});
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "profile", name, wa }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Gagal menyimpan profil.");
      return;
    }
    setNotice("Profil tersimpan.");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "password", current, next: nextPw }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Gagal mengganti password.");
      return;
    }
    setNotice("Password berhasil diganti.");
    setCurrent("");
    setNextPw("");
  }

  return (
    <main className="wrap-wide">
      <section className="hero">
        <span className="spec-label">Pengaturan • Profil • Keamanan</span>
        <h1>Pengaturan</h1>
        <p>Profil dan keamanan akun kamu.</p>
        <div className="ruler" />
      </section>

      <nav className="tabs">
        <Link href="/dashboard">Link & Statistik</Link>
        <Link href="/dashboard/microsite">Microsite</Link>
        <Link href="/dashboard/pengaturan" className="active">Pengaturan</Link>
      </nav>

      {error && <div className="error">{error}</div>}
      {notice && <div className="success">{notice}</div>}

      <form className="card" onSubmit={saveProfile}>
        <h2>Profil</h2>
        <p className="sub">Email akun: {email || "..."}</p>
        <div className="field">
          <label htmlFor="nama">Nama</label>
          <input id="nama" className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="wa">Nomor WA (opsional)</label>
          <input id="wa" className="input" value={wa} onChange={(e) => setWa(e.target.value)} placeholder="62812..." />
        </div>
        <button className="btn" type="submit">Simpan profil</button>
      </form>

      <form className="card" onSubmit={changePassword}>
        <h2>Ganti password</h2>
        <div className="field">
          <label htmlFor="pw-lama">Password lama</label>
          <input id="pw-lama" className="input" type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="pw-baru">Password baru (minimal 8 karakter)</label>
          <input id="pw-baru" className="input" type="password" required value={nextPw} onChange={(e) => setNextPw(e.target.value)} />
        </div>
        <button className="btn" type="submit">Ganti password</button>
      </form>
    </main>
  );
}
