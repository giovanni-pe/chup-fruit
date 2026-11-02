import { el, esc, money } from '../../../core/dom.js';
import { buildProductVisual } from '../../../shared/popsicle/popsicle.view.js';
import { ICON } from '../../ui/icons.js';

const FEATURED = {1: 'Portada 1', 2: 'Portada 2', 3: 'Portada 3'};

/* ISO -> valor de <input type="datetime-local"> en la hora local */
function toLocalInput(iso){
  if(!iso) return '';
  const d = new Date(iso), pad = function(n){ return String(n).padStart(2, '0'); };
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function formatDate(iso){
  return new Date(iso).toLocaleString('es-PE', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'});
}

function stockBadge(p){
  if(p.stock == null) return '';
  return '<span class="badge ' + (p.stock === 0 ? 'out' : p.stock <= 10 ? 'low' : 'stock') + '">' +
    (p.stock === 0 ? 'Agotado' : 'Stock ' + p.stock) + '</span>';
}

/* Lista de productos y formulario del editor (pestaña Datos) */
export class ProductsView {
  constructor(){
    this.list = el('productsList');
    this.dialog = el('productEditor');
    this.slugTouched = false;
  }

  /* ---------- lista ---------- */
  renderList(model, categories){
    const s = el('productsSummary');
    if(model.loading && !model.items.length){
      s.textContent = 'Cargando…';
      this.list.innerHTML = '<div class="skel-row"></div><div class="skel-row"></div><div class="skel-row"></div><div class="skel-row"></div>';
      return;
    }
    if(model.error && !model.items.length){
      s.textContent = '';
      this.list.innerHTML = '<p class="empty error">No se pudieron cargar los productos. <button class="btn-link" type="button" data-retry>Reintentar</button></p>';
      return;
    }
    const active = model.items.filter(function(p){ return p.isActive; }).length;
    s.textContent = model.items.length + ' productos · ' + active + ' visibles en la tienda';

    const vis = model.visible();
    if(!vis.length){
      this.list.innerHTML = '<p class="empty">' + (model.items.length ? 'Ningún producto coincide con la búsqueda.' : 'Todavía no hay productos. Crea el primero con «Nuevo producto».') + '</p>';
      return;
    }
    this.list.innerHTML = '';
    vis.forEach((p, i) => {
      const cat = categories.get(p.categoryId);
      const name = esc(p.name);
      const row = document.createElement('article');
      row.className = 'row prod' + (p.isActive && (!cat || cat.isActive) ? '' : ' off');
      row.dataset.id = p.id;
      row.innerHTML =
        '<div class="order">' +
          '<button class="ibtn" type="button" data-move="-1" aria-label="Subir ' + name + '"' + (i === 0 ? ' disabled' : '') + '>' + ICON.up + '</button>' +
          '<button class="ibtn" type="button" data-move="1" aria-label="Bajar ' + name + '"' + (i === vis.length - 1 ? ' disabled' : '') + '>' + ICON.down + '</button>' +
        '</div>' +
        '<div class="thumb"></div>' +
        '<div class="nm"><strong>' + name + (p.isAdult ? '<span class="badge">+18</span>' : '') + '</strong><small>' + esc(p.slug) + '</small></div>' +
        '<div class="meta">' +
          '<span><span class="tagc">' + esc(cat ? cat.name : 'Sin categoría') + '</span>' + (cat && !cat.isActive ? ' <small class="muted">(oculta)</small>' : '') + '</span>' +
          '<span class="price">' + money(p.price) + '</span>' +
          '<span>' + (p.featuredRank ? '<span class="badge star">' + (FEATURED[p.featuredRank] || 'Portada') + '</span>' : '') +
            (p.displayMode === 'image' ? '<span class="badge photo">' + (p.primaryImage ? 'Foto' : 'Foto (sin subir)') + '</span>' : '') +
            stockBadge(p) +
            (p.publishAt && new Date(p.publishAt).getTime() > Date.now() ? '<span class="badge sched" title="Se publica el ' + esc(formatDate(p.publishAt)) + '">Desde ' + esc(formatDate(p.publishAt)) + '</span>' : '') +
            '</span>' +
          '<label class="switch"><input type="checkbox" data-toggle' + (p.isActive ? ' checked' : '') + ' aria-label="Visible: ' + name + '"><span>' + (p.isActive ? 'Visible' : 'Oculto') + '</span></label>' +
        '</div>' +
        '<div class="acts">' +
          '<button class="ibtn" type="button" data-edit aria-label="Editar ' + name + '">' + ICON.edit + '</button>' +
          '<button class="ibtn del" type="button" data-del aria-label="Eliminar ' + name + '">' + ICON.del + '</button>' +
        '</div>';
      row.querySelector('.thumb').appendChild(buildProductVisual(p));
      this.list.appendChild(row);
    });
  }

  renderCategoryOptions(categories){
    const filter = el('productCategoryFilter'), current = filter.value;
    filter.innerHTML = '<option value="">Todas las categorías</option>' + categories.map(function(c){
      return '<option value="' + esc(c.id) + '">' + esc(c.name) + (c.isActive ? '' : ' (oculta)') + '</option>';
    }).join('');
    filter.value = categories.some(function(c){ return c.id === current; }) ? current : '';

    const sel = el('pCategory'), picked = sel.value;
    sel.innerHTML = (categories.length ? '' : '<option value="">Primero crea una categoría</option>') + categories.map(function(c){
      return '<option value="' + esc(c.id) + '">' + esc(c.name) + (c.isActive ? '' : ' (oculta)') + '</option>';
    }).join('');
    if(picked) sel.value = picked;
  }

  /* ---------- editor ---------- */
  renderFeaturedOptions(holders){
    el('pFeatured').querySelectorAll('option[value]:not([value=""])').forEach(function(o){
      o.dataset.base = o.dataset.base || o.textContent;
      o.textContent = o.dataset.base + (holders[o.value] ? ' — ahora: ' + holders[o.value] : '');
    });
  }

  open(p){
    this.slugTouched = !!p.id;
    this.setTitle(p);
    el('pName').value = p.name;
    el('pSlug').value = p.slug;
    el('pCategory').value = p.categoryId;
    el('pPrice').value = p.id || p.price ? Number(p.price).toFixed(2) : '';
    el('pDescription').value = p.description;
    el('pStock').value = p.stock == null ? '' : p.stock;
    el('pPublishAt').value = toLocalInput(p.publishAt);
    this.publishHint(el('pPublishAt').value);
    document.querySelectorAll('input[name="pDisplay"]').forEach(function(r){ r.checked = r.value === p.displayMode; });
    el('pFeatured').value = p.featuredRank ? String(p.featuredRank) : '';
    el('pActive').checked = p.isActive;
    el('pAdult').checked = p.isAdult;
    this.errors({});
    this.formError('');
    this.busy(false);
    this.tab('datos');
    if(!this.dialog.open) this.dialog.showModal();
    setTimeout(function(){ if(!p.id) el('pName').focus(); }, 30);
  }

  setTitle(p){ el('edTitle').textContent = p.id ? 'Editar «' + p.name + '»' : 'Nuevo producto'; }
  close(){ this.dialog.close(); }

  read(){
    const display = document.querySelector('input[name="pDisplay"]:checked');
    return {
      name: el('pName').value,
      slug: el('pSlug').value.trim(),
      categoryId: el('pCategory').value,
      price: el('pPrice').value,
      description: el('pDescription').value,
      stock: el('pStock').value.trim(),
      publishAt: el('pPublishAt').value ? new Date(el('pPublishAt').value).toISOString() : null,
      displayMode: display ? display.value : 'design',
      featuredRank: el('pFeatured').value ? +el('pFeatured').value : null,
      isActive: el('pActive').checked,
      isAdult: el('pAdult').checked
    };
  }

  publishHint(value){
    const t = value ? new Date(value).getTime() : 0;
    el('pPublishHint').textContent = !t ? 'Vacío = se publica de inmediato.'
      : t > Date.now() ? 'Programado: aparecerá en la tienda el ' + formatDate(new Date(t).toISOString()) + '.'
      : 'Ya publicado (la fecha pasó).';
  }

  setSlug(slug){ el('pSlug').value = slug; }

  tab(name){
    this.dialog.querySelectorAll('.ed-tabs button').forEach(function(b){ b.classList.toggle('sel', b.dataset.tab === name); });
    this.dialog.querySelectorAll('.ed-pane').forEach(function(p){ p.hidden = p.dataset.pane !== name; });
  }

  displayHint(mode, hasPhoto){
    el('pDisplayHint').textContent = mode === 'image' && !hasPhoto ? 'Sube la foto en la pestaña Fotos; mientras no haya, se muestra el chupete 3D.' : '';
  }

  errors(map){
    el('productForm').querySelectorAll('[data-pane="datos"] [data-err]').forEach(function(n){
      n.textContent = map[n.dataset.err] || '';
      n.closest('.fld').classList.toggle('invalid', !!map[n.dataset.err]);
    });
  }

  formError(msg){ el('edError').textContent = msg; }

  busy(on){
    el('edSave').classList.toggle('busy', on);
    el('edSave').disabled = on;
  }
}
