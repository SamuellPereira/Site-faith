# Faith Store — Supabase conectado

Este pacote já está configurado para o projeto Supabase informado pelo proprietário.

## Configuração

- `config.js` já contém a URL do projeto e a chave **publishable** fornecida.
- Não use `service_role` no navegador.
- O login administrativo usa Supabase Auth.
- O usuário do administrador precisa existir em Authentication > Users e ter uma linha correspondente em `public.admins` com `user_id` e/ou `email`.

## Banco

Execute `supabase_setup.sql` no SQL Editor do projeto para adicionar as colunas necessárias e criar as funções/policies.

## Abrir no VS Code

Abra esta pasta no VS Code e use Live Server ou outro servidor HTTP local.

## Admin

Abra `/admin.html` e entre com o usuário criado no Supabase Authentication.

## Observação

A chave `sb_publishable_...` é destinada ao uso público do frontend. Nunca coloque uma chave `service_role` no código do navegador.
# Faith Store — Faith Car Crew

Site de reservas de camisetas inspirado no layout enviado pelo grupo. O catálogo usa as fotos reais fornecidas e separa os modelos em cards individuais.

## Estrutura
- `index.html` — loja pública
- `admin.html` — painel administrativo (não aparece no menu da loja)
- `app.js` — catálogo, filtros e reservas
- `admin.js` — login e gerenciamento dos anúncios
- `styles.css` — visual responsivo
- `config.js` — URL/chave publicável do Supabase e links sociais
- `supabase_setup.sql` — políticas, função de reserva e catálogo inicial
- `assets/products/` — imagens individuais das camisetas

## Abrir no VS Code
1. Extraia o ZIP.
2. Abra a pasta no VS Code.
3. Para testar localmente, use Live Server ou outro servidor HTTP. Não abra apenas com `file://`.
4. Edite `config.js` com a URL do projeto Supabase e a chave **anon/publicável**.
5. Nunca coloque a chave `service_role` no frontend.

## Supabase
O projeto espera as tabelas `camisetas`, `reservas` e `admins` já existentes. Confira os nomes das colunas antes de rodar o SQL. O script não apaga as tabelas.

O `supabase_setup.sql` cria a função transacional `reservar_camiseta`, que decrementa o estoque com lock de linha para reduzir reservas duplicadas.

## Admin
O arquivo `admin.html` é separado e não é linkado no menu público. O acesso deve ser feito com Supabase Auth e a conta precisa existir na tabela `admins` com `ativo = true`.

O painel permite:
- criar anúncio;
- informar nome, marca, estoque e imagem;
- ocultar/ativar anúncio;
- apagar anúncio;
- visualizar reservas recentes.

## Imagens
As imagens da pasta `assets/products` foram recortadas e tratadas a partir da foto do catálogo enviada no chat. Se você quiser trocar por fotos individuais mais limpas depois, basta substituir os arquivos mantendo os mesmos nomes ou alterar o campo `imagem` no Supabase.

## Redes sociais
Os links do criador ficam em `config.js`. Troque os placeholders pelos seus links reais.


## Notificação dos vendedores

No `config.js`, preencha `SELLER_WHATSAPP_NUMBERS` com os dois números em formato internacional, somente dígitos, por exemplo `5511999999999`. Depois de uma reserva confirmada, o navegador abrirá uma conversa do WhatsApp para cada vendedor com a mensagem da reserva já preenchida. O vendedor ainda precisa tocar em **Enviar** no WhatsApp.

Para envio 100% automático sem interação do navegador, será necessário integrar a WhatsApp Cloud API/Twilio em um backend ou Supabase Edge Function com as credenciais correspondentes.

## Sem tamanho

O formulário de reserva não pergunta mais tamanho. Execute o `supabase_setup.sql` atualizado para deixar a coluna antiga `tamanho` opcional e fazer a função de reserva ignorá-la.


### WhatsApp automático (opcional)

O projeto inclui `supabase/functions/notify-sellers/index.ts`. Se você configurar a WhatsApp Cloud API no Supabase Edge Functions com os secrets `WHATSAPP_CLOUD_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` e `SELLER_WHATSAPP_NUMBERS` (dois números separados por vírgula), a reserva poderá notificar os dois vendedores automaticamente. Sem essa configuração, o site usa o fallback que abre as duas conversas do WhatsApp com a mensagem preenchida.

## Catálogo atualizado

O catálogo local foi atualizado para 17 camisetas identificadas na foto enviada. Cada anúncio representa **1 unidade de estoque**.

Duas artes da foto não permitem identificar o modelo com segurança apenas pela imagem; elas aparecem como:
- Esportivo Azul — modelo não identificado
- Esportivo Branco — modelo não identificado

Você pode alterar esses nomes no `app.js`, no `supabase_setup.sql` ou diretamente pelo painel administrativo depois de cadastrar os registros.

As fotos individuais foram recortadas e melhoradas com contraste, cor e nitidez a partir da foto original, mantendo `assets/catalog-source.jpg` como referência.


## CONECTAR AO SUPABASE

Abra `config.js` e preencha apenas estes dois campos com os dados do seu projeto:

```js
SUPABASE_URL: "https://SEU-PROJETO.supabase.co",
SUPABASE_ANON_KEY: "SUA_CHAVE_ANON_PUBLICA",
```

Use a chave **anon/public**, nunca a `service_role`.

No Supabase, execute primeiro o `supabase_setup.sql`. Ele cria, se necessário, as colunas `admins.user_id`, `admins.email` e `admins.ativo`, sem apagar os registros existentes.

Depois crie o usuário em Authentication > Users e copie o UUID. Para autorizar esse usuário como administrador:

```sql
insert into public.admins (user_id, email, ativo)
values ('UUID_DO_USUARIO', 'seu-email@exemplo.com', true);
```

Se já houver uma linha para esse e-mail, prefira:

```sql
update public.admins
set user_id = 'UUID_DO_USUARIO', ativo = true
where lower(email) = lower('seu-email@exemplo.com');
```
