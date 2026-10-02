import { Emitter } from '../../../core/emitter.js';
import { DEFAULT_ZONE, toZone } from '../../../shared/delivery/delivery.entities.js';

const TOLERANCIA = 80;               // metros de gracia en el borde

/* Zona de reparto (configurable en el panel). Estar fuera NO bloquea el pedido:
   solo se avisa al cliente y a la tienda para coordinar el envío. */
export class DeliveryModel extends Emitter {
  constructor(deps){
    super();
    deps = deps || {};
    this.remote = deps.remote || null;     // SupabaseZoneRepository | null
    this.cache = deps.cache || null;       // ZoneCache
    this.zone = Object.assign({}, DEFAULT_ZONE);
  }

  get base(){ return [this.zone.lat, this.zone.lng]; }

  async load(){
    const cached = this.cache && this.cache.read();
    if(cached) this._apply(cached);
    if(!this.remote) return;
    try{
      const row = await this.remote.fetch();
      if(!row) return;
      if(this.cache) this.cache.write(row);
      if(JSON.stringify(row) !== JSON.stringify(cached)) this._apply(row);
    }catch(err){
      console.warn('[zona] no se pudo leer de Supabase; uso la zona guardada.', err);
    }
  }

  _apply(row){
    this.zone = toZone(row);
    this.emit('change', this.zone);
  }

  /* distancia en metros (haversine) */
  distance(a, b){
    const R = 6371000, rad = Math.PI / 180;
    const dLat = (b[0] - a[0]) * rad, dLng = (b[1] - a[1]) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  distanceFromStore(pin){ return pin ? this.distance(pin, this.base) : 0; }
  inZone(pin){ return !!pin && this.distanceFromStore(pin) <= this.zone.radius + TOLERANCIA; }

  /* Leaflet viene de un CDN: si no carga, el pedido sigue sin mapa */
  hasMap(){ return typeof window.L !== 'undefined'; }
}
