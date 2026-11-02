import { restSelect } from '../../../core/supabase-rest.js';
import { store } from '../../../core/storage.js';

/* Adaptadores de la zona de reparto: fetch() -> Promise<fila | null>
   select=* para no fallar si la base aún no tiene alguna columna nueva (p. ej. min_order_units) */
export class SupabaseZoneRepository {
  async fetch(){
    const rows = await restSelect('delivery_settings', {select: '*', id: 'eq.true'});
    return rows[0] || null;
  }
}

/* Última zona recibida: el mapa se dibuja al instante en la siguiente visita */
export class ZoneCache {
  constructor(key){ this.key = key || 'chup_zona_v1'; }
  read(){ const c = store.get(this.key, null); return c && c.row ? c.row : null; }
  write(row){ store.set(this.key, {savedAt: Date.now(), row: row}); }
}
