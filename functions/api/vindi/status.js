/* ============================================================
   Status da cobrança — consulta a Vindi (ou simulada)
   Cloudflare Pages Function — rota: GET /api/vindi/status?charge_id=...
   Mesmas variáveis de ambiente do checkout.js (VINDI_API_KEY/VINDI_MOCK).
   ============================================================ */
const API = 'https://app.vindi.com.br/api/v1';
const auth = key => 'Basic ' + btoa(key + ':');

export async function onRequestGet({ request, env }) {
  const id = (new URL(request.url).searchParams.get('charge_id') || '').replace(/[^\w-]/g, '');
  if (!id) return new Response(JSON.stringify({ ok: false, msg: 'Falta charge_id.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  /* modo de teste: a simulação vira "paid" ~6s após criar (ou já paga, cartão) */
  if (env.VINDI_MOCK === '1') {
    if (id.startsWith('mock-')) {
      const ts = Number(id.split('-')[1]) || 0;
      const pago = id.endsWith('-c') || (Date.now() - ts) > 6000;
      return new Response(JSON.stringify({ ok: true, status: pago ? 'paid' : 'pending' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ ok: false, msg: 'ID de teste inválido.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (!env.VINDI_API_KEY) return new Response(JSON.stringify({ ok: false, msg: 'Servidor sem credenciais.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  const r = await fetch(API + '/charges/' + encodeURIComponent(id), { headers: { Authorization: auth(env.VINDI_API_KEY) } });
  const j = await r.json().catch(() => null);
  if (!j || !j.charge) return new Response(JSON.stringify({ ok: false, msg: 'Cobrança não encontrada.' }), { status: r.status, headers: { 'Content-Type': 'application/json' } });
  const c = j.charge;
  const status = c.status === 'paid' ? 'paid'
    : (c.status === 'pending' || c.status === 'processing') ? 'pending'
    : 'falhou';
  return new Response(JSON.stringify({ ok: true, status, paid_at: c.paid_at || '', amount: c.amount }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
}