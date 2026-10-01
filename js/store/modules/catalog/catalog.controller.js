/* Conecta el catálogo con la vista: carga, filtros y cantidades del pedido en cada tarjeta.
   Agregar/quitar lo resuelve el módulo de pedido (OrderController) con los data-add / .qty. */
export class CatalogController {
  constructor(model, view, order, reveal){
    this.model = model;
    this.view = view;
    this.order = order;
    this.reveal = reveal;       // (nodos, yaVisibles) -> los muestra al hacer scroll
    this.rendered = false;
  }

  init(){
    if(!this.model.ready) this.view.renderLoading();

    this.model.on('change', () => {
      const cards = this.view.render(this.model);
      /* la primera vez aparecen con el scroll; si Supabase trae cambios después, sin animar */
      this.reveal(cards, this.rendered);
      this.rendered = true;
      this.view.syncQuantities(this.order.activeItems());
    });

    this.order.on('change', () => this.view.syncQuantities(this.order.activeItems()));

    this.view.filters.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-f]');
      if(b) this.view.applyFilter(b.dataset.f, true);
    });

    this.view.bindTilt();
  }
}
