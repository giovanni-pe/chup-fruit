import { IMAGES_BUCKET } from '../../../core/config.js';
import { toImage } from '../../../shared/catalog/catalog.entities.js';

/* Fotos: archivo en Storage (bucket product-images) + fila en public.product_images */
function check(res){
  if(res.error) throw res.error;
  return res.data;
}

export class ImagesRepository {
  constructor(sb){ this.sb = sb; }

  bucket(){ return this.sb.storage.from(IMAGES_BUCKET); }

  async upload(productId, file, meta){
    const path = 'products/' + productId + '/' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) + '.' + file.ext;
    check(await this.bucket().upload(path, file.blob, {contentType: file.type, cacheControl: '31536000', upsert: false}));
    const res = await this.sb.from('product_images')
      .insert({product_id: productId, storage_path: path, alt_text: meta.alt || null, is_primary: meta.isPrimary, sort_order: meta.sortOrder})
      .select().single();
    if(res.error){
      await this.bucket().remove([path]);         // no dejar archivos huérfanos
      throw res.error;
    }
    return toImage(res.data);
  }

  async addExternal(productId, url, meta){
    return toImage(check(await this.sb.from('product_images')
      .insert({product_id: productId, external_url: url, alt_text: meta.alt || null, is_primary: meta.isPrimary, sort_order: meta.sortOrder})
      .select().single()));
  }

  async remove(image){
    check(await this.sb.from('product_images').delete().eq('id', image.id));
    if(image.storagePath){
      const res = await this.bucket().remove([image.storagePath]);
      if(res.error) console.warn('[fotos] la fila se borró pero el archivo quedó en Storage:', image.storagePath, res.error);
    }
  }

  async setPrimary(id){
    check(await this.sb.rpc('set_primary_product_image', {p_image_id: id}));
  }

  async updateAlt(id, alt){
    check(await this.sb.from('product_images').update({alt_text: alt || null}).eq('id', id));
  }
}
