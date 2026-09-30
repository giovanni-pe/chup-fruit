import { el } from '../../core/dom.js';

/* Pestañas del panel (Productos / Categorías), recordadas en la URL (#categorias) */
const VIEWS = {products: 'productos', categories: 'categorias'};

export function initShell(){
  const tabs = el('tabs');
  const show = function(view){
    tabs.querySelectorAll('button').forEach(function(b){
      const on = b.dataset.view === view;
      b.classList.toggle('sel', on);
      b.setAttribute('aria-selected', on);
    });
    el('productsView').hidden = view !== 'products';
    el('categoriesView').hidden = view !== 'categories';
  };
  tabs.addEventListener('click', function(e){
    const b = e.target.closest('button[data-view]');
    if(!b) return;
    show(b.dataset.view);
    history.replaceState(null, '', '#' + VIEWS[b.dataset.view]);
  });
  show(location.hash === '#categorias' ? 'categories' : 'products');
}
