import { Emitter } from '../../../core/emitter.js';

const TYPES = /^image\/(webp|jpeg|png|avif|gif)$/;
const MAX_INPUT = 20 * 1024 * 1024;      // lo que acepta del celular antes de optimizar
const MAX_UPLOAD = 5 * 1024 * 1024;      // límite del bucket (file_size_limit)

const byOrder = function(a, b){ return (b.isPrimary - a.isPrimary) || (a.sortOrder - b.sortOrder); };

/* Galería del producto abierto en el editor */
export class ImagesModel extends Emitter {
  constructor(repo, resize){
    super();
    this.repo = repo;
    this.resize = resize;            // (File) -> Promise<{blob, ext, type}>
    this.productId = null;
    this.productName = '';
    this.items = [];
    this.pending = 0;
  }

  open(productId, images, productName){
    this.productId = productId;
    this.productName = productName || '';
    this.items = (images || []).slice().sort(byOrder);
    this.pending = 0;
    this.emit('change');
  }

  primary(){ return this.items.find(function(i){ return i.isPrimary; }) || this.items[0] || null; }

  _next(){
    return {
      isPrimary: !this.items.some(function(i){ return i.isPrimary; }),
      sortOrder: this.items.reduce(function(m, i){ return Math.max(m, i.sortOrder); }, -1) + 1,
      alt: this.productName
    };
  }

  validateFile(file){
    if(!TYPES.test(file.type)) return '«' + file.name + '» no es una imagen JPG, PNG, WebP, AVIF o GIF.';
    if(file.size > MAX_INPUT) return '«' + file.name + '» pesa más de 20 MB.';
    return '';
  }

  /* sube una por una para respetar el orden; devuelve los errores para avisarlos */
  async upload(files){
    const errors = [];
    for(const file of files){
      const problem = this.validateFile(file);
      if(problem){ errors.push(problem); continue; }
      this.pending++; this.emit('change');
      try{
        const out = await this.resize(file);
        if(out.blob.size > MAX_UPLOAD) throw new Error('«' + file.name + '» sigue pesando más de 5 MB después de optimizarla.');
        const img = await this.repo.upload(this.productId, out, this._next());
        this.items.push(img);
        this.items.sort(byOrder);
      }catch(err){
        errors.push(err);
      }finally{
        this.pending--; this.emit('change');
      }
    }
    return errors;
  }

  async addUrl(url){
    if(!/^https:\/\/\S+$/.test(url)) throw new Error('El enlace debe empezar con https://');
    const img = await this.repo.addExternal(this.productId, url, this._next());
    this.items.push(img);
    this.items.sort(byOrder);
    this.emit('change');
  }

  async remove(id){
    const img = this.items.find(function(i){ return i.id === id; });
    if(!img) return;
    await this.repo.remove(img);
    this.items = this.items.filter(function(i){ return i.id !== id; });
    /* si se borró la principal, la siguiente pasa a serlo */
    if(img.isPrimary && this.items.length){
      await this.repo.setPrimary(this.items[0].id);
      this.items[0].isPrimary = true;
    }
    this.emit('change');
  }

  async makePrimary(id){
    await this.repo.setPrimary(id);
    this.items.forEach(function(i){ i.isPrimary = i.id === id; });
    this.items.sort(byOrder);
    this.emit('change');
  }

  async setAlt(id, alt){
    const img = this.items.find(function(i){ return i.id === id; });
    if(!img || img.alt === alt) return;
    await this.repo.updateAlt(id, alt.trim());
    img.alt = alt.trim();
  }
}
