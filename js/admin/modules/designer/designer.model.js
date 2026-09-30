import { Emitter } from '../../../core/emitter.js';
import { DEFAULT_DESIGN } from '../../../shared/catalog/catalog.entities.js';

/* "#abc", "abc" o "#AABBCC" -> "#aabbcc"; null si no es un color válido */
export function normalizeHex(value){
  let v = String(value || '').trim().toLowerCase().replace(/^#/, '');
  if(/^[0-9a-f]{3}$/.test(v)) v = v.split('').map(function(c){ return c + c; }).join('');
  return /^[0-9a-f]{6}$/.test(v) ? '#' + v : null;
}

/* mezcla lineal de dos colores: t = 0 -> a, t = 1 -> b */
export function mixHex(a, b, t){
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = function(shift){ return Math.round(((pa >> shift) & 255) * (1 - t) + ((pb >> shift) & 255) * t); };
  return '#' + [16, 8, 0].map(function(s){ return ch(s).toString(16).padStart(2, '0'); }).join('');
}

const COLOR_FIELDS = ['colorTop', 'colorBottom', 'colorEdge', 'speckColor', 'coatingColor'];
const DEFAULT_COATING = '#3a1c0b';

/* Diseño del chupete en edición + datos del producto que muestra la vista previa */
export class DesignerModel extends Emitter {
  constructor(){
    super();
    this.design = Object.assign({}, DEFAULT_DESIGN);
    this.labelMode = 'brand';                 // brand = "CHUP Fruit" + nombre | custom = dos líneas propias
    this.lastCoating = DEFAULT_COATING;
    this.meta = {name: '', price: 0, description: '', categoryLabel: '', isAdult: false, isActive: true, displayMode: 'design', photo: null};
  }

  load(design, meta){
    this.design = Object.assign({}, DEFAULT_DESIGN, design);
    this.labelMode = this.design.labelLine1 ? 'custom' : 'brand';
    this.lastCoating = this.design.coatingColor || DEFAULT_COATING;
    this.meta = Object.assign({}, this.meta, meta);
    this.emit('change');
  }

  setMeta(patch){ Object.assign(this.meta, patch); this.emit('change'); }

  setColor(field, value){
    const hex = normalizeHex(value);
    if(!hex || COLOR_FIELDS.indexOf(field) < 0) return false;
    this.design[field] = hex;
    if(field === 'coatingColor') this.lastCoating = hex;
    this.emit('change');
    return true;
  }

  setSpeckCount(n){ this.design.speckCount = Math.max(0, Math.min(40, parseInt(n, 10) || 0)); this.emit('change'); }
  setSpeckLight(on){ this.design.speckLight = !!on; this.emit('change'); }

  setCoating(on){
    this.design.coatingColor = on ? this.lastCoating : null;
    this.emit('change');
  }

  setLabelMode(mode){
    this.labelMode = mode === 'custom' ? 'custom' : 'brand';
    if(this.labelMode === 'custom' && !this.design.labelLine1){
      /* propone partir el nombre: "Fresa con cobertura…" -> "Fresa" / "con cobertura…" */
      const words = this.meta.name.trim().split(/\s+/);
      this.design.labelLine1 = (words.shift() || '').slice(0, 18) || null;
      this.design.labelLine2 = words.join(' ').slice(0, 22) || null;
    }
    this.emit('change');
  }

  setLabel(line, text){
    const max = line === 1 ? 18 : 22;
    this.design[line === 1 ? 'labelLine1' : 'labelLine2'] = String(text).slice(0, max) || null;
    this.emit('change');
  }

  /* borde = color intermedio entre arriba y abajo, como en los sabores originales */
  autoEdge(){
    this.design.colorEdge = mixHex(this.design.colorTop, this.design.colorBottom, 0.45);
    this.emit('change');
  }

  /* copia colores, trocitos y cobertura de otro sabor; la etiqueta se queda como está */
  applyPreset(design){
    const keep = {labelLine1: this.design.labelLine1, labelLine2: this.design.labelLine2};
    this.design = Object.assign({}, DEFAULT_DESIGN, design, keep);
    if(this.design.coatingColor) this.lastCoating = this.design.coatingColor;
    this.emit('change');
  }

  validate(){
    const e = {};
    if(this.labelMode === 'custom' && !(this.design.labelLine1 || '').trim()) e.labelLine1 = 'Escribe la línea grande o usa «CHUP Fruit + nombre».';
    return e;
  }

  /* lo que se guarda en product_designs (y lo que dibuja la vista previa) */
  value(){
    const d = Object.assign({}, this.design);
    if(this.labelMode === 'brand'){ d.labelLine1 = null; d.labelLine2 = null; }
    return d;
  }
}
