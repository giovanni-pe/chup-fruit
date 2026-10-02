import { toZone, zoneToRow } from '../../../shared/delivery/delivery.entities.js';

/* Acceso a public.delivery_settings (una sola fila; escribir exige ser administrador) */
function check(res){
  if(res.error) throw res.error;
  return res.data;
}

export class ZoneRepository {
  constructor(sb){ this.sb = sb; }

  /* null si todavía no se ejecutó la migración de la zona */
  async get(){
    const rows = check(await this.sb.from('delivery_settings').select('*').eq('id', true).limit(1));
    return rows[0] ? toZone(rows[0]) : null;
  }

  async save(zone){
    return toZone(check(await this.sb.from('delivery_settings').upsert(zoneToRow(zone), {onConflict: 'id'}).select().single()));
  }
}
