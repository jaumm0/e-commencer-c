# ComfyLife — e-commerce da linha Multiplus

Loja completa (sem código de servidor) montada a partir dos PDFs oficiais 2026:
Colchões 2026, Colchões A Vácuo, Camas Box, Cabeceiras, Poltronas e Travesseiros.

**35 produtos** com fotos extraídas dos próprios catálogos, filtros por tamanho,
altura, tecido e cor, favoritos, carrinho de orçamento, fechamento por
WhatsApp, checkout online (Pix/cartão na própria loja) e **painel admin**
para controle de tudo sem mexer no código.

## Como rodar

- **Modo simples:** dê dois cliques em `index.html` (funciona direto no navegador, via file://).
- **Modo servidor local (recomendado para testar no celular também):**
  ```
  python -m http.server 8000
  ```
  e abra `http://localhost:8000` na pasta `ecommerce/`.

Nada mais é necessário — sem npm, sem banco de dados.

## Onde editar o quê

| O quê | Caminho preferido | Alternativa em código |
|---|---|---|
| WhatsApp, cidade, preços, checkout, Pix | **Aba “Loja” do painel** | `js/config.js` (valores padrão) |
| Produtos: nome, categoria, preço, destaque, fotos | **Aba “Produtos” do painel** | `js/data.js` (catálogo base) |
| Cores/tipografia do tema | `css/app.css` (tokens no bloco `:root`) | — |

O que é salvo no painel vai para o **KV do Cloudflare** e sobrepõe os
valores de `config.js`/`data.js` — sem precisar de novo deploy.

## Painel admin (`/admin.html`)

Controle completo da loja sem mexer no código: **Visão geral** (receita do
mês, vendas, pendências, orçamentos, últimos movimentos — junta cobranças
Vindi e pedidos manuais), **Pedidos** (cobranças online da Vindi em
somente-leitura + registro manual de vendas fechadas por WhatsApp, com
status: pago, orçamento, fechado, entregue, cancelado…), **Produtos**
(CRUD completo — preço com digitação direta na lista, destaque ★, excluir,
e fotos: por referência do repositório **ou** upload direto, reduzido no
navegador e guardado no KV como `u/<ref>`) e **Loja** (WhatsApp, cidade,
saudação, preços ligados/desligados, **“Checkout online ativo”**, sinal
pré-preenchido, parcelas, chave Pix, saudação do WhatsApp, Instagram, e-mail).

**Modelo de dados:** o painel salva o **catálogo inteiro** no KV
(`produtos`) e a **configuração da loja** (`conf`) — o site lê os dois
a cada carregamento (`/api/store`) e sobrepõe os padrões de
`config.js`/`data.js`. Nenhum deploy é necessário para mudar preço,
foto ou WhatsApp.

### Publicar o painel (Cloudflare Pages)

1. No projeto Pages: **Settings → Functions → KV namespace bindings** →
   criar/embutir um namespace (ex.: `STORE_KV`, `env` = production e preview);
2. **Settings → Variables and Secrets**: `ADMIN_PASS` = senha do painel
   (**mínimo 8 caracteres** — sem ela nada autentica) e `VINDI_API_KEY`
   quando existir;
3. Acessar `https://<dominio>/admin.html`. Sessão via cookie assinado
   (HMAC) com 7 dias; erro de senha trava o IP por 15 min após 10 tentativas.

> A senha **nunca** vai no código — só na variável de ambiente do Cloudflare.

### Rodar localmente (modo demonstração)

Sem servidor de functions (ex.: abrir por `python -m http.server` — o
`/api/*` responde 404), o painel entra em **modo demonstração**: dados
fictícios para navegar e todo botão de salvar bloqueado com aviso.
Para modo ao vivo local, use `wrangler pages dev --binding STORE_KV=<...>`
ou um wrapper equivalente.

> O botão **“Checkout online ativo”** na aba Loja só deve ser marcado
> quando a conta da Vindi estiver aprovada e `VINDI_API_KEY` configurada
> no Cloudflare. O `modoTeste` da Vindi fica **só em `js/config.js`**
> (nunca no painel) — é chave de código, de uso restrito a testes.

## Link de Mercado Pago (opcional, desligado)

Retirado da loja a pedido — o caminho principal é o checkout da própria
loja (Vindi). Se um dia quiser voltar: cole o link de pagamento gerado no
painel do Mercado Pago no campo **mpLink** (aba Loja) e o botão
“Pagar online — Mercado Pago” reaparece no carrinho. `pix` + `pixNome`
adicionam o botão **“Copiar chave Pix”** independentemente do link.

> **Segurança:** nunca coloque token/chave privada do Mercado Pago no
> código — `config.js` fica visível para qualquer visitante. Só o link
> público do painel pode ficar em config.

## Checkout na própria loja (Vindi + Cloudflare Pages)

O fluxo mais profissional: o cliente fecha o valor no WhatsApp e paga
**aqui mesmo no site** — Pix com QR Code na tela, ou cartão em até 12×.
O cartão é processado pela **Vindi** e **não fica salvo** (`discard_credit_card`);
o site continua 100% estático — a chave da Vindi vive **só no servidor**
(Cloudflare Pages Functions) e nunca no código front-end.

**Taxas Vindi (cobrança avulsa — sem mensalidade):** cartão
2,75% + R$ 0,39 · Pix 0,95% (mín. R$ 1,60) · boleto R$ 2,99 + R$ 0,39.
Precisa de **CNPJ** aprovado no cadastro (o modo recorrência, em que
cobre planos mensais, só vale a pena se a loja vender assinaturas).

### Passo a passo

1. **Cadastrar a loja na Vindi** → [vindi.com.br](https://vindi.com.br),
   plano “cobrança avulsa” (checkout transparente). Aguardar aprovação
   do CNPJ.
2. **Pegar a chave de API** → painel `app.vindi.com.br` →
   **Configuração → Integrações → Chaves de API** (produção).
3. **Publicar no Cloudflare Pages (grátis):**
   1. Suba a pasta `ecommerce/` para um repositório novo no GitHub —
      o **conteúdo da pasta é a raiz do repo** (`index.html` na raiz,
      ao lado de `functions/` e `js/`);
   2. Em cloudflare.com → **Workers & Pages → Create → Pages →
      Connect to Git**, escolher o repo, framework **None**,
      output directory `/`;
   3. **Antes de publicar**: Settings → **Variables and Secrets** →
      adicionar `VINDI_API_KEY` com a chave do passo 2
      (opcional: `VINDI_MAX_AMT`, teto por cobrança em R$ — padrão 50000).
4. **Ativar no painel:** aba **Loja** → marcar **“Checkout online ativo”**
   → salvar (não precisa deploy). O carrinho ganha **“Finalizar compra —
   pagar no site”** e o rodapé passa a citar o checkout.
   (Alternativa em código: `checkout: { ativo: true }` em `js/config.js`.)

### Dois modos de valor

| Modo | Quando | Como |
|---|---|---|
| **Valor acordado** (padrão hoje) | Não há tabela de preços — orçamento fechado no WhatsApp | Cliente digita o valor na página **#/pagamento** (ou `sinalFixo` na aba Loja, pré-preenchido) |
| **Carrinho itemizado** | Quando existir tabela: `mostrarPrecos` ligado na aba Loja + preço em todo produto | O cart já mostra o total estimado e o checkout traz o resumo itemizado — sem campo de valor |

### Desenvolvimento local

- `python -m http.server` serve o site, mas **Functions do Cloudflare
  só rodam no Pages** (ou em `wrangler pages dev`). Em `file://` o
  checkout mostra aviso e continua funcionando o resto.
- Para ver o fluxo **sem chave da Vindi**: nas variáveis de ambiente
  do projeto, definir `VINDI_MOCK=1` (simula Pix/cartão de ponta a
  ponta — cartão aprova na hora, Pix “cai” ~6s depois). **Nunca deixe
  `VINDI_MOCK=1` em produção**, ou aceitará pagamentos falsos.
- `functions/api/vindi/` contém as três funções: `checkout` (POST —
  valida dados, cria cliente/produto/cobrança na Vindi, devolve Pix ou
  confirmação), `status` (GET — consultado a cada 5s até o Pix cair) e
  `webhook` (POST — aviso imediato ao dono, abaixo).

### Avisar o dono no celular quando o pagamento cai (webhook)

1. **Cloudflare** → Variables and Secrets → criar dois valores:
   `WEBHOOK_TOKEN` (string secreta aleatória, ex. 32 caracteres) e
   `NOTIFY_URL` (para onde o aviso vai — ver abaixo).
2. **Painel da Vindi** → procure **"Webhooks"** nas configurações →
   cadastrar a URL `https://<dominio>/api/vindi/webhook?t=<WEBHOOK_TOKEN>`
   e marcar os eventos de **cobrança paga** (charge/bill paid).
3. Teste pelo navegador: abrir a URL do webhook com o token — deve
   responder `{"ok":true,"ping":true}`.
4. O que a `NOTIFY_URL` recebe (POST JSON):
   ```json
   {"fonte":"vindi","evento":"charge.paid","ref":"551","cliente":"Maria",
    "total":1890,"metodo":"pix","item":"Cama Box Tatame Casal","pago_em":"2026-10-02"}
   ```
   O painel **não depende** deste webhook (ele lê o status real da API
   da Vindi quando aberto) — o webhook é só o **aviso imediato**.
5. O evento é deduplicado no KV (`wh:…`) — reenvios da Vindi avisam 1× só.
6. Sem `VINDI_API_KEY` no servidor, o painel nunca mostra valores
   fictícios: começa com a lista vazia. (`VINDI_MOCK=1` é só para teste
   de código e injeta faturas fictícias — nunca deixar em produção.)
7. Fallback em produção: o recibo do comprador tem o botão
   **"Avisar a loja no WhatsApp"** (referência + valor) enquanto a
   ponte de notificação não estiver no ar.

> **Nota:** APIs de WhatsApp não-oficiais violam os termos do WhatsApp e
> podem resultar no banimento do número da loja — avalie antes de usar.

## Estrutura

```
ecommerce/
├── index.html        casca da aplicação (SPA)
├── admin.html        painel admin standalone
├── css/app.css       tema e componentes
├── css/admin.css     tema do painel
├── js/config.js      configuração padrão da loja
├── js/data.js        catálogo base (categorias + produtos)
├── js/bgdark.js      lista de fotos com fundo preto (estúdio escuro)
├── js/app.js         rotas, filtros, carrinho, checkout e WhatsApp
├── js/admin.js       lógica do painel (tabs, CRUD, upload, modais)
├── functions/api/    Cloudflare Pages Functions
│   ├── store.js            leitura pública (conf + produtos)
│   ├── img/[name].js       fotos subidas no painel (KV b64)
│   ├── vindi/              checkout.js + status.js + webhook.js (aviso)
│   └── admin/              login/logout/_auth, config, produtos,
│                           pedidos, vindi (resumo), upload
└── img/              imagens extraídas dos PDFs
```

Rotas: `#/` (home) · `#/c/<categoria>` · `#/p/<produto>` · `#/fav`
(favoritos) · `#/pagamento` (checkout online) · `#/pagamento/<id>`
(recibo do pagamento).