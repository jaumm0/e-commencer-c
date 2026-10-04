/* ============================================================
   Fonte de verdade da loja publicado — Cloudflare Pages Function
   GET /api/store (público, leitura apenas):
     { conf: {...} | null, produtos: [...] | null }
   O site tenta buscar isto ao abrir; se falhar (file:// ou sem
   KV), fica exatamente como é hoje — config.js + data.js.
   ============================================================ */
const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'max-age=60' } });

export async function onRequestGet({ env }) {
  if (!env.STORE_KV) return json({ conf: null, produtos: null });
  try {
    const [conf, produtos] = await Promise.all([env.STORE_KV.get('conf', 'json'), env.STORE_KV.get('produtos', 'json')]);
    return json({ conf: conf || null, produtos: produtos || null });
  } catch (e) { return json({ conf: null, produtos: null }); }
}