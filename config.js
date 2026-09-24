window.FAITH_CONFIG = {
  SUPABASE_URL: "https://iqikcfcispxchbpxyrpg.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_TBQmZo5-IN9Jqah8sGa0XQ_ddb4vx3p",
  SELLER_WHATSAPP_NUMBERS: ["5511952845848", "55YYYYYYYYYYY"],
  WHATSAPP_EDGE_FUNCTION: "notify-sellers",
  CREATOR: {
    INSTAGRAM: "https://instagram.com/samue.pereira",
    LINKEDIN: "https://www.linkedin.com/in/samuel-s-pereira/",
    GITHUB: "https://github.com/SamuellPereira/Site-faith"
  },
  COLUMNS: {
    products: { id:"id", name:"nome", brand:"marca", image:"imagem", stock:"estoque", active:"ativo" },
    reservations: { id:"id", productId:"camiseta_id", name:"nome", whatsapp:"whatsapp", size:"tamanho", note:"observacao", status:"status", createdAt:"created_at" }
  },
  TABLES: { products:"camisetas", reservations:"reservas", admins:"admins" }
};
