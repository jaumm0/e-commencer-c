/* ============================================================
   Sessão do painel admin — helpers compartilhados.
   Arquivo começa com _ : o Pages NÃO cria rota para ele.

   A senha nunca mora no código: fica em env ADMIN_PASS no
   Cloudflare (Settings → Variables and Secrets). O login troca
   a senha por um cookie assinado (HMAC-SHA256, WebCrypto) que
   TODAS as rotas /api/admin/* exigem antes de qualquer leitura
   ou escrita no KV.
   ============================================================ */
const COOKIE = 'admin_sess';
const DIA = 86400000; // ms

const enc = s => new TextEncoder().encode(s);
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

async function chave(env) {
  const segredo = env.ADMIN_SECRET || env.ADMIN_PASS || '';
  return crypto.subtle.importKey('raw', enc(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

/* token: exp em unix-s + assinatura HMAC de "adm:<exp>" */
async function emiteToken(env, dias = 7) {
  const exp = Math.floor((Date.now() + dias * DIA) / 1000);
  const sig = b64u(await crypto.subtle.sign('HMAC', await chave(env), enc('adm:' + exp)));
  return exp + '.' + sig;
}

async function validaToken(env, token) {
  const [exp, sig] = String(token || '').split('.');
  const n = Number(exp);
  if (!n || !sig || n * 1000 < Date.now()) return false;
  const alvo = b64u(await crypto.subtle.sign('HMAC', await chave(env), enc('adm:' + exp)));
  /* comparação em tempo constante simples (mesmo comprimento, XOR) */
  const a = enc(alvo), b = enc(sig);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/* --- comparação em tempo constante da senha --- */
export async function senhaOK(env, senha) {
  const s = String(senha || '');
  const ref = String(env.ADMIN_PASS || '');
  if (!ref || ref.length < 8) return false; /* sem senha forte, nada autentica */
  const a = enc(s.padEnd(Math.max(s.length, ref.length), ' '));
  const b = enc(ref.padEnd(Math.max(s.length, ref.length), ' '));
  let diff = s.length === ref.length ? 0 : 1;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function cookieSessao(token, maxAge = 7 * 86400) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

/* ---- anti força-bruta: contador por IP no KV (10 tentativas / 15 min) ---- */
async function travaIP(env, ip) {
  if (!env.STORE_KV || !ip) return false;
  const key = 'lb:' + ip;
  const atual = Number((await env.STORE_KV.get(key)) || 0);
  if (atual >= 10) return true;
  await env.STORE_KV.put(key, String(atual + 1), { expirationTtl: 900 });
  return false;
}

/* ---- verificação usada por TODAS as rotas /api/admin/* ---- */
export async function guard(request, env) {
  const c = request.headers.get('Cookie') || '';
  const hit = c.split(';').map(p => p.trim()).find(p => p.startsWith(COOKIE + '='));
  if (hit && await validaToken(env, hit.slice(COOKIE.length + 1))) return null;
  return new Response(JSON.stringify({ ok: false, msg: 'Sessão ausente ou expirada.' }), {
    status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

/* POST /api/admin/login  { senha }  → cookie + ok  (login.js delega aqui) */
export async function login(request, env) {
  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, msg: 'Requisição inválida.' }, 400); }
  const ip = (request.headers.get('CF-Connecting-IP') || 'local').split(',')[0].trim();
  if (env.ADMIN_PASS === undefined) return json({ ok: false, msg: 'Painel sem senha configurada no servidor (defina ADMIN_PASS).' }, 500);
  if (env.STORE_KV && await travaIP(env, ip)) return json({ ok: false, msg: 'Muitas tentativas — aguarde 15 minutos.' }, 429);
  if (!await senhaOK(env, body.senha)) return json({ ok: false, msg: 'Senha incorreta.' }, 401);
  const token = await emiteToken(env);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Set-Cookie': cookieSessao(token) },
  });
}

/* POST /api/admin/logout → limpa o cookie */
export async function logout() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Set-Cookie': cookieSessao('', 0) },
  });
}