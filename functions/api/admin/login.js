/* Cloudflare Pages Function — rota: POST /api/admin/login */
import { login } from './_auth.js';
export async function onRequestPost({ request, env }) {
  return login(request, env);
}