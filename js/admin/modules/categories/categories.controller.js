import { el, slugify } from '../../../core/dom.js';
import { friendlyError } from '../../../core/supabase-client.js';

/* Crear, editar, ocultar, ordenar y eliminar categorías */
export class CategoriesController {
  constructor(model, view, ui){
    this.model = model;
    this.view = view;
    this.toast = ui.toast;
    this.confirm = ui.confirm;
  }

  init(){
    this.model.on('change', () => this.view.render(this.model));
    this.view.render(this.model);

    el('newCategory').addEventListener('click', () => this.view.open(this.model.blank()));
    this.view.list.addEventListener('click', (e) => this.onListClick(e));
    this.view.list.addEventListener('change', (e) => {
      if(e.target.matches('[data-toggle]')) this.toggle(e.target.closest('[data-id]').dataset.id, e.target);
    });

    el('cName').addEventListener('input', () => { if(!this.view.slugTouched) this.view.setSlug(slugify(el('cName').value)); });
    el('cSlug').addEventListener('input', () => { this.view.slugTouched = true; });
    el('cSlug').addEventListener('blur', () => this.view.setSlug(slugify(el('cSlug').value)));
    el('categoryForm').addEventListener('submit', (e) => { e.preventDefault(); this.save(); });
    el('catCancel').addEventListener('click', () => this.view.close());
    el('catClose').addEventListener('click', () => this.view.close());
  }

  onListClick(e){
    if(e.target.closest('[data-retry]')){ this.model.load(); return; }
    const row = e.target.closest('[data-id]');
    if(!row) return;
    const id = row.dataset.id;
    const mv = e.target.closest('[data-move]');
    if(mv){ this.run(() => this.model.move(id, +mv.dataset.move)); return; }
    if(e.target.closest('[data-edit]')){ this.view.open(Object.assign({}, this.model.get(id))); return; }
    if(e.target.closest('[data-del]')) this.remove(id);
  }

  async save(){
    const c = this.view.read();
    const errors = this.model.validate(c);
    this.view.errors(errors);
    if(Object.keys(errors).length) return;
    this.view.busy(true);
    try{
      const saved = await this.model.save(c);
      this.view.close();
      this.toast.ok(c.id ? 'Categoría actualizada' : 'Categoría «' + saved.name + '» creada');
    }catch(err){
      this.view.formError(friendlyError(err));
    }finally{
      this.view.busy(false);
    }
  }

  async toggle(id, input){
    try{
      const c = await this.model.toggle(id);
      this.toast.ok(c.isActive ? '«' + c.name + '» ya se ve en la tienda' : '«' + c.name + '» y sus productos quedaron ocultos');
    }catch(err){
      input.checked = !input.checked;
      this.toast.error(friendlyError(err));
    }
  }

  async remove(id){
    const c = this.model.get(id);
    if(c.productCount > 0){
      this.toast.error('«' + c.name + '» tiene ' + c.productCount + ' producto(s): muévelos a otra categoría o desactívala.');
      return;
    }
    const ok = await this.confirm({title: '¿Eliminar «' + c.name + '»?', text: 'La categoría se borra de forma permanente.'});
    if(ok) this.run(async () => { await this.model.remove(id); this.toast.ok('Categoría eliminada'); });
  }

  async run(action){
    try{ await action(); }catch(err){ this.toast.error(friendlyError(err)); }
  }
}
