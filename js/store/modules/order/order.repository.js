import { restRpc } from '../../../core/supabase-rest.js';

/* Registra el pedido en la base para descontar el stock (todo o nada).
   place(items) -> Promise<{ok: boolean, reason?: string, min?: number, shortages?: [{id, name, available}]}> */
export class SupabaseOrderRepository {
  async place(items){
    return await restRpc('place_order', {p_items: items});
  }
}

/* Sin Supabase (catálogo de respaldo) no hay stock que controlar */
export class LocalOrderRepository {
  async place(){ return {ok: true}; }
}
