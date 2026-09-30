import { el, esc, money } from '../../../core/dom.js';
import { personLabel, payText } from '../order/order.model.js';

/* Pestaña "Mis pedidos" del panel */
export class HistoryView {
  renderCount(n){ el('histCnt').textContent = n || ''; }

  render(list){
    if(!list.length){
      el('histList').innerHTML = '<p class="empty">Aún no tienes pedidos guardados.<br>Cuando confirmes uno, aparecerá aquí.</p>';
      return;
    }
    el('histList').innerHTML = list.map(function(o){
      const d = new Date(o.date);
      const when = isNaN(d) ? '' : d.toLocaleString('es-PE', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'});
      const lines = (o.people || []).map(function(p, k){
        const its = (p.items || []).map(function(it){ return it.q + ' ' + esc(it.n); }).join(', ');
        return '<div>' + (o.mode === 'persona' ? '<b>' + esc(personLabel(p, k)) + ':</b> ' : '') + its + '</div>';
      }).join('');
      const id = esc(o.id);
      return '<article class="hcard">' +
        '<div class="hc-top"><strong>' + when + '</strong><span class="badge' + (o.sent ? ' sent' : '') + '">' + (o.sent ? 'Enviado' : 'Guardado') + '</span></div>' +
        '<div class="hc-body">' + lines + '</div>' +
        '<div class="hc-meta"><span>' + esc(o.addr || '') + (o.pay && o.pay.m ? '<br>' + esc(payText(o.pay, +o.total || 0)) : '') + '</span><b>' + money(+o.total || 0) + '</b></div>' +
        '<div class="hc-act">' +
          '<button type="button" data-h="repeat" data-id="' + id + '">Repetir</button>' +
          '<button type="button" class="wa" data-h="wa" data-id="' + id + '">Enviar por WhatsApp</button>' +
          '<button type="button" class="del" data-h="del" data-id="' + id + '">Eliminar</button>' +
        '</div></article>';
    }).join('') + '<button class="btn-link clearh" type="button" data-h="clear">Borrar todo el historial</button>';
  }
}
