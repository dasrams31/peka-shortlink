import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "s.peka.ai.id - Pendekin Link Peka",
  description: "Pendekin link panjang jadi pendek, custom slug, statistik klik, dan microsite. Gratis, dari Peka AI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <header className="topbar">
          <Link href="/" className="brand" style={{ textDecoration: "none" }}>
            s<span>.</span>peka<span>.</span>ai<span>.</span>id
          </Link>
          <Nav />
        </header>
        {children}
      </body>
    </html>
  );
}
