/* ============================================================
   Pedidos online (cobranças da Vindi) — Cloudflare Pages Function
   GET /api/admin/vindi → lista compacta das últimas faturas,
   com a cobrança da fatura embutida (status do pagamento real).

   GET /v1/bills?page=1&per_page=100&sort_by=created_at&sort_order=desc
   → array puro de faturas: {id, amount, status, created_at, url,
     customer:{name}, charges:[{status, paid_at, payment_method…}]}
   Variáveis: VINDI_API_KEY | VINDI_MOCK='1' (dados de demonstração)
   ============================================================ */
import { guard } from './_auth.js';

const API = 'https://app.vindi.com.br/api/v1';
const auth = key => 'Basic ' + btoa(key + ':');
const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

/* compacta uma fatura no forma do painel */
function faturaDe(b) {
  const c = (b.charges && b.charges[0]) || {};
  return {
    id: String(b.id),
    fonte: 'vindi',
    cliente: (b.customer && b.customer.name) || '',
    total: b.amount,
    criado: (b.created_at || '').slice(0, 10),
    status: c.status || b.status || 'pending', // pendente|pago|cancelado|em_processamento|revisão_fraude
    pago_em: (c.paid_at || '').slice(0, 10),
    metodo: (c.payment_method && (c.payment_method.code || c.payment_method.name)) || '',
    url: b.url || '',
  };
}

/* dados de demonstração (VINDI_MOCK='1' ou sem servidor) */
function demo() {
  const d = n => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
  const f = (id, cli, tot, st, dias, met, pagoEm) => ({
    id, fonte: 'vindi', cliente: cli, total: tot, criado: d(dias), status: st,
    pago_em: pagoEm || '', metodo: met, url: '',
  });
  return [
    f('9101', 'Ana Ribeiro', 1290.0, 'paid', 0, 'pix', d(0)),
    f('9102', 'Jorge Martins', 189.8, 'paid', 1, 'credit_card', d(0)),
    f('9103', 'Camila Souza', 300.0, 'pending', 1, 'pix', ''),
    f('9104', 'Renata Alves', 3490.0, 'paid', 3, 'credit_card', d(2)),
    f('9105', 'Paulo Neto', 219.0, 'processing', 4, 'credit_card', ''),
    f('9106', 'Luiza Campos', 899.0, 'canceled', 6, 'pix', ''),
    f('9107', 'Tiago Mendes', 739.6, 'paid', 9, 'pix', d(8)),
    f('9108', 'Bia Ferraz', 158.7, 'paid', 12, 'pix', d(11)),
  ];
}

export async function onRequestGet({ request, env }) {
  const negado = await guard(request, env);
  if (negado) return negado;

  if (env.VINDI_MOCK === '1') {
    return json({ ok: true, demo: true, faturas: demo() }); // só em teste — nunca em produção
  }
  if (!env.VINDI_API_KEY) {
    return json({ ok: true, faturas: [] }); // sem chave: nada de dados inventados — lista vazia
  }
  try {
    const r = await fetch(API + '/bills?page=1&per_page=100&sort_by=created_at&sort_order=desc', { headers: { Authorization: auth(env.VINDI_API_KEY) } });
    if (!r.ok) return json({ ok: false, msg: 'Vindi respondeu HTTP ' + r.status + '.' }, 502);
    const lista = await r.json();
    if (!Array.isArray(lista)) return json({ ok: false, msg: 'Resposta inesperada da Vindi.' }, 502);
    return json({ ok: true, faturas: lista.slice(0, 100).map(faturaDe) });
  } catch (e) {
    return json({ ok: false, msg: 'Falha ao falar com a Vindi.' }, 502);
  }
}