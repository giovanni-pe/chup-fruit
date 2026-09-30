/* Base de los modelos: avisan a sus controladores cuando cambia el estado */
export class Emitter {
  constructor(){ this._handlers = {}; }

  on(event, fn){
    (this._handlers[event] = this._handlers[event] || []).push(fn);
    return () => { this._handlers[event] = this._handlers[event].filter(h => h !== fn); };
  }

  emit(event, data){
    (this._handlers[event] || []).slice().forEach(fn => fn(data));
  }
}
