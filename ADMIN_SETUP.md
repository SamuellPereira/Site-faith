# Configuração do administrador — Faith Store

## 1. Criar o usuário no Supabase Auth

No Supabase: **Authentication → Users → Add user**.

Use, por exemplo:

- E-mail: `admin@faithstore.com`
- Senha: `FaithStore@2026`

## 2. Copiar o UUID do usuário

Depois de criar, copie o **User UID** desse usuário.

No SQL Editor, execute:

```sql
select id, email
from auth.users
where lower(email) = 'admin@faithstore.com';
```

## 3. Colocar o usuário em public.admins

Substitua `COLE_UUID_AQUI` pelo UUID retornado:

```sql
insert into public.admins (user_id, email, ativo)
values ('COLE_UUID_AQUI', 'admin@faithstore.com', true)
on conflict do nothing;
```

Confira:

```sql
select user_id, email, ativo
from public.admins
where lower(email) = 'admin@faithstore.com';
```

## 4. Executar o SQL do projeto

No Supabase SQL Editor, execute o arquivo `supabase_setup.sql` inteiro. Ele cria/atualiza a função `public.sou_admin()` usada pelo painel.

## 5. Entrar

Abra `admin.html` e use:

- E-mail: `admin@faithstore.com`
- Senha: `FaithStore@2026`

Se a autenticação funcionar mas o UUID não estiver em `public.admins`, o painel agora mostra uma mensagem específica em vez de simplesmente voltar para o login.
