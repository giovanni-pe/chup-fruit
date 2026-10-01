import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';

/* Lectura pública con fetch sobre la Data API (PostgREST): la tienda solo lee el catálogo,
   así no descarga supabase-js en el celular del cliente. La RLS decide qué filas ve "anon". */
export async function restSelect(table, query, options){
  const timeout = (options && options.timeout) || 6000;
  const ctrl = new AbortController();
  const timer = setTimeout(function(){ ctrl.abort(); }, timeout);
  try{
    const res = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?' + new URLSearchParams(query), {
      headers: {apikey: SUPABASE_PUBLISHABLE_KEY, Accept: 'application/json'},
      signal: ctrl.signal
    });
    if(!res.ok) throw new Error('Supabase ' + res.status + ' en ' + table + ': ' + (await res.text()).slice(0, 200));
    return await res.json();
  }finally{
    clearTimeout(timer);
  }
}
