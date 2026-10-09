import { el, openExternal } from '../../../core/dom.js';
import { personLabel, messageFor } from './order.model.js';

/* Eventos del pedido: carrito (catálogo, panel y modal), pasos, pago y envío por WhatsApp */
export class OrderController {
  constructor(model, view, history){
    this.model = model;
    this.view = view;
    this.history = history;
    this.mIdx = -1;          // persona abierta en el modal
    this.mIsNew = false;
  }

  init(){
    this.model.on('change', () => this.render());
    this.model.on('step', () => this.view.scrollTop());
    this.model.on('repeat', () => this.view.tab('pedido'));
    this.model.catalog.on('change', () => this.model.prune());

    document.addEventListener('click', (e) => this.onClick(e));
    this.bindInputs();
    this.bindNavigation();
    this.bindModal();
    this.render();
  }

  render(){ this.view.render(this.model, this.mIdx); }

  onClick(e){
    const m = this.model, st = m.st;
    const q = e.target.closest('.qty button');
    if(q){
      const box = q.parentElement, delta = parseInt(q.dataset.d, 10);
      const k = box.dataset.p == null ? st.active : +box.dataset.p;
      this.changeQty(box.dataset.i, delta, k);
      return;
    }
    const sg = e.target.closest('[data-seg] button');
    if(sg){ this.setMode(sg.dataset.mode); return; }
    if(e.target.closest('[data-addp]')){ this.openModal(m.addPerson(), true); return; }
    const a = e.target.closest('[data-act]');
    if(a){ m.setActive(+a.dataset.act); return; }
    const ed = e.target.closest('[data-edit]');
    if(ed){ this.openModal(+ed.dataset.edit); return; }
    const dl = e.target.closest('[data-del]');
    if(dl){ this.removePerson(+dl.dataset.del); return; }
    if(e.target.closest('[data-go-hist]')){ this.view.tab('hist'); return; }
    const ad = e.target.closest('[data-add]');
    if(ad){ this.changeQty(ad.dataset.add, 1, st.active); return; }
    const pc = e.target.closest('[data-pay]');
    if(pc){ m.setPay(pc.dataset.pay); return; }
    const bl = e.target.closest('[data-bill]');
    if(bl && !bl.disabled){
      m.setBill(bl.dataset.bill);
      if(bl.dataset.bill === 'otro') el('billOther').focus();
      return;
    }
    const gt = e.target.closest('[data-goto]');
    if(gt){ m.go(+gt.dataset.goto); return; }
    const sli = e.target.closest('.stepper li.on');
    if(sli){ m.go(+sli.dataset.s); return; }
    if(e.target.closest('[data-tocat]')){ this.view.drawer(false); el('sabores').scrollIntoView({behavior: 'smooth'}); }
  }

  changeQty(id, delta, k){
    if(!this.model.setQty(id, delta, k)) return;
    if(delta > 0) this.view.toast(this.model.product(id), this.model.st.mode === 'persona' ? personLabel(this.model.st.people[k], k) : '');
    this.view.bumpCart();
  }

  setMode(mode){
    if(mode === 'general' && this.model.st.mode !== 'general' && this.model.peopleWithItems() > 1 &&
      !confirm('Se juntarán los sabores de todas las personas en un solo pedido. ¿Continuar?')){ this.render(); return; }
    this.model.setMode(mode);
  }

  removePerson(k){
    const p = this.model.st.people[k];
    if(Object.keys(p.items).length && !confirm('¿Quitar a ' + personLabel(p, k) + ' y sus sabores?')) return;
    this.model.removePerson(k);
  }

  /* ----- modal de persona ----- */
  openModal(k, isNew){
    this.mIdx = k; this.mIsNew = !!isNew;
    this.view.openModal(this.model.st.people[k].name);
    this.model.setActive(k);
  }

  closeModal(){
    if(this.mIdx < 0) return;
    const k = this.mIdx;
    this.mIdx = -1;
    this.view.closeModal();
    if(this.mIsNew) this.model.discardIfEmpty(k); else this.render();
  }

  bindModal(){
    el('mName').addEventListener('input', (e) => { if(this.mIdx >= 0) this.model.renamePerson(this.mIdx, e.target.value); });
    el('mName').addEventListener('keydown', (e) => {
      if(e.key !== 'Enter') return;
      const first = el('mList').querySelector('button[data-d="1"]');
      if(first) first.focus();
    });
    el('mClose').addEventListener('click', () => this.closeModal());
    el('mDone').addEventListener('click', () => this.closeModal());
    el('pmodal').addEventListener('click', (e) => { if(e.target === e.currentTarget) this.closeModal(); });
  }

  /* ----- campos ----- */
  bindInputs(){
    el('billOther').addEventListener('input', (e) => this.model.setOther(e.target.value));
    el('addr').addEventListener('input', (e) => this.model.setAddr(e.target.value));
    el('recv').addEventListener('input', (e) => this.model.setRecv(e.target.value));
    el('note').addEventListener('input', (e) => this.model.setNote(e.target.value));
  }

  /* ----- navegación del panel ----- */
  openDrawer(tab){
    if(tab) this.view.tab(tab);
    this.view.drawer(true);
    if(this.model.st.step === 5) this.model.go(1); else this.render();
  }

  finish(send){
    const k = this.model.firstProblemStep();
    if(k){ this.model.go(k); this.warn(k); return; }
    const o = this.model.finish(send);
    this.history.add(o);
    if(send) openExternal(messageFor(o));
    this.view.renderDone(o, send);
  }

  /* al intentar avanzar con un paso incompleto: si falta el domicilio en el mapa, aviso destacado */
  warn(step){
    if(step === 2 && this.model.needsPin()) this.view.mapWarning(true);
  }

  bindNavigation(){
    const m = this.model;
    el('nextBtn').addEventListener('click', () => { if(m.stepProblem(m.st.step)) this.warn(m.st.step); else m.go(m.st.step + 1); });
    el('backBtn').addEventListener('click', () => m.go(Math.max(1, m.st.step - 1)));
    el('sendWa').addEventListener('click', () => this.finish(true));
    el('saveOnly').addEventListener('click', () => this.finish(false));
    el('newOrder').addEventListener('click', () => { m.go(1); this.view.drawer(false); location.hash = '#sabores'; });
    document.querySelectorAll('.dr-tabs button').forEach((b) => b.addEventListener('click', () => this.view.tab(b.dataset.tab)));

    el('openDrawer').addEventListener('click', () => this.openDrawer('pedido'));
    el('barSend').addEventListener('click', () => this.openDrawer('pedido'));
    el('hcart').addEventListener('click', () => this.openDrawer());
    el('closeDrawer').addEventListener('click', () => this.view.drawer(false));
    el('scrim').addEventListener('click', () => this.view.drawer(false));
    document.addEventListener('keydown', (e) => {
      if(e.key !== 'Escape') return;
      if(this.mIdx >= 0) this.closeModal(); else this.view.drawer(false);
    });
  }
}
