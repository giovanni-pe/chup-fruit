import { Emitter } from '../../../core/emitter.js';
import { store } from '../../../core/storage.js';
import { money, plural } from '../../../core/dom.js';
import { SEED_PRODUCTS } from '../../../shared/catalog/catalog.seed.js';

/* ---------- Reglas del negocio ---------- */
export const TEL = '51939617373';
export const YAPE = '939 617 373';
export const MIN = 5;                                   // pedido mínimo
export const BILL_VALUES = ['10', '20', '50', '100', '200'];
const LS_DRAFT = 'chup_borrador';

const blankPerson = function(){ return {name: '', items: {}}; };
export const personLabel = function(p, k){ return (p.name || '').trim() || 'Persona ' + (k + 1); };

export function payText(pay, total){
  if(!pay || !pay.m) return '';
  if(pay.m === 'yape') return 'Yape al ' + YAPE;
  if(pay.bill === 'exacto' || Math.abs(pay.cash - total) < 0.005) return 'Efectivo · monto exacto';
  return 'Efectivo · paga con ' + money(pay.cash) + ' → llevar vuelto de ' + money(pay.cash - total);
}

/* Enlace de WhatsApp con el pedido ya escrito */
export function messageFor(o){
  let msg = '¡Hola CHUP Fruit! Quiero hacer este pedido:\n';
  o.people.forEach(function(p, k){
    msg += '\n';
    if(o.mode === 'persona') msg += '*' + personLabel(p, k) + '*\n';
    let sub = 0;
    p.items.forEach(function(it){
      const s = it.q * parseFloat(it.p); sub += s;
      msg += '• ' + it.q + ' × ' + it.n + ' — ' + money(s) + '\n';
    });
    if(o.mode === 'persona') msg += 'Subtotal: ' + money(sub) + '\n';
  });
  msg += '\n*Total: ' + plural(o.units) + ' — ' + money(o.total) + '*\n';
  msg += '\nEntrega: ' + o.addr;
  if(o.recv) msg += '\nRecibe: ' + o.recv;
  if(o.pin) msg += '\nUbicación: https://maps.google.com/?q=' + o.pin[0].toFixed(6) + ',' + o.pin[1].toFixed(6);
  if(o.outOfZone) msg += '\n⚠️ Fuera de la zona de reparto' + (o.distanceKm ? ' (a ' + o.distanceKm.toFixed(1) + ' km de la tienda)' : '') + ': coordinemos el envío.';
  if(o.note) msg += '\nNota: ' + o.note;
  msg += '\nPago: ' + (payText(o.pay, o.total) || 'Yape al ' + YAPE);
  if(o.pay && o.pay.m === 'yape') msg += '\n(Envío la captura del Yape por aquí)';
  msg += '\n\n¡Gracias!';
  return 'https://wa.me/' + TEL + '?text=' + encodeURIComponent(msg);
}

/* ---------- Estado del pedido: general o por persona, en pasos ---------- */
export class OrderModel extends Emitter {
  constructor(deps){
    super();
    this.catalog = deps.catalog;
    this.delivery = deps.delivery;
    this.st = {mode: 'general', people: [blankPerson()], active: 0, step: 1, addr: '', recv: '', pin: null, note: '',
      pay: {m: '', bill: '', other: ''}};           // m: yape | efectivo; bill: exacto | 10 | 20 | … | otro
    this._loadDraft();
  }

  _loadDraft(){
    const d = store.get(LS_DRAFT, null);
    if(!d || !Array.isArray(d.people) || !d.people.length) return;
    const st = this.st;
    st.mode = d.mode === 'persona' ? 'persona' : 'general';
    st.people = d.people.map(function(p){
      const items = {};
      Object.keys(p.items || {}).forEach(function(key){
        const q = parseInt(p.items[key], 10);
        /* borradores anteriores guardaban la posición del sabor en el catálogo fijo */
        const id = /^\d+$/.test(key) ? (SEED_PRODUCTS[key] && SEED_PRODUCTS[key].id) : key;
        if(id && q > 0) items[id] = Math.min(99, (items[id] || 0) + q);
      });
      return {name: String(p.name || '').slice(0, 30), items: items};
    });
    if(st.mode === 'general') st.people = st.people.slice(0, 1);
    st.active = Math.min(st.people.length - 1, Math.max(0, d.active | 0));
    st.addr = String(d.addr || ''); st.recv = String(d.recv || '');
    st.pin = d.pin && isFinite(d.pin[0]) && isFinite(d.pin[1]) ? [+d.pin[0], +d.pin[1]] : null;
    if(d.pay && (d.pay.m === 'yape' || d.pay.m === 'efectivo')) st.pay = {m: d.pay.m, bill: String(d.pay.bill || ''), other: String(d.pay.other || '')};
  }

  _save(){
    const st = this.st;
    store.set(LS_DRAFT, {mode: st.mode, people: st.people, active: st.active, addr: st.addr, recv: st.recv, pin: st.pin, pay: st.pay});
  }

  _changed(){ this._save(); this.emit('change'); }

  /* ----- consultas ----- */
  activeItems(){ return (this.st.people[this.st.active] || this.st.people[0]).items; }
  product(id){ return this.catalog.get(id); }

  sumItems(items){
    let u = 0, s = 0;
    Object.keys(items).forEach((id) => {
      const f = this.product(id);
      if(!f) return;                               // sabor que ya no está en el catálogo
      u += items[id]; s += items[id] * f.price;
    });
    return {units: u, soles: s};
  }

  totals(){
    let u = 0, s = 0;
    this.st.people.forEach((p) => { const t = this.sumItems(p.items); u += t.units; s += t.soles; });
    return {units: u, soles: s};
  }

  peopleWithItems(){ return this.st.people.filter(function(p){ return Object.keys(p.items).length; }).length; }

  /* cuánto entrega el cliente en efectivo (para calcular el vuelto) */
  cashAmount(){
    const b = this.st.pay.bill;
    if(b === 'exacto') return this.totals().soles;
    if(b === 'otro') return parseFloat(String(this.st.pay.other).replace(',', '.'));
    return parseFloat(b);
  }

  /* ----- validaciones por paso ----- */
  stepProblem(step){
    const st = this.st, t = this.totals(), dz = this.delivery;
    if(step === 1){
      if(t.units === 0) return 'Agrega tus sabores desde el catálogo.';
      if(st.mode === 'persona'){
        const k = st.people.findIndex((p) => !this.sumItems(p.items).units);
        if(k >= 0) return personLabel(st.people[k], k) + ' todavía no tiene sabores: agrégale o quítala.';
      }
      if(t.units < MIN){ const f = MIN - t.units; return 'Agrega ' + f + (f === 1 ? ' unidad más' : ' unidades más') + ' para el pedido mínimo de ' + MIN + '.'; }
    }
    if(step === 2){
      if(dz.hasMap() && !st.pin) return 'Marca tu ubicación en el mapa o usa tu GPS.';
      if(st.addr.trim().length < 5) return 'Escribe tu dirección y una referencia.';
    }
    if(step === 3){
      if(!st.pay.m) return 'Elige cómo vas a pagar: Yape o efectivo.';
      if(st.pay.m === 'efectivo'){
        if(!st.pay.bill) return 'Dinos con qué billete pagas para llevarte el vuelto.';
        const c = this.cashAmount();
        if(!(c > 0)) return 'Escribe con cuánto vas a pagar.';
        if(c < t.soles - 0.001) return 'El monto no alcanza para el total de ' + money(t.soles) + '.';
      }
    }
    return '';
  }

  firstProblemStep(){
    for(let k = 1; k <= 3; k++){ if(this.stepProblem(k)) return k; }
    return 0;
  }

  /* fuera de la zona no se bloquea: se avisa para coordinar el envío */
  outOfZone(){ return !!this.st.pin && !this.delivery.inZone(this.st.pin); }

  /* ----- cambios del carrito ----- */
  setQty(id, delta, k){
    k = k == null ? this.st.active : k;
    const p = this.st.people[k];
    if(!p || !this.product(id)) return false;
    const q = Math.max(0, Math.min(99, (p.items[id] || 0) + delta));
    if(q === (p.items[id] || 0)) return false;
    if(q === 0) delete p.items[id]; else p.items[id] = q;
    this._changed();
    return true;
  }

  setMode(mode){
    const st = this.st;
    if(mode === st.mode) return;
    if(mode === 'general'){
      const merged = {};
      st.people.forEach(function(p){ Object.keys(p.items).forEach(function(i){ merged[i] = Math.min(99, (merged[i] || 0) + p.items[i]); }); });
      st.people = [{name: '', items: merged}];
      st.active = 0;
    }
    st.mode = mode;
    this._changed();
  }

  addPerson(){
    this.st.people.push(blankPerson());
    this.st.active = this.st.people.length - 1;
    this._changed();
    return this.st.active;
  }

  removePerson(k){
    const st = this.st;
    st.people.splice(k, 1);
    if(!st.people.length) st.people.push(blankPerson());
    st.active = Math.min(st.active, st.people.length - 1);
    this._changed();
  }

  /* una persona recién creada y vacía no se queda en la lista */
  discardIfEmpty(k){
    const st = this.st, p = st.people[k];
    if(p && !p.name.trim() && !Object.keys(p.items).length && st.people.length > 1){
      st.people.splice(k, 1);
      st.active = Math.min(st.active, st.people.length - 1);
    }
    this._changed();
  }

  setActive(k){ if(this.st.people[k]){ this.st.active = k; this._changed(); } }
  renamePerson(k, name){ if(this.st.people[k]){ this.st.people[k].name = String(name).slice(0, 30); this._changed(); } }

  setPin(pin){ this.st.pin = [+pin[0].toFixed(6), +pin[1].toFixed(6)]; this._changed(); }
  setAddr(v){ this.st.addr = v; this._changed(); }
  setRecv(v){ this.st.recv = v; this._save(); }
  setNote(v){ this.st.note = v; }
  setPay(m){ this.st.pay.m = m; this._changed(); }
  setBill(b){ this.st.pay.bill = b; this._changed(); }
  setOther(v){ this.st.pay.other = String(v).replace(/[^0-9.,]/g, '').slice(0, 7); this._changed(); }

  go(step){
    this.st.step = step;
    this.emit('change');
    this.emit('step', step);
  }

  /* quita del carrito los sabores que el administrador retiró del catálogo */
  prune(){
    if(!this.catalog.ready) return;
    let removed = false;
    this.st.people.forEach((p) => {
      Object.keys(p.items).forEach((id) => { if(!this.product(id)){ delete p.items[id]; removed = true; } });
    });
    if(removed) this._changed(); else this.emit('change');
  }

  /* ----- pedido listo para guardar / enviar ----- */
  snapshot(sent){
    const st = this.st, t = this.totals();
    return {
      id: Date.now(), date: new Date().toISOString(), mode: st.mode, sent: !!sent,
      people: st.people.map((p) => ({
        name: p.name.trim(),
        items: Object.keys(p.items).filter((id) => this.product(id)).map((id) => {
          const f = this.product(id);
          return {id: f.id, n: f.name, p: f.price.toFixed(2), q: p.items[id]};
        })
      })),
      addr: st.addr.trim(), recv: st.recv.trim(), pin: st.pin, note: st.note.trim(), units: t.units, total: t.soles,
      outOfZone: this.outOfZone(), distanceKm: st.pin ? this.delivery.distanceFromStore(st.pin) / 1000 : 0,
      pay: {m: st.pay.m, bill: st.pay.bill, cash: st.pay.m === 'efectivo' ? this.cashAmount() : 0}
    };
  }

  /* se vacía el carrito, pero la dirección y el modo quedan para el próximo pedido */
  finish(send){
    const o = this.snapshot(send);
    this.st.people = [blankPerson()]; this.st.active = 0; this.st.note = '';
    this._save();
    this.go(5);
    return o;
  }

  /* "Repetir" un pedido del historial: por id y, si es antiguo, por nombre del sabor */
  repeat(o){
    const st = this.st;
    st.mode = o.mode === 'persona' ? 'persona' : 'general';
    st.people = (o.people || []).map((p) => {
      const items = {};
      (p.items || []).forEach((it) => {
        const f = (it.id && this.product(it.id)) || this.catalog.findByName(it.n);
        if(f) items[f.id] = Math.min(99, (items[f.id] || 0) + it.q);
      });
      return {name: p.name || '', items: items};
    });
    if(!st.people.length) st.people = [blankPerson()];
    st.active = 0;
    if(o.addr) st.addr = o.addr;
    if(o.recv) st.recv = o.recv;
    if(o.pin) st.pin = o.pin;
    this._save();
    this.emit('repeat');
    this.go(1);
  }
}
