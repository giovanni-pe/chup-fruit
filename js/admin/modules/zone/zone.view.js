import { el } from '../../../core/dom.js';
import { formatDistance } from '../../../shared/delivery/delivery.entities.js';

const TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

/* Pestaña Zona: mapa con el pin de la tienda y el círculo de reparto, más el formulario */
export class ZoneView {
  constructor(){
    this.form = el('zoneForm');
    this.map = null;
    this.marker = null;
    this.circle = null;
  }

  hasMap(){ return typeof window.L !== 'undefined'; }

  /* Leaflet mide el contenedor: se crea la primera vez que la pestaña está visible */
  ensureMap(zone, handlers){
    if(!this.hasMap()){
      el('zoneMap').innerHTML = '<p class="notice" style="margin:16px">No se pudo cargar el mapa. Puedes escribir la latitud y longitud a mano.</p>';
      return;
    }
    if(this.map){ this.map.invalidateSize(); return; }
    const L = window.L, c = [zone.lat, zone.lng];
    this.map = L.map('zoneMap', {scrollWheelZoom: true}).setView(c, 15);
    L.tileLayer(TILES, {maxZoom: 19, attribution: '&copy; OpenStreetMap'}).addTo(this.map);
    this.circle = L.circle(c, {radius: zone.radius, color: '#ef2f68', weight: 2.5, fillColor: '#ef2f68', fillOpacity: .14, interactive: false}).addTo(this.map);
    this.marker = L.marker(c, {draggable: true, title: 'Tienda'}).addTo(this.map);
    this.marker.on('drag', () => { const ll = this.marker.getLatLng(); this.circle.setLatLng(ll); });
    this.marker.on('dragend', () => { const ll = this.marker.getLatLng(); handlers.onMove(ll.lat, ll.lng); });
    this.map.on('click', (e) => handlers.onMove(e.latlng.lat, e.latlng.lng));
    this.fit(zone);
  }

  fit(zone){
    if(!this.map) return;
    this.map.fitBounds(window.L.latLng(zone.lat, zone.lng).toBounds(zone.radius * 2.4), {padding: [16, 16]});
  }

  renderMap(zone){
    if(!this.map) return;
    this.marker.setLatLng([zone.lat, zone.lng]);
    this.circle.setLatLng([zone.lat, zone.lng]);
    this.circle.setRadius(zone.radius);
  }

  /* skip: id del campo que el usuario está escribiendo (no se le pisa el texto) */
  fill(zone, skip){
    const set = function(id, v){ if(id !== skip && document.activeElement !== el(id)) el(id).value = v; };
    set('zName', zone.name);
    set('zAddress', zone.address);
    set('zLat', zone.lat);
    set('zLng', zone.lng);
    if(skip !== 'zRadius') el('zRadius').value = Math.min(10000, zone.radius);
    el('zRadiusOut').textContent = formatDistance(zone.radius);
  }

  read(){
    return {name: el('zName').value, address: el('zAddress').value, lat: parseFloat(el('zLat').value.replace(',', '.')), lng: parseFloat(el('zLng').value.replace(',', '.'))};
  }

  errors(map){
    this.form.querySelectorAll('[data-err]').forEach(function(n){
      n.textContent = map[n.dataset.err] || '';
      n.closest('.fld').classList.toggle('invalid', !!map[n.dataset.err]);
    });
  }

  state(dirty, message){
    el('zSave').disabled = !dirty;
    el('zReset').disabled = !dirty;
    el('zError').textContent = message || '';
  }

  busy(on){ el('zSave').classList.toggle('busy', on); if(on) el('zSave').disabled = true; }
}
