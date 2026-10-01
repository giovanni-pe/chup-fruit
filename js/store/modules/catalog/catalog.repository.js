import { restSelect } from '../../../core/supabase-rest.js';
import { store } from '../../../core/storage.js';
import { SEED_CATEGORIES, SEED_PRODUCTS } from '../../../shared/catalog/catalog.seed.js';

/* Adaptadores del catálogo. Todos cumplen el mismo contrato:
   fetch() -> Promise<{categories: fila[], products: fila[]}> */

const CATEGORY_FIELDS = 'id,slug,name,card_label,description,badge,sort_order,is_active';
const PRODUCT_FIELDS = 'id,category_id,slug,name,description,price,is_adult,display_mode,featured_rank,sort_order,is_active,' +
  'design:product_designs(color_top,color_bottom,color_edge,speck_color,speck_count,speck_light,coating_color,label_line1,label_line2),' +
  'images:product_images(id,storage_path,external_url,alt_text,is_primary,sort_order)';

/* Supabase: solo lo publicado (además la RLS ya oculta a "anon" lo inactivo) */
export class SupabaseCatalogRepository {
  async fetch(){
    const res = await Promise.all([
      restSelect('categories', {select: CATEGORY_FIELDS, is_active: 'eq.true', order: 'sort_order.asc,name.asc'}),
      restSelect('products', {select: PRODUCT_FIELDS, is_active: 'eq.true', order: 'sort_order.asc,name.asc'})
    ]);
    return {categories: res[0], products: res[1]};
  }
}

/* Respaldo: el catálogo original embebido en la página */
export class SeedCatalogRepository {
  async fetch(){
    return {categories: SEED_CATEGORIES, products: SEED_PRODUCTS};
  }
}

/* Última respuesta buena de Supabase: en las siguientes visitas la tienda pinta al instante */
export class CatalogCache {
  constructor(key){ this.key = key || 'chup_catalogo_v1'; }

  read(){
    const c = store.get(this.key, null);
    return c && c.data && Array.isArray(c.data.categories) && Array.isArray(c.data.products) ? c : null;
  }

  write(data){ store.set(this.key, {savedAt: Date.now(), data: data}); }
}
