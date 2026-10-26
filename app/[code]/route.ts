import { getLinkByCode, recordClick } from "@/lib/db";

function notFoundPage(code: string): Response {
  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Link tidak ditemukan</title><style>body{margin:0;background:#f3f3f0;color:#111;font-family:"Inter Tight","Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}main{max-width:640px;margin:0 auto;padding:64px 20px}a{color:#111}.card{background:#fbfbf8;border:1px solid #d6d6d2;border-left:4px solid #ffd60a;border-radius:2px;padding:24px}code{font-family:"Space Mono",ui-monospace,Menlo,Consolas,monospace}</style></head><body><main><div class="card"><h1 style="margin-top:0">Link tidak ditemukan</h1><p>Link pendek <code>${code}</code> tidak ada, sudah dihapus, atau sedang dinonaktifkan.</p><p><a href="/">Buat link pendek baru di s.peka.ai.id</a></p></div></main></body></html>`;
  return new Response(html, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const code = decodeURIComponent((await params).code);
  const link = getLinkByCode(code);
  if (!link || link.is_active !== 1) {
    return notFoundPage(code);
  }
  const referer = _req.headers.get("referer") || "";
  const ua = _req.headers.get("user-agent") || "";
  recordClick(link.id, referer, ua);
  return Response.redirect(link.target_url, 307);
}
