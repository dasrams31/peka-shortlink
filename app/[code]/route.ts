import { getLinkByCode, recordClick } from "@/lib/db";

const BOT_UA =
  /facebookexternalhit|facebot|twitterbot|telegrambot|whatsapp|linkedinbot|slackbot|discordbot|pinterest|googlebot|bingbot|duckduckbot|applebot|petalbot|bytespider|yandexbot|baiduspider|semrushbot|ahrefsbot|curl|wget|python-requests|python-urllib|axios|go-http-client|node-fetch|postman|httpclient|java\/|okhttp/i;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function notFoundPage(code: string): Response {
  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Link tidak ditemukan</title><style>body{margin:0;background:#f3f3f0;color:#111;font-family:"Inter Tight","Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}main{max-width:640px;margin:0 auto;padding:64px 20px}a{color:#111}.card{background:#fbfbf8;border:1px solid #d6d6d2;border-left:4px solid #ffd60a;border-radius:2px;padding:24px}code{font-family:"Space Mono",ui-monospace,Menlo,Consolas,monospace}</style></head><body><main><div class="card"><h1 style="margin-top:0">Link tidak ditemukan</h1><p>Link pendek <code>${esc(code)}</code> tidak ada, sudah dihapus, atau sedang dinonaktifkan.</p><p><a href="/">Buat link pendek baru di s.peka.ai.id</a></p></div></main></body></html>`;
  return new Response(html, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function interstitialPage(target: string): Response {
  const safeTarget = esc(target);
  const safeTargetJs = JSON.stringify(target);
  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="refresh" content="10;url=${safeTarget}"><title>Mengarahkan... — SnaPeka</title><style>
*{box-sizing:border-box}body{margin:0;background:#f3f3f0;color:#111;font-family:"Inter Tight","Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;font-size:16px;line-height:1.55}a{color:#111}
main{max-width:680px;margin:0 auto;padding:28px 20px 64px}
.top{display:flex;align-items:center;gap:8px;font-weight:800;font-size:20px;letter-spacing:-.02em}
.top i{display:inline-block;width:12px;height:12px;background:#ffd60a;flex:none}
.top span{color:#5c5c5a;font-weight:400;font-size:13px;margin-left:auto}
.card{background:#fbfbf8;border:1px solid #d6d6d2;border-radius:2px;padding:24px;margin-top:20px}
.card.hero{border-left:4px solid #ffd60a;text-align:center;padding:28px 24px}
.count{font-size:64px;font-weight:800;letter-spacing:-.03em;line-height:1}
.count-lbl{font-family:"Space Mono",ui-monospace,Menlo,Consolas,monospace;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#5c5c5a;margin-top:4px}
.bar{height:8px;background:#e3e3df;border:1px solid #d6d6d2;margin-top:20px}
.bar i{display:block;height:100%;background:#ffd60a;width:100%;animation:shrink 10s linear forwards}
@keyframes shrink{from{width:100%}to{width:0%}}
.dest{font-family:"Space Mono",ui-monospace,Menlo,Consolas,monospace;font-size:13px;word-break:break-all;color:#5c5c5a;margin-top:16px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#ffd60a;color:#111;border:1px solid #ffd60a;border-radius:2px;padding:12px 20px;font-size:16px;font-weight:700;cursor:pointer;min-height:44px;text-decoration:none;margin-top:16px}
.btn:hover{filter:brightness(.95)}
.btn-dark{background:#111;color:#fbfbf8;border-color:#111}
h2{font-size:18px;margin:0 0 4px}
.sub{color:#5c5c5a;font-size:14px;margin:0 0 8px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
.proj{background:#fff;border:1px solid #d6d6d2;border-radius:2px;padding:14px 16px;text-decoration:none}
.proj strong{display:block;font-size:15px}
.proj span{color:#5c5c5a;font-size:13px}
.proj:hover{border-color:#111}
.slide{border-radius:2px;padding:20px;margin-top:12px}
.slide h3{margin:0 0 4px;font-size:18px}
.slide p{margin:0 0 12px;font-size:14px}
.slide.store{background:#ffd60a;color:#111}
.slide.store .btn{background:#111;color:#fbfbf8;border-color:#111}
.slide.bot{background:#111;color:#fbfbf8}
.slide.bot p{color:#c9c9c4}
.slide.bot .btn{background:#ffd60a;color:#111;border-color:#ffd60a}
.community-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(17,17,17,.55);opacity:0;visibility:hidden;transition:opacity .25s ease,visibility 0s linear .25s}
.community-overlay.open{opacity:1;visibility:visible;transition:opacity .25s ease}
.community-panel{position:relative;width:min(100%,440px);background:#fff;color:#111;border:2.5px solid #111;border-radius:16px;box-shadow:8px 8px 0 #111;padding:28px 26px 24px;text-align:center;transform:translateY(12px) scale(.98);transition:transform .25s ease}
.community-overlay.open .community-panel{transform:translateY(0) scale(1)}
.community-close{position:absolute;top:12px;right:12px;width:36px;height:36px;display:grid;place-items:center;background:#fff;border:2.5px solid #111;border-radius:12px;font-size:19px;font-weight:800;line-height:1;color:#111;cursor:pointer}
.community-tile{width:56px;height:56px;margin:0 auto 16px;background:#ffd60a;border:2.5px solid #111;border-radius:14px;display:flex;align-items:center;justify-content:center}
.community-tile svg{width:28px;height:28px;fill:#111}
.community-eyebrow{font-size:11.5px;font-weight:800;letter-spacing:.22em;opacity:.6;margin-bottom:8px}
.community-panel h3{font-size:24px;font-weight:800;letter-spacing:-.02em;line-height:1.2;margin:0 0 10px}
.community-body{font-size:15px;font-weight:500;line-height:1.55;opacity:.75;margin:0 0 20px}
.community-btn{display:flex;align-items:center;justify-content:center;gap:10px;border-radius:14px;padding:14px 16px;margin-bottom:12px;font-size:16px;font-weight:800;text-decoration:none;color:#fff}
.community-btn.wa{background:#25d366}
.community-btn.tg{background:#229ed9}
.community-btn svg{width:20px;height:20px;fill:#fff}
.community-note{font-size:12.5px;font-weight:600;opacity:.55;margin:0}
.foot{color:#5c5c5a;font-size:13px;margin-top:28px;border-top:1px solid #d6d6d2;padding-top:16px;text-align:center}
@media(max-width:640px){.grid{grid-template-columns:1fr}.count{font-size:52px}}
</style></head><body><main>
<div class="top"><i></i>SnaPeka<span>s.peka.ai.id</span></div>
<div class="card hero">
<div class="count" id="n">10</div>
<div class="count-lbl">detik lagi menuju tujuan</div>
<div class="bar"><i></i></div>
<a class="btn" href="${safeTarget}" id="go">Lanjutkan sekarang &rarr;</a>
</div>
<div class="card">
<h2>SnaPeka itu apa?</h2>
<p class="sub">SnaPeka adalah layanan pendekin link dan microsite dari Peka. Gratis, tanpa iklan, dengan statistik klik. Satu tempat buat semua link Peka dan link kamu sendiri.</p>
<h2 style="margin-top:20px">Project Peka</h2>
<div class="grid">
<a class="proj" href="https://peka.ai.id"><strong>Peka AI</strong><span>Info AI terbaru tiap hari</span></a>
<a class="proj" href="https://store.peka.ai.id"><strong>Peka Store</strong><span>Produk digital dan akun premium</span></a>
<a class="proj" href="https://piko.peka.ai.id"><strong>Piko</strong><span>Latihan speaking IELTS dengan AI</span></a>
<a class="proj" href="https://tools.peka.ai.id"><strong>Peka Tools</strong><span>Direktori tools open source pilihan</span></a>
<a class="proj" href="https://blog.peka.ai.id"><strong>Blog Peka</strong><span>Versi tulisan dari konten Peka</span></a>
<a class="proj" href="https://url.peka.ai.id"><strong>Semua link Peka</strong><span>Satu halaman, semua kanal resmi</span></a>
</div>
<div class="slide store">
<h3>Peka Store</h3>
<p>Script bot dan otomasi, akun AI premium kayak Gemini dan Canva, CapCut, pack prompt, dan kelas prompt. Bayar QRIS, langsung dikirim.</p>
<a class="btn" href="https://store.peka.ai.id">Lihat Peka Store &rarr;</a>
</div>
<div class="slide bot">
<h3>Order akun premium langsung di Telegram</h3>
<p>Gemini, Canva, CapCut, dan puluhan produk digital lainnya. Chat botnya, pilih produk, bayar QRIS, langsung dikirim.</p>
<a class="btn" href="https://t.me/aeternum_premibot">Buka Bot Telegram &rarr;</a>
</div>
</div>
<p class="foot">Link ini dipendekkan lewat <a href="/">SnaPeka</a> &mdash; s.peka.ai.id</p>
</main>
<div class="community-overlay" id="community-overlay" role="dialog" aria-modal="true" aria-label="Gabung Komunitas Peka AI" aria-hidden="true">
  <div class="community-panel">
    <button class="community-close" id="community-close" type="button" aria-label="Tutup">&times;</button>
    <span class="community-tile" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3Zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z"/></svg></span>
    <p class="community-eyebrow">KOMUNITAS PEKA AI</p>
    <h3>Gabung Komunitas Peka AI</h3>
    <p class="community-body">Info AI terbaru, bansos, dan diskusi seputar AI. Info naik duluan di grup, sebelum naik ke feed.</p>
    <a class="community-btn wa" href="https://chat.whatsapp.com/GLRMuZBICZg2636lVPj6NL" target="_blank" rel="noopener"><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.2 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.9-1.2-4.7-4.1-4.9-4.3-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.4.5c-.1.1-.3.3-.1.6.1.3.7 1.2 1.6 1.9 1.1.9 2 1.2 2.3 1.3.3.1.5.1.6-.1l1-1.2c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.4 0 .1 0 .7-.2 1.3Z"/></svg>Gabung Grup WhatsApp</a>
    <a class="community-btn tg" href="https://t.me/peka_aigroup" target="_blank" rel="noopener"><svg viewBox="0 0 24 24"><path d="M21.9 4.6 18.8 19.2c-.2 1-.8 1.3-1.7.8l-4.7-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.8 8.7-7.9c.4-.3-.1-.5-.6-.2L6.7 13.1 2.1 11.7c-1-.3-1-1 .2-1.5L20.4 3.2c.8-.3 1.6.2 1.5 1.4Z"/></svg>Gabung Grup Telegram</a>
    <p class="community-note">Gratis, tanpa daftar.</p>
  </div>
</div>
<script>
(function(){var t=${safeTargetJs};var s=10;var el=document.getElementById("n");var iv=setInterval(function(){s--;if(s<=0){clearInterval(iv);location.replace(t);return;}el.textContent=s;},1000);document.getElementById("go").addEventListener("click",function(e){e.preventDefault();clearInterval(iv);location.replace(t);});})();
</script>
<script>
(function(){
  var KEY='peka-community-seen';
  var overlay=document.getElementById('community-overlay');
  var closeBtn=document.getElementById('community-close');
  function open(){overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');try{sessionStorage.setItem(KEY,'1');}catch(e){}closeBtn.focus();}
  function close(){overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true');}
  closeBtn.addEventListener('click',close);
  overlay.addEventListener('click',function(e){if(e.target===overlay)close();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
  try{if(!sessionStorage.getItem(KEY))setTimeout(open,5000);}catch(e){setTimeout(open,5000);}
})();
</script></body></html>`;
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const code = decodeURIComponent((await params).code);
  const link = getLinkByCode(code);
  if (!link || link.is_active !== 1) {
    return notFoundPage(code);
  }
  const referer = req.headers.get("referer") || "";
  const ua = req.headers.get("user-agent") || "";
  recordClick(link.id, referer, ua);
  const url = new URL(req.url);
  // Bots and explicit ?direct=1 get the immediate redirect (link previews keep working).
  if (url.searchParams.get("direct") === "1" || BOT_UA.test(ua)) {
    return Response.redirect(link.target_url, 307);
  }
  return interstitialPage(link.target_url);
}
