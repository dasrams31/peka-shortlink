import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "SnaPeka",
  description: "SnaPeka: pendekin link dan microsite dalam satu tempat. Custom slug, statistik klik, gratis tanpa iklan.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <header className="topbar">
          <Link href="/" className="brand">
            <span className="logo-mark" />
            SnaPeka
          </Link>
          <Nav />
        </header>
        {children}
      </body>
    </html>
  );
}
