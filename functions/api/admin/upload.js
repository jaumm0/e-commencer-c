/* ============================================================
   Upload de foto (após login) — Cloudflare Pages Function
   POST /api/admin/upload  { nome, ct, b64 }  (b64 = base64 da foto,
   já reduzida no navegador a no máx. 1600px / ~0.8 qualidade)
   Guarda no KV'img:<ref>' e devolve ref = 'u/<ref>'
   (o site resolve refs 'u/…' via /api/img/<ref>).
   Aceita jpeg/png/webp até 2MB decodificados.
   ============================================================ */
import { guard } from './_auth.js';

const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
const CT_OK = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

export async function onRequestPost({ request, env }) {
  const negado = await guard(request, env);
  if (negado) return negado;
  if (!env.STORE_KV) return json({ ok: false, msg: 'Sem KV configurado (binding STORE_KV).' }, 500);

  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, msg: 'Requisição inválida.' }, 400); }
  const ct = String((body && body.ct) || '').toLowerCase();
  const ext = CT_OK[ct];
  if (!ext) return json({ ok: false, msg: 'Formato aceito: JPG, PNG ou WebP.' }, 400);
  const b64 = String((body && body.b64) || '').replace(/\s/g, '');
  if (!b64) return json({ ok: false, msg: 'Foto vazia.' }, 400);
  const bytes = Math.floor(b64.length * 3 / 4);
  if (bytes > 2 * 1024 * 1024) return json({ ok: false, msg: 'Foto muito grande (máx. 2 MB depois da redução).' }, 413);

  const base = String((body && body.nome) || 'foto').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\.(jpe?g|png|webp|gif|bmp)$/i, '')  /* solta a extensão original — a nossa vem no fim */
    .replace(/[^a-z0-9._-]+/g, '-').replace(/\.+/g, '.').replace(/^-+|-+$/g, '').slice(0, 50) || 'foto';
  const ref = Date.now().toString(36) + '-' + base + ext;

  try {
    await env.STORE_KV.put('img:' + ref, JSON.stringify({ ct, b64, up: new Date().toISOString().slice(0, 10) }));
  } catch (e) { return json({ ok: false, msg: 'Falha ao guardar a foto.' }, 502); }
  return json({ ok: true, ref: 'u/' + ref });
}