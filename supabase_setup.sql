-- FAITH STORE / SUPABASE
-- Execute apenas depois de conferir os nomes das colunas das suas tabelas.
-- Este script NÃO apaga tabelas existentes.

-- 1) Compatibilidade com tabelas existentes
-- Se "ativo" não existir, adiciona a coluna sem apagar os dados.
alter table public.camisetas add column if not exists ativo boolean not null default true;
alter table public.admins add column if not exists ativo boolean not null default true;
alter table public.admins add column if not exists user_id uuid;
alter table public.admins add column if not exists email text;

-- 1) RLS
alter table public.camisetas enable row level security;
alter table public.reservas enable row level security;

-- Remova políticas antigas com estes nomes, se existirem.
drop policy if exists "faith_camisetas_public_select" on public.camisetas;
drop policy if exists "faith_reservas_public_insert" on public.reservas;
drop policy if exists "faith_admin_camisetas_all" on public.camisetas;
drop policy if exists "faith_admin_reservas_select" on public.reservas;

create policy "faith_camisetas_public_select"
on public.camisetas for select to anon, authenticated
using (ativo = true);

-- Reserva pública. O estoque é protegido pela função abaixo.
create policy "faith_reservas_public_insert"
on public.reservas for insert to anon, authenticated
with check (true);

-- 2) Admins: garantimos as colunas necessárias sem apagar dados existentes.
create or replace function public.sou_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a
    where a.ativo = true
      and (a.user_id = auth.uid() or lower(a.email) = lower(coalesce(auth.jwt()->>'email','')))
  );
$$;
revoke all on function public.sou_admin() from public;
grant execute on function public.sou_admin() to authenticated;

-- 3) Admins podem gerenciar anúncios. A checagem fica no banco.
create policy "faith_admin_camisetas_all"
on public.camisetas for all to authenticated
using (public.sou_admin())
with check (public.sou_admin());

create policy "faith_admin_reservas_select"
on public.reservas for select to authenticated
using (public.sou_admin());

-- 4) O tamanho não é mais coletado no site. Se sua coluna antiga for NOT NULL,
-- torne-a opcional para manter compatibilidade com reservas antigas.
alter table public.reservas alter column tamanho drop not null;

drop function if exists public.reservar_camiseta(text,text,text,text,text);
drop function if exists public.reservar_camiseta(text,text,text,text);

-- Reserva transacional: trava a linha do produto, verifica estoque,
-- decrementa e cria a reserva sem corrida entre usuários.
create or replace function public.reservar_camiseta(
  p_camiseta_id text,
  p_nome text,
  p_whatsapp text,
  p_observacao text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estoque integer;
  v_reserva_id text;
begin
  select estoque into v_estoque
  from public.camisetas
  where id::text = p_camiseta_id and ativo = true
  for update;

  if not found then
    return jsonb_build_object('success',false,'message','Camiseta não encontrada.');
  end if;
  if coalesce(v_estoque,0) <= 0 then
    return jsonb_build_object('success',false,'message','Essa camiseta está esgotada.');
  end if;

  update public.camisetas set estoque = estoque - 1 where id::text = p_camiseta_id;

  insert into public.reservas (camiseta_id,nome,whatsapp,observacao,status)
  select id,p_nome,p_whatsapp,p_observacao,'pendente'
  from public.camisetas where id::text = p_camiseta_id
  returning id::text into v_reserva_id;

  return jsonb_build_object('success',true,'reservation_id',v_reserva_id);
end;
$$;
revoke all on function public.reservar_camiseta(text,text,text,text) from public;
grant execute on function public.reservar_camiseta(text,text,text,text) to anon, authenticated;

-- 5) Catálogo inicial. Todos os anúncios têm exatamente 1 unidade.
insert into public.camisetas (nome,marca,imagem,estoque,ativo)
select * from (values
('Nissan GTR R34','Nissan','assets/products/nissan-gtr-r34.jpg',1,true),
('Porsche 911','Porsche','assets/products/porsche-911.jpg',1,true),
('Dodge Charger','Dodge','assets/products/dodge-charger.jpg',1,true),
('Volkswagen UP','Volkswagen','assets/products/volkswagen-up.jpg',1,true),
('Datsun 510','Datsun','assets/products/datsun-510.jpg',1,true),
('Volkswagen Beetle','Volkswagen','assets/products/volkswagen-beetle-black.jpg',1,true),
('DeLorean DMC-12','DeLorean','assets/products/de-lorean-dmc12.jpg',1,true),
('Nissan Silvia S14','Nissan','assets/products/nissan-silvia-s14.jpg',1,true),
('BMW E30 — Corrida #16','BMW','assets/products/bmw-e30-race-16.jpg',1,true),
('Volkswagen Beetle — Vermelho','Volkswagen','assets/products/volkswagen-beetle-red.jpg',1,true),
('Toyota Corolla AE86','Toyota','assets/products/toyota-corolla-ae86.jpg',1,true),
('Porsche 911 RSR','Porsche','assets/products/porsche-911-rsr.jpg',1,true),
('Esportivo Azul — modelo não identificado','Outros','assets/products/blue-sport-car.jpg',1,true),
('Esportivo Branco — modelo não identificado','Outros','assets/products/white-sport-car.jpg',1,true),
('Toyota Supra MK4 — Orange','Toyota','assets/products/toyota-supra-orange.jpg',1,true),
('Toyota Supra MK4 (Brian O''Conner)','Toyota','assets/products/toyota-supra-brian-oconnor.jpg',1,true),
('Toyota Supra MK4','Toyota','assets/products/toyota-supra-mk4.jpg',1,true)) as x(nome,marca,imagem,estoque,ativo)
where not exists (select 1 from public.camisetas c where lower(c.nome)=lower(x.nome));

-- Se os anúncios antigos já existirem, padronize o estoque para 1 unidade.
update public.camisetas set estoque = 1;
