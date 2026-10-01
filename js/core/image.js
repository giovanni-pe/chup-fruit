/* Reduce la foto en el navegador antes de subirla: WebP de máximo `max` px por lado.
   Así un celular no sube fotos de 8 MB y la tienda carga rápido. */
export async function resizeImage(file, opts){
  const max = (opts && opts.max) || 1200, quality = (opts && opts.quality) || 0.85;
  if(file.type === 'image/gif') return {blob: file, ext: 'gif', type: file.type};   // conserva la animación

  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  if(bitmap.close) bitmap.close();

  let blob = await toBlob(canvas, 'image/webp', quality);
  let type = 'image/webp', ext = 'webp';
  if(!blob || blob.type !== 'image/webp'){          // Safari antiguo no genera WebP
    blob = await toBlob(canvas, 'image/png');
    type = 'image/png'; ext = 'png';
  }
  /* si ya venía pequeña y liviana, se sube tal cual */
  if(scale === 1 && file.size <= blob.size && /^image\/(webp|png|jpeg)$/.test(file.type)){
    return {blob: file, ext: file.type.split('/')[1].replace('jpeg', 'jpg'), type: file.type};
  }
  return {blob: blob, ext: ext, type: type};
}

function toBlob(canvas, type, quality){
  return new Promise(function(resolve){ canvas.toBlob(resolve, type, quality); });
}

async function loadBitmap(file){
  if(window.createImageBitmap){
    try{ return await createImageBitmap(file); }catch{ /* sigue con <img> */ }
  }
  return new Promise(function(resolve, reject){
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = function(){ URL.revokeObjectURL(url); resolve(img); };
    img.onerror = function(){ URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen')); };
    img.src = url;
  });
}
