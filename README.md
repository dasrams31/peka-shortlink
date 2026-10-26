# s.peka.ai.id — Peka Shortlink

Shortlink, microsite, dan statistik klik untuk Peka AI. Dibangun dengan Next.js +
SQLite (node:sqlite), tanpa dependensi tambahan selain next/react.

## Fitur

- **Shortlink**: tempel URL panjang, dapat link pendek `s.peka.ai.id/kode`.
  Custom slug bebas (3-50 karakter, huruf kecil, angka, strip).
- **Tamu**: maks 5 link per IP per hari. Akun gratis: unlimited.
- **Akun**: register/login email + password (hash scrypt, sesi cookie 30 hari).
- **Dashboard user**: total link, total klik, klik hari ini, grafik 14 hari,
  daftar link (cari, aktif/nonaktif, hapus), dan pembuatan link.
- **Microsite**: satu halaman link-in-bio per akun di `s.peka.ai.id/m/slug`
  (judul, bio, avatar, 3 tema, daftar link yang bisa diurutkan).
- **Dashboard admin**: statistik global, daftar pengguna (nonaktifkan),
  semua link (nonaktifkan/hapus), link teratas, dan klik terbaru.
- **Pelacakan klik**: jumlah klik per link, klik per hari, referer.

## Menjalankan

```bash
cp env.example .env   # isi ADMIN_EMAIL + ADMIN_PASSWORD untuk seed admin
npm install
npm run build
npm start             # port 8095
```

Service systemd: `peka-shortlink` (lokal 8095) + `peka-shortlink-tunnel`
(remote 18093 di server). Keduanya masuk `recover-after-reboot.sh`.

## Publikasi

Butuh langkah manual: DNS A record `s` ke server, dan vhost Caddy
`s.peka.ai.id` mengarah ke `127.0.0.1:18093` di server.

## Struktur data (SQLite `data/shortlink.db`)

`users`, `user_sessions`, `links`, `clicks`, `microsites`, `microsite_links`.
IP tamu hanya disimpan sebagai hash SHA-256 (32 karakter) untuk penegakan limit.
