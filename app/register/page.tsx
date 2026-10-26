"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Pendaftaran gagal.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Koneksi gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="wrap">
      <section className="hero">
        <span className="spec-label">Akun • Daftar gratis</span>
        <h1>Daftar gratis</h1>
        <p>Satu akun untuk link unlimited, statistik lengkap, dan microsite sendiri.</p>
        <div className="ruler" />
      </section>
      <form className="card" onSubmit={submit}>
        <div className="field">
          <label htmlFor="name">Nama (opsional)</label>
          <input id="name" className="input" type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
        </div>
        <div className="field">
          <label htmlFor="password">Password (minimal 8 karakter)</label>
          <input id="password" className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
        </div>
        <button className="btn" type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Memproses..." : "Daftar"}
        </button>
        <p className="note">
          Sudah punya akun? <Link href="/login">Masuk</Link>.
        </p>
        {error && <div className="error">{error}</div>}
      </form>
    </main>
  );
}
