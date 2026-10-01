/* ============================================================
   CONFIGURAÇÃO DA LOJA — edite apenas este arquivo para:
   - nome da loja / slogan
   - número de WhatsApp (código do país + DDD + número, só dígitos)
   - cidade, redes, e se mostra preços
   ============================================================ */
window.MP_CONFIG = {
  store: 'Multiplus Colchões',
  tagline: 'Descanso, sono e terapia em casa',

  /* WhatsApp de orçamento. Formato: código do país + DDD + número (só dígitos).
     Ex.: São Paulo (11) 91234-5678 → '5511912345678'                        */
  whatsapp: '5511912345678',

  /* Primeira linha da mensagem do orçamento (pode alterar) */
  saudacao: 'Olá! Vim pelo catálogo online e gostaria de um orçamento.',

  /* Aparece no rodapé (opcional) */
  cidade: '',
  instagram: '',               // ex.: 'colchoesmultiplus'
  email: '',

  /* false = todos os produtos mostram “Sob consulta” (padrão do catálogo).
     Se você cadastrar `price` em algum produto em data.js e marcar true,
     o valor aparece em R$ na loja.                                        */
  mostrarPrecos: false,

  /* ---------- PAGAMENTO ONLINE (Mercado Pago) — como ativar:
     1. Crie a conta grátis em mercadopago.com.br;
     2. No painel, use “Criar link de pagamento” — Pix e/ou cartão em até
        12x, com valor fixo ou para o cliente digitar — e copie o link
        (algo como https://mpago.la/xxxxxxxx);
     3. Cole o link abaixo e salve. A conta não tem mensalidade; a taxa
        é cobrada só por venda.
     NUNCA coloque token/chave privada do Mercado Pago aqui — o código
     do site fica visível para qualquer visitante. O link gerado no
     painel é o único conteúdo próprio para publicar.                    */
  pagamentos: {
    link: 'https://link.mercadopago.com.br/kipposystems', // link de pagamento do painel; '' = esconde o botão “Pagar online”
    pix: '',       // opcional: chave Pix — mostra o botão “Copiar chave Pix”
    pixNome: '',   // opcional: nome do favorecido (vai na cópia, para conferência)

    /* Checkout dentro do próprio site (Vindi + Cloudflare Pages).
       Fluxo completo: o cliente paga com Pix (QR no site) ou cartão
       (formulário no site) — processado por functions/api/vindi/.
       Para ativar:
       1. Cadastre a loja na Vindi no modo cobrança avulsa
          (sem mensalidade; precisa de CNPJ aprovado);
       2. Copie a chave de API de produção em
          app.vindi.com.br → Configuração → Integrações → Chaves;
       3. Publique a loja no Cloudflare Pages e cadastre a chave na
          variável de ambiente VINDI_API_KEY do projeto;
       4. Mude `ativo: true` abaixo e republique.                     */
    checkout: {
      ativo: false,      // true quando a Vindi estiver aprovada e publicada
      modoTeste: false,  // true = simula pagamento na sua máquina, sem API
      sinalFixo: 0,      // ex.: 300 → o valor do sinal já vem preenchido
      parcelasMax: 12,
      /* códigos dos métodos na sua conta Vindi (conferir em
         GET /v1/payment_methods — normalmente 'pix' e 'credit_card') */
      codigos: { pix: 'pix', cartao: 'credit_card' },
    },
  },
};