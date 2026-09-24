// Copie este arquivo para config.js e preencha os dados do seu projeto Supabase.
window.FAITH_CONFIG = {
  SUPABASE_URL: "https://SEU-PROJETO.supabase.co",
  SUPABASE_ANON_KEY: "SUA_CHAVE_PUBLICA",
  SELLER_WHATSAPP_NUMBERS: ["5511952845848", "55YYYYYYYYYYY"],
  WHATSAPP_EDGE_FUNCTION: "notify-sellers", // somente números
  CREATOR: {
    INSTAGRAM: "https://instagram.com/SEU_INSTAGRAM",
    LINKEDIN: "https://linkedin.com/in/SEU_PERFIL",
    GITHUB: "https://github.com/SEU_USUARIO"
  },
  // Se as suas tabelas usam outros nomes de colunas, altere aqui.
  COLUMNS: {
    products: { id:"id", name:"nome", brand:"marca", image:"imagem", stock:"estoque", active:"ativo" },
    reservations: { productId:"camiseta_id", name:"nome", whatsapp:"whatsapp", size:"tamanho", note:"observacao", status:"status" }
  },
  TABLES: { products:"camisetas", reservations:"reservas", admins:"admins" }
};