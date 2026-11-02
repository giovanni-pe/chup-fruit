-- =====================================================================
-- CHUP Fruit · Pedido mínimo configurable, control de stock y fecha de publicación
--   delivery_settings.min_order_units  pedido mínimo (antes fijo en 5 en el frontend)
--   products.stock                     unidades disponibles; null = sin control de stock
--   products.publish_at                desde cuándo se ve en la tienda; null = de inmediato
--   place_order(items)                 descuenta el stock al enviar el pedido (todo o nada)
-- Se puede ejecutar varias veces (idempotente).
-- =====================================================================

-- ---------- Pedido mínimo ----------
alter table public.delivery_settings
  add column if not exists min_order_units integer not null default 5;

alter table public.delivery_settings drop constraint if exists delivery_settings_min_order_ck;
alter table public.delivery_settings add constraint delivery_settings_min_order_ck
  check (min_order_units between 1 and 99);

comment on column public.delivery_settings.min_order_units is 'Pedido mínimo en unidades (1 a 99).';

-- ---------- Stock y fecha de publicación ----------
alter table public.products add column if not exists stock integer;
alter table public.products add column if not exists publish_at timestamptz;

alter table public.products drop constraint if exists products_stock_ck;
alter table public.products add constraint products_stock_ck check (stock is null or stock between 0 and 99999);

comment on column public.products.stock is 'Unidades disponibles. null = sin control de stock (siempre disponible).';
comment on column public.products.publish_at is 'Fecha y hora desde la que el público lo ve. null = publicado de inmediato.';

-- el público solo ve lo activo, de categorías activas y ya publicado
drop policy if exists "products: lectura" on public.products;
create policy "products: lectura" on public.products
  for select to anon, authenticated
  using (
    (is_active
      and (publish_at is null or publish_at <= now())
      and exists (select 1 from public.categories c where c.id = category_id and c.is_active))
    or (select public.is_admin())
  );

-- ---------- Registrar un pedido: descuenta el stock ----------
-- p_items: [{"id": "<uuid>", "q": 3}, …]
-- Devuelve {"ok": true} o {"ok": false, "reason": "...", "shortages": [{"id", "name", "available"}]}.
-- Si falta stock de algún sabor no se descuenta nada.
create or replace function public.place_order(p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_items     jsonb;
  v_min       integer;
  v_units     integer;
  v_shortages jsonb := '[]'::jsonb;
  r           record;
begin
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'empty');
  end if;

  -- agrupa por sabor (el mismo sabor puede venir de varias personas)
  select coalesce(jsonb_agg(jsonb_build_object('id', g.id, 'q', g.q)), '[]'::jsonb), coalesce(sum(g.q), 0)
    into v_items, v_units
  from (
    select (e->>'id')::uuid as id, sum((e->>'q')::integer)::integer as q
    from jsonb_array_elements(p_items) e
    where (e->>'q')::integer > 0
    group by 1
  ) g;

  select coalesce((select d.min_order_units from public.delivery_settings d where d.id), 5) into v_min;
  if v_units < v_min then
    return jsonb_build_object('ok', false, 'reason', 'min_order', 'min', v_min);
  end if;
  if v_units > 500 then
    return jsonb_build_object('ok', false, 'reason', 'too_many');
  end if;

  -- bloquea las filas (en orden fijo) para que dos pedidos simultáneos no vendan la misma unidad
  perform 1 from public.products p
  where p.id in (select x.id from jsonb_to_recordset(v_items) as x(id uuid, q integer))
  order by p.id
  for update;

  for r in
    select x.id, x.q, p.name, p.stock,
           coalesce(p.is_active and (p.publish_at is null or p.publish_at <= now())
             and exists (select 1 from public.categories c where c.id = p.category_id and c.is_active), false) as visible
    from jsonb_to_recordset(v_items) as x(id uuid, q integer)
    left join public.products p on p.id = x.id
  loop
    if not r.visible then
      -- no existe, está oculto o aún no se publica (sin revelar su nombre)
      v_shortages := v_shortages || jsonb_build_object('id', r.id, 'name', null, 'available', 0);
    elsif r.stock is not null and r.stock < r.q then
      v_shortages := v_shortages || jsonb_build_object('id', r.id, 'name', r.name, 'available', r.stock);
    end if;
  end loop;

  if jsonb_array_length(v_shortages) > 0 then
    return jsonb_build_object('ok', false, 'reason', 'stock', 'shortages', v_shortages);
  end if;

  update public.products p set stock = p.stock - x.q
  from jsonb_to_recordset(v_items) as x(id uuid, q integer)
  where p.id = x.id and p.stock is not null;

  return jsonb_build_object('ok', true);
exception
  when invalid_text_representation or numeric_value_out_of_range then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
end;
$$;

revoke all on function public.place_order(jsonb) from public;
grant execute on function public.place_order(jsonb) to anon, authenticated;
