/* ============================================================
   CRUD de produtos do painel — Cloudflare Pages Function
   O catálogo completo mora no KV (chave 'produtos' — array).
   GET    /api/admin/produtos → { produtos: [] | null }
   POST   /api/admin/produtos { produto }            → cria (id novo)
   PUT    /api/admin/produtos { produto }            → atualiza por id
   DELETE /api/admin/produtos { id }                 → remove por id
   js/data.js continua sendo o fallback quando o KV está vazio.
   ============================================================ */
import { guard } from './_auth.js';

const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

export async function onRequestGet({ request, env }) {
  const negado = await guard(request, env);
  if (negado) return negado;
  if (!env.STORE_KV) return json({ ok: false, msg: 'Sem KV configurado (binding STORE_KV).' }, 500);
  const produtos = await env.STORE_KV.get('produtos', 'json');
  return json({ ok: true, produtos: produtos || null });
}

/* saneia um produto vindo do painel; devolve {erro} ou produto limpo */
function limpa(p) {
  if (!p || typeof p !== 'object') return { erro: 'Produto ausente.' };
  const id = String(p.id || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
  if (!id) return { erro: 'Produto sem id (nome vira o id automaticamente).' };
  const name = String(p.name || p.nome || '').trim().slice(0, 120);
  if (!name) return { erro: 'Produto sem nome.' };
  const cat = String(p.cat || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
  if (!cat) return { erro: 'Produto sem categoria.' };
  const saida = {
    id,
    name: String(p.name || p.nome || '').trim().slice(0, 120),
    cat,
    tag: String(p.tag || '').trim().slice(0, 120),
    lead: String(p.lead || '').trim().slice(0, 400),
    price: p.price == null || p.price === '' ? null : Math.min(Math.max(Number(p.price) || 0, 0), 200000),
    feats: (Array.isArray(p.feats) ? p.feats : []).map(f => String(f).trim().slice(0, 120)).filter(Boolean).slice(0, 14),
    imgs: (Array.isArray(p.imgs) ? p.imgs : []).map(i => String(i).toLowerCase().replace(/[^a-z0-9_u/.-]/g, '').slice(0, 90)).filter(Boolean).slice(0, 8),
    featured: !!p.featured,
    rel: Math.round(Number(p.rel) || 99),
  };
  /* campos ricos do catálogo (tamanhos/cores/blocos) atravessam intactos,
     saneados — o painel só os lê; edite data.js para mudar a estrutura */
  for (const k of ['sizes', 'heights', 'fabrics', 'about']) {
    if (Array.isArray(p[k])) saida[k] = p[k].map(x => String(x).slice(0, 120)).slice(0, 12);
    else if (typeof p[k] === 'string') saida[k] = p[k].slice(0, 1200);
  }
  for (const k of ['colors', 'opts', 'blocks']) if (Array.isArray(p[k])) saida[k] = p[k];
  if (p.homeHero) saida.homeHero = true;
  return { produto: saida };
}

async function leLista(env) { return (await env.STORE_KV.get('produtos', 'json')) || null; }

export async function onRequestPost({ request, env }) {
  const negado = await guard(request, env);
  if (negado) return negado;
  if (!env.STORE_KV) return json({ ok: false, msg: 'Sem KV configurado (binding STORE_KV).' }, 500);
  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, msg: 'Requisição inválida.' }, 400); }
  const l = limpa(body && body.produto);
  if (l.erro) return json({ ok: false, msg: l.erro }, 400);
  const lista = (await leLista(env)) || [];
  if (lista.some(p => p.id === l.produto.id)) return json({ ok: false, msg: 'Já existe um produto com esse id.' }, 409);
  lista.push(l.produto);
  await env.STORE_KV.put('produtos', JSON.stringify(lista));
  return json({ ok: true, produto: l.produto });
}

export async function onRequestPut({ request, env }) {
  const negado = await guard(request, env);
  if (negado) return negado;
  if (!env.STORE_KV) return json({ ok: false, msg: 'Sem KV configurado (binding STORE_KV).' }, 500);
  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, msg: 'Requisição inválida.' }, 400); }

  /* gravação da LISTA COMPLETA (o painel edita no navegador e envia tudo;
     isso semeia o catálogo no KV mantendo os produtos que o painel não editou) */
  if (Array.isArray(body && body.produtos)) {
    const limpos = [];
    for (const p of body.produtos.slice(0, 400)) {
      const l = limpa(p);
      if (l.erro) return json({ ok: false, msg: 'Produto “' + (p.name || p.id || '?') + '”: ' + l.erro }, 400);
      limpos.push(l.produto);
    }
    const ids = new Set(limpos.map(p => p.id));
    if (ids.size !== limpos.length) return json({ ok: false, msg: 'Há dois produtos com o mesmo id.' }, 400);
    await env.STORE_KV.put('produtos', JSON.stringify(limpos));
    return json({ ok: true, produtos: limpos });
  }

  const l = limpa(body && body.produto);
  if (l.erro) return json({ ok: false, msg: l.erro }, 400);
  const lista = await leLista(env);
  if (!lista) return json({ ok: false, msg: 'Nenhum produto salvo ainda — use criar.' }, 404);
  const i = lista.findIndex(p => p.id === l.produto.id);
  if (i < 0) return json({ ok: false, msg: 'Produto não encontrado.' }, 404);
  lista[i] = l.produto;
  await env.STORE_KV.put('produtos', JSON.stringify(lista));
  return json({ ok: true, produto: l.produto });
}

export async function onRequestDelete({ request, env }) {
  const negado = await guard(request, env);
  if (negado) return negado;
  if (!env.STORE_KV) return json({ ok: false, msg: 'Sem KV configurado (binding STORE_KV).' }, 500);
  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, msg: 'Requisição inválida.' }, 400); }
  const id = String((body && body.id) || '').trim().toLowerCase();
  if (!id) return json({ ok: false, msg: 'Falta o id.' }, 400);
  const lista = await leLista(env);
  if (!lista) return json({ ok: false, msg: 'Nada salvo ainda.' }, 404);
  const i = lista.findIndex(p => p.id === id);
  if (i < 0) return json({ ok: false, msg: 'Produto não encontrado.' }, 404);
  lista.splice(i, 1);
  await env.STORE_KV.put('produtos', JSON.stringify(lista));
  return json({ ok: true });
}