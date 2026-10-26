"use client";

import { useState } from "react";

export default function ShortenForm({ loggedIn }: { loggedIn: boolean }) {
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ short_url: string; code: string; guest_remaining: number | null } | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setCopied(false);
    setLoading(true);
    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, slug: slug || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal membuat shortlink.");
        return;
      }
      setResult(data);
    } catch {
      setError("Koneksi gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.short_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Gagal menyalin. Salin manual dari kotak di atas.");
    }
  }

  if (result) {
    return (
      <div className="result-box">
        <p style={{ margin: "0 0 6px", color: "var(--muted)", fontSize: 14 }}>Link pendek kamu sudah jadi:</p>
        <div className="result-url">{result.short_url}</div>
        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn" onClick={copy}>{copied ? "Tersalin!" : "Salin link"}</button>
          <a className="btn btn-ghost" href={result.short_url} target="_blank" rel="noreferrer">Buka link</a>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setResult(null);
              setUrl("");
              setSlug("");
            }}
          >
            Buat lagi
          </button>
        </div>
        {result.guest_remaining !== null && (
          <p className="note">Sisa jatah tamu hari ini: {result.guest_remaining} link. Daftar gratis untuk unlimited.</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label htmlFor="long-url">Link panjang</label>
        <input
          id="long-url"
          className="input"
          type="url"
          required
          placeholder="https://link-panjang-kamu.com/artikel/bagus-banget"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="field">
        <label htmlFor="custom-slug">Custom slug (opsional)</label>
        <div className="row" style={{ flexWrap: "nowrap" }}>
          <span className="mono" style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>s.peka.ai.id/</span>
          <input
            id="custom-slug"
            className="input"
            type="text"
            placeholder="nama-apa"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            disabled={loading}
          />
        </div>
        <p className="note" style={{ marginTop: 6 }}>
          Kosongkan untuk kode acak. Slug 3-50 karakter, huruf kecil, angka, dan strip.
        </p>
      </div>
      <button className="btn" type="submit" disabled={loading} style={{ width: "100%" }}>
        {loading ? "Memproses..." : "Pendekin link"}
      </button>
      {!loggedIn && (
        <p className="note">
          Tanpa akun: maks 5 link per IP per hari. <a href="/register">Daftar gratis</a> untuk link unlimited,
          statistik lengkap, dan microsite.
        </p>
      )}
      {error && <div className="error">{error}</div>}
    </form>
  );
}
