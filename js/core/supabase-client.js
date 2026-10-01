import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SDK, isSupabaseConfigured } from './config.js';

/* Cliente supabase-js para el panel: se carga una sola vez (build UMD, un solo archivo) */
let clientPromise = null;

function loadScript(src, integrity){
  return new Promise(function(resolve, reject){
    const s = document.createElement('script');
    s.src = src;
    if(integrity){ s.integrity = integrity; s.crossOrigin = 'anonymous'; }
    s.onload = resolve;
    s.onerror = function(){ reject(new Error('No se pudo cargar supabase-js desde ' + src)); };
    document.head.appendChild(s);
  });
}

export function getSupabase(){
  if(!clientPromise){
    clientPromise = (async function(){
      if(!isSupabaseConfigured()) throw new Error('Falta configurar SUPABASE_PUBLISHABLE_KEY en js/core/config.js');
      if(!window.supabase) await loadScript(SUPABASE_SDK.url, SUPABASE_SDK.integrity);
      return window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'chup-admin-auth'}
      });
    })();
    clientPromise.catch(function(){ clientPromise = null; });   // permite reintentar
  }
  return clientPromise;
}

/* Errores de Supabase/Postgres traducidos a mensajes para el administrador */
export function friendlyError(err){
  const e = err || {};
  const code = e.code || '', msg = String(e.message || e);
  if(code === '23505') return 'Ya existe un registro con ese identificador (slug). Usa otro.';
  if(code === '23503') return 'No se puede borrar: todavía tiene productos asociados. Muévelos o desactívala.';
  if(code === '23514' || code === '22P02') return 'Algún dato no tiene el formato correcto: revisa los campos.';
  if(code === '42501' || /row-level security|permission denied/i.test(msg)) return 'Tu usuario no tiene permiso para esta acción.';
  if(code === 'PGRST116') return 'No se encontró el registro o tu usuario no puede editarlo.';
  if(/Invalid login credentials/i.test(msg)) return 'Correo o contraseña incorrectos.';
  if(/Email not confirmed/i.test(msg)) return 'Confirma tu correo antes de ingresar.';
  if(/Failed to fetch|NetworkError|Load failed/i.test(msg)) return 'Sin conexión con Supabase. Revisa tu internet.';
  if(/exceeded the maximum allowed size|Payload too large/i.test(msg)) return 'La imagen es muy pesada (máximo 5 MB).';
  return msg;
}
