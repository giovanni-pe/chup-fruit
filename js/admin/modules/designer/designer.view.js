import { el, esc, money } from '../../../core/dom.js';
import { buildProductVisual } from '../../../shared/popsicle/popsicle.view.js';

/* Controles del diseñador (pestaña Diseño) y tarjeta de vista previa */
export class DesignerView {
  constructor(){
    this.pane = document.querySelector('[data-pane="diseno"]');
    this.card = el('pvCard');
    this.frame = 0;
  }

  fill(model){
    const d = model.design;
    this.pane.querySelectorAll('[data-color]').forEach(function(inp){
      const v = d[inp.dataset.color] || (inp.dataset.color === 'coatingColor' ? model.lastCoating : '#000000');
      inp.value = v;
    });
    this.pane.querySelectorAll('[data-hex]').forEach(function(inp){
      if(document.activeElement === inp) return;
      inp.value = d[inp.dataset.hex] || (inp.dataset.hex === 'coatingColor' ? model.lastCoating : '');
      inp.classList.remove('bad');
    });
    el('dSpeckCount').value = d.speckCount;
    el('dSpeckCountOut').textContent = d.speckCount;
    el('dSpeckLight').checked = d.speckLight;
    el('dCoating').checked = !!d.coatingColor;
    el('dCoatingColorWrap').hidden = !d.coatingColor;
    this.pane.querySelectorAll('input[name="dLabel"]').forEach(function(r){ r.checked = r.value === model.labelMode; });
    el('dLabelFields').hidden = model.labelMode !== 'custom';
    if(document.activeElement !== el('dLabel1')) el('dLabel1').value = d.labelLine1 || '';
    if(document.activeElement !== el('dLabel2')) el('dLabel2').value = d.labelLine2 || '';
  }

  syncColor(field, hex){
    const c = this.pane.querySelector('[data-color="' + field + '"]'), t = this.pane.querySelector('[data-hex="' + field + '"]');
    if(c) c.value = hex;
    if(t && document.activeElement !== t) t.value = hex;
    if(t) t.classList.remove('bad');
  }

  markHex(field, bad){ this.pane.querySelector('[data-hex="' + field + '"]').classList.toggle('bad', bad); }

  renderPresets(products, excludeId){
    el('dPreset').innerHTML = '<option value="">Elegir sabor…</option>' + products
      .filter(function(p){ return p.id !== excludeId; })
      .map(function(p){ return '<option value="' + esc(p.id) + '">' + esc(p.name) + '</option>'; }).join('');
  }

  errors(map){
    this.pane.querySelectorAll('[data-err]').forEach(function(n){
      n.textContent = map[n.dataset.err] || '';
      n.closest('.fld').classList.toggle('invalid', !!map[n.dataset.err]);
    });
  }

  /* se dibuja como mucho una vez por cuadro aunque se arrastre el selector de color */
  schedulePreview(model){
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.renderPreview(model));
  }

  renderPreview(model){
    const m = model.meta, design = model.value();
    const product = {name: m.name || 'Nuevo sabor', design: design, displayMode: m.displayMode, primaryImage: m.photo};
    const c = this.card;
    c.style.setProperty('--acc', design.colorBottom);
    c.classList.toggle('off', !m.isActive);
    c.innerHTML = (m.isAdult ? '<span class="plus">+18</span>' : '');
    const stage = document.createElement('div');
    stage.className = 'stage';
    stage.appendChild(buildProductVisual(product, {eager: true}));
    c.appendChild(stage);
    c.insertAdjacentHTML('beforeend',
      (m.categoryLabel ? '<span class="tag">' + esc(m.categoryLabel) + '</span>' : '') +
      '<h4>' + esc(product.name) + '</h4>' +
      (m.description ? '<p class="desc">' + esc(m.description) + '</p>' : '') +
      '<span class="price">' + money(m.price) + '</span>');

    let note = 'El chupete gira como en la tienda. Cambia colores y trocitos en la pestaña Diseño.';
    if(m.displayMode === 'image') note = m.photo ? 'Se muestra la foto principal (pestaña Fotos).' : 'Modo foto sin fotos todavía: la tienda mostrará el chupete 3D hasta que subas una.';
    if(!m.isActive) note = 'Oculto: no aparece en la tienda. ' + note;
    el('pvNote').textContent = note;
  }
}
