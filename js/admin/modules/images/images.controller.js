import { friendlyError } from '../../../core/supabase-client.js';

/* Eventos de la galería. onChange avisa al editor de productos (vista previa y lista) */
export class ImagesController {
  constructor(model, view, ui){
    this.model = model;
    this.view = view;
    this.toast = ui.toast;
    this.confirm = ui.confirm;
    this.onChange = function(){};
  }

  init(){
    const root = this.view.root;
    this.model.on('change', () => { this.view.render(this.model); this.onChange(this.model.items.slice()); });

    root.addEventListener('change', (e) => {
      if(e.target.id === 'imgFiles'){ this.upload(e.target.files); return; }
      if(e.target.matches('[data-alt]')) this.run(() => this.model.setAlt(e.target.closest('[data-img]').dataset.img, e.target.value));
    });
    root.addEventListener('click', (e) => {
      if(e.target.closest('#imgUrlAdd')){ this.addUrl(); return; }
      const fig = e.target.closest('[data-img]');
      if(!fig) return;
      if(e.target.closest('[data-primary]')) this.run(async () => { await this.model.makePrimary(fig.dataset.img); this.toast.ok('Foto principal actualizada'); });
      else if(e.target.closest('[data-remove]')) this.remove(fig.dataset.img);
    });
    root.addEventListener('keydown', (e) => { if(e.key === 'Enter' && e.target.id === 'imgUrl'){ e.preventDefault(); this.addUrl(); } });
    root.addEventListener('dragover', (e) => { if(this.model.productId){ e.preventDefault(); this.view.highlight(true); } });
    root.addEventListener('dragleave', () => this.view.highlight(false));
    root.addEventListener('drop', (e) => {
      if(!this.model.productId) return;
      e.preventDefault();
      this.view.highlight(false);
      this.upload(e.dataTransfer.files);
    });
  }

  open(product){ this.model.open(product.id, product.images, product.name); }

  async upload(fileList){
    const files = Array.from(fileList || []);
    if(!files.length) return;
    const errors = await this.model.upload(files);
    const ok = files.length - errors.length;
    if(ok) this.toast.ok(ok === 1 ? 'Foto subida' : ok + ' fotos subidas');
    errors.forEach((err) => this.toast.error(typeof err === 'string' ? err : friendlyError(err)));
  }

  async addUrl(){
    const url = this.view.urlValue();
    if(!url) return;
    await this.run(async () => { await this.model.addUrl(url); this.toast.ok('Imagen agregada'); });
  }

  async remove(id){
    const ok = await this.confirm({title: '¿Eliminar esta foto?', text: 'Se borra también el archivo guardado en Supabase Storage.'});
    if(ok) this.run(async () => { await this.model.remove(id); this.toast.ok('Foto eliminada'); });
  }

  async run(action){
    try{ await action(); }catch(err){ this.toast.error(friendlyError(err)); }
  }
}
