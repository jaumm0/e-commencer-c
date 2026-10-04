/* Cloudflare Pages Function — rota: POST /api/admin/logout */
import { logout } from './_auth.js';
export async function onRequestPost() {
  return logout();
}