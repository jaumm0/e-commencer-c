/* ============================================================
   Serviço de fotos subidas pelo painel — Pages Function
   GET /api/img/<ref> ( público ) — ref sem 'u/' (ex.: 8z1k2-foto.jpg)
   Guardado no KV como 'img:<ref>' = { ct, b64 }; 1 ano de cache.
   Fotos do repositório (img/…) NÃO passam por aqui — são estáticas.
   ============================================================ */
export async function onRequestGet({ env, params }) {
  const ref = String(params.name || '').replace(/[^a-z0-9._-]/gi, '');
  if (!ref || !env.STORE_KV) return new Response('não encontrado', { status: 404 });
  const j = await env.STORE_KV.get('img:' + ref, 'json');
  if (!j || !j.b64 || !j.ct) return new Response('não encontrado', { status: 404 });
  const bytes = Uint8Array.from(atob(j.b64), c => c.charCodeAt(0));
  return new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': j.ct,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}