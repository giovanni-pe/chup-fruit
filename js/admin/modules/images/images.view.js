import { el, esc } from '../../../core/dom.js';
import { ICON } from '../../ui/icons.js';

/* Pestaña Fotos: zona para soltar archivos, enlace externo y galería */
export class ImagesView {
  constructor(){ this.root = el('imagesPane'); }

  render(model){
    el('photoCount').textContent = model.items.length || '';
    if(!model.productId){
      this.root.innerHTML = '<p class="notice">Guarda el producto primero; después podrás subir sus fotos aquí.</p>';
      return;
    }
    const pending = Array.from({length: model.pending}, function(){ return '<div class="gimg uploading"><div class="ph"></div></div>'; }).join('');
    this.root.innerHTML =
      '<label class="drop" id="drop">' + ICON.upload +
        '<strong>Toca para elegir fotos o suéltalas aquí</strong>' +
        '<small>JPG, PNG, WebP o AVIF. Se optimizan a WebP de 1200 px. Mejor verticales y con fondo limpio o transparente.</small>' +
        '<input type="file" id="imgFiles" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" multiple>' +
      '</label>' +
      '<div class="url-add"><input type="url" id="imgUrl" placeholder="…o pega un enlace https:// a una imagen" aria-label="Enlace de imagen">' +
        '<button class="btn ghost sm" type="button" id="imgUrlAdd">Agregar</button></div>' +
      (model.items.length || model.pending ? '<div class="gallery">' + model.items.map(function(img){
        const id = esc(img.id);
        return '<figure class="gimg' + (img.isPrimary ? ' primary' : '') + '" data-img="' + id + '">' +
          (img.isPrimary ? '<span class="flag">Principal</span>' : '') +
          '<div class="ph"><img src="' + esc(img.url) + '" alt="' + esc(img.alt) + '" loading="lazy"></div>' +
          '<div class="gbar">' +
            '<button class="ibtn' + (img.isPrimary ? ' on' : '') + '" type="button" data-primary title="Usar como principal" aria-label="Usar como foto principal"' + (img.isPrimary ? ' disabled' : '') + '>' + ICON.star + '</button>' +
            '<button class="ibtn del" type="button" data-remove title="Eliminar" aria-label="Eliminar foto">' + ICON.del + '</button>' +
          '</div>' +
          '<input type="text" data-alt maxlength="160" value="' + esc(img.alt) + '" placeholder="Descripción (accesibilidad)" aria-label="Descripción de la foto">' +
        '</figure>';
      }).join('') + pending + '</div>' : '<p class="muted">Todavía no hay fotos.</p>');
  }

  highlight(on){ const d = el('drop'); if(d) d.classList.toggle('over', on); }
  urlValue(){ return el('imgUrl').value.trim(); }
}
