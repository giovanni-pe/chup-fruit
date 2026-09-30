import { Emitter } from '../../../core/emitter.js';
import { DEFAULT_DESIGN, productToRow, designToRow } from '../../../shared/catalog/catalog.entities.js';

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const plain = function(t){ return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
const bySort = function(a, b){ return (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name, 'es'); };

/* Estado y reglas de los productos */
export class ProductsModel extends Emitter {
  constructor(repo){
    super();
    this.repo = repo;
    this.items = [];
    this.loading = false;
    this.error = null;
    this.filter = {q: '', categoryId: ''};
  }

  async load(){
    this.loading = true; this.emit('change');
    try{
      this.items = await this.repo.list();
      this.error = null;
    }catch(err){
      this.error = err;
    }finally{
      this.loading = false;
      this.emit('change');
    }
  }

  get(id){ return this.items.find(function(p){ return p.id === id; }) || null; }

  setFilter(patch){ Object.assign(this.filter, patch); this.emit('change'); }

  visible(){
    const q = plain(this.filter.q).trim(), cat = this.filter.categoryId;
    return this.items.filter(function(p){
      return (!cat || p.categoryId === cat) && (!q || plain(p.name).indexOf(q) >= 0 || p.slug.indexOf(q) >= 0);
    });
  }

  counts(){
    const c = {};
    this.items.forEach(function(p){ c[p.categoryId] = (c[p.categoryId] || 0) + 1; });
    return c;
  }

  blank(categoryId){
    const last = this.items.reduce(function(m, p){ return Math.max(m, p.sortOrder); }, 0);
    return {id: null, categoryId: categoryId || '', slug: '', name: '', description: '', price: 2, isAdult: false,
      displayMode: 'design', featuredRank: null, isActive: true, sortOrder: last + 10,
      design: Object.assign({}, DEFAULT_DESIGN), images: [], primaryImage: null};
  }

  validate(p){
    const e = {};
    if(!p.name.trim()) e.name = 'Escribe el nombre del sabor.';
    else if(p.name.trim().length > 80) e.name = 'Máximo 80 caracteres.';
    if(!SLUG.test(p.slug)) e.slug = 'Usa minúsculas, números y guiones (ej. fresa-con-leche).';
    else if(this.items.some(function(x){ return x.slug === p.slug && x.id !== p.id; })) e.slug = 'Ya hay otro producto con este identificador.';
    if(!p.categoryId) e.categoryId = 'Elige una categoría (créala primero en «Categorías»).';
    const price = Number(p.price);
    if(p.price === '' || !isFinite(price) || price < 0 || price > 9999) e.price = 'Escribe un precio entre 0 y 9999.';
    if((p.description || '').length > 500) e.description = 'Máximo 500 caracteres.';
    return e;
  }

  /* guarda producto + diseño; si es nuevo, devuelve el producto ya con id */
  /* posición de portada -> nombre del producto que la ocupa (sin contar al que se edita) */
  featuredHolders(exceptId){
    const h = {};
    this.items.forEach(function(p){ if(p.featuredRank && p.id !== exceptId) h[p.featuredRank] = p.name; });
    return h;
  }

  async save(p, design){
    /* cada posición de la portada es de un solo producto: se libera en el que la tenía */
    const rank = p.featuredRank ? Number(p.featuredRank) : null;
    for(const other of this.items.filter(function(x){ return rank && x.id !== p.id && x.featuredRank === rank; })){
      await this.repo.setFeatured(other.id, null);
      other.featuredRank = null;
    }
    let id = p.id;
    if(id) await this.repo.update(id, productToRow(p));
    else id = await this.repo.create(productToRow(p));
    try{
      await this.repo.saveDesign(id, designToRow(design));
    }catch(err){
      err.productId = id;                 // el producto ya existe: el editor no debe volver a crearlo
      throw err;
    }finally{
      this._replace(await this.repo.get(id));
    }
    return this.get(id);
  }

  async toggle(id){
    const p = this.get(id);
    await this.repo.setActive(id, !p.isActive);
    p.isActive = !p.isActive;
    this.emit('change');
    return p;
  }

  async remove(id){
    const p = this.get(id);
    await this.repo.remove(id);
    const paths = p.images.filter(function(i){ return i.storagePath; }).map(function(i){ return i.storagePath; });
    try{ await this.repo.removeFiles(paths); }catch(err){ console.warn('[productos] quedaron fotos en Storage:', paths, err); }
    this.items = this.items.filter(function(x){ return x.id !== id; });
    this.emit('change');
  }

  /* sube o baja respecto al vecino visible (respeta búsqueda y filtro) */
  async move(id, dir){
    const vis = this.visible(), i = vis.findIndex(function(p){ return p.id === id; });
    const neighbor = vis[i + dir];
    if(!neighbor) return;
    const list = this.items.slice();
    const from = list.findIndex(function(p){ return p.id === id; });
    const item = list.splice(from, 1)[0];
    const to = list.findIndex(function(p){ return p.id === neighbor.id; }) + (dir > 0 ? 1 : 0);
    list.splice(to, 0, item);
    await this.repo.reorder(list.map(function(p){ return p.id; }));
    list.forEach(function(p, k){ p.sortOrder = (k + 1) * 10; });
    this.items = list;
    this.emit('change');
  }

  /* la galería cambió en el editor: la lista y la tienda usan la foto principal */
  setImages(id, images){
    const p = this.get(id);
    if(!p) return;
    p.images = images;
    p.primaryImage = images.find(function(i){ return i.isPrimary; }) || images[0] || null;
    this.emit('change');
  }

  _replace(product){
    const i = this.items.findIndex(function(x){ return x.id === product.id; });
    if(i >= 0) this.items[i] = product; else this.items.push(product);
    this.items.sort(bySort);
    this.emit('change');
  }
}
