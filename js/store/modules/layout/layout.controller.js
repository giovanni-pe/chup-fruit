import { el } from '../../../core/dom.js';

/* Arranca los efectos de la página y expone reveal() para el contenido que llega después */
export class LayoutController {
  constructor(model, view){
    this.model = model;
    this.view = view;
    this.reveal = (nodes, instantly) => this.view.reveal(nodes, instantly);
  }

  init(){
    const m = this.model, v = this.view;
    v.initReveal(m.animate);
    if(m.animate) v.animateCounters();
    if(m.canObserve) v.spySections(m.sections);
    v.bindScroll();
    if(m.finePointer && !m.reduceMotion) v.bindBannerTilt();
    v.setYear();

    el('burger').addEventListener('click', () => v.setMenu(!v.menuOpen()));
    v.links.forEach((a) => a.addEventListener('click', () => v.setMenu(false)));

    el('copyBtn').addEventListener('click', () => this.copy(el('copyBtn'), m.yapeNumber, 'Copiar número', m.yapeNumber));
    document.addEventListener('click', (e) => {
      const cp = e.target.closest('[data-copy]');
      if(cp) this.copy(cp, cp.dataset.copy, cp.textContent);
    });
  }

  copy(btn, value, restore, fallbackText){
    const ok = () => this.view.flashCopied(btn, 'Número copiado', restore, 2200);
    const fail = () => this.view.flashCopied(btn, fallbackText || 'Número copiado', restore, 2200);
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(value).then(ok, fail);
    else fail();
  }
}
