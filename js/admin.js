/* ============================================================
   PAINEL ADMIN — Multiplus Colchões
   Standalone (admin.html). Sem framework: IIFE vanilla.

   Modos de funcionamento:
   - AO VIVO: publico no Cloudflare Pages com STORE_KV (+ADMIN_PASS).
     Login troca senha por cookie assinado; tudo salva no KV.
   - DEMONSTRAÇÃO: aberto sem servidor (file:// ou dev local puro) —
     mostra dados e avisos, nada é salvo.
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- helpers ---------------- */
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const brl = n => n == null ? 'Sob consulta'
    : Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtNum = n => n == null ? ''
    : Number(n).toLocaleString('pt-BR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const fmtData = s => {
    const p = String(s || '').slice(0, 10).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : (s || '—');
  };
  const slug = s => String(s || '').toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  const imgSrc = ref => String(ref || '').indexOf('u/') === 0
    ? '/api/img/' + ref.slice(2)
    : 'img/' + ref + '.jpg';
  const v = id => (document.getElementById(id) ? document.getElementById(id).value : '');
  const noMes = s => String(s || '').slice(0, 7) === new Date().toISOString().slice(0, 7);
  const metLabel = m => ({ pix: 'Pix', credit_card: 'Cartão' }[m] || m || '');
  /* aceita “1290,50” / “1.290.50” / “1290” */
  function brlParseEdit(s) {
    s = String(s).trim(); if (!s) return null;
    s = s.replace(/[^\d.,]/g, '');
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    const n = Number(s);
    return isFinite(n) ? n : null;
  }

  /* ---------------- estado ---------------- */
  const CATS = (window.MP_DATA && window.MP_DATA.cats) || [];
  const STATS = ['orcamento', 'fechado', 'entregue', 'cancelado'];
  const STATS_PT = { orcamento: 'Orçamento', fechado: 'Fechado', entregue: 'Entregue', cancelado: 'Cancelado' };
  const S = {
    tab: 'vis', demo: false, demoVindi: false,
    conf: null, produtos: [], pedidos: [], faturas: [],
    busca: '', sel: null, timer: 0, busy: false,
  };

  /* ---------------- toasts ---------------- */
  function toast(msg) {
    const t = $('#atoast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(S.timer);
    S.timer = setTimeout(() => { t.hidden = true; }, 3200);
  }

  /* ---------------- modal ---------------- */
  function abrirModal(html) {
    $('#mConteudo').innerHTML = html;
    $('#modal').hidden = false;
  }
  function fecharModal() { $('#modal').hidden = true; $('#mConteudo').innerHTML = ''; S.sel = null; }

  /* ------------------------------------------------------------------
     API — fetch autenticado por cookie; 401 é marcado para voltar ao login
  ------------------------------------------------------------------ */
  async function api(path, met, body) {
    const init = { method: met || 'GET', credentials: 'same-origin', headers: {} };
    if (body !== undefined) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(body); }
    let r;
    try { r = await fetch(path, init); }
    catch (e) {
      const er = new Error('Sem conexão com o servidor.');
      er.rede = true; throw er;
    }
    let d = null;
    try { d = await r.json(); } catch (e) { d = null; }
    if (r.status === 401) {
      const er = new Error((d && d.msg) || 'Sessão expirada — entre de novo.');
      er.naoAuth = true;
      mostrarLogin();      /* válido no boot (mostra o form) e no meio de uso (relogin) */
      throw er;
    }
    if (!r.ok || (d && d.ok === false)) throw new Error((d && d.msg) || 'HTTP ' + r.status);
    return d;
  }

  /* --------------------------------------------------------------
     Modos: demonstração e ao vivo — nenhum dado inventado: em
     demonstração (ou sem chave da Vindi) comece tudo ZERADO e vazio.
  -------------------------------------------------------------- */

  /* conf default do config.js (o KV sobrepõe campo por campo) */
  function confDefault() {
    const C = window.MP_CONFIG || {}, pg = C.pagamentos || {}, ck = pg.checkout || {};
    return {
      whatsapp: C.whatsapp || '', saudacao: C.saudacao || '', cidade: C.cidade || '',
      instagram: C.instagram || '', email: C.email || '',
      mostrarPrecos: !!C.mostrarPrecos,
      checkoutAtivo: !!(ck && ck.ativo),
      mpLink: pg.link || '', pix: pg.pix || '', pixNome: pg.pixNome || '',
      sinalFixo: Number(ck.sinalFixo) || 0,
      parcelasMax: Number(ck.parcelasMax) || 12,
    };
  }
  function mergeConf(kv) { return Object.assign(confDefault(), kv || {}); }

  /* produtos base do data.js quando o KV ainda está vazio */
  const produtosBase = () => ((window.MP_DATA && window.MP_DATA.products) || []).map(p => Object.assign({ rel: 99 }, p));

  /* grava o catálogo inteiro (o servidor semeia/replaceAll o KV); repinta */
  async function salvarLista(msg) {
    const d = await api('/api/admin/produtos', 'PUT', { produtos: S.produtos });
    S.produtos = d.produtos || S.produtos;
    render();
    if (msg) toast(msg);
  }

  function mostrarLogin() {
    $('#painel').hidden = true;
    $('#login').hidden = false;
    setTimeout(() => $('#lSenha').focus(), 50);
  }

  async function carregarTudo() {
    const [pr, pe, vi] = await Promise.allSettled([
      api('/api/admin/produtos'), api('/api/admin/pedidos'), api('/api/admin/vindi'),
    ]);
    if (pr.status === 'fulfilled') {
      S.produtos = pr.value.produtos || produtosBase();
      S.kvEmpty = pr.value.produtos == null;
    } else { S.produtos = produtosBase(); S.kvEmpty = true; }
    if (pe.status === 'fulfilled') S.pedidos = pe.value.pedidos || [];
    if (vi.status === 'fulfilled') { S.faturas = vi.value.faturas || []; S.demoVindi = !!vi.value.demo; }
    render();
  }

  async function modoLive(conf) {
    S.demo = false;
    S.conf = mergeConf(conf);
    $('#login').hidden = true;
    $('#painel').hidden = false;
    render();
    await carregarTudo();
  }

  function modoDemo(motivo) {
    S.demo = true; S.demoVindi = false;
    S.conf = mergeConf(null);
    S.produtos = produtosBase();
    S.pedidos = [];
    S.faturas = [];
    $('#painel').hidden = false;
    render();
    if (motivo) toast(motivo);
  }

  /* --------------------------------------------------------------
     Boot — tenta dizer se estamos ao vivo ou num ambiente sem servidor
  -------------------------------------------------------------- */
  (async function boot() {
    try {
      const d = await api('/api/admin/config');
      modoLive(d.conf);
    } catch (e) {
      if (e.naoAuth) mostrarLogin();            // servidor existe; pede senha
      else modoDemo();                          // sem servidor (file:// / dev puro)
    }
  })();

  /* --------------------------------------------------------------
     LOGIN / SAIR
  -------------------------------------------------------------- */
  $('#lForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('#lGo'), err = $('#lErr');
    btn.disabled = true; err.hidden = true;
    try {
      await api('/api/admin/login', 'POST', { senha: v('lSenha') });
      $('#lGo').value = ''; $('#lSenha').value = '';
      const d = await api('/api/admin/config');
      modoLive(d.conf);
    } catch (ex) {
      err.textContent = ex.message;
      err.hidden = false;
      setTimeout(() => { btn.disabled = false; $('#lSenha').focus(); }, 50);
    }
  });

  $('#sairBtn').addEventListener('click', async () => {
    try { await api('/api/admin/logout', 'POST'); } catch (e) { /* cookie mesmo assim */ }
    S.demo = false; S.faturas = []; S.pedidos = []; S.produtos = [];
    mostrarLogin();
  });

  /* --------------------------------------------------------------
     TABS
  -------------------------------------------------------------- */
  function setTab(t) {
    S.tab = t;
    document.querySelectorAll('.atab').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
    render();
  }
  document.querySelector('.atabs').addEventListener('click', e => {
    const b = e.target.closest('.atab');
    if (b) setTab(b.dataset.tab);
  });

  /* --------------------------------------------------------------
     componentes comuns
  -------------------------------------------------------------- */
  function badgeStatus(st) {
    st = String(st || '').toLowerCase();
    if (st === 'paid' || st === 'entregue') return '<span class="bad b-pago">Pago</span>';
    if (st === 'pending' || st === 'scheduled') return '<span class="bad b-pendente">Pendente</span>';
    if (st === 'processing' || st === 'fraud_review') return '<span class="bad b-pendente">Processando</span>';
    if (st === 'canceled' || st === 'refused' || st === 'refund' || st === 'refunded')
      return '<span class="bad b-cancelado">Cancelado</span>';
    if (st === 'orcamento') return '<span class="bad b-orcamento">Orçamento</span>';
    if (st === 'fechado') return '<span class="bad b-fechado">Fechado</span>';
    return '<span class="bad b-outros">' + esc(st) + '</span>';
  }
  const catNome = id => { const c = CATS.find(x => x.id === id); return c ? c.nome : id; };
  function exigeLive() {
    if (S.demo) { toast('Sem servidor conectado — nada é salvo agora.'); return false; }
    return true;
  }

  /* --------------------------------------------------------------
     VISÃO GERAL
  -------------------------------------------------------------- */
  const VIEWS = {
    vis() {
      const pagas = S.faturas.filter(f => f.status === 'paid' && noMes(f.pago_em || f.criado));
      const ma = S.pedidos.filter(p => (p.status === 'fechado' || p.status === 'entregue') && p.total != null && noMes(p.criado));
      const receita = pagas.reduce((t, f) => t + Number(f.total || 0), 0)
        + ma.reduce((t, p) => t + Number(p.total || 0), 0);
      const vendasMes = pagas.length + ma.length;
      const pend = S.faturas.filter(f => f.status === 'pending' || f.status === 'processing').length;
      const orc = S.pedidos.filter(p => p.status === 'orcamento').length;

      let mov = S.faturas.map(f => ({ data: f.criado, nome: f.cliente, total: f.total, status: f.status, origem: 'vindi', url: f.url }));
      S.pedidos.forEach(p => mov.push({ data: (p.criado || '').slice(0, 10), nome: p.cliente, total: p.total, status: p.status, origem: 'manual' }));
      mov.sort((a, b) => (b.data || '').localeCompare(a.data || ''));
      mov = mov.slice(0, 8);

      return `
        ${S.demo ? `
        <div class="banner warn">⚠ <span>Modo demonstração — este painel não está conectado a um servidor.
          <small>Ao publicar no Cloudflare Pages (com STORE_KV e ADMIN_PASS), os dados reais da loja aparecem aqui e o salvamento é ativado.</small>
        </span></div>` : ''}
        <h1 class="ah">Visão geral</h1>
        <p class="asub">${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} · ${S.produtos.length} produtos no catálogo${S.demoVindi ? ' · faturas fictícias (conecte a Vindi para ver as reais)' : ''}</p>
        <div class="kgrid">
          <div class="kcard"><small>Receita paga no mês</small><b>${brl(receita)}</b><span>online ${pagas.length} + WhatsApp ${ma.length}</span></div>
          <div class="kcard"><small>Vendas pagas no mês</small><b>${vendasMes}</b><span>Pix e cartão</span></div>
          <div class="kcard"><small>Pendentes de pagamento</small><b>${pend}</b><span>faturas abertas</span></div>
          <div class="kcard"><small>Orçamentos abertos</small><b>${orc}</b><span>registros manuais</span></div>
          <div class="kcard"><small>Estado</small><b style="font-size:18px">${S.demo ? 'Demonstração' : 'Conectado ✓'}</b><span>${S.demo ? 'sem servidor' : 'Cloudflare Pages'}</span></div>
        </div>
        <div class="sect"><h2>Últimos movimentos</h2></div>
        ${mov.length ? `
        <div class="twrap"><table class="tbl">
          <thead><tr><th>Data</th><th>Cliente</th><th>Origem</th><th>Total</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${mov.map(m => `
            <tr>
              <td class="num">${fmtData(m.data)}</td>
              <td>${esc(m.nome)}</td>
              <td>${m.origem === 'vindi' ? '<span class="bad b-online">Online</span>' : '<span class="bad b-outros">WhatsApp</span>'}</td>
              <td class="num">${brl(m.total)}</td>
              <td>${badgeStatus(m.status)}</td>
              <td>${m.url ? `<a href="${esc(m.url)}" target="_blank" rel="noopener">fatura</a>` : ''}</td>
            </tr>`).join('')}
          </tbody>
        </table></div>` : '<div class="emptybox">Nada por enquanto.</div>'}`;
    },

    /* ------------------------------------------------------------
       PEDIDOS
    ------------------------------------------------------------ */
    ped() {
      const fat = S.faturas.slice().sort((a, b) => (b.criado || '').localeCompare(a.criado || ''));
      const man = S.pedidos.slice().sort((a, b) => String(b.id).localeCompare(String(a.id)));
      return `
        ${S.demo ? `<div class="banner warn">⚠ <span>Modo demonstração<small>Registrar, editar e excluir precisam de servidor publicado.</small></span></div>` : ''}
        ${(!S.demo && S.demoVindi) ? `<div class="banner warn">🧪 <span>Faturas fictícias<small>Defina VINDI_API_KEY no Cloudflare (ou VINDI_MOCK=1 para testar) e recarregue.</small></span></div>` : ''}
        <h1 class="ah">Pedidos</h1>
        <p class="asub">Cobranças online da Vindi (somente leitura) + registro manual dos pedidos de WhatsApp.</p>

        <div class="sect"><h2>Vendas online (Vindi)</h2></div>
        ${fat.length ? `
        <div class="twrap"><table class="tbl">
          <thead><tr><th>Data</th><th>Cliente</th><th>Método</th><th>Total</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${fat.map(f => `
            <tr>
              <td class="num">${fmtData(f.criado)}</td>
              <td>${esc(f.cliente)}</td>
              <td>${esc(metLabel(f.metodo))}</td>
              <td class="num">${brl(f.total)}</td>
              <td>${badgeStatus(f.status)}</td>
              <td>${f.url ? `<a href="${esc(f.url)}" target="_blank" rel="noopener">fatura</a>` : ''}</td>
            </tr>`).join('')}
          </tbody>
        </table></div>` : '<div class="emptybox">Nenhuma cobrança online ainda.</div>'}

        <div class="sect"><h2>Registro manual (WhatsApp)</h2>
          <button class="btn btn-primary" data-acao="ped-novo">＋ Registrar pedido</button>
        </div>
        ${man.length ? `
        <div class="twrap"><table class="tbl">
          <thead><tr><th>Data</th><th>Cliente</th><th>Itens</th><th>Total</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${man.map(p => `
            <tr>
              <td class="num">${fmtData(p.criado)}</td>
              <td>${esc(p.cliente)}${p.telefone ? `<br><small style="color:var(--muted)">${esc(p.telefone)}</small>` : ''}</td>
              <td class="itens">${esc(p.itens)}</td>
              <td class="num">${p.total == null ? '—' : brl(p.total)}</td>
              <td>${badgeStatus(p.status)}</td>
              <td class="pact">
                <button class="iconbtn" data-acao="ped-edit" data-id="${esc(p.id)}" title="Editar">✎</button>
                <button class="iconbtn dg" data-acao="ped-del" data-id="${esc(p.id)}" title="Excluir">🗑</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table></div>` : '<div class="emptybox">Nenhum registro manual. O “＋ Registrar pedido” cria um.</div>'}`;
    },

    /* ------------------------------------------------------------
       PRODUTOS
    ------------------------------------------------------------ */
    prod() {
      return `
        ${S.demo ? `<div class="banner warn">⚠ <span>Modo demonstração<small>Alterações de catálogo precisam de servidor publicado (STORE_KV).</small></span></div>` : ''}
        <div class="sect" style="margin:0">
          <div><h1 class="ah" style="margin:0">Produtos</h1>
          <p class="asub" style="margin:0">Clique no valor para editar o preço; ✎ abre o editor completo.</p></div>
          <button class="btn btn-primary" data-acao="prod-novo">＋ Novo produto</button>
        </div>
        <p class="ahint" style="margin:8px 0 14px">Preço vazio = “Sob consulta”. Mostrar valores na loja: aba Loja → mostrarPrecos.</p>
        <div style="margin:0 0 12px">
          <input id="pQ" placeholder="Buscar produto…" value="${esc(S.busca)}"
            style="width:min(340px,100%);height:38px;border:1px solid var(--line-2);border-radius:10px;padding:0 12px;font:500 14px var(--body);background:var(--card)">
        </div>
        <div id="prodbox"></div>`;
    },

    /* ------------------------------------------------------------
       LOJA
    ------------------------------------------------------------ */
    loja() {
      const c = S.conf || {};
      return `
        ${S.demo ? `<div class="banner warn">⚠ <span>Modo demonstração<small>O botão salvar só funciona com o servidor publicado.</small></span></div>` : ''}
        <h1 class="ah">Loja</h1>
        <p class="asub">O que o cliente vê — contato, preços e pagamento. Salvo no servidor da loja.</p>
        <form id="fmLoja" class="pcard" style="padding:20px">
          <div class="fgrid">
            <label class="fld">WhatsApp (só dígitos)<input id="cfWa" value="${esc(c.whatsapp)}" placeholder="5511912345678"></label>
            <label class="fld">Cidade (rodapé)<input id="cfCid" value="${esc(c.cidade)}" placeholder="ex.: Guarulhos — SP"></label>
            <label class="fld wide">Saudação do orçamento<input id="cfSaud" value="${esc(c.saudacao)}"></label>
            <label class="fld">Instagram<input id="cfInsta" value="${esc(c.instagram)}" placeholder="sem @"></label>
            <label class="fld">E-mail<input id="cfMail" value="${esc(c.email)}"></label>
            <label class="chk"><input type="checkbox" id="cfPrecos"${c.mostrarPrecos ? ' checked' : ''}> Mostrar preços na loja</label>
            <label class="chk"><input type="checkbox" id="cfCkOn"${c.checkoutAtivo ? ' checked' : ''}> Checkout online ativo (Pix/cartão na própria loja)</label>
            <p class="ahint" style="margin:2px 0 0;grid-column:1/-1">Marque só quando a conta da Vindi estiver com a chave de API no Cloudflare — sem isso o botão aparece mas o pagamento falha.</p>
            <label class="fld">Sinal fixo (R$)<input id="cfSinal" inputmode="decimal" value="${c.sinalFixo ? fmtNum(c.sinalFixo) : ''}" placeholder="vazio = cliente digita"></label>
            <label class="fld">Parcelas máx.<input id="cfParc" type="number" min="1" max="12" value="${c.parcelasMax || 12}"></label>
            <label class="fld wide">Link do Mercado Pago (opcional — botão adicional)<input id="cfMp" value="${esc(c.mpLink)}" placeholder="https://mpago.la/…">
              <p class="ahint">Deixe em branco: com preços cadastrados o caminho é o checkout da própria loja. Cole de volta para reaparecer.</p></label>
            <label class="fld">Chave Pix (opcional)<input id="cfPix" value="${esc(c.pix)}"></label>
            <label class="fld">Favorecido Pix<input id="cfPixN" value="${esc(c.pixNome)}"></label>
          </div>
          <button class="btn btn-primary">Salvar</button>
        </form>
        <div class="sect"><h2>Também nesta instalação</h2></div>
        <div class="kgrid">
          <div class="kcard"><small>Produtos</small><b>${S.produtos.length}</b><span>na aba Produtos</span></div>
          <div class="kcard"><small>Fotos próprias</small><b>${contaUploads()}</b><span>subidas pelo painel</span></div>
          <div class="kcard"><small>Estado</small><b style="font-size:18px">${S.demo ? 'Demonstração' : 'Conectado ✓'}</b><span></span></div>
        </div>`;
    },
  };
  function contaUploads() {
    return S.produtos.reduce((n, p) => n + (p.imgs || []).filter(i => String(i).indexOf('u/') === 0).length, 0);
  }

  function render() {
    $('#adm').innerHTML = (VIEWS[S.tab] || VIEWS.vis)();
    if (S.tab === 'prod') listaProdutos();
  }

  /* lista de cards de produtos (respeita a busca) */
  function listaProdutos() {
    const q = S.busca.trim().toLowerCase();
    const box = $('#prodbox');
    if (!box) return;
    let ps = S.produtos.slice();
    if (q) ps = ps.filter(p => (p.name || '').toLowerCase().includes(q) || (p.id || '').includes(q));
    ps.sort((a, b) => {
      const ci = CATS.findIndex(c => c.id === a.cat) - CATS.findIndex(c => c.id === b.cat);
      return ci || (Number(a.rel) || 99) - (Number(b.rel) || 99) || String(a.name).localeCompare(b.name);
    });
    if (!ps.length) { box.innerHTML = `<div class="emptybox">${q ? 'Nada encontrado.' : 'Nenhum produto.'} ${S.demo ? ' (demonstração)' : ''}</div>`; return; }
    box.innerHTML = `<div class="pgrid">
      ${ps.map(p => {
      const img = (p.imgs && p.imgs[0]) || '';
      return `
      <div class="prow">
        <img src="${img ? imgSrc(img) : 'img/logo.svg'}" alt="" onerror="this.style.visibility='hidden'">
        <div class="pmeta">
          <strong>${esc(p.name)}</strong>
          <small>${esc(catNome(p.cat))} · id: ${esc(p.id)}</small>
        </div>
        <div class="pact">
          ${p.featured ? '<span class="bad b-online" title="Destaque">★</span>' : ''}
          <input class="preco" data-id="${esc(p.id)}" value="${p.price == null ? '' : fmtNum(p.price)}" placeholder="— consulta" inputmode="decimal" title="Preço (vazio = sob consulta)">
          <button class="iconbtn${p.featured ? '' : ''}" data-acao="prod-feat" data-id="${esc(p.id)}" title="${p.featured ? 'Remover destaque' : 'Marcar destaque'}">${p.featured ? '☆' : '★'}</button>
          <button class="iconbtn" data-acao="prod-edit" data-id="${esc(p.id)}" title="Editar">✎</button>
          <button class="iconbtn dg" data-acao="prod-del" data-id="${esc(p.id)}" title="Excluir">🗑</button>
        </div>
      </div>`;}).join('')}
    </div>`;
  }

  /* --------------------------------------------------------------
     AÇÕES delegadas no documento (abas + modal, o modal está fora de #adm)
  -------------------------------------------------------------- */
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-acao]');
    if (!b) return;
    const a = b.dataset.acao, id = b.dataset.id;

    if (a === 'ped-novo') return abrirModal(formPedido(null));
    if (a === 'ped-edit') {
      const p = S.pedidos.find(x => x.id === id);
      if (p) abrirModal(formPedido(p));
      return;
    }
    if (a === 'ped-del') {
      if (!confirm('Excluir o registro de ' + (S.pedidos.find(x => x.id === id) || {}).cliente + '?')) return;
      if (!exigeLive()) return;
      try { await api('/api/admin/pedidos', 'DELETE', { id }); await carregarTudo(); toast('Registro excluído.'); }
      catch (ex) { toast(ex.message); }
      return;
    }

    if (a === 'prod-novo') return abrirEditor(null);
    if (a === 'prod-edit') {
      const p = S.produtos.find(x => x.id === id);
      if (p) abrirEditor(JSON.parse(JSON.stringify(p)));
      return;
    }
    if (a === 'prod-del') {
      const p = S.produtos.find(x => x.id === id) || {};
      if (!confirm('Excluir o produto “' + (p.name || id) + '” da loja?')) return;
      if (!exigeLive()) return;
      if (!exigeLive()) return;
      const i = S.produtos.findIndex(x => x.id === id);
      if (i >= 0) S.produtos.splice(i, 1);
      try { await salvarLista('Produto excluído da loja.'); }
      catch (ex) { toast(ex.message); await carregarTudo(); }
      return;
    }
    if (a === 'prod-feat') {
      const p = S.produtos.find(x => x.id === id);
      if (!p) return;
      if (!exigeLive()) return;
      try {
        p.featured = !p.featured;
        await salvarLista(p.featured ? 'Produto em destaque.' : 'Destaque removido.');
      } catch (ex) { p.featured = !p.featured; toast(ex.message); await carregarTudo(); }
      return;
    }

    /* fotos no modal do editor */
    if (a === 'img-add') {
      const ref = (v('imgRef') || '').trim().toLowerCase().replace(/^img\//, '');
      if (!ref) { toast('Escreva o nome da foto do repositório.'); return; }
      if (!/^[a-z0-9._-]+(\/[a-z0-9._-]+)*$/.test(ref)) { toast('Nome de foto inválido (letras, números, / e -).'); return; }
      S.sel.imgs = S.sel.imgs || [];
      if (S.sel.imgs.includes(ref)) { toast('Essa foto já está no produto.'); return; }
      if (S.sel.imgs.length >= 8) { toast('Máximo de 8 fotos.'); return; }
      S.sel.imgs.push(ref);
      pintaImgs();
      const ir = document.getElementById('imgRef');
      if (ir) ir.value = '';
      return;
    }
    if (a === 'img-rm') {
      if (!S.sel) return;
      S.sel.imgs = (S.sel.imgs || []).filter((_, i) => i !== Number(b.dataset.i));
      pintaImgs();
      return;
    }
  });

  /* preço digitado nas linhas (change = saiu do campo) */

  /* preço digitado nas linhas (change = saiu do campo) */
  document.addEventListener('change', async e => {
    if (e.target && e.target.classList && e.target.classList.contains('preco')) {
      const id = e.target.dataset.id;
      const p = S.produtos.find(x => x.id === id);
      if (!p) return;
      const novo = e.target.value.trim() === '' ? null : Math.min(Math.max(brlParseEdit(e.target.value) || 0, 0), 200000);
      if (novo === p.price) return;
      if (!exigeLive()) { render(); return; }
      try {
        p.price = novo;
        await salvarLista(novo == null ? 'Preço removido (sob consulta).' : 'Preço atualizado: ' + brl(novo));
      } catch (ex) { toast(ex.message); await carregarTudo(); }
    }
    if (e.target && e.target.id === 'fotoIn') subirFoto(e.target.files && e.target.files[0]);
    if (e.target && e.target.id === 'pQ') { S.busca = e.target.value; listaProdutos(); } /* p/ navegadores antigos */
  });
  document.addEventListener('input', e => {
    if (e.target && e.target.id === 'pQ') { S.busca = e.target.value; listaProdutos(); }
  });

  /* --------------------------------------------------------------
     modal de pedido manual
  -------------------------------------------------------------- */
  function formPedido(p) {
    p = p || { cliente: '', telefone: '', itens: '', total: null, status: 'orcamento', obs: '' };
    return `
    <form id="fmPed" data-edit="${esc(p.id || '')}">
      <h2>${p.id ? 'Editar pedido' : 'Registrar pedido'}</h2>
      <div class="fgrid">
        <label class="fld wide">Cliente *<input id="fmCliente" required value="${esc(p.cliente)}"></label>
        <label class="fld wide">Telefone<input id="fmFone" value="${esc(p.telefone)}" inputmode="tel" placeholder="opcional"></label>
        <label class="fld wide">Itens<textarea id="fmItens" maxlength="800" placeholder="o que o cliente levou / quer">${esc(p.itens)}</textarea></label>
        <label class="fld">Total (R$)<input id="fmTotal" inputmode="decimal" value="${fmtNum(p.total)}" placeholder="opcional"></label>
        <label class="fld">Status<select id="fmStatus">
          ${STATS.map(s => `<option value="${s}"${s === p.status ? ' selected' : ''}>${STATS_PT[s]}</option>`).join('')}
        </select></label>
        <label class="fld wide">Observações<textarea id="fmObs" maxlength="500">${esc(p.obs)}</textarea></label>
      </div>
      <p id="fmErr" class="lerr" hidden></p>
      <p class="ahint" style="margin:10px 0 0">${S.demo ? 'Demonstração: salvar está desativado (publicar com STORE_KV para ativar).' : 'Registre aqui o que veio pelo WhatsApp para o controle de tudo ficar num só lugar.'}</p>
      <button class="btn btn-primary" style="margin-top:12px">${p.id ? 'Salvar alterações' : 'Registrar'}</button>
    </form>`;
  }

  /* --------------------------------------------------------------
     editor de produto (modal)
  -------------------------------------------------------------- */
  function abrirEditor(pOrig) {
    const novo = !pOrig;
    S.sel = novo
      ? { id: '', name: '', cat: (CATS[0] || {}).id || 'colchoes', tag: '', lead: '', price: null, rel: 99, feats: [], imgs: [], featured: false }
      : JSON.parse(JSON.stringify(pOrig));
    const p = S.sel;
    abrirModal(`
      <form id="fmProd">
        <h2>${novo ? 'Novo produto' : 'Editar produto'}</h2>
        ${novo ? '' : `<p class="ahint" style="margin:0 0 12px">id: <code>${esc(p.id)}</code> — categoria atual: ${esc(catNome(p.cat))}</p>`}
        <div class="fgrid">
          <label class="fld wide">Nome *<input id="pnNome" required value="${esc(p.name)}"></label>
          <label class="fld">Categoria<select id="pnCat">
            ${CATS.map(c => `<option value="${esc(c.id)}"${c.id === p.cat ? ' selected' : ''}>${esc(c.nome)}</option>`).join('')}
          </select></label>
          <label class="fld">Ordem no catálogo<input id="pnRel" type="number" value="${Number(p.rel) || 99}" title="menor aparece primeiro"></label>
          <label class="fld wide">Chamada (etiqueta curta)<input id="pnTag" value="${esc(p.tag)}" placeholder="ex.: Terapêutico a vácuo"></label>
          <label class="fld wide">Frase de vitrine (lead)<input id="pnLead" value="${esc(p.lead)}" maxlength="180"></label>
          <label class="fld">Preço (R$)<input id="pnPreco" inputmode="decimal" value="${p.price == null ? '' : fmtNum(p.price)}" placeholder="vazio = sob consulta"></label>
          <label class="chk" style="align-self:end"><input type="checkbox" id="pnFeat"${p.featured ? ' checked' : ''}> Destaque</label>
          <label class="fld wide">Características (uma por linha, máx. 14)<textarea id="pnFeats" rows="5">${esc((p.feats || []).join('\n'))}</textarea></label>
          <div class="fld wide">Fotos (máx. 8)
            <div id="ilistRef" class="ilist"></div>
            <p class="ahint">Suba uma foto nova (vai para o servidor) ou digite o nome de uma foto que já existe no repositório (ex.: colchoes/aurora-cama).</p>
            <div style="display:flex;gap:8px">
              <input id="imgRef" placeholder="colchoes/aurora-cama" style="flex:1;height:38px;border:1px solid var(--line-2);border-radius:10px;padding:0 11px;font:500 13.5px var(--body)">
              <button type="button" class="btn btn-ghost" data-acao="img-add">Adicionar</button>
            </div>
          </div>
        </div>
        <p id="fmErr" class="lerr" hidden style="margin:12px 0 0"></p>
        <p class="ahint" style="margin:12px 0 0">${novo ? 'O id é gerado automaticamente do nome.' : ''}${S.demo ? ' Demonstração: salvar está desativado.' : ''}</p>
        <button class="btn btn-primary" style="margin-top:12px">${novo ? 'Criar produto' : 'Salvar'}</button>
      </form>`);
    pintaImgs();
  }

  function pintaImgs() {
    const box = $('#ilistRef');
    if (!box || !S.sel) return;
    const imgs = S.sel.imgs || [];
    box.innerHTML =
      imgs.map((ref, i) => `
        <div class="ithumb">
          <img src="${imgSrc(ref)}" alt="" onerror="this.style.opacity='.3'">
          <button type="button" data-acao="img-rm" data-i="${i}" title="Remover">&times;</button>
          <small>${esc(ref)}</small>
        </div>`).join('') +
      `<label class="upbtn" id="upBtn" title="Subir foto (JPEG/PNG/WebP)">📸 Subir foto</label>
       <input type="file" id="fotoIn" accept="image/jpeg,image/png,image/webp" hidden>`;
    /* o label.upbtn dispara o input hidden */
    const lbl = $('#upBtn'), inp = $('#fotoIn');
    if (lbl && inp) lbl.addEventListener('click', () => inp.click());
  }

  async function subirFoto(file) {
    if (!file) return;
    if (!exigeLive()) return;
    const lbl = $('#upBtn');
    if (lbl) lbl.classList.add('busy');
    try {
      const { ct, b64 } = await fotoParaB64(file);
      const d = await api('/api/admin/upload', 'POST', { nome: file.name, ct, b64 });
      if (d.ref) {
        S.sel.imgs.push(d.ref);
        pintaImgs();
        toast('Foto pronta — salve o produto para colocar na loja.');
      }
    } catch (ex) {
      toast(ex.message || 'Não consegui subir a foto.');
    } finally {
      if (lbl) lbl.classList.remove('busy');
      const inp = $('#fotoIn'); if (inp) inp.value = '';
    }
  }

  /* reduz no navegador para ≤1600px e devolve {ct:'image/jpeg', b64} */
  function fotoParaB64(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const escf = Math.min(1, 1600 / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * escf) || 1;
          c.height = Math.round(img.height * escf) || 1;
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          const b64 = c.toDataURL('image/jpeg', 0.82).split(',')[1];
          URL.revokeObjectURL(url);
          res({ ct: 'image/jpeg', b64 });
        } catch (err) { URL.revokeObjectURL(url); rej(err); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Imagem ilegível.')); };
      img.src = url;
    });
  }

  /* --------------------------------------------------------------
     submits dos três formulários (pedidos, produto, loja)
  -------------------------------------------------------------- */
  document.addEventListener('submit', async e => {
    const f = e.target;

    /* ---- pedido manual ---- */
    if (f.id === 'fmPed') {
      e.preventDefault();
      if (!S.demo && !exigeLive()) return;
      const id = f.dataset.edit || '';
      const totalRaw = v('fmTotal').trim();
      const pedido = {
        cliente: v('fmCliente').trim(),
        telefone: v('fmFone').trim(),
        itens: v('fmItens').trim(),
        total: totalRaw === '' ? null : Math.min(Math.max(brlParseEdit(totalRaw) || 0, 0), 200000),
        status: v('fmStatus'),
        obs: v('fmObs').trim(),
      };
      if (!pedido.cliente) return mostraErr('fmErr', 'Falta o nome do cliente.');
      if (S.demo) { fecharModal(); toast('Demonstração — nada salvo.'); return; }
      try {
        if (id) await api('/api/admin/pedidos', 'PUT', { pedido: Object.assign({ id }, pedido) });
        else await api('/api/admin/pedidos', 'POST', { pedido });
        fecharModal(); await carregarTudo();
        toast(id ? 'Pedido atualizado.' : 'Pedido registrado.');
      } catch (ex) { mostraErr('fmErr', ex.message); }
      return;
    }

    /* ---- produto ---- */
    if (f.id === 'fmProd') {
      e.preventDefault();
      if (!exigeLive()) return;
      const novo = !S.sel.id;
      const name = v('pnNome').trim();
      if (!name) return mostraErr('fmErr', 'Falta o nome.');
      const priceRaw = v('pnPreco').trim();
      const price = priceRaw === '' ? null : Math.min(Math.max(brlParseEdit(priceRaw) || 0, 0), 200000);
      const produto = Object.assign({}, S.sel, {
        id: novo ? slug(name) : S.sel.id,
        name,
        cat: v('pnCat'),
        tag: v('pnTag').trim(),
        lead: v('pnLead').trim(),
        price,
        rel: parseInt(v('pnRel'), 10) || 99,
        feats: v('pnFeats').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 14),
        imgs: (S.sel.imgs || []).slice(0, 8),
        featured: $('#pnFeat') && $('#pnFeat').checked,
      });
      if (novo && S.produtos.some(p => p.id === produto.id)) return mostraErr('fmErr', 'Já existe um produto com esse id — mude o nome.');
      try {
        if (novo) S.produtos.push(produto);
        else {
          const i = S.produtos.findIndex(x => x.id === produto.id);
          if (i >= 0) S.produtos[i] = produto; else S.produtos.push(produto);
        }
        await salvarLista(novo ? 'Produto criado — catálogo inteiro atualizado.' : 'Produto salvo.');
        fecharModal();
      } catch (ex) {
        mostraErr('fmErr', ex.message);
        await carregarTudo();  /* volta do estado do servidor */
      }
      return;
    }

    /* ---- loja ---- */
    if (f.id === 'fmLoja') {
      e.preventDefault();
      if (!exigeLive()) return;
      const wa = v('cfWa').replace(/\D/g, '');
      if (wa && (wa.length < 10 || wa.length > 13)) return toast('WhatsApp inválido — use país + DDD + número (só dígitos).');
      const conf = {
        whatsapp: wa,
        saudacao: v('cfSaud').trim(),
        cidade: v('cfCid').trim(),
        instagram: v('cfInsta').trim(),
        email: v('cfMail').trim(),
        mostrarPrecos: !!($('#cfPrecos') || {}).checked,
        checkoutAtivo: !!($('#cfCkOn') || {}).checked,
        sinalFixo: brlParseEdit(v('cfSinal') || '') || 0,
        parcelasMax: Math.min(Math.max(parseInt(v('cfParc'), 10) || 12, 1), 12),
        mpLink: v('cfMp').trim(),
        pix: v('cfPix').trim(),
        pixNome: v('cfPixN').trim(),
      };
      try {
        const d = await api('/api/admin/config', 'PUT', { conf });
        S.conf = Object.assign(S.conf, d.conf);
        render();
        toast('Loja atualizada — já vale para o site.');
      } catch (ex) { toast(ex.message); }
      return;
    }
  });

  function mostraErr(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.hidden = false; }
  }

  /* --------------------------------------------------------------
     modal: fechar (×, fundo, Esc)
  -------------------------------------------------------------- */
  $('#modal').addEventListener('click', e => {
    if (e.target === $('#modal') || e.target.closest('#mFechar')) fecharModal();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) fecharModal(); });
})();