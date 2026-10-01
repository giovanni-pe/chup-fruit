import { publicImageUrl } from '../../core/config.js';

/* Entidades del catálogo: traducen filas de Supabase (snake_case) a objetos de la app (camelCase)
   y de vuelta. Tienda y panel comparten este contrato. */

export const DEFAULT_DESIGN = Object.freeze({
  colorTop: '#ffc3d5', colorBottom: '#ef2f68', colorEdge: '#f16b93', speckColor: '#b3113f',
  speckCount: 0, speckLight: false, coatingColor: null, labelLine1: null, labelLine2: null
});

/* PostgREST devuelve la relación 1:1 como objeto; por si acaso llega como arreglo */
const one = function(v){ return Array.isArray(v) ? (v[0] || null) : (v || null); };

export function toCategory(r){
  const count = Array.isArray(r.products) && r.products[0] && typeof r.products[0].count === 'number' ? r.products[0].count : null;
  return {
    id: r.id, slug: r.slug, name: r.name,
    cardLabel: r.card_label || r.name, rawCardLabel: r.card_label || '',
    description: r.description || '', badge: r.badge || '',
    sortOrder: r.sort_order || 0, isActive: r.is_active !== false,
    productCount: count
  };
}

export function toDesign(r){
  if(!r) return Object.assign({}, DEFAULT_DESIGN);
  return {
    colorTop: r.color_top, colorBottom: r.color_bottom, colorEdge: r.color_edge, speckColor: r.speck_color,
    speckCount: r.speck_count || 0, speckLight: !!r.speck_light,
    coatingColor: r.coating_color || null,
    labelLine1: r.label_line1 || null, labelLine2: r.label_line2 || null
  };
}

export function toImage(r){
  return {
    id: r.id, productId: r.product_id || null,
    storagePath: r.storage_path || null, externalUrl: r.external_url || null,
    url: r.external_url || (r.storage_path ? publicImageUrl(r.storage_path) : ''),
    alt: r.alt_text || '', isPrimary: !!r.is_primary, sortOrder: r.sort_order || 0
  };
}

export function toProduct(r){
  const images = (r.images || []).map(toImage).sort(function(a, b){
    return (b.isPrimary - a.isPrimary) || (a.sortOrder - b.sortOrder);
  });
  return {
    id: r.id, categoryId: r.category_id, slug: r.slug, name: r.name, description: r.description || '',
    price: Number(r.price), isAdult: !!r.is_adult,
    displayMode: r.display_mode === 'image' ? 'image' : 'design',
    featuredRank: r.featured_rank == null ? null : Number(r.featured_rank),
    isActive: r.is_active !== false, sortOrder: r.sort_order || 0,
    design: toDesign(one(r.design)),
    images: images,
    primaryImage: images[0] || null
  };
}

/* ¿La tienda muestra la foto o el chupete 3D? */
export function showsPhoto(product){
  return product.displayMode === 'image' && !!product.primaryImage;
}

export function categoryToRow(c){
  return {
    slug: c.slug, name: c.name.trim(),
    card_label: (c.rawCardLabel || '').trim() || null,
    description: (c.description || '').trim() || null,
    badge: (c.badge || '').trim() || null,
    sort_order: c.sortOrder | 0, is_active: !!c.isActive
  };
}

export function productToRow(p){
  return {
    category_id: p.categoryId, slug: p.slug, name: p.name.trim(),
    description: (p.description || '').trim() || null,
    price: Math.round(Number(p.price) * 100) / 100,
    is_adult: !!p.isAdult, display_mode: p.displayMode === 'image' ? 'image' : 'design',
    featured_rank: p.featuredRank ? Number(p.featuredRank) : null,
    is_active: !!p.isActive, sort_order: p.sortOrder | 0
  };
}

export function designToRow(d){
  const l1 = (d.labelLine1 || '').trim();
  return {
    color_top: d.colorTop, color_bottom: d.colorBottom, color_edge: d.colorEdge, speck_color: d.speckColor,
    speck_count: Math.max(0, Math.min(40, d.speckCount | 0)), speck_light: !!d.speckLight,
    coating_color: d.coatingColor || null,
    label_line1: l1 || null,
    label_line2: l1 ? ((d.labelLine2 || '').trim() || null) : null
  };
}
