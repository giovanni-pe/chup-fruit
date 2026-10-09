import { el, esc, money, plural, bump } from '../../../core/dom.js';
import { MIN, YAPE, BILL_VALUES, personLabel, payText } from './order.model.js';

const AV_COLORS = ['#ef2f68','#ff9a1f','#8a3fa8','#1a9e6e','#1a7fc4','#c2410c','#be185d'];
const BILL_COLORS = {'10': '#2e9e5b', '20': '#c77d2e', '50': '#d9534f', '100': '#2f6fb3', '200': '#8a3fa8'};
const ICON_EDIT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
const ICON_DEL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>';

const avatar = function(p, k, extra){
  return '<span class="av" style="--avc:' + AV_COLORS[k % AV_COLORS.length] + '"' + (extra || '') + '>' +
    esc(personLabel(p, k).charAt(0).toUpperCase()) + '</span>';
};

/* Panel del pedido (drawer), barra inferior, modal por persona y avisos */
export class OrderView {
  constructor(){
    this.toastTimer = null;
  }

  /* ----- piezas ----- */
  itemRows(model, p, k){
    return Object.keys(p.items).map(function(id){
      const f = model.product(id), q = p.items[id];
      if(!f) return '';
      const n = esc(f.name), i = esc(id);
      return '<div class="li" style="--c1:' + f.design.colorTop + ';--c2:' + f.design.colorBottom + '">' +
        '<span class="dot-f"></span>' +
        '<span class="nm"><strong>' + n + '</strong><span>' + money(f.price) + ' c/u</span></span>' +
        '<span class="qty" data-i="' + i + '" data-p="' + k + '">' +
          '<button type="button" data-d="-1" aria-label="Quitar uno de ' + n + '">−</button>' +
          '<span class="n">' + q + '</span>' +
          '<button type="button" data-d="1" aria-label="Agregar uno de ' + n + '">+</button>' +
        '</span>' +
        '<span class="sub">' + money(q * f.price) + '</span></div>';
    }).join('');
  }

  renderStep1(model){
    const st = model.st;
    el('modeHelp').textContent = st.mode === 'persona'
      ? 'Ideal para la familia: cada quien con sus sabores. El nombre es opcional.'
      : 'Todos los sabores en un solo pedido.';
    if(st.mode === 'general'){
      const p = st.people[0];
      el('s1List').innerHTML = model.sumItems(p.items).units ? this.itemRows(model, p, 0)
        : '<p class="empty">Todavía no eliges nada.<br>Agrega tus sabores desde el catálogo.</p><button class="btn-main emptycta" type="button" data-tocat>Ver sabores</button>';
      return;
    }
    el('s1List').innerHTML = st.people.map((p, k) => {
      const t = model.sumItems(p.items), who = esc(personLabel(p, k));
      return '<div class="pcard' + (k === st.active ? ' sel' : '') + '">' +
        '<div class="pc-top">' + avatar(p, k) +
          '<span class="nm"><strong>' + who + '</strong><span>' + plural(t.units) + ' · ' + money(t.soles) + '</span></span>' +
          '<button class="ibtn" type="button" data-edit="' + k + '" aria-label="Editar a ' + who + '">' + ICON_EDIT + '</button>' +
          (st.people.length > 1 ? '<button class="ibtn" type="button" data-del="' + k + '" aria-label="Quitar a ' + who + '">' + ICON_DEL + '</button>' : '') +
        '</div>' +
        (t.units ? this.itemRows(model, p, k) : '<p class="none">Sin sabores todavía. <button type="button" data-edit="' + k + '">Elegir sabores</button></p>') +
      '</div>';
    }).join('') + '<button class="addp" type="button" data-addp>+ Agregar persona</button>';
  }

  renderChips(model){
    const st = model.st;
    el('forChips').innerHTML = st.people.map(function(p, k){
      const u = model.sumItems(p.items).units;
      return '<button type="button" class="pchip' + (k === st.active ? ' sel' : '') + '" data-act="' + k + '">' +
        avatar(p, k) + esc(personLabel(p, k)) + (u ? ' <span class="ct">' + u + '</span>' : '') + '</button>';
    }).join('') + '<button type="button" class="pchip add" data-addp>+ Persona</button>';
  }

  renderPay(model){
    const st = model.st, t = model.totals();
    document.querySelectorAll('.paycard').forEach(function(c){ c.classList.toggle('sel', c.dataset.pay === st.pay.m); });
    el('payYape').classList.toggle('show', st.pay.m === 'yape');
    el('payCash').classList.toggle('show', st.pay.m === 'efectivo');
    document.querySelectorAll('.ptot').forEach(function(n){ n.textContent = money(t.soles); });
    el('bills').innerHTML =
      '<button type="button" class="bill plain' + (st.pay.bill === 'exacto' ? ' sel' : '') + '" data-bill="exacto">Monto exacto<small>' + money(t.soles) + '</small></button>' +
      BILL_VALUES.map(function(b){
        const v = +b, dis = v < t.soles - 0.001;
        return '<button type="button" class="bill' + (st.pay.bill === b ? ' sel' : '') + '" style="--bc:' + BILL_COLORS[b] + '" data-bill="' + b + '"' + (dis ? ' disabled' : '') + '>' +
          'S/ ' + b + '<small>' + (dis ? 'no alcanza' : 'vuelto ' + money(v - t.soles)) + '</small></button>';
      }).join('') +
      '<button type="button" class="bill plain' + (st.pay.bill === 'otro' ? ' sel' : '') + '" data-bill="otro">Otro monto<small>escríbelo</small></button>';
    el('otherWrap').classList.toggle('show', st.pay.bill === 'otro');
    if(document.activeElement !== el('billOther')) el('billOther').value = st.pay.other;
    this.renderChange(model);
  }

  renderChange(model){
    const st = model.st, t = model.totals(), ch = el('change');
    ch.className = 'change';
    if(st.pay.m !== 'efectivo' || !st.pay.bill){ ch.innerHTML = ''; return; }
    const c = model.cashAmount();
    if(!(c > 0)){ ch.innerHTML = ''; return; }
    if(c < t.soles - 0.001){ ch.className = 'change bad'; ch.textContent = 'Ese monto no alcanza para ' + money(t.soles) + '.'; return; }
    ch.innerHTML = c - t.soles < 0.005 ? 'Pagas justo: <b>' + money(t.soles) + '</b>' : 'Te llevamos de vuelto: <b>' + money(c - t.soles) + '</b>';
  }

  renderSummary(model){
    const st = model.st, t = model.totals();
    let h = '<div class="sumbox"><h4>Tu pedido <button class="btn-link" type="button" data-goto="1">Cambiar</button></h4>';
    st.people.forEach(function(p, k){
      if(st.mode === 'persona') h += '<div class="sperson">' + avatar(p, k) + esc(personLabel(p, k)) + '</div>';
      Object.keys(p.items).forEach(function(id){
        const f = model.product(id);
        if(f) h += '<div class="sline"><span>' + p.items[id] + ' × ' + esc(f.name) + '</span><b>' + money(p.items[id] * f.price) + '</b></div>';
      });
    });
    h += '<div class="sline tot"><span>' + plural(t.units) + '</span><b>' + money(t.soles) + '</b></div></div>';
    h += '<div class="sumbox"><h4>Entrega <button class="btn-link" type="button" data-goto="2">Cambiar</button></h4><div>' + esc(st.addr.trim()) + '</div>' +
      (st.recv.trim() ? '<div class="muted">Recibe: ' + esc(st.recv.trim()) + '</div>' : '') +
      (st.pin ? '<a href="https://maps.google.com/?q=' + st.pin[0] + ',' + st.pin[1] + '" target="_blank" rel="noopener">Ver ubicación en el mapa</a>' : '') +
      (model.outOfZone() ? '<div class="zone-warn">Estás fuera de la zona de reparto: al recibir tu pedido te escribiremos para coordinar el envío.</div>' : '') + '</div>';
    const pt = payText({m: st.pay.m, bill: st.pay.bill, cash: st.pay.m === 'efectivo' ? model.cashAmount() : 0}, t.soles);
    h += '<div class="sumbox"><h4>Pago <button class="btn-link" type="button" data-goto="3">Cambiar</button></h4><div>' + esc(pt) + '</div>' +
      (st.pay.m === 'yape' ? '<div class="muted">Envía la captura del Yape por WhatsApp.</div>' : '') + '</div>';
    el('summary').innerHTML = h;
  }

  renderModal(model, mIdx){
    if(mIdx < 0 || !model.st.people[mIdx]) return;
    const p = model.st.people[mIdx], t = model.sumItems(p.items);
    el('mTitle').textContent = personLabel(p, mIdx);
    el('mAv').outerHTML = avatar(p, mIdx, ' id="mAv"');
    el('mSum').textContent = plural(t.units) + ' · ' + money(t.soles);
    el('mList').innerHTML = model.catalog.products.map(function(f){
      const q = p.items[f.id] || 0, n = esc(f.name), i = esc(f.id);
      return '<div class="mrow' + (q ? ' on' : '') + '" style="--c1:' + f.design.colorTop + ';--c2:' + f.design.colorBottom + '">' +
        '<span class="dot-f"></span>' +
        '<span class="nm"><strong>' + n + '</strong><span>' + money(f.price) + (f.isAdult ? ' · +18' : '') + '</span></span>' +
        '<span class="qty" data-i="' + i + '" data-p="' + mIdx + '">' +
          '<button type="button" data-d="-1" aria-label="Quitar uno de ' + n + '"' + (q ? '' : ' disabled') + '>−</button>' +
          '<span class="n">' + q + '</span>' +
          '<button type="button" data-d="1" aria-label="Agregar uno de ' + n + '">+</button>' +
        '</span></div>';
    }).join('');
  }

  /* ----- pintado general ----- */
  render(model, mIdx){
    const st = model.st, t = model.totals();
    document.body.classList.toggle('persona-mode', st.mode === 'persona');

    /* switches (catálogo y panel) */
    document.querySelectorAll('[data-seg]').forEach(function(sg){
      sg.classList.toggle('persona', st.mode === 'persona');
      sg.querySelectorAll('button').forEach(function(b){ b.classList.toggle('sel', b.dataset.mode === st.mode); });
    });
    this.renderChips(model);

    /* barra inferior y cabecera */
    el('cartbar').classList.toggle('show', t.units > 0);
    document.body.classList.toggle('has-cart', t.units > 0);
    el('barTotal').textContent = money(t.soles);
    el('barUnits').textContent = plural(t.units) + (st.mode === 'persona' ? ' · ' + st.people.length + (st.people.length === 1 ? ' persona' : ' personas') : '');
    el('hcnt').textContent = t.units;
    el('hcnt').classList.toggle('on', t.units > 0);

    /* panel por pasos */
    document.querySelectorAll('.stp').forEach(function(s){ s.classList.toggle('cur', +s.dataset.s === st.step); });
    el('stepper').classList.toggle('hide', st.step === 5);
    el('stepper').querySelectorAll('li').forEach(function(li){
      const n = +li.dataset.s;
      li.classList.toggle('cur', n === st.step); li.classList.toggle('on', n < st.step);
    });
    el('drFoot').className = 'dr-foot s' + st.step;
    if(st.step === 1) this.renderStep1(model);
    if(st.step === 2){
      if(document.activeElement !== el('addr')) el('addr').value = st.addr;
      if(document.activeElement !== el('recv')) el('recv').value = st.recv;
    }
    if(st.step === 3) this.renderPay(model);
    if(st.step === 4) this.renderSummary(model);
    el('drUnits').textContent = plural(t.units);
    el('drTotal').textContent = money(t.soles);
    this.renderHint(model);

    /* progreso hacia el mínimo en la barra inferior */
    const falta = Math.max(0, MIN - t.units);
    el('minFill').style.width = Math.min(100, t.units / MIN * 100) + '%';
    el('minFill').parentElement.classList.toggle('full', !falta);
    el('minMsg').textContent = falta ? 'Te ' + (falta === 1 ? 'falta 1 unidad' : 'faltan ' + falta + ' unidades') + ' para el mínimo' : '¡Listo! Ya puedes hacer tu pedido';
    el('minMsg').classList.toggle('ok', !falta);
    el('barSend').classList.toggle('ready', !falta);
    this.renderModal(model, mIdx);
  }

  renderHint(model){
    const step = model.st.step;
    const prob = step <= 3 ? model.stepProblem(step) : '';
    el('drHint').textContent = prob;
    el('nextBtn').classList.toggle('blocked', !!prob);
    el('nextBtn').setAttribute('aria-disabled', prob ? 'true' : 'false');
    if(model.st.pin) this.mapWarning(false);
    this.mapGuide(step === 2 && model.needsPin());
    el('nextBtn').innerHTML = ({1: 'Siguiente: entrega', 2: 'Siguiente: pago', 3: 'Revisar mi pedido'}[step] || 'Continuar') + ' <span aria-hidden="true">→</span>';
  }

  renderDone(o, send){
    el('doneTitle').textContent = send ? '¡Pedido enviado!' : '¡Pedido guardado!';
    el('doneText').textContent = (send
      ? 'Se abrió WhatsApp con tu pedido: solo toca «Enviar». '
      : 'Lo guardamos en «Mis pedidos» de este dispositivo; envíalo por WhatsApp cuando quieras. ') +
      (o.pay.m === 'yape' ? 'Recuerda yapear ' + money(o.total) + ' al ' + YAPE + ' y mandar la captura.'
        : 'Ten listo tu pago en efectivo' + (o.pay.cash > o.total + 0.005 ? '; llevamos tu vuelto de ' + money(o.pay.cash - o.total) + '.' : '.'));
    el('note').value = '';
  }

  /* ----- navegación del panel ----- */
  drawer(open){
    el('drawer').classList.toggle('show', open);
    el('scrim').classList.toggle('show', open);
  }

  tab(name){
    document.querySelectorAll('.dr-tabs button').forEach(function(b){ b.classList.toggle('sel', b.dataset.tab === name); });
    el('vPedido').hidden = name !== 'pedido';
    el('vHist').hidden = name !== 'hist';
  }

  scrollTop(){ el('drBody').scrollTop = 0; }

  /* animación que invita a marcar el domicilio mientras falta el punto */
  mapGuide(on){
    el('pickMap').classList.toggle('guide', on);
    el('gpsBtn').classList.toggle('guide', on);
    el('mapTip').hidden = !on;
  }

  /* aviso visible cuando falta marcar el domicilio en el mapa */
  mapWarning(show){
    const w = el('mapWarn'), map = el('pickMap');
    w.hidden = !show;
    map.classList.remove('need');
    if(!show) return;
    void map.offsetWidth;   // reinicia la animación si ya se mostró
    map.classList.add('need');
    w.scrollIntoView({behavior: 'smooth', block: 'start'});
  }

  openModal(name){
    el('mName').value = name;
    el('pmodal').classList.add('show');
    el('pmodal').setAttribute('aria-hidden', 'false');
    setTimeout(function(){ el('mName').focus(); }, 60);
  }

  closeModal(){
    el('pmodal').classList.remove('show');
    el('pmodal').setAttribute('aria-hidden', 'true');
  }

  /* ----- avisos ----- */
  toast(product, who){
    const t = el('toast');
    t.style.setProperty('--acc', product.design.colorBottom);
    t.querySelector('span').textContent = '+1 ' + product.name + (who ? ' para ' + who : ' al pedido');
    t.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(function(){ t.classList.remove('show'); }, 1600);
  }

  bumpCart(){ bump(el('hcart')); bump(el('barTotal')); }
}
