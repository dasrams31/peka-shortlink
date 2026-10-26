"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Me = { id: number; email: string; role: string } | null;

export default function Nav() {
  const [me, setMe] = useState<Me>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user || null))
      .catch(() => setMe(null))
      .finally(() => setLoaded(true));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  if (!loaded) return <div className="nav" />;
  return (
    <div className="nav">
      <Link href="/">Beranda</Link>
      {me ? (
        <>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/dashboard/microsite">Microsite</Link>
          {me.role === "admin" && <Link href="/admin">Admin</Link>}
          <button onClick={logout}>Keluar</button>
        </>
      ) : (
        <>
          <Link href="/login">Masuk</Link>
          <Link href="/register">Daftar</Link>
        </>
      )}
    </div>
  );
}
