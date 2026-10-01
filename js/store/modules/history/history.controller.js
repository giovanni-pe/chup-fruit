import { el, openExternal } from '../../../core/dom.js';
import { messageFor } from '../order/order.model.js';

/* Acciones sobre los pedidos guardados: repetir, reenviar, eliminar */
export class HistoryController {
  constructor(model, view, order){
    this.model = model;
    this.view = view;
    this.order = order;
  }

  init(){
    this.model.on('change', () => this.refresh());
    /* la pestaña la cambia el pedido; aquí solo se pinta la lista al abrirla */
    document.querySelectorAll('[data-tab="hist"], [data-go-hist]').forEach((b) => b.addEventListener('click', () => this.refresh(true)));
    el('histList').addEventListener('click', (e) => this.onClick(e));
    this.refresh();
  }

  refresh(opening){
    const list = this.model.all();
    this.view.renderCount(list.length);
    if(opening || !el('vHist').hidden) this.view.render(list);
  }

  onClick(e){
    const b = e.target.closest('[data-h]');
    if(!b) return;
    if(b.dataset.h === 'clear'){
      if(confirm('¿Borrar todos tus pedidos guardados?')) this.model.clear();
      return;
    }
    const o = this.model.find(b.dataset.id);
    if(!o) return;
    if(b.dataset.h === 'del') this.model.remove(o.id);
    else if(b.dataset.h === 'wa'){ this.model.markSent(o.id); openExternal(messageFor(o)); }
    else if(b.dataset.h === 'repeat') this.order.repeat(o);
  }
}
