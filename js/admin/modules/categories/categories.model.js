import { Emitter } from '../../../core/emitter.js';

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/* Estado y reglas de las categorías del catálogo */
export class CategoriesModel extends Emitter {
  constructor(repo){
    super();
    this.repo = repo;
    this.items = [];
    this.loading = false;
    this.error = null;
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

  get(id){ return this.items.find(function(c){ return c.id === id; }) || null; }
  active(){ return this.items.filter(function(c){ return c.isActive; }); }

  blank(){
    const last = this.items.reduce(function(m, c){ return Math.max(m, c.sortOrder); }, 0);
    return {id: null, slug: '', name: '', rawCardLabel: '', description: '', badge: '', sortOrder: last + 10, isActive: true, productCount: 0};
  }

  validate(c){
    const e = {};
    if(!c.name.trim()) e.name = 'Escribe el nombre.';
    else if(c.name.trim().length > 60) e.name = 'Máximo 60 caracteres.';
    if(!SLUG.test(c.slug)) e.slug = 'Usa minúsculas, números y guiones (ej. con-licor).';
    else if(this.items.some(function(x){ return x.slug === c.slug && x.id !== c.id; })) e.slug = 'Ya hay otra categoría con este identificador.';
    return e;
  }

  async save(c){
    const saved = c.id ? await this.repo.update(c.id, c) : await this.repo.create(c);
    const i = this.items.findIndex(function(x){ return x.id === saved.id; });
    if(i >= 0) this.items[i] = saved; else this.items.push(saved);
    this._sort();
    this.emit('change');
    return saved;
  }

  async toggle(id){
    const c = this.get(id);
    const saved = await this.repo.setActive(id, !c.isActive);
    Object.assign(c, saved);
    this.emit('change');
    return c;
  }

  async remove(id){
    const c = this.get(id);
    if(c && c.productCount > 0) throw new Error('«' + c.name + '» tiene ' + c.productCount + ' producto(s). Muévelos a otra categoría o desactívala.');
    await this.repo.remove(id);
    this.items = this.items.filter(function(x){ return x.id !== id; });
    this.emit('change');
  }

  /* sube o baja una posición y guarda el orden completo en una sola llamada */
  async move(id, dir){
    const i = this.items.findIndex(function(c){ return c.id === id; }), j = i + dir;
    if(i < 0 || j < 0 || j >= this.items.length) return;
    const list = this.items.slice();
    list.splice(j, 0, list.splice(i, 1)[0]);
    await this.repo.reorder(list.map(function(c){ return c.id; }));
    list.forEach(function(c, k){ c.sortOrder = (k + 1) * 10; });
    this.items = list;
    this.emit('change');
  }

  /* el conteo de productos lo cambia el módulo de productos al crear, mover o borrar */
  setCounts(counts){
    this.items.forEach(function(c){ c.productCount = counts[c.id] || 0; });
    this.emit('change');
  }

  _sort(){
    this.items.sort(function(a, b){ return (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name, 'es'); });
  }
}
