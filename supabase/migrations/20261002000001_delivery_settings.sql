-- =====================================================================
-- CHUP Fruit · Zona de reparto configurable desde el panel
--   delivery_settings: una sola fila con la ubicación de la tienda y el radio de reparto.
--   Fuera del radio el pedido NO se bloquea: la tienda avisa y se coordina por WhatsApp.
-- Se puede ejecutar varias veces (idempotente).
-- =====================================================================

create table if not exists public.delivery_settings (
  id            boolean primary key default true check (id),      -- fuerza una sola fila
  zone_name     text not null check (length(btrim(zone_name)) between 1 and 60),
  store_address text not null check (length(btrim(store_address)) between 1 and 120),
  store_lat     double precision not null check (store_lat between -90 and 90),
  store_lng     double precision not null check (store_lng between -180 and 180),
  radius_m      integer not null check (radius_m between 200 and 30000),
  updated_at    timestamptz not null default now()
);

comment on table public.delivery_settings is 'Zona de reparto (una fila): centro en la tienda y radio en metros.';

drop trigger if exists delivery_settings_updated_at on public.delivery_settings;
create trigger delivery_settings_updated_at before update on public.delivery_settings
  for each row execute function public.set_updated_at();

grant select on public.delivery_settings to anon, authenticated;
grant insert, update on public.delivery_settings to authenticated;

alter table public.delivery_settings enable row level security;

drop policy if exists "delivery_settings: lectura" on public.delivery_settings;
create policy "delivery_settings: lectura" on public.delivery_settings
  for select to anon, authenticated using (true);

drop policy if exists "delivery_settings: admin inserta" on public.delivery_settings;
create policy "delivery_settings: admin inserta" on public.delivery_settings
  for insert to authenticated with check ((select public.is_admin()));

drop policy if exists "delivery_settings: admin edita" on public.delivery_settings;
create policy "delivery_settings: admin edita" on public.delivery_settings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- valores actuales de la tienda (no pisa lo que ya se haya editado)
insert into public.delivery_settings (id, zone_name, store_address, store_lat, store_lng, radius_m)
values (true, 'Tingo María centro', 'Jr. 28 de Marzo 245, Bella Durmiente', -9.3064229, -75.9996039, 1500)
on conflict (id) do nothing;
