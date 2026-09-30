/* Catálogo inicial: los 16 sabores que ya estaban en la tienda.
   - Es la misma data que carga supabase/migrations/20260930000002_seed_catalog.sql (UUID fijos).
   - La tienda lo usa como respaldo si Supabase no está configurado o no responde.
   Formato: filas tal como las devuelve la Data API (snake_case, diseño e imágenes embebidos). */

const CAT = {
  frutales: 'ca000000-0000-4000-8000-000000000001',
  cremosos: 'ca000000-0000-4000-8000-000000000002',
  chocolate: 'ca000000-0000-4000-8000-000000000003',
  licor: 'ca000000-0000-4000-8000-000000000004'
};

export const SEED_CATEGORIES = [
  {id: CAT.frutales,  slug: 'frutales',      name: 'Frutales',      card_label: 'Frutal',        description: null, badge: null,  sort_order: 10, is_active: true},
  {id: CAT.cremosos,  slug: 'cremosos',      name: 'Cremosos',      card_label: 'Cremoso',       description: null, badge: null,  sort_order: 20, is_active: true},
  {id: CAT.chocolate, slug: 'con-chocolate', name: 'Con chocolate', card_label: 'Con chocolate', description: null, badge: null,  sort_order: 30, is_active: true},
  {id: CAT.licor,     slug: 'con-licor',     name: 'Con licor',     card_label: 'Con licor',     description: 'Sabores con alcohol: venta solo a mayores de 18 años.', badge: '+18', sort_order: 40, is_active: true}
];

/* d(color_top, color_bottom, color_edge, speck_color, speck_count, extras) */
function d(top, bottom, edge, speck, count, extra){
  return Object.assign({
    color_top: top, color_bottom: bottom, color_edge: edge, speck_color: speck,
    speck_count: count || 0, speck_light: false, coating_color: null, label_line1: null, label_line2: null
  }, extra || {});
}

function p(n, slug, name, category, price, design, extra){
  return Object.assign({
    id: 'b0000000-0000-4000-8000-0000000000' + String(n).padStart(2, '0'),
    category_id: category, slug: slug, name: name, description: null, price: price,
    is_adult: false, display_mode: 'design', featured_rank: null, is_active: true, sort_order: n * 10,
    design: design, images: []
  }, extra || {});
}

/* El orden es el del catálogo original: los borradores antiguos del carrito usaban esta posición */
export const SEED_PRODUCTS = [
  p(1,  'oreo',            'Oreo',            CAT.cremosos,  3.00, d('#f6f1ea', '#3c3237', '#6f6167', '#2b2226', 16)),
  p(2,  'fresa-con-leche', 'Fresa con leche', CAT.cremosos,  2.00, d('#ffc3d5', '#ef2f68', '#f16b93', '#b3113f', 8), {featured_rank: 2}),
  p(3,  'cappuccino',      'Cappuccino',      CAT.cremosos,  2.00, d('#e0bd96', '#8a5a34', '#a8764a', '#5e3a1e', 0)),
  p(4,  'coco-con-leche',  'Coco con leche',  CAT.cremosos,  2.00, d('#ffffff', '#ecdccb', '#f2e5d8', '#ffffff', 10, {speck_light: true})),
  p(5,  'mani-con-leche',  'Maní con leche',  CAT.cremosos,  2.00, d('#eccb9c', '#b07a3e', '#c99a63', '#7d5223', 9)),
  p(6,  'ron-con-pasas',   'Ron con pasas',   CAT.licor,     2.50, d('#d8b184', '#6e4526', '#97673c', '#40230f', 14), {is_adult: true}),
  p(7,  'maracumango',     'Maracumango',     CAT.frutales,  2.00, d('#ffd869', '#ff5f2e', '#ff9448', '#8a2f0a', 6)),
  p(8,  'maracuya',        'Maracuyá',        CAT.frutales,  2.00, d('#ffe07a', '#ff8a1f', '#ffb04a', '#3a1a00', 14), {featured_rank: 3}),
  p(9,  'maracuya-sour',   'Maracuyá sour',   CAT.licor,     2.50, d('#fff0a8', '#f0a90c', '#f7c744', '#7a5200', 0), {is_adult: true}),
  p(10, 'lucuma',          'Lúcuma',          CAT.frutales,  2.00, d('#f4d29a', '#cf9a4f', '#dcb371', '#94682c', 0), {featured_rank: 1}),
  p(11, 'mango',           'Mango',           CAT.frutales,  2.00, d('#ffdf72', '#ff9500', '#ffba3d', '#8f5200', 0)),
  p(12, 'morochas',        'Morochas',        CAT.cremosos,  2.50, d('#f7ead7', '#4a3a33', '#7c6759', '#33251f', 12)),
  p(13, 'cerveza-negra',   'Cerveza negra',   CAT.licor,     2.50, d('#c99a5c', '#33200f', '#6d4b2a', '#1d1108', 0), {is_adult: true}),
  p(14, 'sublime',         'Sublime',         CAT.chocolate, 2.50, d('#7a4a2c', '#2b160a', '#4a2a16', '#e2b77c', 14, {speck_light: true})),
  p(15, 'fresa-con-cobertura-de-chocolate',  'Fresa con cobertura de chocolate',  CAT.chocolate, 2.50,
    d('#ffc3d5', '#ef2f68', '#f16b93', '#b3113f', 0, {coating_color: '#3a1c0b', label_line1: 'Fresa', label_line2: 'con chocolate'})),
  p(16, 'lucuma-con-cobertura-de-chocolate', 'Lúcuma con cobertura de chocolate', CAT.chocolate, 2.50,
    d('#f4d29a', '#cf9a4f', '#dcb371', '#94682c', 0, {coating_color: '#3a1c0b', label_line1: 'Lúcuma', label_line2: 'con chocolate'}))
];
