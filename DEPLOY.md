# Publicação rápida

## Vercel / Netlify / GitHub Pages
O frontend é estático e pode ser publicado em qualquer serviço que sirva HTML/CSS/JS.

Antes de publicar:
1. configure `config.js`;
2. execute o SQL necessário no Supabase;
3. crie o usuário administrador no Supabase Auth;
4. insira esse usuário na tabela `admins` com `ativo = true`;
5. teste uma reserva com estoque 1 e confirme que a segunda tentativa é bloqueada.

### Segurança
- Use somente a chave anon/publicável no frontend.
- Não publique a `service_role`.
- O painel depende do Supabase Auth + `sou_admin()`.
- O estoque é alterado pela função SQL transacional, não por um `update` simples no navegador.
