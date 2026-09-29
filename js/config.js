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
};