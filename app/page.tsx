import ShortenForm from "@/components/ShortenForm";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getSessionUser();
  return (
    <main className="wrap">
      <section className="hero">
        <h1>Pendekin link, gratis, tanpa ribet.</h1>
        <p>
          Tempel link panjang, dapat link pendek s.peka.ai.id yang gampang dibagikan.
          Mau slug sendiri? Tinggal ketik. Mau statistik dan microsite? Daftar gratis.
        </p>
      </section>

      <div className="card">
        <ShortenForm loggedIn={!!user} />
      </div>

      <section className="card">
        <h2>Kenapa pakai ini</h2>
        <ul className="list">
          <li>
            <strong>Custom slug bebas</strong>
            <span>s.peka.ai.id/nama-apa pun, selama belum dipakai orang lain.</span>
          </li>
          <li>
            <strong>Statistik klik lengkap</strong>
            <span>Total klik, klik per hari, dan link teratas, semua di dashboard.</span>
          </li>
          <li>
            <strong>Microsite sendiri</strong>
            <span>Satu halaman link-in-bio dengan slug, tema, dan daftar link kamu sendiri.</span>
          </li>
          <li>
            <strong>Gratis dan tanpa iklan</strong>
            <span>Tamu bisa 5 link per IP per hari. Akun gratis unlimited.</span>
          </li>
        </ul>
      </section>

      <section className="card">
        <h2>Cara pakai</h2>
        <ul className="list">
          <li>
            <strong>1. Tempel link panjang</strong>
            <span>Link apa pun yang diawali http:// atau https://.</span>
          </li>
          <li>
            <strong>2. Pilih slug kalau mau</strong>
            <span>Kosongkan saja kalau mau kode acak 6 karakter.</span>
          </li>
          <li>
            <strong>3. Bagikan dan pantau</strong>
            <span>Salin link pendeknya, bagikan, dan lihat kliknya di dashboard.</span>
          </li>
        </ul>
      </section>

      <footer className="footer">
        Dibuat oleh <a href="https://peka.ai.id">Peka AI</a>. Link yang dibuat pengguna adalah tanggung jawab
        pembuatnya. Link yang disalahgunakan bisa dinonaktifkan admin.
      </footer>
    </main>
  );
}
