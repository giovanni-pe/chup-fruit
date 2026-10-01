import { IMAGES_BUCKET } from '../../../core/config.js';
import { toProduct } from '../../../shared/catalog/catalog.entities.js';

/* Acceso a public.products + su diseño (product_designs) y fotos (product_images) embebidos */
const SELECT = '*, design:product_designs(*), images:product_images(*)';

function check(res){
  if(res.error) throw res.error;
  return res.data;
}

export class ProductsRepository {
  constructor(sb){ this.sb = sb; }

  async list(){
    const data = check(await this.sb.from('products').select(SELECT).order('sort_order').order('name'));
    return data.map(toProduct);
  }

  async get(id){
    return toProduct(check(await this.sb.from('products').select(SELECT).eq('id', id).single()));
  }

  /* el trigger products_default_design crea su diseño por defecto al insertar */
  async create(row){
    return check(await this.sb.from('products').insert(row).select('id').single()).id;
  }

  async update(id, row){
    check(await this.sb.from('products').update(row).eq('id', id).select('id').single());
  }

  async setActive(id, active){
    check(await this.sb.from('products').update({is_active: active}).eq('id', id).select('id').single());
  }

  async setFeatured(id, rank){
    check(await this.sb.from('products').update({featured_rank: rank}).eq('id', id).select('id').single());
  }

  async saveDesign(productId, designRow){
    check(await this.sb.from('product_designs').upsert(Object.assign({product_id: productId}, designRow), {onConflict: 'product_id'}));
  }

  async remove(id){
    check(await this.sb.from('products').delete().eq('id', id));
  }

  /* las filas de product_images se borran en cascada; los archivos de Storage no */
  async removeFiles(paths){
    if(paths.length) check(await this.sb.storage.from(IMAGES_BUCKET).remove(paths));
  }

  async reorder(ids){
    check(await this.sb.rpc('reorder_products', {p_ids: ids}));
  }
}
