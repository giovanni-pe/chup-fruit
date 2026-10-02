import { Emitter } from '../../../core/emitter.js';
import { DEFAULT_ZONE } from '../../../shared/delivery/delivery.entities.js';

export const RADIUS_MIN = 200, RADIUS_MAX = 30000;

/* Zona de reparto en edición: lo guardado (saved) y el borrador (zone) */
export class ZoneModel extends Emitter {
  constructor(repo){
    super();
    this.repo = repo;
    this.saved = Object.assign({}, DEFAULT_ZONE);
    this.zone = Object.assign({}, DEFAULT_ZONE);
    this.loading = false;
    this.error = null;
    this.missing = false;          // aún no existe la fila en la base
  }

  async load(){
    this.loading = true;
    try{
      const z = await this.repo.get();
      this.missing = !z;
      this.saved = Object.assign({}, z || DEFAULT_ZONE);
      this.zone = Object.assign({}, this.saved);
      this.error = null;
    }catch(err){
      this.error = err;
    }finally{
      this.loading = false;
      this.emit('change', {source: 'load'});
    }
  }

  /* source: quién originó el cambio, para no repintar el control que el usuario está tocando */
  set(patch, source){
    Object.assign(this.zone, patch);
    this.emit('change', {source: source || 'form'});
  }

  setCenter(lat, lng, source){ this.set({lat: +lat.toFixed(7), lng: +lng.toFixed(7)}, source || 'map'); }

  reset(){
    this.zone = Object.assign({}, this.saved);
    this.emit('change', {source: 'load'});
  }

  get dirty(){ return JSON.stringify(this.zone) !== JSON.stringify(this.saved); }

  validate(){
    const z = this.zone, e = {};
    if(!String(z.name || '').trim()) e.name = 'Escribe el nombre de la zona.';
    if(!String(z.address || '').trim()) e.address = 'Escribe la dirección de la tienda.';
    if(!(z.radius >= RADIUS_MIN && z.radius <= RADIUS_MAX)) e.radius = 'El radio debe estar entre 200 m y 30 km.';
    if(!(isFinite(z.lat) && z.lat >= -90 && z.lat <= 90)) e.lat = 'Latitud inválida.';
    if(!(isFinite(z.lng) && z.lng >= -180 && z.lng <= 180)) e.lng = 'Longitud inválida.';
    return e;
  }

  async save(){
    const saved = await this.repo.save(this.zone);
    this.saved = Object.assign({}, saved);
    this.zone = Object.assign({}, saved);
    this.missing = false;
    this.emit('change', {source: 'load'});
    return saved;
  }
}
