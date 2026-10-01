-- =====================================================================
-- CHUP Fruit · Seed del catálogo: los 16 sabores que ya estaban en la tienda
-- Generado a partir de js/shared/catalog/catalog.seed.js (mismos UUID).
-- Idempotente: no pisa lo que el administrador ya haya editado.
-- =====================================================================

insert into public.categories (id, slug, name, card_label, description, badge, sort_order, is_active) values
  ('ca000000-0000-4000-8000-000000000001', 'frutales', 'Frutales', 'Frutal', null, null, 10, true),
  ('ca000000-0000-4000-8000-000000000002', 'cremosos', 'Cremosos', 'Cremoso', null, null, 20, true),
  ('ca000000-0000-4000-8000-000000000003', 'con-chocolate', 'Con chocolate', 'Con chocolate', null, null, 30, true),
  ('ca000000-0000-4000-8000-000000000004', 'con-licor', 'Con licor', 'Con licor', 'Sabores con alcohol: venta solo a mayores de 18 años.', '+18', 40, true)
on conflict (id) do nothing;

insert into public.products (id, category_id, slug, name, description, price, is_adult, display_mode, featured_rank, is_active, sort_order) values
  ('b0000000-0000-4000-8000-000000000001', 'ca000000-0000-4000-8000-000000000002', 'oreo', 'Oreo', null, 3.00, false, 'design', null, true, 10),
  ('b0000000-0000-4000-8000-000000000002', 'ca000000-0000-4000-8000-000000000002', 'fresa-con-leche', 'Fresa con leche', null, 2.00, false, 'design', 2, true, 20),
  ('b0000000-0000-4000-8000-000000000003', 'ca000000-0000-4000-8000-000000000002', 'cappuccino', 'Cappuccino', null, 2.00, false, 'design', null, true, 30),
  ('b0000000-0000-4000-8000-000000000004', 'ca000000-0000-4000-8000-000000000002', 'coco-con-leche', 'Coco con leche', null, 2.00, false, 'design', null, true, 40),
  ('b0000000-0000-4000-8000-000000000005', 'ca000000-0000-4000-8000-000000000002', 'mani-con-leche', 'Maní con leche', null, 2.00, false, 'design', null, true, 50),
  ('b0000000-0000-4000-8000-000000000006', 'ca000000-0000-4000-8000-000000000004', 'ron-con-pasas', 'Ron con pasas', null, 2.50, true, 'design', null, true, 60),
  ('b0000000-0000-4000-8000-000000000007', 'ca000000-0000-4000-8000-000000000001', 'maracumango', 'Maracumango', null, 2.00, false, 'design', null, true, 70),
  ('b0000000-0000-4000-8000-000000000008', 'ca000000-0000-4000-8000-000000000001', 'maracuya', 'Maracuyá', null, 2.00, false, 'design', 3, true, 80),
  ('b0000000-0000-4000-8000-000000000009', 'ca000000-0000-4000-8000-000000000004', 'maracuya-sour', 'Maracuyá sour', null, 2.50, true, 'design', null, true, 90),
  ('b0000000-0000-4000-8000-000000000010', 'ca000000-0000-4000-8000-000000000001', 'lucuma', 'Lúcuma', null, 2.00, false, 'design', 1, true, 100),
  ('b0000000-0000-4000-8000-000000000011', 'ca000000-0000-4000-8000-000000000001', 'mango', 'Mango', null, 2.00, false, 'design', null, true, 110),
  ('b0000000-0000-4000-8000-000000000012', 'ca000000-0000-4000-8000-000000000002', 'morochas', 'Morochas', null, 2.50, false, 'design', null, true, 120),
  ('b0000000-0000-4000-8000-000000000013', 'ca000000-0000-4000-8000-000000000004', 'cerveza-negra', 'Cerveza negra', null, 2.50, true, 'design', null, true, 130),
  ('b0000000-0000-4000-8000-000000000014', 'ca000000-0000-4000-8000-000000000003', 'sublime', 'Sublime', null, 2.50, false, 'design', null, true, 140),
  ('b0000000-0000-4000-8000-000000000015', 'ca000000-0000-4000-8000-000000000003', 'fresa-con-cobertura-de-chocolate', 'Fresa con cobertura de chocolate', null, 2.50, false, 'design', null, true, 150),
  ('b0000000-0000-4000-8000-000000000016', 'ca000000-0000-4000-8000-000000000003', 'lucuma-con-cobertura-de-chocolate', 'Lúcuma con cobertura de chocolate', null, 2.50, false, 'design', null, true, 160)
on conflict (id) do nothing;

-- el trigger products_default_design ya creó un diseño por defecto: aquí se pone el original
-- (solo si nadie lo ha tocado todavía desde el panel)
insert into public.product_designs (product_id, color_top, color_bottom, color_edge, speck_color, speck_count, speck_light, coating_color, label_line1, label_line2) values
  ('b0000000-0000-4000-8000-000000000001', '#f6f1ea', '#3c3237', '#6f6167', '#2b2226', 16, false, null, null, null),
  ('b0000000-0000-4000-8000-000000000002', '#ffc3d5', '#ef2f68', '#f16b93', '#b3113f', 8, false, null, null, null),
  ('b0000000-0000-4000-8000-000000000003', '#e0bd96', '#8a5a34', '#a8764a', '#5e3a1e', 0, false, null, null, null),
  ('b0000000-0000-4000-8000-000000000004', '#ffffff', '#ecdccb', '#f2e5d8', '#ffffff', 10, true, null, null, null),
  ('b0000000-0000-4000-8000-000000000005', '#eccb9c', '#b07a3e', '#c99a63', '#7d5223', 9, false, null, null, null),
  ('b0000000-0000-4000-8000-000000000006', '#d8b184', '#6e4526', '#97673c', '#40230f', 14, false, null, null, null),
  ('b0000000-0000-4000-8000-000000000007', '#ffd869', '#ff5f2e', '#ff9448', '#8a2f0a', 6, false, null, null, null),
  ('b0000000-0000-4000-8000-000000000008', '#ffe07a', '#ff8a1f', '#ffb04a', '#3a1a00', 14, false, null, null, null),
  ('b0000000-0000-4000-8000-000000000009', '#fff0a8', '#f0a90c', '#f7c744', '#7a5200', 0, false, null, null, null),
  ('b0000000-0000-4000-8000-000000000010', '#f4d29a', '#cf9a4f', '#dcb371', '#94682c', 0, false, null, null, null),
  ('b0000000-0000-4000-8000-000000000011', '#ffdf72', '#ff9500', '#ffba3d', '#8f5200', 0, false, null, null, null),
  ('b0000000-0000-4000-8000-000000000012', '#f7ead7', '#4a3a33', '#7c6759', '#33251f', 12, false, null, null, null),
  ('b0000000-0000-4000-8000-000000000013', '#c99a5c', '#33200f', '#6d4b2a', '#1d1108', 0, false, null, null, null),
  ('b0000000-0000-4000-8000-000000000014', '#7a4a2c', '#2b160a', '#4a2a16', '#e2b77c', 14, true, null, null, null),
  ('b0000000-0000-4000-8000-000000000015', '#ffc3d5', '#ef2f68', '#f16b93', '#b3113f', 0, false, '#3a1c0b', 'Fresa', 'con chocolate'),
  ('b0000000-0000-4000-8000-000000000016', '#f4d29a', '#cf9a4f', '#dcb371', '#94682c', 0, false, '#3a1c0b', 'Lúcuma', 'con chocolate')
on conflict (product_id) do update set
  color_top = excluded.color_top, color_bottom = excluded.color_bottom, color_edge = excluded.color_edge,
  speck_color = excluded.speck_color, speck_count = excluded.speck_count, speck_light = excluded.speck_light,
  coating_color = excluded.coating_color, label_line1 = excluded.label_line1, label_line2 = excluded.label_line2
where (public.product_designs.color_top, public.product_designs.color_bottom, public.product_designs.color_edge,
       public.product_designs.speck_color, public.product_designs.speck_count, public.product_designs.speck_light)
      = ('#ffc3d5', '#ef2f68', '#f16b93', '#b3113f', 0, false)
  and public.product_designs.coating_color is null
  and public.product_designs.label_line1 is null;
