-- =====================================================================
-- CHUP Fruit · Catálogo administrable
--   categories        categorías del catálogo (filtros de la tienda)
--   products          productos (sabores) con precio y visibilidad
--   product_designs   diseño 3D del chupete, 1:1 con products
--   product_images    fotos del producto (bucket product-images), 1:N
--   admins            usuarios de Supabase Auth con acceso al panel
--
-- Se puede ejecutar varias veces (idempotente) desde el SQL Editor.
-- =====================================================================

-- ---------- Dominios ----------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'hex_color' and typnamespace = 'public'::regnamespace) then
    create domain public.hex_color as text
      check (value ~ '^#[0-9a-fA-F]{6}$');
  end if;
  if not exists (select 1 from pg_type where typname = 'slug_text' and typnamespace = 'public'::regnamespace) then
    create domain public.slug_text as text
      check (value ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(value) <= 80);
  end if;
end $$;

-- ---------- Tablas ----------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        public.slug_text not null unique,
  name        text not null check (length(btrim(name)) between 1 and 60),       -- filtro: "Frutales"
  card_label  text check (length(card_label) <= 40),                            -- tarjeta: "Frutal" (null = name)
  description text check (length(description) <= 300),
  badge       text check (length(badge) <= 12),                                  -- ej. "+18" junto al filtro
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references public.categories(id) on update cascade on delete restrict,
  slug          public.slug_text not null unique,
  name          text not null check (length(btrim(name)) between 1 and 80),
  description   text check (length(description) <= 500),
  price         numeric(8,2) not null check (price >= 0),
  is_adult      boolean not null default false,                                  -- contiene licor: venta +18
  display_mode  text not null default 'design' check (display_mode in ('design', 'image')),
  featured_rank smallint check (featured_rank between 1 and 99),                 -- null = no sale en la portada
  is_active     boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_catalog_idx  on public.products (is_active, sort_order);

-- Diseño del chupete 3D (lo que antes era c1, c2, e, sp, k, lt, cov y lbl en el JS)
create table if not exists public.product_designs (
  product_id    uuid primary key references public.products(id) on delete cascade,
  color_top     public.hex_color not null default '#ffc3d5',   -- degradado: arriba
  color_bottom  public.hex_color not null default '#ef2f68',   -- degradado: abajo (también acento de la tarjeta)
  color_edge    public.hex_color not null default '#f16b93',   -- bordes del tubo
  speck_color   public.hex_color not null default '#b3113f',   -- trocitos (galleta, pasas, semillas)
  speck_count   smallint not null default 0 check (speck_count between 0 and 40),
  speck_light   boolean  not null default false,               -- trocitos claros sin sombra
  coating_color public.hex_color,                              -- cobertura de chocolate; null = sin cobertura
  label_line1   text check (length(label_line1) <= 18),        -- null = etiqueta "CHUP Fruit" + nombre
  label_line2   text check (length(label_line2) <= 22),
  updated_at    timestamptz not null default now(),
  constraint product_designs_label_ck check (label_line2 is null or label_line1 is not null)
);

create table if not exists public.product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products(id) on delete cascade,
  storage_path text unique,                                    -- ruta dentro del bucket product-images
  external_url text check (external_url ~ '^https://'),
  alt_text     text check (length(alt_text) <= 160),
  is_primary   boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  constraint product_images_source_ck check (num_nonnulls(storage_path, external_url) = 1)
);
create index if not exists product_images_product_idx on public.product_images (product_id, sort_order);
create unique index if not exists product_images_one_primary on public.product_images (product_id) where is_primary;

create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'editor' check (role in ('owner', 'editor')),
  created_at timestamptz not null default now()
);

comment on table public.categories      is 'Categorías del catálogo; cada una es un filtro en la tienda.';
comment on table public.products        is 'Productos (sabores). Visibles al público si is_active y su categoría está activa.';
comment on table public.product_designs is 'Diseño del chupete 3D que dibuja la tienda. Se crea solo al insertar un producto.';
comment on table public.product_images  is 'Fotos del producto; la principal se muestra cuando display_mode = image.';
comment on table public.admins          is 'Usuarios de Auth con acceso al panel. Se gestionan desde el SQL Editor.';

-- ---------- Funciones y triggers ----------
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- todo producto nace con un diseño por defecto: la relación 1:1 nunca queda vacía
create or replace function public.create_default_design()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.product_designs (product_id) values (new.id)
  on conflict (product_id) do nothing;
  return new;
end;
$$;

drop trigger if exists categories_updated_at on public.categories;
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists product_designs_updated_at on public.product_designs;
create trigger product_designs_updated_at before update on public.product_designs
  for each row execute function public.set_updated_at();

drop trigger if exists products_default_design on public.products;
create trigger products_default_design after insert on public.products
  for each row execute function public.create_default_design();

-- Reordenar en una sola transacción: sort_order = posición en el arreglo × 10
create or replace function public.reorder_categories(p_ids uuid[])
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede reordenar' using errcode = '42501';
  end if;
  update public.categories c set sort_order = o.pos * 10
  from unnest(p_ids) with ordinality as o(id, pos)
  where c.id = o.id;
end;
$$;

create or replace function public.reorder_products(p_ids uuid[])
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede reordenar' using errcode = '42501';
  end if;
  update public.products p set sort_order = o.pos * 10
  from unnest(p_ids) with ordinality as o(id, pos)
  where p.id = o.id;
end;
$$;

-- Cambia la foto principal sin violar el índice único parcial
create or replace function public.set_primary_product_image(p_image_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_product uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede cambiar la foto principal' using errcode = '42501';
  end if;
  select product_id into v_product from public.product_images where id = p_image_id;
  if v_product is null then
    raise exception 'La imagen no existe' using errcode = 'P0002';
  end if;
  update public.product_images set is_primary = false where product_id = v_product and is_primary;
  update public.product_images set is_primary = true  where id = p_image_id;
end;
$$;

revoke all on function public.reorder_categories(uuid[]) from public, anon;
revoke all on function public.reorder_products(uuid[]) from public, anon;
revoke all on function public.set_primary_product_image(uuid) from public, anon;
grant execute on function public.reorder_categories(uuid[]) to authenticated;
grant execute on function public.reorder_products(uuid[]) to authenticated;
grant execute on function public.set_primary_product_image(uuid) to authenticated;

-- ---------- Permisos de la Data API ----------
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products, public.product_designs, public.product_images to anon, authenticated;
grant insert, update, delete on public.categories, public.products, public.product_designs, public.product_images to authenticated;
grant select on public.admins to authenticated;

-- ---------- Row Level Security ----------
alter table public.categories      enable row level security;
alter table public.products        enable row level security;
alter table public.product_designs enable row level security;
alter table public.product_images  enable row level security;
alter table public.admins          enable row level security;

-- categories: el público ve las activas; el admin ve y edita todo
drop policy if exists "categories: lectura" on public.categories;
create policy "categories: lectura" on public.categories
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));

drop policy if exists "categories: admin inserta" on public.categories;
create policy "categories: admin inserta" on public.categories
  for insert to authenticated with check ((select public.is_admin()));

drop policy if exists "categories: admin edita" on public.categories;
create policy "categories: admin edita" on public.categories
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "categories: admin borra" on public.categories;
create policy "categories: admin borra" on public.categories
  for delete to authenticated using ((select public.is_admin()));

-- products: el público ve los activos de categorías activas
drop policy if exists "products: lectura" on public.products;
create policy "products: lectura" on public.products
  for select to anon, authenticated
  using (
    (is_active and exists (select 1 from public.categories c where c.id = category_id and c.is_active))
    or (select public.is_admin())
  );

drop policy if exists "products: admin inserta" on public.products;
create policy "products: admin inserta" on public.products
  for insert to authenticated with check ((select public.is_admin()));

drop policy if exists "products: admin edita" on public.products;
create policy "products: admin edita" on public.products
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "products: admin borra" on public.products;
create policy "products: admin borra" on public.products
  for delete to authenticated using ((select public.is_admin()));

-- product_designs / product_images: visibles si su producto es visible (hereda la RLS de products)
drop policy if exists "product_designs: lectura" on public.product_designs;
create policy "product_designs: lectura" on public.product_designs
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));

drop policy if exists "product_designs: admin inserta" on public.product_designs;
create policy "product_designs: admin inserta" on public.product_designs
  for insert to authenticated with check ((select public.is_admin()));

drop policy if exists "product_designs: admin edita" on public.product_designs;
create policy "product_designs: admin edita" on public.product_designs
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "product_designs: admin borra" on public.product_designs;
create policy "product_designs: admin borra" on public.product_designs
  for delete to authenticated using ((select public.is_admin()));

drop policy if exists "product_images: lectura" on public.product_images;
create policy "product_images: lectura" on public.product_images
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));

drop policy if exists "product_images: admin inserta" on public.product_images;
create policy "product_images: admin inserta" on public.product_images
  for insert to authenticated with check ((select public.is_admin()));

drop policy if exists "product_images: admin edita" on public.product_images;
create policy "product_images: admin edita" on public.product_images
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "product_images: admin borra" on public.product_images;
create policy "product_images: admin borra" on public.product_images
  for delete to authenticated using ((select public.is_admin()));

-- admins: cada usuario solo puede ver su propia fila (el panel la usa para saber si entra)
drop policy if exists "admins: ver la propia" on public.admins;
create policy "admins: ver la propia" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

-- ---------- Storage: fotos de productos ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
        array['image/webp', 'image/jpeg', 'image/png', 'image/avif', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- bucket público: la lectura va por URL pública; listar, subir y borrar solo el admin
drop policy if exists "product-images: admin lee" on storage.objects;
create policy "product-images: admin lee" on storage.objects
  for select to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

drop policy if exists "product-images: admin sube" on storage.objects;
create policy "product-images: admin sube" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));

drop policy if exists "product-images: admin actualiza" on storage.objects;
create policy "product-images: admin actualiza" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()))
  with check (bucket_id = 'product-images' and (select public.is_admin()));

drop policy if exists "product-images: admin borra" on storage.objects;
create policy "product-images: admin borra" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
