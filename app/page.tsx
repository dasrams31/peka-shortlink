import ShortenForm from "@/components/ShortenForm";
import { getSessionUser } from "@/lib/auth";
import { countClicks, countLinks } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getSessionUser();
  const totalLinks = countLinks();
  const totalClicks = countClicks();

  return (
    <main className="wrap">
      <section className="hero hero-center">
        <div className="marks-row">
          <span className="spec-label">Shortlink • Gratis • Tanpa iklan</span>
          <span className="marks"><i /><i /><i /></span>
        </div>
        <h1>Link panjang jadi <span className="hl">pendek</span>, langsung dari sini.</h1>
        <p>
          Tempel link, dapat link pendek s.peka.ai.id. Gratis, tanpa iklan,
          dan bisa pakai slug sendiri.
        </p>
        <div className="ruler" />
      </section>

      <div className="card card-hero">
        <ShortenForm loggedIn={!!user} />
        <p className="stats-line">
          Sejauh ini {totalLinks} link dibuat dan {totalClicks} klik tercatat di s.peka.ai.id.
        </p>
      </div>

      <section className="section">
        <h2>Yang bisa kamu lakukan</h2>
        <div className="feature-flagship">
          <strong>Shortlink dengan slug sendiri</strong>
          <p>
            s.peka.ai.id/nama-apa pun, selama belum dipakai orang lain. Kosongkan saja
            kalau mau kode acak 6 karakter. Link aktif bisa dinonaktifkan kapan pun dari dashboard.
          </p>
          <p className="mono">s.peka.ai.id/promo-diskon → toko-kamu.com/promo-panjang</p>
        </div>
        <ul className="list">
          <li>
            <strong>Statistik klik yang jelas</strong>
            <span>Total klik, klik per hari, dan link teratas, semua terlihat di dashboard.</span>
          </li>
          <li>
            <strong>Microsite satu halaman</strong>
            <span>
              Satu halaman link-in-bio di s.peka.ai.id/m/nama-kamu, dengan judul, bio,
              tema, dan daftar link yang bisa diurutkan.
            </span>
          </li>
          <li>
            <strong>Gratis, tanpa iklan, tanpa kartu</strong>
            <span>
              Tamu bisa 5 link per IP per hari. Daftar gratis, link jadi unlimited
              dan semua fiturnya kebuka.
            </span>
          </li>
        </ul>
      </section>

      <section className="section">
        <h2>Cara pakai</h2>
        <ol className="steps">
          <li>
            <strong>Tempel link panjang</strong>
            <span>Link apa pun yang diawali http:// atau https://.</span>
          </li>
          <li>
            <strong>Tulis slug kalau mau</strong>
            <span>Kosongkan saja kalau mau kode acak.</span>
          </li>
          <li>
            <strong>Salin, bagikan, pantau</strong>
            <span>Bagikan link pendeknya, lalu lihat kliknya di dashboard.</span>
          </li>
        </ol>
      </section>

      <section className="section">
        <h2>Pertanyaan yang sering ditanyakan</h2>
        <div className="faq">
          <details>
            <summary>Apakah benar-benar gratis?</summary>
            <p>
              Ya. Tamu bisa membuat 5 link per IP per hari tanpa akun. Akun gratis
              tidak ada batas jumlah link dan membuka statistik lengkap plus microsite.
            </p>
          </details>
          <details>
            <summary>Bagaimana cara pakai slug sendiri?</summary>
            <p>
              Tulis slug yang kamu mau di kolom custom slug, 3-50 karakter huruf kecil,
              angka, dan strip. Kalau sudah dipakai orang lain, formulir akan menolak
              dan kamu bisa pilih slug lain.
            </p>
          </details>
          <details>
            <summary>Apa itu microsite?</summary>
            <p>
              Satu halaman publik berisi semua link kamu, di s.peka.ai.id/m/nama-kamu.
              Cocok untuk bio Instagram, TikTok, atau WhatsApp. Atur dari dashboard setelah daftar.
            </p>
          </details>
          <details>
            <summary>Bagaimana kalau link disalahgunakan?</summary>
            <p>
              Admin bisa menonaktifkan atau menghapus link yang dilaporkan disalahgunakan.
              Link yang dibuat pengguna adalah tanggung jawab pembuatnya.
            </p>
          </details>
        </div>
      </section>

      <section className="card card-cta">
        <h2>Mau statistik dan microsite juga?</h2>
        <p className="sub">Daftar gratis, satu menit, langsung bisa pakai semua fitur.</p>
        <div className="row">
          <a className="btn" href={user ? "/dashboard" : "/register"} style={{ textDecoration: "none" }}>
            {user ? "Buka dashboard" : "Daftar gratis"}
          </a>
          <a className="btn btn-ghost" href="/login" style={{ textDecoration: "none" }}>Masuk</a>
        </div>
      </section>

      <footer className="footer">
        Dibuat oleh <a href="https://peka.ai.id">Peka AI</a>. Link yang dibuat pengguna adalah tanggung jawab
        pembuatnya. Link yang disalahgunakan bisa dinonaktifkan admin.
      </footer>
    </main>
  );
}
