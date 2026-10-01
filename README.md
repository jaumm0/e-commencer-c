# Multiplus Colchões — e-commerce do catálogo

Loja completa (sem código de servidor) montada a partir dos PDFs oficiais 2026:
Colchões 2026, Colchões A Vácuo, Camas Box, Cabeceiras, Poltronas e Travesseiros.

**34 produtos** com fotos extraídas dos próprios catálogos, filtros por tamanho,
altura, tecido e cor, favoritos, carrinho de orçamento, fechamento por
WhatsApp e pagamento online opcional pelo Mercado Pago.

## Como rodar

- **Modo simples:** dê dois cliques em `index.html` (funciona direto no navegador, via file://).
- **Modo servidor local (recomendado para testar no celular também):**
  ```
  python -m http.server 8000
  ```
  e abra `http://localhost:8000` na pasta `ecommerce/`.

Nada mais é necessário — sem npm, sem banco de dados.

## Onde editar o quê

| O quê | Arquivo |
|---|---|
| Nome da loja, número de WhatsApp, cidade, mostrar preços | `js/config.js` |
| Produtos, cores, medidas, descrições, **preços** | `js/data.js` |
| Pagamento online (link do Mercado Pago, chave Pix) | `js/config.js` |
| Cores/tipografia do tema | `css/app.css` (tokens no bloco `:root`) |

## Colocar preços

O catálogo original não traz preços. Por padrão todo produto mostra
**“Sob consulta”**. Para exibir preço:

1. Em `js/data.js`, troque `price: null` por um número — ex.: `price: 1490`;
2. Em `js/config.js`, marque `mostrarPrecos: true`.

## WhatsApp de orçamento

Troque o número em `js/config.js` (`whatsapp: '5511912345678'`) —
código do país + DDD + número, só dígitos.

## Pagamento online (Mercado Pago)

Opcional e sem back-end: a loja cria no painel do Mercado Pago um
**link de pagamento** (Pix e/ou cartão em até 12x, com valor fixo ou
para o cliente digitar) e cola em `js/config.js`:

```js
pagamentos: { link: 'https://mpago.la/xxxxxxxx', pix: '', pixNome: '' },
```

Com o link o carrinho ganha o botão **“Pagar online — Mercado Pago”**
(e o rodapé passa a citar a opção). `pix` (chave) + `pixNome` adicionam
um botão **“Copiar chave Pix”**. Sem nada configurado, o site fica
exatamente como antes — só WhatsApp.

> **Segurança:** nunca coloque token/chave privada do Mercado Pago no
> código — `config.js` fica visível para qualquer visitante. O único
> conteúdo próprio para publicar é o link gerado no painel (a taxa
> do Mercado Pago é cobrada por venda; não há mensalidade).

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
4. **Ativar no site:** em `js/config.js` mudar
   `checkout: { ativo: true, ... }` e commit — o Cloudflare redesenha
   sozinho. Pronto: o carrinho ganha **“Finalizar compra — pagar no
   site”** e o rodapé passa a citar o checkout.

### Dois modos de valor

| Modo | Quando | Como |
|---|---|---|
| **Valor acordado** (padrão hoje) | Não há tabela de preços — orçamento fechado no WhatsApp | Cliente digita o valor na página **#/pagamento** (ou `sinalFixo: 300` para um sinal pré-preenchido) |
| **Carrinho itemizado** | Quando existir tabela: `mostrarPrecos: true` em `config.js` + `price` em todo produto de `data.js` | O cart já mostra o total estimado e o checkout traz o resumo itemizado — sem campo de valor |

### Desenvolvimento local

- `python -m http.server` serve o site, mas **Functions do Cloudflare
  só rodam no Pages** (ou em `wrangler pages dev`). Em `file://` o
  checkout mostra aviso e continua funcionando o resto.
- Para ver o fluxo **sem chave da Vindi**: nas variáveis de ambiente
  do projeto, definir `VINDI_MOCK=1` (simula Pix/cartão de ponta a
  ponta — cartão aprova na hora, Pix “cai” ~6s depois). **Nunca deixe
  `VINDI_MOCK=1` em produção**, ou aceitará pagamentos falsos.
- `functions/api/vindi/` contém as duas funções: `checkout` (POST —
  valida dados, cria cliente/produto/cobrança na Vindi, devolve Pix ou
  confirmação) e `status` (GET — consultado a cada 5s até o Pix cair).

## Estrutura

```
ecommerce/
├── index.html        casca da aplicação (SPA)
├── css/app.css       tema e componentes
├── js/config.js      configuração da loja
├── js/data.js        catálogo (categorias + produtos)
├── js/bgdark.js      lista de fotos com fundo preto (estúdio escuro)
├── js/app.js         rotas, filtros, carrinho, checkout e WhatsApp
├── functions/api/vindi/  checkout + status (Cloudflare Pages Functions)
└── img/              imagens extraídas dos PDFs
```

Rotas: `#/` (home) · `#/c/<categoria>` · `#/p/<produto>` · `#/fav`
(favoritos) · `#/pagamento` (checkout online) · `#/pagamento/<id>`
(recibo do pagamento).