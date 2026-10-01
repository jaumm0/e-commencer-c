/* ============================================================
   Checkout da loja — cria cobrança avulsa na Vindi (Pix/cartão)
   Cloudflare Pages Function — rota: POST /api/vindi/checkout

   As credenciais NUNCA entram no código do site; ficam como
   variáveis de ambiente do Cloudflare Pages (painel do projeto:
   Settings → Variables and Secrets):
     VINDI_API_KEY   chave de produção (app.vindi.com.br → Configuração
                     → Integrações → Chaves de API)
     VINDI_MAX_AMT   teto por cobrança em R$ (opcional; padrão 50000)
     VINDI_MOCK      '1' = modo de teste, não chama a Vindi
   ============================================================ */
const API = 'https://app.vindi.com.br/api/v1';

const auth = key => 'Basic ' + btoa(key + ':');
const digitos = s => String(s || '').replace(/\D/g, '');

function err(status, msg) {
  return new Response(JSON.stringify({ ok: false, msg }), {
    status, headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
const ok = dados => new Response(JSON.stringify(Object.assign({ ok: true }, dados)), {
  status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' },
});

/* ---------- validação ---------- */
function cpfOk(d) {
  if (!/^\d{11}$/.test(d) || /^(\d)\1+$/.test(d)) return false;
  const calc = n => {
    let s = 0;
    for (let i = 0; i < n; i++) s += +d[i] * (n + 1 - i);
    const r = 11 - (s % 11);
    return r > 9 ? 0 : r;
  };
  return calc(9) === +d[9] && calc(10) === +d[10];
}
function cnpjOk(d) {
  if (!/^\d{14}$/.test(d) || /^(\d)\1+$/.test(d)) return false;
  const calc = (pesos, n) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += +d[i] * pesos[i];
    const r = 11 - (s % 11);
    return r > 9 ? 0 : r;
  };
  const p1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const p2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  return calc(p1, 12) === +d[12] && calc(p2, 13) === +d[13];
}
const docOk = d => d.length === 11 ? cpfOk(d) : d.length === 14 ? cnpjOk(d) : false;
const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function valida(body, env) {
  if (!body || typeof body !== 'object') return 'Requisição inválida.';
  const valor = Number(body.valor);
  if (!isFinite(valor) || valor < 5) return 'Valor inválido (mínimo R$ 5,00).';
  const teto = Math.max(Number(env && env.VINDI_MAX_AMT) || 50000, 5);
  if (valor > teto) return 'Valor acima do teto permitido. A loja combina direto com você no WhatsApp.';
  if (!['pix', 'cartao'].includes(body.metodo)) return 'Escolha Pix ou cartão.';
  if (!body.cliente || !String(body.cliente.nome || '').trim()) return 'Informe seu nome completo.';
  if (!emailOk(body.cliente.email)) return 'Informe um e-mail válido.';
  const doc = digitos(body.cliente.doc);
  if (!docOk(doc)) return 'CPF/CNPJ inválido.';
  if (!body.cliente.rua || !body.cliente.numero || !body.cliente.cep) return 'Preencha o endereço de faturamento.';
  if (body.metodo === 'cartao') {
    const par = Number(body.parcelas) || 1;
    if (par < 1 || par > 12 || !Number.isInteger(par)) return 'Parcelas inválidas.';
    const c = body.cartao || {};
    if (!String(c.nome || '').trim()) return 'Informe o nome do titular do cartão.';
    if (!/^\d{12,19}$/.test(digitos(c.numero))) return 'Número do cartão inválido.';
    const val = digitos(c.validade);
    if (val.length !== 4 || +val.slice(0, 2) < 1 || +val.slice(0, 2) > 12) return 'Validade do cartão deve ser MM/AA.';
    if (!/^\d{3,4}$/.test(digitos(c.cvv))) return 'CVV inválido.';
  }
  return null;
}

/* produto avulso do site (Vindi exige item de fatura atrelado a um produto) */
async function garanteProduto(headers, code, name, amount) {
  const r = await fetch(API + '/products?query=code:' + encodeURIComponent(code), { headers });
  if (r && r.ok) {
    const j = await r.json().catch(() => ({}));
    if (j.products && j.products.length) return j.products[0].id;
  }
  const c = await fetch(API + '/products', {
    method: 'POST', headers, body: JSON.stringify({
      name, code, description: 'Cobrança gerada pelo site — valor avulso',
      pricing_schema: { price: amount }, unit: 'unidade', invoice: 'never',
    }),
  }).then(r => r.ok ? r.json() : null).catch(() => null);
  if (c && c.product) return c.product.id;
  return null;
}

/* extrai Pix (QR/copia-e-cola) da cobrança, nos campos que os gateways devolvem */
function pixDe(cob) {
  const t = (cob.last_transaction || {});
  const fs = Object.assign({}, t.gateway_response_fields || {}, cob.gateway_response_fields || {});
  let copia = '', img = '';
  for (const k of Object.keys(fs)) {
    const v = fs[k];
    const kl = k.toLowerCase();
    if (/img|image|qr_code_url|qrcode/i.test(kl) && typeof v === 'string' && /^https?:/.test(v) && !img) img = v;
    if (/^[\d.\s]{40,}$/.test(String(v)) && !copia) copia = String(v).trim();
  }
  return { copia, img, url: cob.print_url || '' };
}

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch (e) { return err(400, 'Requisição inválida.'); }

  const problema = valida(body, env);
  if (problema) return err(400, problema);

  const v = Number(body.valor);
  const valor = Math.round(v * 100) / 100;
  const metodo = body.metodo === 'cartao' ? 'cartao' : 'pix';
  const cli = body.cliente;

  /* ---- MODO DE TESTE: sem chamar a Vindi ---- */
  if (env.VINDI_MOCK === '1') {
    return ok({
      mock: true,
      cobranca: {
        id: 'mock-' + Date.now() + (metodo === 'cartao' ? '-c' : ''),
        status: metodo === 'cartao' ? 'paid' : 'pending',
        amount: valor, metodo,
        pix: metodo === 'pix' ? {
          copia: '00020126TESTE-SIMULADO-SEMMOCKQR6148BR.com.multiplus520400005303986' + String(Date.now()).slice(-8),
          img: '', url: '',
        } : null,
      },
    });
  }

  if (!env.VINDI_API_KEY) {
    return err(500, 'Checkout ainda não configurado (variável VINDI_API_KEY ausente no servidor).');
  }

  const headers = { 'Content-Type': 'application/json', Authorization: auth(env.VINDI_API_KEY) };
  const codigos = { pix: env.VINDI_CODE_PIX || 'pix', cartao: env.VINDI_CODE_CARD || 'credit_card' };
  const pm = codigos[metodo];

  const produto = await garanteProduto(headers, 'SITE_COBRANCA', 'Cobrança site — ' + (body.descricao || 'Orçamento'), valor);
  if (!produto) return err(502, 'Não foi possível preparar a cobrança na Vindi. Confira as credenciais.');

  const payload = {
    payment_method_code: pm,
    installments: metodo === 'cartao' ? (Number(body.parcelas) || 1) : 1,
    bill_items: [{ product_id: produto, amount: valor, quantity: 1, description: String(body.descricao || 'Cobrança do site').slice(0, 255) }],
    metadata: { origem: 'site-multiplus', valor_cents: Math.round(valor * 100) },
    customer: {
      name: String(cli.nome).slice(0, 200),
      email: String(cli.email).trim(),
      registry_code: digitos(cli.doc),
      customer_ip: (request.headers.get('CF-Connecting-IP') || '').trim() || undefined,
      address_attributes: {
        street: String(cli.rua).slice(0, 200), number: String(cli.numero).slice(0, 40),
        additional_details: String(cli.complemento || '').slice(0, 100) || undefined,
        zipcode: digitos(cli.cep), neighborhood: String(cli.bairro || '').slice(0, 100),
        city: String(cli.cidade || '').slice(0, 100), state: String(cli.uf || '').slice(0, 2).toUpperCase(),
        country: 'BR',
      },
      phones_attributes: digitos(cli.telefone).length >= 10
        ? [{ phone_type: 'mobile', number: digitos(cli.telefone).length > 11 ? digitos(cli.telefone) : '55' + digitos(cli.telefone) }]
        : [],
    },
  };
  if (metodo === 'cartao') {
    const c = body.cartao;
    payload.payment_profile = {
      holder_name: String(c.nome).trim(),
      registry_code: digitos(cli.doc),
      card_number: digitos(c.numero),
      card_expiration: String(c.validade).trim(),
      card_cvv: digitos(c.cvv),
      payment_method_code: 'credit_card',
    };
    payload.discard_credit_card = true; /* não guarda o cartão do comprador */
  }

  const r = await fetch(API + '/billing', {
    method: 'POST', headers, body: JSON.stringify(payload),
  });
  const j = await r.json().catch(() => null);

  if (!j || !j.bill || !(j.bill.charges || []).length) {
    /* 4xx — erro visível para o comprador (ex.: cartão recusado) */
    const e = j && (j.errors || {});
    const msg = Object.values(e).length
      ? String(Object.values(e)[0][Object.keys(e)[0]][0] || 'Cobrança recusada.')
      : 'Cobrança recusada. Revise os dados ou pague por Pix.';
    return err(r.status, msg);
  }
  const cob = j.bill.charges[0];
  return ok({
    cobranca: {
      id: String(cob.id),
      status: cob.status,
      amount: cob.amount,
      metodo,
      pix: metodo === 'pix' ? pixDe(cob) : null,
      print_url: cob.print_url || '',
    },
  });
}