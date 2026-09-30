import { el } from '../../../core/dom.js';
import { normalizeHex } from './designer.model.js';

/* Enlaza los controles del diseño con el modelo; el editor de productos lo usa como componente */
export class DesignerController {
  constructor(model, view){
    this.model = model;
    this.view = view;
    this.presets = [];
  }

  init(){
    const m = this.model, v = this.view, pane = v.pane;
    m.on('change', () => v.schedulePreview(m));

    pane.addEventListener('input', (e) => {
      const t = e.target;
      if(t.dataset.color){ m.setColor(t.dataset.color, t.value); v.syncColor(t.dataset.color, m.design[t.dataset.color]); return; }
      if(t.dataset.hex){
        const hex = normalizeHex(t.value);
        v.markHex(t.dataset.hex, !hex);
        if(hex){ m.setColor(t.dataset.hex, hex); v.syncColor(t.dataset.hex, hex); }
        return;
      }
      if(t.id === 'dSpeckCount'){ m.setSpeckCount(t.value); el('dSpeckCountOut').textContent = m.design.speckCount; return; }
      if(t.id === 'dLabel1'){ m.setLabel(1, t.value); v.errors({}); return; }
      if(t.id === 'dLabel2') m.setLabel(2, t.value);
    });

    /* al salir de un hex inválido vuelve el último color bueno */
    pane.addEventListener('focusout', (e) => { if(e.target.dataset.hex) v.fill(m); });

    pane.addEventListener('change', (e) => {
      const t = e.target;
      if(t.id === 'dSpeckLight') m.setSpeckLight(t.checked);
      else if(t.id === 'dCoating'){ m.setCoating(t.checked); v.fill(m); }
      else if(t.name === 'dLabel'){ m.setLabelMode(t.value); v.fill(m); v.errors({}); }
    });

    el('dAutoEdge').addEventListener('click', () => { m.autoEdge(); v.fill(m); });
    el('dPresetApply').addEventListener('click', () => {
      const p = this.presets.find((x) => x.id === el('dPreset').value);
      if(!p) return;
      m.applyPreset(p.design);
      v.fill(m);
    });
  }

  /* presets: productos existentes para "partir del diseño de otro sabor" */
  open(design, meta, presets, productId){
    this.presets = presets;
    this.view.renderPresets(presets, productId);
    this.view.errors({});
    this.model.load(design, meta);
    this.view.fill(this.model);
    this.view.renderPreview(this.model);
  }

  updateMeta(patch){ this.model.setMeta(patch); }

  validate(){
    const e = this.model.validate();
    this.view.errors(e);
    return e;
  }

  value(){ return this.model.value(); }
}
