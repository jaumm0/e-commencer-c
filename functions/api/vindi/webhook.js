/* ============================================================
   Webhook da Vindi — Cloudflare Pages Function
   POST /api/vindi/webhook?t=<WEBHOOK_TOKEN>

   A Vindi chama esta URL no instante em que o pagamento cai
   (eventos charge.paid / bill.paid). A função:
     1. valida o token na URL (env WEBHOOK_TOKEN — segredo só no servidor);
     2. deduplica o evento no KV (a Vindi pode reenviar);
     3. encaminha um JSON compacto para env.NOTIFY_URL — o "plug"
        de notificação do dono (hoje: e-mail ou uma ponte de WhatsApp
        que você subir depois; amanhã: qualquer serviço que aceite
        POST com JSON). Sem NOTIFY_URL configurada, não encaminha nada.
   O painel continua lendo o status real direto da API da Vindi —
   este webhook existe para o AVISO imediato, não para o painel.
   POST /api/vindi/webhook sem evento pago → 200 {ok:true,skipped}
   GET  /api/vindi/webhook?t=… → 200 {ok:true,ping} (teste da URL no painel da Vindi)
   ============================================================ */
const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

export function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const t = url.searchParams.get('t') || '';
  if (!t) return json({ ok: true, msg: 'Webhook do lojista — POST com payload da Vindi. Use a URL com ?t=<token>.' });
  if (!env.WEBHOOK_TOKEN || t !== String(env.WEBHOOK_TOKEN)) return json({ ok: false, msg: 'Token errado (env WEBHOOK_TOKEN).' }, 401);
  return json({ ok: true, ping: true }); // resposta pronta para colar no painel da Vindi
}

export async function onRequestPost({ request, env }) {
  const t = new URL(request.url).searchParams.get('t') || '';
  if (!env.WEBHOOK_TOKEN || t !== String(env.WEBHOOK_TOKEN)) {
    return json({ ok: false, msg: 'Token ausente ou errado.' }, 401);
  }
  if (!env.NOTIFY_URL) {
    return json({ ok: true, aviso: 'Recebido, mas NOTIFY_URL não está configurada — nada encaminhado.' });
  }

  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, msg: 'JSON inválido.' }, 400); }

  const ev = (body && body.event) || body || {};
  const tipo = String(ev.type || ev.event || '');
  if (!/\.paid$/.test(tipo)) return json({ ok: true, skipped: true, tipo });

  const d = ev.data || {};
  const cob = d.charge || (d.bill && d.bill.charges && d.bill.charges[0]) || {};
  const fat = d.bill || {};
  const pm = (cob.payment_method && (cob.payment_method.code || cob.payment_method.name)) || '';
  const itens = (fat.bill_items && fat.bill_items[0]) || null;
  const desc = String((itens && itens.description) || '').replace(/^Cobrança do site — /, '');
  const aviso = {
    fonte: 'vindi',
    evento: tipo,
    ref: String(fat.id || cob.bill_id || ''),
    ref_vindi: String(cob.id || ''),
    cliente: (fat.customer && fat.customer.name) || (cob.customer && cob.customer.name) || '',
    total: Number(cob.amount != null ? cob.amount : fat.amount) || 0,
    metodo: pm,
    item: desc,
    pago_em: (cob.paid_at || '').slice(0, 10),
    url: fat.url || '',
  };

  /* dedupe: mesma cobrança paga → notifica só 1x */
  const chave = 'wh:' + tipo + ':' + aviso.ref + ':' + (aviso.ref_vindi || aviso.total);
  try {
    if (env.STORE_KV) {
      if (await env.STORE_KV.get(chave)) return json({ ok: true, repetido: true });
      await env.STORE_KV.put(chave, JSON.stringify({ aviso, quando: new Date().toISOString() }));
    }
  } catch (e) { /* sem KV segue mesmo assim — melhor avisar 2x do que 0x */ }

  try {
    const r = await fetch(String(env.NOTIFY_URL), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aviso),
    });
    if (!r.ok) return json({ ok: false, msg: 'NOTIFY_URL respondeu HTTP ' + r.status + ' — a Vindi tenta de novo.' }, 502);
  } catch (e) {
    return json({ ok: false, msg: 'Falha ao avisar o dono — a Vindi tenta de novo.' }, 502);
  }
  return json({ ok: true, avisado: aviso.ref });
}