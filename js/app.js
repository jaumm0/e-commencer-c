(function () {
  'use strict';

  const CFG = window.MP_CONFIG;
  const DATA = window.MP_DATA;
  const P = 'img/';
  const DK = window.MP_DBG || [];           /* renders com fundo preto (js/bgdark.js) */
  const dkC = img => DK.includes(img) ? 'dk' : '';

  /* ---------- ícones ---------- */
  const I = {
    heart: f => `<svg viewBox="0 0 24 24" fill="${f ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/></svg>`,
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1.6"/><circle cx="19" cy="21" r="1.6"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57L22 6H5.12"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.48-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.11 3.22 5.1 4.52.71.3 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.76-.72 2-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35zM12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.83 9.83 0 0 1 7 2.9 9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.9 9.88zm8.42-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.16-3.47-8.41z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16M7 12h10m-7 7h4"/></svg>',
    card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  };

  /* ---------- util ---------- */
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const byId = id => DATA.products.find(p => p.id === id);
  const catOf = id => DATA.cats.find(c => c.id === id);
  const hexOf = n => DATA.HEX[n] || '#666';
  const priceOf = p => (p.price != null && CFG.mostrarPrecos) ? 'R$ ' + p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 'Sob consulta';
  const isFav = id => store.fav.includes(id);

  function toast(msg) {
    const t = $('#toast');
    t.innerHTML = msg;
    t.hidden = false;
    clearTimeout(toast._h);
    toast._h = setTimeout(() => { t.hidden = true; }, 2400);
  }

  function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
  function loadVal(key, dflt) { try { return JSON.parse(localStorage.getItem(key)) || dflt; } catch (e) { return dflt; } }

  const store = { cart: loadVal('mp_cart_v1', []), fav: loadVal('mp_fav_v1', []), q: '', sort: 'rel', size: '', alt: '', fab: '', cor: '', sel: {} };

  /* ---------- carrinho ---------- */
  function cartCount() { return store.cart.reduce((a, i) => a + i.qty, 0); }
  function addToCart(p, sel, qty) {
    const vid = sel.join(' · ');
    const found = store.cart.find(i => i.pid === p.id && i.vid === vid);
    if (found) found.qty += qty; else store.cart.push({ pid: p.id, name: p.name, vid, qty });
    save('mp_cart_v1', store.cart);
    updateBadges();
    renderCart();
    openDrawer();
    toast('Adicionado ao orçamento ' + I.check);
  }
  function selDefault(p) {
    const s = { cor: p.colors && p.colors[0] ? p.colors[0].n : '', tamanho: p.sizes ? p.sizes[0] : '', altura: p.heights ? p.heights[0] : '', tecido: p.fabrics ? p.fabrics[0] : '', opt: (p.opts || []).map(o => o.v[0]) };
    store.sel[p.id] = s;
    return s;
  }
  function selLines(p, s) {
    const l = [];
    if (s.cor) l.push(s.cor);
    if (s.tamanho && s.tamanho !== 'Padrão') l.push(s.tamanho + (DATA.dims[s.tamanho] ? ' ' + DATA.dims[s.tamanho] : ''));
    if (s.altura) l.push(s.altura);
    if (s.tecido) l.push('Tecido ' + s.tecido);
    (s.opt || []).forEach(o => o && l.push(o));
    return l;
  }

  function waLink(msg) {
    return 'https://wa.me/' + String(CFG.whatsapp).replace(/\D/g, '') + '?text=' + encodeURIComponent(msg);
  }
  function cartMsg(name) {
    const l = [CFG.saudacao, ''];
    let total = 0, temPreco = CFG.mostrarPrecos;
    store.cart.forEach(i => {
      const p = byId(i.pid);
      let prec = p && p.price != null && CFG.mostrarPrecos ? ' (R$ ' + brl(p.price * i.qty) + ')' : '';
      if (!prec) temPreco = false; else total += p.price * i.qty;
      l.push(`• ${i.qty}× ${i.name}${i.vid ? ' — ' + i.vid : ''}${prec}`);
    });
    if (temPreco && store.cart.length) l.push('', `Total estimado: R$ ${brl(total)} (frete acertado com a loja)`);
    if (name) l.push('', `Nome: ${name}`);
    return l.join('\n');
  }

  /* total do orçamento — só quando TODOS os itens têm preço cadastrado */
  function cartTotal() {
    if (!CFG.mostrarPrecos || !store.cart.length) return null;
    let t = 0;
    for (const i of store.cart) {
      const p = byId(i.pid);
      if (!p || p.price == null) return null;
      t += p.price * i.qty;
    }
    return t;
  }

  /* valor formatado em reais (usado nas mensagens e no checkout) */
  function brl(n) { return (Number(n) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }

  /* ---------- pagamento online (config.pagamentos) ----------
     Botões aparecem só com link/chave configurados em js/config.js. */
  function renderPay() {
    const box = $('#drawerPay');
    const pay = CFG.pagamentos || {};
    const ck = pay.checkout || {};
    const row = [];
    if (ck.ativo) row.push(`<a class="btn btn-primary full" href="#/pagamento">${I.cart} Finalizar compra — pagar no site</a>`);
    if (pay.link) row.push(`<a class="btn btn-mp full" href="${esc(pay.link)}" target="_blank" rel="noopener">${I.card} Pagar online — Mercado Pago</a>`);
    if (pay.pix) row.push(`<button class="btn btn-ghost full" data-action="copy-pix">${I.copy} Copiar chave Pix</button>`);
    if (!row.length) { box.hidden = true; return; }
    row.unshift(`<p class="small-note muted">${ck.ativo
      ? 'Fechou o orçamento? Pague aqui mesmo na loja — Pix ou cartão em até 12x.'
      : pay.link
        ? 'Fechou o orçamento? Pague por aqui — Pix ou cartão em até 12x pelo Mercado Pago.'
        : 'Fechou o orçamento? Pague direto no Pix — copie a chave abaixo.'}</p>`);
    box.innerHTML = row.join('');
    box.hidden = false;
    const fp = $('#footPay');
    if (fp) {
      fp.hidden = false;
      fp.textContent = ck.ativo
        ? 'Pague online aqui mesmo no site — Pix ou cartão em até 12x.'
        : 'Pague online com Pix ou cartão em até 12x pelo Mercado Pago.';
    }
  }

  /* ---------- cabeçalho ---------- */
  function updateBadges() {
    $('#cartCount').hidden = !cartCount();
    $('#cartCount').textContent = cartCount() || '';
    $('#favCount').hidden = !store.fav.length;
    $('#favCount').textContent = store.fav.length || '';
  }

  /* ---------- cartão de produto ---------- */
  function card(p) {
    const feats = (p.feats || []).slice(0, 3).map(f => `<span class="chip">${esc(f)}</span>`).join('');
    const cimg = p.colors && p.colors[0] && p.colors[0].img;
    const kimg = cimg || p.imgs[0];
    return `<article class="card">
      <a class="card-media ${dkC(kimg)}" href="#/p/${p.id}" aria-label="${esc(p.name)}">
        <img src="${P + (cimg || p.imgs[0])}.jpg" alt="${esc(p.name)}" loading="lazy">
        <span class="heart ${isFav(p.id) ? 'on' : ''}" data-action="fav" data-id="${p.id}" aria-label="Favoritar">${I.heart(isFav(p.id))}</span>
      </a>
      <div class="card-body">
        <a class="card-name" href="#/p/${p.id}">${esc(p.name)}</a>
        <p class="card-tag">${esc(p.tag || '')}</p>
        <p class="price">${priceOf(p)}</p>
      </div>
      <button class="add" data-action="add" data-id="${p.id}">${I.plus}<span>Adicionar</span></button>
    </article>`;
  }
  function grid(list) {
    return `<div class="grid">${list.map(card).join('')}</div>`;
  }

  /* ---------- Home ---------- */
  function viewHome() {
    const H = DATA.home;
    const tiles = DATA.cats.map(c => `
      <a class="tile" href="#/c/${c.id}">
        <img src="${P + c.img}.jpg" alt="" loading="lazy">
        <span class="tile-label"><strong>${esc(c.nome)}</strong><small>${esc(c.desc)}</small></span>
      </a>`).join('');
    const feat = DATA.home.featured.map(id => byId(id)).filter(Boolean).map(card).join('');
    return `
      ${renderNav('todos')}
      <section class="hero">
        <img class="hero-img" src="${P + H.hero.img}.jpg" alt="">
        <div class="hero-in">
          <p class="eyebrow">${esc(H.hero.kicker)}</p>
          <h1>${esc(H.hero.title)}</h1>
          <p class="hero-sub">${esc(H.hero.sub)}</p>
          <div class="hero-cta">
            <a class="btn btn-primary" href="${H.hero.ctaHref}">${esc(H.hero.cta)}</a>
            <a class="btn btn-wa" target="_blank" rel="noopener" href="${waLink(CFG.saudacao)}">${I.wa} Falar no WhatsApp</a>
          </div>
        </div>
      </section>
      <section class="sec">
        <div class="sec-head"><h2>Navegue por categoria</h2><a class="sec-link" href="#/c/todos">${I.arrow}</a></div>
        <div class="tiles">${tiles}</div>
      </section>
      <section class="sec vacuo">
        <div class="vacuo-txt">
          <p class="eyebrow accent">${esc(H.vacuo.kicker)}</p>
          <h2>${esc(H.vacuo.title)}</h2>
          <p>${esc(H.vacuo.sub)}</p>
          <div class="chips">${H.vacuo.chips.map(c => `<span class="chip big">${esc(c)}</span>`).join('')}</div>
          <a class="btn btn-primary" href="${H.vacuo.ctaHref}">${esc(H.vacuo.cta)}</a>
        </div>
        <div class="vacuo-img"><img src="${P + H.vacuo.img}.jpg" alt="" loading="lazy"></div>
      </section>
      <section class="sec">
        <div class="sec-head"><h2>Queridinhos do catálogo</h2></div>
        <div class="grid">${feat}</div>
      </section>
      <section class="sec steps">
        <div class="step"><span>1</span><h3>Escolha e personalize</h3><p>Selecione cor, tamanho, altura e tecido na página do produto.</p></div>
        <div class="step"><span>2</span><h3>Monte o orçamento</h3><p>Adicione os itens ao carrinho e confira a lista no final.</p></div>
        <div class="step"><span>3</span><h3>Peça no WhatsApp</h3><p>A lista segue pronta para o atendimento — respondemos com preço e prazo.</p></div>
      </section>`;
  }

  /* ---------- catálogo ---------- */
  function navChips(active) {
    return `<div class="navchips" role="tablist">
      <a class="nchip ${active === 'todos' ? 'on' : ''}" href="#/c/todos">Todos</a>
      ${DATA.cats.map(c => `<a class="nchip ${active === c.id ? 'on' : ''}" href="#/c/${c.id}">${esc(c.nome)}</a>`).join('')}
    </div>`;
  }
  function renderNav(active) {
    return `<div class="catalog-head">
      <div class="catalog-title"><h2>${active === 'todos' ? 'Catálogo completo' : esc(catOf(active).nome)}</h2>
      <p class="muted">${active === 'todos' ? 'Toda a linha Multiplus Colchões' : esc(catOf(active).desc || '')}</p></div>
    </div>` + navChips(active);
  }

  const SORTS = [['rel', 'Relevância'], ['az', 'Nome A–Z']];

  function viewCatalog(active) {
    const list = filterList();
    const groups = filterGroups();
    return `
      ${renderNav(active)}
      <div class="controls">
        <label class="search"><span class="s-icon">${I.search}</span>
          <input id="q" type="search" placeholder="Buscar no catálogo…" value="${esc(store.q)}" autocomplete="off"></label>
        <select id="sort" aria-label="Ordenar">${SORTS.map(s => `<option value="${s[0]}" ${store.sort === s[0] ? 'selected' : ''}>${s[1]}</option>`).join('')}</select>
        <button class="btn btn-ghost show-filters" data-action="filters">${I.filter} Filtros${activeFilterCount() ? ' · ' + activeFilterCount() : ''}</button>
      </div>
      <div class="catalog" id="catalogWrap">
        <aside class="filters" id="filtersPanel" ${store.panel ? '' : 'hidden'}>
          <div class="f-head"><strong>Filtrar</strong><button class="linkbtn" data-action="clear-filters">Limpar tudo</button></div>
          ${groups}
        </aside>
        <div class="catalog-main" id="catalogResults">
          ${list.length ? grid(list) : emptyState()}
          <p class="results-count muted">${list.length} ${list.length === 1 ? 'produto' : 'produtos'}</p>
        </div>
      </div>
    `;
  }

  function activeFilterCount() {
    return [store.size, store.alt, store.fab, store.cor].filter(Boolean).length + (store.q ? 1 : 0);
  }

  function emptyState() {
    return `<div class="empty">
      <p>Nenhum produto com esses filtros.</p>
      <button class="btn btn-ghost" data-action="clear-filters">Limpar filtros</button>
    </div>`;
  }

  function chipRow(label, values, kind) {
    if (!values.length) return '';
    return `<div class="f-group"><span class="f-label">${esc(label)}</span><div class="f-chips">` +
      values.map(v => `<button class="fchip ${String(store[kind]) === v ? 'on' : ''}" data-action="set-${kind}" data-v="${esc(v)}">${kind === 'cor' ? `<i style="background:${hexOf(v)}"></i>` : ''}${esc(v)}</button>`).join('') +
      '</div></div>';
  }

  function filterGroups() {
    const ps = currentCatProducts();
    const uniq = a => [...new Set(a.filter(Boolean))];
    let sizes = [], alts = [], fabs = [], cors = [];
    ps.forEach(p => {
      (p.sizes || []).forEach(s => sizes.push(s));
      (p.heights || []).forEach(h => alts.push(h));
      (p.fabrics || []).forEach(f => fabs.push(f));
      (p.colors || []).forEach(c => cors.push(c.n));
    });
    alts = uniq(alts).sort((a, b) => (+(a.match(/\d+/) || [0])[0]) - (+(b.match(/\d+/) || [0])[0]));
    return [
      chipRow('Tamanho', uniq(sizes).filter(s => s !== 'Padrão').sort(), 'size'),
      chipRow('Altura', alts, 'alt'),
      chipRow('Tecido', uniq(fabs), 'fab'),
      `<div class="f-group"><span class="f-label">Cor</span><div class="f-chips">` +
      uniq(cors).sort().map(c => `<button class="fchip ${store.cor === c ? 'on' : ''}" data-action="set-cor" data-v="${esc(c)}"><i style="background:${hexOf(c)}"></i>${esc(c)}</button>`).join('') +
      '</div></div>',
    ].join('');
  }

  function currentCatProducts() {
    const m = route.match(/^#\/c\/(.+)$/);
    const cat = m ? m[1] : 'todos';
    return cat === 'todos' ? DATA.products : DATA.products.filter(p => p.cat === cat);
  }

  function filterList() {
    let ps = currentCatProducts();
    if (store.size) ps = ps.filter(p => (p.sizes || []).includes(store.size) || (store.size === 'Padrão' && (!p.sizes || !p.sizes.length)));
    if (store.alt) ps = ps.filter(p => (p.heights || []).includes(store.alt));
    if (store.fab) ps = ps.filter(p => (p.fabrics || []).includes(store.fab));
    if (store.cor) ps = ps.filter(p => (p.colors || []).some(c => c.n === store.cor));
    if (store.q) {
      const q = store.q.toLowerCase();
      ps = ps.filter(p => [p.name, p.tag, p.lead, (p.feats || []).join(' ')].join(' ').toLowerCase().includes(q));
    }
    ps = ps.slice();
    if (store.sort === 'az') ps.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    else ps.sort((a, b) => (a.rel || 9) - (b.rel || 9));
    return ps;
  }

  /* ---------- produto ---------- */
  function colorSwatches(p) {
    if (!p.colors || !p.colors.length) return '';
    return `<div class="f-group"><span class="f-label">Cor</span><div class="swatches">` +
      p.colors.map((c, i) => `<button class="sw ${store.sel[p.id].cor === c.n ? 'on' : ''}" data-action="sel-cor" data-i="${i}" aria-label="${esc(c.n)}">
        <i style="background:${hexOf(c.n)}"></i><span>${esc(c.n)}</span></button>`).join('') + '</div></div>';
  }
  function optRow(label, values, kind, cur) {
    return `<div class="f-group"><span class="f-label">${esc(label)}</span><div class="f-chips">` +
      values.map(v => `<button class="fchip ${cur === v ? 'on' : ''}" data-action="${kind}" data-v="${esc(v)}">${esc(v)}</button>`).join('') +
      '</div></div>';
  }

  function mainImgFor(p) {
    const s = store.sel[p.id];
    const c = (p.colors || []).find(c => c.n === s.cor && c.img);
    return c ? c.img : p.imgs[0];
  }

  function viewProduct(id) {
    const p = byId(id);
    if (!p) return viewHome();
    const s = store.sel[p.id] || selDefault(p);
    const main = mainImgFor(p);
    const dimsOf = s.tamanho && (DATA.dims[s.tamanho] || DATA.headDims[s.tamanho]) ? `<span class="muted">${DATA.dims[s.tamanho] || DATA.headDims[s.tamanho]}</span>` : '';
    const blocks = (p.blocks || []).map(b => `
      <div class="block"><h3>${esc(b.h)}</h3>
        ${b.items ? '<ul>' + b.items.map(i => `<li>${esc(i)}</li>`).join('') + '</ul>' : ''}
        ${b.table ? '<table class="tbl"><tbody>' + b.table.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('') + '</tbody></table>' : ''}
      </div>`).join('');
    const cats = DATA.products.filter(x => x.cat === p.cat && x.id !== p.id && (x.rel || 9) < (p.rel || 9)).slice(0, 3);
    const featchips = (p.feats || []).map(f => `<span class="chip big">${esc(f)}</span>`).join('');
    return `
      <div class="crumbs"><a href="#/c/todos">Catálogo</a> › <a href="#/c/${p.cat}">${esc(catOf(p.cat).nome)}</a> › <span>${esc(p.name)}</span></div>
      <div class="product">
        <div class="gallery">
          <div class="g-main ${dkC(main)}"><img id="gMain" src="${P + main}.jpg" alt="${esc(p.name)}"></div>
          <div class="g-thumbs">${p.imgs.map(im => `<button class="thumb ${main === im ? 'on ' : ''}${dkC(im)}" data-action="thumb-img" data-src="${im}"><img src="${P + im}.jpg" alt="" loading="lazy"></button>`).join('')}</div>
        </div>
        <div class="buybox">
          <div class="badges">${(p.badges || []).map(b => `<span class="badge">${esc(b)}</span>`).join('')}</div>
          <h1>${esc(p.name)}</h1>
          <p class="tag muted">${esc(p.tag || '')}</p>
          <p class="price big">${priceOf(p)}</p>
          <p class="lead">${esc(p.lead || '')}</p>
          ${colorSwatches(p)}
          ${p.sizes && p.sizes.length ? optRow('Tamanho', p.sizes, 'sel-size', s.tamanho) : ''}
          ${p.heights && p.heights.length > 1 ? optRow('Altura', p.heights, 'sel-alt', s.altura) : ''}
          ${p.fabrics && p.fabrics.length > 1 ? optRow('Tecido', p.fabrics, 'sel-fab', s.tecido) : ''}
          ${(p.opts || []).map((o, i) => optRow(o.k, o.v, 'sel-opt', s.opt[i])).join('')}
          ${dimsOf ? `<p class="muted dims">${dimsOf}</p>` : ''}
          <div class="buyrow">
            <div class="qty"><button data-action="qty-p" aria-label="Diminuir">−</button><output id="qtyOut">1</output><button data-action="qty-m" aria-label="Aumentar">＋</button></div>
            <button class="btn btn-primary grow" data-action="buy">${I.cart} Adicionar ao orçamento</button>
          </div>
          <a class="btn btn-wa full" target="_blank" rel="noopener" href="${waLink(`${CFG.saudacao}\n\n• ${p.name}${selLines(p, s).length ? ' — ' + selLines(p, s).join(' · ') : ''}`)}">${I.wa} Perguntar no WhatsApp</a>
          ${featchips ? `<div class="chips">${featchips}</div>` : ''}
          <div class="about">${blocks ? '' : ''}${p.about ? `<p>${esc(p.about)}</p>` : ''}</div>
          ${blocks}
          <div class="note muted">* Imagens meramente ilustrativas. Cores, tecidos e medidas disponíveis sob confirmação com o fabricante.</div>
        </div>
      </div>
      ${cats.length ? `<section class="sec"><div class="sec-head"><h2>Também em ${esc(catOf(p.cat).nome)}</h2></div><div class="grid">${cats.map(card).join('')}</div></section>` : ''}`;
  }

  /* ---------- favoritos ---------- */
  function viewFav() {
    const list = store.fav.map(byId).filter(Boolean);
    return `
      <div class="catalog-head"><div class="catalog-title"><h2>Favoritos</h2>
      <p class="muted">Itens que você marcou para ver depois — ${list.length ? list.length : 'nenhum ainda'}.</p></div></div>
      ${list.length ? grid(list) : `<div class="empty"><p>Nenhum favorito ainda. Toque no ${I.heart(true)} nos produtos que você quiser revisitar.</p></div>`}`;
  }

  /* ---------- checkout dentro do site (Vindi na Cloudflare) ---------- */
  let payTimer = 0;
  const PAY_LAST = 'mp_pay_last_v1';
  function digitos(s) { return String(s || '').replace(/\D/g, ''); }
  function brlParse(s) { const v = parseFloat(String(s || '').replace(/[^\d,\.]/g, '').replace(/\./g, '').replace(',', '.')); return isFinite(v) ? v : 0; }

  function docValido(d) { /* CPF ou CNPJ, com dígitos verificadores */
    d = digitos(d);
    if (d.length === 11) {
      if (/^(\d)\1+$/.test(d)) return false;
      const calc = n => { let s = 0; for (let i = 0; i < n; i++) s += +d[i] * (n + 1 - i); const r = 11 - (s % 11); return r > 9 ? 0 : r; };
      return calc(9) === +d[9] && calc(10) === +d[10];
    }
    if (d.length === 14) {
      if (/^(\d)\1+$/.test(d)) return false;
      const p1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      const p2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      const calc = (P, n) => { let s = 0; for (let i = 0; i < n; i++) s += +d[i] * P[i]; const r = 11 - (s % 11); return r > 9 ? 0 : r; };
      return calc(p1, 12) === +d[12] && calc(p2, 13) === +d[13];
    }
    return false;
  }

  function viewCheckout() {
    const ck = (CFG.pagamentos || {}).checkout || {};
    if (!ck.ativo) {
      return `<div class="empty"><p>O pagamento online está sendo preparado — no momento a loja opera por orçamento.</p>
        <p class="muted">Envie sua lista pelo WhatsApp que combinamos preço, frete e prazo por lá.</p>
        <a class="btn btn-wa" href="${waLink(CFG.saudacao)}">${I.wa} Falar no WhatsApp</a>
        <p class="small-note muted" style="margin-top:12px">Para ativar: guia “Checkout na própria loja (Vindi)” no README.</p></div>`;
    }
    const itemizado = cartTotal() != null && store.cart.length;
    const tot = itemizado ? cartTotal() : 0;
    const sinal = ck.sinalFixo > 0 && !itemizado ? ck.sinalFixo : 0;
    const resumo = itemizado
      ? `<div class="resumo"><h3 class="p-sect">Seu orçamento</h3>` +
        store.cart.map(i => { const p = byId(i.pid); return `<div class="r-item"><span>${i.qty}× ${esc(i.name)}${i.vid ? ' <small class="muted">' + esc(i.vid) + '</small>' : ''}</span><span>R$ ${brl(p.price * i.qty)}</span></div>`; }).join('') +
        `<div class="r-item r-tot"><span>Total</span><span>R$ ${brl(tot)}</span></div>
         <p class="small-note muted">Frete e condições acertados com a loja pelo WhatsApp.</p></div>`
      : (sinal ? `<div class="resumo"><div class="r-item r-tot"><span>Sinal da compra</span><span>R$ ${brl(sinal)}</span></div></div>` : '') +
      `<label class="fld">Valor a pagar${sinal ? '' : ' (o valor acertado no WhatsApp)'} <input id="pValor" inputmode="decimal" autocomplete="off" placeholder="ex.: 1.250,00"${sinal ? ` value="${brl(sinal)}"` : ''}></label>
       <p class="small-note muted">Não sabe o valor? Envie a lista no WhatsApp e volte aqui depois de acertar.</p>`;
    let parcOpts = '';
    for (let k = 1; k <= Math.min(12, ck.parcelasMax || 12); k++) parcOpts += `<option value="${k}">${k === 1 ? '1× à vista' : k + '×'}</option>`;
    return `
      <div class="crumbs"><a href="#/">Catálogo</a> › <span>Pagar online</span></div>
      <section class="paywrap">
        <div class="paybox">
          <h1>Pagar online</h1>
          <p class="muted">Pix com aprovação na hora, ou cartão de crédito em até ${Math.min(12, ck.parcelasMax || 12)}× — processado pela Vindi, aqui mesmo na loja.</p>
          ${resumo}
          <form id="pForm" novalidate>
            <h3 class="p-sect">Seus dados</h3>
            <div class="fgrid">
              <label class="fld wide">Nome completo<input id="pNome" autocomplete="name"></label>
              <label class="fld">E-mail<input id="pEmail" type="email" autocomplete="email"></label>
              <label class="fld">CPF ou CNPJ<input id="pDoc" inputmode="numeric" autocomplete="off" maxlength="18"></label>
              <label class="fld">WhatsApp de contato<input id="pTel" inputmode="tel" autocomplete="tel"></label>
              <h3 class="p-sect wide-sect">Endereço de faturamento</h3>
              <label class="fld">CEP<input id="pCep" inputmode="numeric" autocomplete="postal-code" maxlength="9"></label>
              <label class="fld">Rua<input id="pRua" autocomplete="street-address"></label>
              <label class="fld">Número<input id="pNumero" inputmode="numeric" autocomplete="off"></label>
              <label class="fld">Complemento (opcional)<input id="pCompl" autocomplete="off"></label>
              <label class="fld">Bairro<input id="pBairro" autocomplete="off"></label>
              <label class="fld">Cidade<input id="pCidade" autocomplete="off"></label>
              <label class="fld" data-min><select id="pUf" autocomplete="address-level1">${['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map(u => `<option${u === 'SP' ? ' selected' : ''}>${u}</option>`).join('')}</select></label>
            </div>
            <h3 class="p-sect">Forma de pagamento</h3>
            <div class="mth-row">
              <button type="button" class="mth on" data-action="sel-met" data-m="pix">${I.check}<strong>Pix</strong><small>Aprovação instantânea</small></button>
              <button type="button" class="mth" data-action="sel-met" data-m="cartao">${I.card}<strong>Cartão</strong><small>Em até ${Math.min(12, ck.parcelasMax || 12)}×</small></button>
            </div>
            <div id="pParcWrap" class="fld" hidden><span>Parcelas</span><select id="pParcelas">${parcOpts}</select></div>
            <div id="pCardBox" hidden class="cardbox">
              <div class="fgrid">
                <label class="fld wide">Nome impresso no cartão<input id="pCardNome" autocomplete="cc-name"></label>
                <label class="fld">Número do cartão<input id="pCardNum" inputmode="numeric" autocomplete="cc-number" maxlength="19"></label>
                <label class="fld">Validade (MM/AA)<input id="pCardVal" inputmode="numeric" autocomplete="cc-exp" maxlength="5" placeholder="MM/AA"></label>
                <label class="fld">CVV<input id="pCardCvv" inputmode="numeric" autocomplete="cc-csc" maxlength="4"></label>
              </div>
              <p class="small-note muted">Os dados do cartão vão direto para a Vindi (PCI DSS) — a loja não guarda nada.</p>
            </div>
            <div id="pFormErr" class="formerr" hidden></div>
            <button class="btn btn-primary full" id="pGo" type="submit">Continuar para o pagamento</button>
          </form>
        </div>
      </section>`;
  }

  function coletarForm() {
    const cfg = (CFG.pagamentos || {}).checkout || {};
    const v = id => { const el = $(id); return el ? el.value.trim() : ''; };
    const itemizado = cartTotal() != null && store.cart.length;
    const valor = itemizado ? cartTotal() : brlParse(v('#pValor')) || cfg.sinalFixo;
    if (valor < 5) return { erro: 'Informe o valor a pagar (mínimo R$ 5,00).' };
    if (digitos(v('#pDoc')).length && !docValido(v('#pDoc'))) return { erro: 'CPF/CNPJ inválido — confira os números.' };
    const body = {
      valor, metodo: store.payMet || 'pix', parcelas: +(v('#pParcelas') || 1),
      descricao: store.cart.length ? ('Orçamento — ' + store.cart.map(i => i.qty + '× ' + i.name).join(', ')).slice(0, 200) : 'Cobrança acertada no WhatsApp',
      cliente: {
        nome: v('#pNome'), email: v('#pEmail'), doc: v('#pDoc'), telefone: digitos(v('#pTel')),
        cep: digitos(v('#pCep')), rua: v('#pRua'), numero: v('#pNumero'), complemento: v('#pCompl'),
        bairro: v('#pBairro'), cidade: v('#pCidade'), uf: v('#pUf'),
      },
    };
    if (!body.cliente.nome) return { erro: 'Informe seu nome completo.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.cliente.email)) return { erro: 'Informe um e-mail válido (a Vindi usa para o comprovante).' };
    if (!docValido(body.cliente.doc) || !body.cliente.rua || !body.cliente.numero || !body.cliente.cep) return { erro: 'Preencha CPF/CNPJ (válido), endereço, número e CEP.' };
    if (body.metodo === 'cartao') {
      const c = { nome: v('#pCardNome'), numero: v('#pCardNum'), validade: v('#pCardVal'), cvv: v('#pCardCvv') };
      if (!c.nome) return { erro: 'Informe o nome impresso no cartão.' };
      if (!/^\d{12,19}$/.test(digitos(c.numero))) return { erro: 'Número do cartão inválido.' };
      const val = digitos(c.validade);
      if (val.length !== 4 || +val.slice(0, 2) < 1 || +val.slice(0, 2) > 12) return { erro: 'Validade do cartão inválida (MM/AA).' };
      if (!/^\d{3,4}$/.test(digitos(c.cvv))) return { erro: 'CVV inválido.' };
      body.cartao = c;
    }
    return { body };
  }

  function formErr(msg) {
    const e = $('#pFormErr');
    if (e) { e.textContent = msg; e.hidden = false; }
  }

  async function paySend(body) {
    const cfg = (CFG.pagamentos || {}).checkout;
    const btn = $('#pGo');
    if (btn) { btn.disabled = true; btn.textContent = 'Processando…'; }
    let r = null;
    if (cfg.modoTeste) {
      r = await simular(body);
    } else if (location.protocol === 'file:') {
      r = { ok: false, msg: 'O checkout funciona no site publicado (Cloudflare Pages) — abra pelo endereço da loja.' };
    } else {
      try {
        const resp = await fetch('/api/vindi/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        r = await resp.json().catch(() => null);
      } catch (e) { r = null; }
    }
    if (btn) { btn.disabled = false; btn.textContent = 'Continuar para o pagamento'; }
    if (!r || !r.ok) { formErr(r && r.msg ? r.msg : 'Não foi possível criar a cobrança. Fale com a loja ou pague pela chave Pix.'); return; }
    r.t = Date.now();
    save(PAY_LAST, r);
    location.hash = '#/pagamento/' + r.cobranca.id;
  }

  function simular(body) { /* simulação local do servidor (modoTeste) */
    const metodo = body.metodo === 'cartao' ? 'cartao' : 'pix';
    return new Promise(res => setTimeout(() => res({
      ok: true,
      cobranca: {
        id: 'mock-' + Date.now() + (metodo === 'cartao' ? '-c' : ''),
        status: metodo === 'cartao' ? 'paid' : 'pending',
        amount: body.valor, metodo,
        pix: metodo === 'pix' ? { copia: '00020126TESTE-SIMULACAO-SEM-QR-PIX-9' + String(Date.now()).slice(-8), img: '', url: '' } : null,
        print_url: '',
      },
    }), 600));
  }
  function simStatus(id) {
    const ts = Number(id.split('-')[1]) || 0;
    return { ok: true, status: id.endsWith('-c') || (Date.now() - ts) > 6000 ? 'paid' : 'pending' };
  }

  async function payStatus(id) {
    const cfg = (CFG.pagamentos || {}).checkout;
    if (cfg && cfg.modoTeste) return simStatus(id);
    try {
      const r = await fetch('/api/vindi/status?charge_id=' + encodeURIComponent(id));
      return await r.json().catch(() => null);
    } catch (e) { return null; }
  }

  function startPayPoll(id) {
    clearTimeout(payTimer);
    const tick = async () => {
      if (!$('#payState')) return; /* usuário saiu da tela */
      const j = await payStatus(id);
      if (j && j.ok) {
        const l = loadVal(PAY_LAST, null) || {};
        if (!l.cobranca) return;
        if (l.status !== j.status) { l.status = j.status; save(PAY_LAST, l); pintaStatus(j.status); }
        else pintaStatus(l.status);
        if (j.status !== 'pending') return;
      }
      payTimer = setTimeout(tick, 5000);
    };
    payTimer = setTimeout(tick, 1500);
  }

  function pintaStatus(status) {
    const box = $('#payState');
    if (!box) return;
    const l = loadVal(PAY_LAST, null);
    if (!l || !l.cobranca) return;
    const c = l.cobranca;
    const ref = `Referência nº ${esc(String(c.id))}${c.amount ? ' · R$ ' + brl(c.amount) : ''}`;
    if (status === 'paid') {
      box.innerHTML = `
        <div class="pay-ic pay-ok">${I.check}</div>
        <h1>Pagamento confirmado</h1>
        <p class="muted">${ref}. A loja recebe a confirmação e combina a entrega com você.</p>
        <a class="btn btn-wa full" target="_blank" rel="noopener" href="${waLink('Olá! Paguei pelo site.\n\nReferência: #' + c.id + (c.amount ? ' — R$ ' + brl(c.amount) : ''))}">${I.wa} Avisar a loja no WhatsApp</a>
        <a class="btn btn-ghost full" href="#/">Voltar ao catálogo</a>`;
      return;
    }
    if (status === 'pending') {
      const pix = c.pix || {};
      const copia = String(pix.copia || '');
      box.innerHTML = `
        <div class="pay-ic pay-pend"><span class="dot"></span></div>
        <h1>Escaneie o Pix</h1>
        <p class="muted">Abra o app do banco, escaneie ou cole o código — a tela atualiza sozinha quando o pagamento cair.</p>
        ${pix.img ? `<img class="qr" src="${esc(pix.img)}" alt="QR Code Pix">` : ''}
        ${copia ? `<label class="fld">Pix copia e cola<input readonly id="pixCode" value="${esc(copia)}"></label>
        <button class="btn btn-primary full" data-action="copy-pix-code" data-code="${esc(copia)}">${I.copy} Copiar código Pix</button>` : ''}
        ${(pix.url || c.print_url) ? `<a class="btn btn-ghost full" target="_blank" rel="noopener" href="${esc(pix.url || c.print_url)}">Abrir a fatura do Pix</a>` : ''}
        <p class="small-note muted">${ref}. Se fechar a página o Pix continua válido — reabra pelo mesmo link.</p>`;
      return;
    }
    box.innerHTML = `
      <div class="pay-ic pay-bad">${I.close}</div>
      <h1>Pagamento não concluído</h1>
      <p class="muted">${esc(status === 'fraud_review' ? 'Seu pagamento está em análise — a loja avisa você em seguida.' : 'Expirou ou foi cancelado, sem cobrança.')}</p>
      <a class="btn btn-primary full" href="#/pagamento">Tentar novamente</a>
      <a class="btn btn-wa full" href="${waLink(CFG.saudacao)}">${I.wa} Falar com a loja</a>`;
  }

  /* ---------- roteador ---------- */
  let route = '';
  let lastRoute = null;
  function parse() {
    route = location.hash || '#/';
    const mC = route.match(/^#\/c\/(.+)$/), mP = route.match(/^#\/p\/(.+)$/), mS = route.match(/^#\/pagamento\/([\w-]+)$/);
    if (mS) return ['stat', mS[1]];
    if (route === '#/pagamento') return ['pag'];
    if (mP) return ['prod', mP[1]];
    if (mC) return ['cat', mC[1] === 'todos' ? 'todos' : (catOf(mC[1]) ? mC[1] : 'todos')];
    if (route === '#/fav') return ['fav'];
    return ['home'];
  }

  function render() {
    clearTimeout(payTimer);
    closeDrawer(false);
    const [kind, arg] = parse();
    const v = $('#view');
    const same = lastRoute === route;
    const y = same ? window.scrollY : 0;
    if (!same) { store.panel = false; }
    if (kind === 'home') v.innerHTML = viewHome();
    else if (kind === 'cat') { v.innerHTML = viewCatalog(arg); navState(arg); }
    else if (kind === 'prod') v.innerHTML = viewProduct(arg);
    else if (kind === 'pag') {
      v.innerHTML = viewCheckout();
      const f = $('#pForm');
      if (f) f.addEventListener('submit', e => { e.preventDefault(); const r = coletarForm(); if (r.erro) formErr(r.erro); else paySend(r.body); });
    }
    else if (kind === 'stat') {
      const l = loadVal(PAY_LAST, null);
      const st = (l && l.cobranca && String(l.cobranca.id) === arg) ? (l.status || l.cobranca.status || 'pending') : null;
      v.innerHTML = '<div class="crumbs"><a href="#/">Catálogo</a> › <span>Pagamento</span></div><section class="paywrap"><div class="paybox" id="payState"></div></section>';
      if (!st) $('#payState').innerHTML = '<div class="empty"><p>Recibo não encontrado neste navegador.</p><a class="btn btn-primary full" href="#/pagamento">Ir para o pagamento</a></div>';
      else { pintaStatus(st); if (st === 'pending') startPayPoll(arg); }
    }
    else v.innerHTML = viewFav();
    updateBadges();
    window.scrollTo({ top: y });
    v.hidden = false;
    lastRoute = route;
  }

  function navState(cat) {
    const q = $('#q'), sort = $('#sort');
    if (q) q.addEventListener('input', () => {
      store.q = q.value;
      $('#catalogResults').innerHTML = (filterList().length ? grid(filterList()) : emptyState());
    });
    if (sort) sort.addEventListener('change', () => { store.sort = sort.value; render(); });
    updateBadges();
  }

  /* ---------- drawer carrinho ---------- */
  function renderCart() {
    const d = $('#drawerList');
    if (!store.cart.length) {
      d.innerHTML = `<div class="empty small"><p>Seu orçamento está vazio.</p><a class="btn btn-primary" href="#/c/todos" data-action="close-drawer">Ver o catálogo</a></div>`;
    } else {
      d.innerHTML = store.cart.map((i, k) => {
        const p = byId(i.pid);
        return `<div class="citem">
          <img class="${p ? dkC(p.imgs[0]) : ''}" src="${P + ((p && p.imgs[0]) || '')}.jpg" alt="" loading="lazy">
          <div class="cinfo"><strong>${esc(i.name)}</strong><span class="muted">${esc(i.vid)}</span>
            <div class="crow"><div class="qty sm"><button data-action="dec" data-i="${k}" aria-label="Diminuir">${I.minus}</button><span>${i.qty}</span><button data-action="inc" data-i="${k}" aria-label="Aumentar">${I.plus}</button></div>
            <button class="iconbtn sm" data-action="rm" data-i="${k}" aria-label="Remover">${I.trash}</button></div>
          </div></div>`;
      }).join('');
    }
    $('#drawerFoot').hidden = !store.cart.length;
    const dT = $('#drawerTotal');
    const tot = cartTotal();
    if (dT) {
      dT.hidden = tot == null;
      if (tot != null) dT.innerHTML = `<span>Total estimado: <span class="dt-val">R$ ${brl(tot)}</span></span><small class="muted">frete acertado com a loja</small>`;
    }
    const ck = $('#checkoutLink');
    if (ck) ck.href = waLink(cartMsg(''));
    updateBadges();
  }
  function openDrawer() {
    $('#overlay').hidden = false;
    $('#cart').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer(restoreScroll = true) {
    $('#overlay').hidden = true;
    $('#cart').classList.remove('open');
    if (restoreScroll) document.body.style.overflow = '';
  }

  /* ---------- eventos globais ---------- */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    const a = b.dataset.action;
    const id = b.dataset.id;

    if (a === 'fav') {
      e.preventDefault();
      const i = store.fav.indexOf(id);
      if (i >= 0) { store.fav.splice(i, 1); b.classList.remove('on'); b.innerHTML = I.heart(false); toast('Removido dos favoritos'); }
      else { store.fav.push(id); b.classList.add('on'); b.innerHTML = I.heart(true); toast('Salvo nos favoritos ' + I.heart(true)); }
      save('mp_fav_v1', store.fav);
      updateBadges();
      if (route === '#/fav') render();
      return;
    }
    if (a === 'add') {
      e.preventDefault();
      const p = byId(id);
      const hasVariants = !!((p.colors && p.colors.length) || (p.opts && p.opts.length)
        || (p.fabrics && p.fabrics.length > 1) || (p.heights && p.heights.length > 1)
        || (p.sizes && p.sizes.length > 1));
      if (hasVariants) {
        location.hash = '#/p/' + p.id;
        toast('Escolha cor, tamanho e detalhes');
      } else {
        addToCart(p, selLines(p, selDefault(p)), 1);
      }
      return;
    }
    if (a === 'buy') {
      e.preventDefault();
      const p = byId(parseProduct());
      const s = store.sel[p.id];
      const qty = parseInt($('#qtyOut').textContent) || 1;
      addToCart(p, selLines(p, s), qty);
      return;
    }
    if (a === 'qty-p' || a === 'qty-m') {
      const out = $('#qtyOut');
      let v = parseInt(out.textContent) || 1;
      v = Math.max(1, Math.min(99, v + (a === 'qty-m' ? 1 : -1)));
      out.textContent = v;
      return;
    }
    if (a === 'inc' || a === 'dec') {
      const i = parseInt(b.dataset.i);
      store.cart[i].qty = Math.max(1, store.cart[i].qty + (a === 'inc' ? 1 : -1));
      save('mp_cart_v1', store.cart); renderCart();
      return;
    }
    if (a === 'rm') {
      store.cart.splice(parseInt(b.dataset.i), 1);
      save('mp_cart_v1', store.cart); renderCart();
      return;
    }
    if (a === 'copy-cart') {
      e.preventDefault();
      const name = $('#buyerName') ? $('#buyerName').value.trim() : '';
      copyText(cartMsg(name), 'Lista copiada para enviar ' + I.check);
      return;
    }
    if (a === 'copy-pix') {
      const pay = CFG.pagamentos || {};
      let pix = String(pay.pix || '');
      if (pay.pixNome) pix += '\n' + pay.pixNome;
      copyText(pix, 'Chave Pix copiada ' + I.check);
      return;
    }
    if (a === 'sel-met') {
      e.preventDefault();
      store.payMet = b.dataset.m === 'cartao' ? 'cartao' : 'pix';
      document.querySelectorAll('.mth').forEach(m => m.classList.toggle('on', m === b));
      const cb = $('#pCardBox'), pw = $('#pParcWrap');
      if (cb) cb.hidden = store.payMet !== 'cartao';
      if (pw) pw.hidden = store.payMet !== 'cartao';
      const go = $('#pGo');
      if (go) go.textContent = store.payMet === 'cartao' ? 'Pagar com cartão' : 'Ir para o pagamento Pix';
      return;
    }
    if (a === 'copy-pix-code') {
      copyText(b.dataset.code || '', 'Código Pix copiado ' + I.check);
      return;
    }
    if (a === 'clear-filters') {
      store.size = store.alt = store.fab = store.cor = store.q = '';
      render();
      return;
    }
    if (a === 'filters') {
      store.panel = !store.panel;
      const panel = $('#filtersPanel');
      panel.hidden = !store.panel;
      b.classList.toggle('on', store.panel);
      return;
    }
    if (a.startsWith('set-')) {
      const kind = a.slice(4);
      const v = b.dataset.v;
      store[kind] = store[kind] === v ? '' : v;
      render();
      return;
    }
    if (a === 'sel-cor') {
      const p = byId(parseProduct());
      const s = store.sel[p.id]; s.cor = p.colors[b.dataset.i].n;
      render(); return;
    }
    if (a === 'sel-size') { const p = byId(parseProduct()); store.sel[p.id].tamanho = b.dataset.v; render(); return; }
    if (a === 'sel-alt') { const p = byId(parseProduct()); store.sel[p.id].altura = b.dataset.v; render(); return; }
    if (a === 'sel-fab') { const p = byId(parseProduct()); store.sel[p.id].tecido = b.dataset.v; render(); return; }
    if (a === 'sel-opt') {
      const p = byId(parseProduct());
      const grp = p.opts.findIndex(o => o.v.includes(b.dataset.v));
      store.sel[p.id].opt[grp] = b.dataset.v;
      render(); return;
    }
    if (a === 'thumb') {
      const p = byId(parseProduct());
      const c = p.colors[b.dataset.i];
      store.sel[p.id].cor = c.n;
      render(); return;
    }
    if (a === 'thumb-img') {
      const p = byId(parseProduct());
      document.getElementById('gMain').src = P + b.dataset.src + '.jpg';
      const gm = document.querySelector('.g-main');
      if (gm) gm.classList.toggle('dk', DK.includes(b.dataset.src));
      document.querySelectorAll('.thumb').forEach(t => t.classList.remove('on'));
      b.classList.add('on');
      return;
    }
    if (a === 'open-cart') { e.preventDefault(); renderCart(); openDrawer(); return; }
    if (a === 'close-drawer') { closeDrawer(); return; }
  });

  function parseProduct() {
    const m = route.match(/^#\/p\/(.+)$/);
    if (m && byId(m[1])) { if (!store.sel[m[1]]) selDefault(byId(m[1])); return m[1]; }
    return null;
  }

  function copyText(msg, ok) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg).then(() => toast(ok)).catch(() => fallbackCopy(msg));
    } else fallbackCopy(msg);
  }

  function fallbackCopy(msg) {
    const ta = document.createElement('textarea');
    ta.value = msg;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast('Lista copiada ' + I.check); } catch (e) { toast('Copie manualmente: ' + waLink(msg).slice(0, 40) + '…'); }
    ta.remove();
  }

  document.addEventListener('input', e => {
    if (e.target.id === 'buyerName') {
      const ck = $('#checkoutLink');
      if (ck) ck.href = waLink(cartMsg(e.target.value.trim()));
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
  $('#overlay').addEventListener('click', () => closeDrawer());
  window.addEventListener('hashchange', () => { route = ''; render(); });

  /* boot */
  render();
  renderCart();
  updateBadges();
  renderPay();
})();