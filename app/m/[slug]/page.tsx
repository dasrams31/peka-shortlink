import { bumpMicrositeViews, getMicrositeBySlug, listMicrositeLinks } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

const THEMES: Record<string, { bg: string; text: string; muted: string; card: string; btnBg: string; btnText: string }> = {
  peka: { bg: "#111111", text: "#f2f2ec", muted: "#a8a8a0", card: "#1a1a1a", btnBg: "#ffd60a", btnText: "#111111" },
  terang: { bg: "#FAF7F2", text: "#111111", muted: "#6b6b64", card: "#ffffff", btnBg: "#ffd60a", btnText: "#111111" },
  gelap: { bg: "#111111", text: "#f2f2ec", muted: "#a8a8a0", card: "#1e1e1e", btnBg: "#f2f2ec", btnText: "#111111" },
};

export default async function MicrositePublic({ params }: { params: Promise<{ slug: string }> }) {
  const slug = decodeURIComponent((await params).slug);
  const site = getMicrositeBySlug(slug);
  const t = THEMES[site?.theme || "peka"] || THEMES.peka;

  if (!site || site.is_active !== 1) {
    return (
      <main style={{ background: "#f3f3f0", color: "#111111", minHeight: "100vh" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "64px 20px" }}>
          <div style={{ background: "#fbfbf8", border: "1px solid #d6d6d2", borderLeft: "4px solid #ffd60a", borderRadius: 2, padding: 24 }}>
            <h1 style={{ marginTop: 0 }}>Microsite tidak ditemukan</h1>
            <p>Halaman ini tidak ada atau sedang dinonaktifkan.</p>
            <p><Link href="/" style={{ color: "#111111" }}>Buat microsite sendiri di s.peka.ai.id</Link></p>
          </div>
        </div>
      </main>
    );
  }

  bumpMicrositeViews(site.id);
  const links = listMicrositeLinks(site.id).filter((l) => l.is_active === 1);

  return (
    <main style={{ background: t.bg, color: t.text, minHeight: "100vh" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 20px 64px", textAlign: "center" }}>
        {site.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={site.avatar_url}
            alt={site.title || site.slug}
            style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", marginBottom: 16 }}
          />
        )}
        <h1 style={{ margin: "0 0 8px", fontSize: 28, letterSpacing: "-0.02em" }}>{site.title || site.slug}</h1>
        {site.bio && <p style={{ color: t.muted, margin: "0 0 28px" }}>{site.bio}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {links.length === 0 && <p style={{ color: t.muted }}>Belum ada link di halaman ini.</p>}
          {links.map((l) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "block", background: t.btnBg, color: t.btnText, fontWeight: 700,
                padding: "14px 20px", borderRadius: 10, textDecoration: "none", minHeight: 44,
              }}
            >
              {l.title}
            </a>
          ))}
        </div>
        <p style={{ color: t.muted, fontSize: 13, marginTop: 40 }}>
          Dibuat dengan <a href="/" style={{ color: t.btnBg === "#ffd60a" ? "#ffd60a" : t.text }}>s.peka.ai.id</a>
        </p>
      </div>
    </main>
  );
}
