/* ============================================================
   Config da loja editável pelo painel — Cloudflare Pages Function
   GET /api/admin/config → o que está salvo no KV (ou nulo)
   PUT /api/admin/config { conf } → grava
   A senha/sessão ficam no guard; o KV guardado aqui sobrepõe
   (no site) os valores default de js/config.js.
   ============================================================ */
import { guard } from './_auth.js';

const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

export async function onRequestGet({ request, env }) {
  const negado = await guard(request, env);
  if (negado) return negado;
  if (!env.STORE_KV) return json({ ok: false, msg: 'Sem KV configurado (binding STORE_KV).' }, 500);
  const conf = await env.STORE_KV.get('conf', 'json');
  return json({ ok: true, conf: conf || null });
}

/* só campos conhecidos, strings/tipos saneados — o resto é descartado */
const CAMPOS = ['whatsapp', 'saudacao', 'cidade', 'instagram', 'email',
  'mpLink', 'pix', 'pixNome', 'sinalFixo', 'parcelasMax', 'mostrarPrecos',
  'checkoutMensagem', 'checkoutAtivo'];
const TXT = ['whatsapp', 'saudacao', 'cidade', 'instagram', 'email', 'mpLink', 'pix', 'pixNome', 'checkoutMensagem'];
const BOOL = ['mostrarPrecos', 'checkoutAtivo'];

export async function onRequestPut({ request, env }) {
  const negado = await guard(request, env);
  if (negado) return negado;
  if (!env.STORE_KV) return json({ ok: false, msg: 'Sem KV configurado (binding STORE_KV).' }, 500);
  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, msg: 'Requisição inválida.' }, 400); }
  const v = body && body.conf;
  if (!v || typeof v !== 'object') return json({ ok: false, msg: 'Config ausente.' }, 400);

  const limpo = {};
  for (const k of CAMPOS) {
    if (v[k] === undefined) continue;
    if (TXT.includes(k)) limpo[k] = String(v[k] || '').slice(0, 300);
    else if (k === 'sinalFixo') limpo[k] = Math.min(Math.max(Number(v[k]) || 0, 0), 100000);
    else if (k === 'parcelasMax') limpo[k] = Math.min(Math.max(Math.round(Number(v[k]) || 12), 1), 12);
    else if (BOOL.includes(k)) limpo[k] = !!v[k];
  }
  const wa = String(limpo.whatsapp || '').replace(/\D/g, '');
  if (wa && (wa.length < 10 || wa.length > 13)) return json({ ok: false, msg: 'WhatsApp inválido — use código do país + DDD + número.' }, 400);
  if (limpo.pix) limpo.pix = limpo.pix.slice(0, 120);

  const atual = (await env.STORE_KV.get('conf', 'json')) || {};
  await env.STORE_KV.put('conf', JSON.stringify(Object.assign(atual, limpo)));
  return json({ ok: true, conf: Object.assign(atual, limpo) });
}