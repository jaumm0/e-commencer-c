/* ============================================================
   Registro manual de pedidos (WhatsApp/orçamento) — Pages Function
   GET    /api/admin/pedidos           → lista salva no KV ('pedidos')
   POST   /api/admin/pedidos { pedido } → cria (id automático)
   PUT    /api/admin/pedidos { pedido } → atualiza (status/obs/total)
   DELETE /api/admin/pedidos { id }
   Status: orcamento | fechado | entregue | cancelado
   ============================================================ */
import { guard } from './_auth.js';

const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
const STATS = ['orcamento', 'fechado', 'entregue', 'cancelado'];

export async function onRequestGet({ request, env }) {
  const negado = await guard(request, env);
  if (negado) return negado;
  if (!env.STORE_KV) return json({ ok: false, msg: 'Sem KV configurado (binding STORE_KV).' }, 500);
  const pedidos = await env.STORE_KV.get('pedidos', 'json');
  return json({ ok: true, pedidos: pedidos || null });
}

function limpa(p, novo) {
  if (!p || typeof p !== 'object') return { erro: 'Pedido ausente.' };
  const cliente = String(p.cliente || '').trim().slice(0, 120);
  if (!cliente) return { erro: 'Pedido sem nome do cliente.' };
  const saida = {
    id: novo ? 'w' + Date.now().toString(36) : String(p.id || '').slice(0, 40),
    criado: String(p.criado || (novo ? new Date().toISOString() : '')).slice(0, 30),
    cliente,
    telefone: String(p.telefone || '').replace(/[^0-9+ ()-]/g, '').slice(0, 20),
    itens: String(p.itens || '').trim().slice(0, 800),
    total: p.total === '' || p.total == null ? null : Math.min(Math.max(Number(p.total) || 0, 0), 200000),
    status: STATS.includes(p.status) ? p.status : 'orcamento',
    obs: String(p.obs || '').trim().slice(0, 500),
    fonte: 'whatsapp',
  };
  return { pedido: saida };
}

const le = async env => (await env.STORE_KV.get('pedidos', 'json')) || [];

export async function onRequestPost({ request, env }) {
  const negado = await guard(request, env);
  if (negado) return negado;
  if (!env.STORE_KV) return json({ ok: false, msg: 'Sem KV configurado (binding STORE_KV).' }, 500);
  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, msg: 'Requisição inválida.' }, 400); }
  const l = limpa(body && body.pedido, true);
  if (l.erro) return json({ ok: false, msg: l.erro }, 400);
  const lista = await le(env);
  lista.unshift(l.pedido);
  if (lista.length > 500) lista.length = 500;
  await env.STORE_KV.put('pedidos', JSON.stringify(lista));
  return json({ ok: true, pedido: l.pedido });
}

export async function onRequestPut({ request, env }) {
  const negado = await guard(request, env);
  if (negado) return negado;
  if (!env.STORE_KV) return json({ ok: false, msg: 'Sem KV configurado (binding STORE_KV).' }, 500);
  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, msg: 'Requisição inválida.' }, 400); }
  const p = body && body.pedido;
  const id = String((p && p.id) || '');
  const lista = await le(env);
  const i = lista.findIndex(x => x.id === id);
  if (i < 0) return json({ ok: false, msg: 'Pedido não encontrado.' }, 404);
  const l = limpa(Object.assign({}, lista[i], p || {}), false);
  if (l.erro) return json({ ok: false, msg: l.erro }, 400);
  lista[i] = l.pedido;
  await env.STORE_KV.put('pedidos', JSON.stringify(lista));
  return json({ ok: true, pedido: l.pedido });
}

export async function onRequestDelete({ request, env }) {
  const negado = await guard(request, env);
  if (negado) return negado;
  if (!env.STORE_KV) return json({ ok: false, msg: 'Sem KV configurado (binding STORE_KV).' }, 500);
  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, msg: 'Requisição inválida.' }, 400); }
  const id = String((body && body.id) || '');
  const lista = await le(env);
  const i = lista.findIndex(x => x.id === id);
  if (i < 0) return json({ ok: false, msg: 'Pedido não encontrado.' }, 404);
  lista.splice(i, 1);
  await env.STORE_KV.put('pedidos', JSON.stringify(lista));
  return json({ ok: true });
}