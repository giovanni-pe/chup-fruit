import { el, slugify } from '../../../core/dom.js';
import { friendlyError } from '../../../core/supabase-client.js';

/* Lista de productos + editor. El editor compone dos módulos: designer (Diseño) e images (Fotos). */
export class ProductsController {
  constructor(model, view, deps){
    this.model = model;
    this.view = view;
    this.categories = deps.categories;
    this.designer = deps.designer;
    this.images = deps.images;
    this.toast = deps.toast;
    this.confirm = deps.confirm;
    this.editing = null;        // producto abierto en el editor
    this.snapshot = '';         // para avisar si se cierra con cambios sin guardar
  }

  init(){
    const m = this.model, v = this.view;
    m.on('change', () => {
      v.renderList(m, this.categories);
      this.categories.setCounts(m.counts());
    });
    this.categories.on('change', () => {
      v.renderCategoryOptions(this.categories.items);
      v.renderList(m, this.categories);
    });
    this.images.onChange = (images) => this.onImagesChange(images);

    el('newProduct').addEventListener('click', () => this.openNew());
    el('productSearch').addEventListener('input', (e) => m.setFilter({q: e.target.value}));
    el('productCategoryFilter').addEventListener('change', (e) => m.setFilter({categoryId: e.target.value}));
    v.list.addEventListener('click', (e) => this.onListClick(e));
    v.list.addEventListener('change', (e) => {
      if(e.target.matches('[data-toggle]')) this.toggle(e.target.closest('[data-id]').dataset.id, e.target);
    });
    this.bindEditor();
  }

  onListClick(e){
    if(e.target.closest('[data-retry]')){ this.model.load(); return; }
    const row = e.target.closest('[data-id]');
    if(!row) return;
    const id = row.dataset.id;
    const mv = e.target.closest('[data-move]');
    if(mv){ this.run(() => this.model.move(id, +mv.dataset.move)); return; }
    if(e.target.closest('[data-edit]') || e.target.closest('.thumb, .nm')){ this.openEdit(id); return; }
    if(e.target.closest('[data-del]')) this.remove(id);
  }

  /* ---------- editor ---------- */
  openNew(){
    if(!this.categories.items.length){
      this.toast.error('Primero crea una categoría en la pestaña «Categorías».');
      return;
    }
    const cat = this.model.filter.categoryId || (this.categories.active()[0] || this.categories.items[0]).id;
    this.open(this.model.blank(cat));
  }

  openEdit(id){
    const p = this.model.get(id);
    if(p) this.open(p);
  }

  open(p){
    this.editing = p;
    this.view.renderFeaturedOptions(this.model.featuredHolders(p.id));
    this.view.open(p);
    this.images.open(p);
    this.designer.open(p.design, this.meta(), this.model.items, p.id);
    this.view.displayHint(p.displayMode, !!p.primaryImage);
    this.snapshot = this.state();
  }

  /* datos del formulario que la vista previa necesita */
  meta(){
    const f = this.view.read(), cat = this.categories.get(f.categoryId);
    return {name: f.name.trim(), price: Number(f.price) || 0, description: f.description.trim(), categoryLabel: cat ? cat.cardLabel : '',
      isAdult: f.isAdult, isActive: f.isActive, displayMode: f.displayMode, photo: this.images.model.primary()};
  }

  state(){ return JSON.stringify([this.view.read(), this.designer.value()]); }

  bindEditor(){
    const v = this.view, form = el('productForm');
    form.querySelector('[data-pane="datos"]').addEventListener('input', (e) => {
      if(e.target.id === 'pName' && !v.slugTouched) v.setSlug(slugify(e.target.value));
      if(e.target.id === 'pSlug') v.slugTouched = true;
      this.designer.updateMeta(this.meta());
    });
    form.querySelector('[data-pane="datos"]').addEventListener('change', () => {
      const meta = this.meta();
      this.designer.updateMeta(meta);
      v.displayHint(meta.displayMode, !!meta.photo);
    });
    el('pSlug').addEventListener('blur', () => v.setSlug(slugify(el('pSlug').value)));
    form.querySelector('.ed-tabs').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-tab]');
      if(b) v.tab(b.dataset.tab);
    });
    form.addEventListener('submit', (e) => { e.preventDefault(); this.save(); });
    el('edCancel').addEventListener('click', () => this.requestClose());
    el('edClose').addEventListener('click', () => this.requestClose());
    v.dialog.addEventListener('cancel', (e) => { e.preventDefault(); this.requestClose(); });
  }

  async requestClose(){
    if(this.state() !== this.snapshot){
      const ok = await this.confirm({title: '¿Salir sin guardar?', text: 'Perderás los cambios de este producto.', okLabel: 'Salir sin guardar'});
      if(!ok) return;
    }
    this.view.close();
    this.editing = null;
  }

  async save(){
    const form = this.view.read();
    const draft = Object.assign({}, this.editing, form);
    const errors = this.model.validate(draft);
    this.view.errors(errors);
    const designErrors = this.designer.validate();
    if(Object.keys(errors).length){ this.view.tab('datos'); return; }
    if(Object.keys(designErrors).length){ this.view.tab('diseno'); return; }

    const isNew = !draft.id;
    this.view.formError('');
    this.view.busy(true);
    try{
      const saved = await this.model.save(draft, this.designer.value());
      this.editing = saved;
      this.snapshot = this.state();
      if(isNew && saved.displayMode === 'image'){
        /* producto nuevo en modo foto: se queda abierto para subir la foto */
        this.view.setTitle(saved);
        this.images.open(saved);
        this.view.tab('fotos');
        this.toast.ok('Producto creado. Ahora sube su foto.');
      }else{
        this.view.close();
        this.editing = null;
        this.toast.ok(isNew ? '«' + saved.name + '» creado' : 'Cambios guardados');
      }
    }catch(err){
      if(err.productId && !this.editing.id){
        this.editing = this.model.get(err.productId) || Object.assign({}, draft, {id: err.productId});
        this.view.setTitle(this.editing);
        this.images.open(this.editing);
      }
      this.view.formError(friendlyError(err));
    }finally{
      this.view.busy(false);
    }
  }

  onImagesChange(images){
    if(!this.editing || !this.editing.id) return;
    this.model.setImages(this.editing.id, images);
    const meta = this.meta();
    this.designer.updateMeta(meta);
    this.view.displayHint(meta.displayMode, !!meta.photo);
  }

  /* ---------- acciones de la lista ---------- */
  async toggle(id, input){
    try{
      const p = await this.model.toggle(id);
      this.toast.ok(p.isActive ? '«' + p.name + '» ya se ve en la tienda' : '«' + p.name + '» quedó oculto');
    }catch(err){
      input.checked = !input.checked;
      this.toast.error(friendlyError(err));
    }
  }

  async remove(id){
    const p = this.model.get(id);
    const ok = await this.confirm({
      title: '¿Eliminar «' + p.name + '»?',
      text: 'Se borran el producto, su diseño y sus fotos. Si solo quieres dejar de venderlo, mejor ocúltalo.'
    });
    if(ok) this.run(async () => { await this.model.remove(id); this.toast.ok('Producto eliminado'); });
  }

  async run(action){
    try{ await action(); }catch(err){ this.toast.error(friendlyError(err)); }
  }
}
