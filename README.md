# Multiplus Colchões — e-commerce do catálogo

Loja completa (sem código de servidor) montada a partir dos PDFs oficiais 2026:
Colchões 2026, Colchões A Vácuo, Camas Box, Cabeceiras, Poltronas e Travesseiros.

**34 produtos** com fotos extraídas dos próprios catálogos, filtros por tamanho,
altura, tecido e cor, favoritos, carrinho de orçamento e fechamento por WhatsApp.

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
| Cores/tipografia do tema | `css/app.css` (tokens no bloco `:root`) |

## Colocar preços

O catálogo original não traz preços. Por padrão todo produto mostra
**“Sob consulta”**. Para exibir preço:

1. Em `js/data.js`, troque `price: null` por um número — ex.: `price: 1490`;
2. Em `js/config.js`, marque `mostrarPrecos: true`.

## WhatsApp de orçamento

Troque o número em `js/config.js` (`whatsapp: '5511912345678'`) —
código do país + DDD + número, só dígitos.

## Estrutura

```
ecommerce/
├── index.html        casca da aplicação (SPA)
├── css/app.css       tema e componentes
├── js/config.js      configuração da loja
├── js/data.js        catálogo (categorias + produtos)
├── js/bgdark.js      lista de fotos com fundo preto (estúdio escuro)
├── js/app.js         rotas, filtros, carrinho e WhatsApp
└── img/              imagens extraídas dos PDFs
```

Rotas: `#/` (home) · `#/c/<categoria>` · `#/p/<produto>` · `#/fav` (favoritos).