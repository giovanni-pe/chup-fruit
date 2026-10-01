/* Utilidades de DOM y formato compartidas por la tienda y el panel */
export const el = function(id){ return document.getElementById(id); };
export const money = function(n){ return 'S/ ' + Number(n || 0).toFixed(2); };
export const esc = function(t){
  return String(t == null ? '' : t).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; });
};
export const plural = function(n){ return n + (n === 1 ? ' unidad' : ' unidades'); };

/* Reinicia la animación de "salto" aunque se dispare varias veces seguidas */
export function bump(node){
  if(!node) return;
  node.classList.remove('bump'); void node.offsetWidth; node.classList.add('bump');
}

/* "Fresa con leche" -> "fresa-con-leche" (mismo formato que el dominio slug_text de la base) */
export function slugify(text){
  return String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/, '');
}

/* Abre WhatsApp en otra pestaña; si el navegador lo bloquea, en la misma.
   (con 'noopener' window.open siempre devuelve null, por eso se corta el opener a mano) */
export function openExternal(url){
  const w = window.open(url, '_blank');
  if(w) w.opener = null; else location.href = url;
}
