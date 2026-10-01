import { Emitter } from '../../../core/emitter.js';
import { store } from '../../../core/storage.js';

const LS_HIST = 'chup_historial';
const MAX = 30;

/* Pedidos guardados en este dispositivo (localStorage) */
export class HistoryModel extends Emitter {
  all(){
    const h = store.get(LS_HIST, []);
    return Array.isArray(h) ? h : [];
  }

  _save(h){ store.set(LS_HIST, h.slice(0, MAX)); this.emit('change'); }

  find(id){ return this.all().find(function(x){ return String(x.id) === String(id); }) || null; }

  add(order){ const h = this.all(); h.unshift(order); this._save(h); }

  remove(id){ this._save(this.all().filter(function(x){ return String(x.id) !== String(id); })); }

  markSent(id){
    const h = this.all();
    h.forEach(function(x){ if(String(x.id) === String(id)) x.sent = true; });
    this._save(h);
  }

  clear(){ this._save([]); }
}
