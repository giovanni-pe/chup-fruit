import { el } from '../../../core/dom.js';
import { formatDistance } from '../../../shared/delivery/delivery.entities.js';

/* Cobertura, ubicación por GPS o tocando el mapa, y aviso (sin bloquear) si queda fuera de la zona */
export class DeliveryController {
  constructor(model, view, order){
    this.model = model;
    this.view = view;
    this.order = order;
  }

  init(){
    const draw = () => {
      this.view.renderTexts(this.model.zone);
      if(this.model.hasMap()) this.view.renderCoverage(this.model.zone);
      this.view.updatePickZone(this.model.zone);
      this.syncMessage();
    };
    this.model.on('change', draw);
    draw();

    this.order.on('step', (step) => {
      if(step !== 2) return;
      setTimeout(() => {
        this.view.ensurePickMap(this.model.zone, this.order.st.pin, (pin, pan) => this.pick(pin, pan));
        this.view.placeMarker(this.order.st.pin, false);
      }, 30);
    });
    this.order.on('change', () => this.syncMessage());

    el('gpsBtn').addEventListener('click', () => this.locate());
  }

  syncMessage(){
    const pin = this.order.st.pin;
    if(this.order.st.step !== 2 || !pin) return;
    if(this.model.inZone(pin)){
      this.view.locMessage('✓ Ubicación dentro de la zona de reparto.', 'ok');
      return;
    }
    this.view.locMessage('Estás fuera de ' + this.model.zone.name + ' (a ' + formatDistance(this.model.distanceFromStore(pin)) +
      ' de la tienda). Igual puedes enviar tu pedido: te escribiremos para coordinar el envío.', 'warn');
  }

  pick(pin, pan){
    this.order.setPin(pin);
    this.view.placeMarker(this.order.st.pin, pan);
  }

  locate(){
    if(!navigator.geolocation){ this.view.locMessage('Tu navegador no permite ubicar. Toca el mapa.', 'bad'); return; }
    this.view.locMessage('Buscando tu ubicación…');
    navigator.geolocation.getCurrentPosition((pos) => {
      this.pick([pos.coords.latitude, pos.coords.longitude], true);
    }, () => {
      this.view.locMessage('No pudimos obtener tu ubicación. Toca el mapa para marcarla.', 'bad');
    }, {enableHighAccuracy: true, timeout: 12000, maximumAge: 60000});
  }
}
