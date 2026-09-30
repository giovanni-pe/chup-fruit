import { el, esc } from '../../../core/dom.js';
import { ICON } from '../../ui/icons.js';

/* Lista de categorías y formulario en diálogo */
export class CategoriesView {
  constructor(){
    this.list = el('categoriesList');
    this.dialog = el('categoryDialog');
    this.slugTouched = false;
  }

  render(model){
    if(model.loading && !model.items.length){
      this.list.innerHTML = '<div class="skel-row"></div><div class="skel-row"></div><div class="skel-row"></div>';
      return;
    }
    if(model.error && !model.items.length){
      this.list.innerHTML = '<p class="empty error">No se pudieron cargar las categorías. <button class="btn-link" type="button" data-retry>Reintentar</button></p>';
      return;
    }
    if(!model.items.length){
      this.list.innerHTML = '<p class="empty">Todavía no hay categorías. Crea la primera con «Nueva categoría».</p>';
      return;
    }
    const last = model.items.length - 1;
    this.list.innerHTML = model.items.map(function(c, i){
      const id = esc(c.id), name = esc(c.name);
      return '<article class="row cat' + (c.isActive ? '' : ' off') + '" data-id="' + id + '">' +
        '<div class="order">' +
          '<button class="ibtn" type="button" data-move="-1" aria-label="Subir ' + name + '"' + (i === 0 ? ' disabled' : '') + '>' + ICON.up + '</button>' +
          '<button class="ibtn" type="button" data-move="1" aria-label="Bajar ' + name + '"' + (i === last ? ' disabled' : '') + '>' + ICON.down + '</button>' +
        '</div>' +
        '<div class="nm"><strong>' + name + (c.badge ? '<span class="badge">' + esc(c.badge) + '</span>' : '') + '</strong><small>' + esc(c.slug) + '</small></div>' +
        '<div class="meta">' +
          '<span class="tagc" title="Texto en la tarjeta">' + esc(c.cardLabel) + '</span>' +
          '<span>' + (c.productCount == null ? '—' : c.productCount) + (c.productCount === 1 ? ' producto' : ' productos') + '</span>' +
          '<label class="switch"><input type="checkbox" data-toggle' + (c.isActive ? ' checked' : '') + ' aria-label="Visible: ' + name + '"><span>' + (c.isActive ? 'Visible' : 'Oculta') + '</span></label>' +
        '</div>' +
        '<div class="acts">' +
          '<button class="ibtn" type="button" data-edit aria-label="Editar ' + name + '">' + ICON.edit + '</button>' +
          '<button class="ibtn del" type="button" data-del aria-label="Eliminar ' + name + '">' + ICON.del + '</button>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  /* ----- formulario ----- */
  open(c){
    this.editing = c;
    this.slugTouched = !!c.id;
    el('catTitle').textContent = c.id ? 'Editar categoría' : 'Nueva categoría';
    el('cName').value = c.name;
    el('cSlug').value = c.slug;
    el('cCardLabel').value = c.rawCardLabel;
    el('cBadge').value = c.badge;
    el('cDescription').value = c.description;
    el('cActive').checked = c.isActive;
    this.errors({});
    this.formError('');
    this.busy(false);
    this.dialog.showModal();
    setTimeout(function(){ el('cName').focus(); }, 30);
  }

  close(){ this.dialog.close(); }

  read(){
    return Object.assign({}, this.editing, {
      name: el('cName').value,
      slug: el('cSlug').value.trim(),
      rawCardLabel: el('cCardLabel').value,
      badge: el('cBadge').value,
      description: el('cDescription').value,
      isActive: el('cActive').checked
    });
  }

  setSlug(slug){ el('cSlug').value = slug; }

  errors(map){
    this.dialog.querySelectorAll('[data-err]').forEach(function(n){
      n.textContent = map[n.dataset.err] || '';
      n.closest('.fld').classList.toggle('invalid', !!map[n.dataset.err]);
    });
  }

  formError(msg){ el('catError').textContent = msg; }

  busy(on){
    el('catSave').classList.toggle('busy', on);
    el('catSave').disabled = on;
  }
}
