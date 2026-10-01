/* Conexión a Supabase (Project Settings → API Keys).
   La clave PUBLICABLE (sb_publishable_…) está hecha para el navegador: lo que cada quien puede
   leer o escribir lo decide la RLS de la base. NUNCA pongas aquí la clave secreta (sb_secret_…). */
export const SUPABASE_URL = 'https://ecktnooenujqsxfqfidz.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_lUwljpUa3WrqToOSy-hYZQ_CCTV9wE6';

export const IMAGES_BUCKET = 'product-images';

/* supabase-js solo lo usa el panel (login, escritura y subida de fotos); versión fija + SRI */
export const SUPABASE_SDK = {
  url: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js',
  integrity: 'sha384-Rj26LVGvoeRVR6+mwQmFfcR3QOBEwT+ZmuCWpuiqeTzJpCs0ER4ITAWGb4Hiy3Ok'
};

export function isSupabaseConfigured(){
  if(/^sb_secret_/.test(SUPABASE_PUBLISHABLE_KEY)){
    console.error('config.js tiene una clave SECRETA: reemplázala por la publicable y rota la secreta en Supabase.');
    return false;
  }
  return /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(SUPABASE_URL) &&
    /^(sb_publishable_[\w-]{10,}|eyJ[\w-]+\.[\w-]+\.[\w-]+)$/.test(SUPABASE_PUBLISHABLE_KEY);
}

export function publicImageUrl(path){
  return SUPABASE_URL + '/storage/v1/object/public/' + IMAGES_BUCKET + '/' +
    String(path).split('/').map(encodeURIComponent).join('/');
}
