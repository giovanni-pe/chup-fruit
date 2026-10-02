import { el } from '../../core/dom.js';

/* Pestañas del panel (Productos / Categorías / Zona), recordadas en la URL (#categorias, #zona) */
const VIEWS = {products: 'productos', categories: 'categorias', zone: 'zona'};

/* onShow(vista) avisa al abrir una pestaña (el mapa de Leaflet necesita estar visible para medirse) */
export function initShell(onShow){
  const tabs = el('tabs');
  const show = function(view){
    tabs.querySelectorAll('button').forEach(function(b){
      const on = b.dataset.view === view;
      b.classList.toggle('sel', on);
      b.setAttribute('aria-selected', on);
    });
    Object.keys(VIEWS).forEach(function(v){ el(v + 'View').hidden = v !== view; });
    if(onShow) onShow(view);
  };
  tabs.addEventListener('click', function(e){
    const b = e.target.closest('button[data-view]');
    if(!b) return;
    show(b.dataset.view);
    history.replaceState(null, '', '#' + VIEWS[b.dataset.view]);
  });
  const initial = Object.keys(VIEWS).find(function(v){ return location.hash === '#' + VIEWS[v]; });
  show(initial || 'products');
}
