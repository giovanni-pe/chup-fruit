import { Emitter } from '../../../core/emitter.js';
import { toCategory, toProduct } from '../../../shared/catalog/catalog.entities.js';

const bySort = function(a, b){ return (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name, 'es'); };

/* Estado del catálogo de la tienda.
   Orden de carga: copia local (al instante) -> Supabase (revalida) -> catálogo de respaldo. */
export class CatalogModel extends Emitter {
  constructor(deps){
    super();
    this.remote = deps.remote;        // SupabaseCatalogRepository | null si no hay clave
    this.fallback = deps.fallback;    // SeedCatalogRepository
    this.cache = deps.cache;          // CatalogCache
    this.categories = [];
    this.products = [];
    this.byId = new Map();
    this.catById = new Map();
    this.source = 'none';
    this.ready = false;
  }

  async load(){
    const cached = this.remote ? this.cache.read() : null;
    if(cached){
      this._apply(cached.data, 'cache');
      this._revalidate(JSON.stringify(cached.data));
      return;
    }
    if(this.remote){
      try{
        const data = await this.remote.fetch();
        this.cache.write(data);
        this._apply(data, 'supabase');
        return;
      }catch(err){
        console.warn('[catálogo] Supabase no respondió; uso el catálogo de respaldo.', err);
      }
    }
    this._apply(await this.fallback.fetch(), 'seed');
  }

  async _revalidate(previous){
    try{
      const data = await this.remote.fetch();
      this.cache.write(data);
      if(JSON.stringify(data) !== previous) this._apply(data, 'supabase');
    }catch(err){
      console.warn('[catálogo] no se pudo actualizar desde Supabase; sigo con la copia local.', err);
    }
  }

  _apply(data, source){
    const cats = data.categories.map(toCategory).filter(function(c){ return c.isActive; }).sort(bySort);
    this.catById = new Map(cats.map(function(c){ return [c.id, c]; }));
    const catById = this.catById;
    this.products = data.products.map(toProduct)
      .filter(function(p){ return p.isActive && catById.has(p.categoryId); })
      .sort(bySort);
    const products = this.products;
    /* un filtro sin sabores no sirve: solo categorías con algo que mostrar */
    this.categories = cats.filter(function(c){ return products.some(function(p){ return p.categoryId === c.id; }); });
    this.byId = new Map(products.map(function(p){ return [p.id, p]; }));
    this.source = source;
    this.ready = true;
    this.emit('change', this);
  }

  get(id){ return this.byId.get(String(id)) || null; }
  has(id){ return this.byId.has(String(id)); }
  findByName(name){ return this.products.find(function(p){ return p.name === name; }) || null; }
  categoryOf(product){ return this.catById.get(product.categoryId) || null; }

  countIn(categoryId){
    return this.products.filter(function(p){ return p.categoryId === categoryId; }).length;
  }

  /* los destacados van en el mostrador de la portada: el 2.º queda al centro, más grande */
  featured(){
    const f = this.products.filter(function(p){ return p.featuredRank != null; })
      .sort(function(a, b){ return (a.featuredRank - b.featuredRank) || bySort(a, b); });
    return (f.length ? f : this.products).slice(0, 3);
  }

  stats(){
    const prices = this.products.map(function(p){ return p.price; });
    return {count: this.products.length, minPrice: prices.length ? Math.min.apply(null, prices) : 0};
  }

  adultProducts(){ return this.products.filter(function(p){ return p.isAdult; }); }
}
