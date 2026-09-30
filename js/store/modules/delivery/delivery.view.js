import { el } from '../../../core/dom.js';

const TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

/* Mapas con Leaflet: cobertura (sección Delivery) y selector de ubicación (paso 2 del pedido) */
export class DeliveryView {
  constructor(){
    this.pickMap = null;
    this.pickMarker = null;
  }

  /* ---------- Mapa de cobertura: solo Tingo María centro ---------- */
  renderCoverage(zone){
    const L = window.L;
    const BASE = zone.base, R_CENTRO = zone.r;
    const map = L.map('map', {scrollWheelZoom: false, zoomControl: true, minZoom: 14, maxBoundsViscosity: 1}).setView(BASE, 15);

    L.tileLayer(TILES, {maxZoom: 18, attribution: '&copy; OpenStreetMap'}).addTo(map);

    L.circle(BASE, {radius: R_CENTRO, color: '#ef2f68', weight: 2.5, fillColor: '#ef2f68', fillOpacity: .14})
      .addTo(map).bindPopup('<b>Tingo María centro</b><br>Pedido mínimo: 5 unidades');

    /* Todo lo que queda fuera del círculo se sombrea: polígono grande con el círculo como hueco */
    const hole = [], kLat = R_CENTRO / 111320, kLng = kLat / Math.cos(BASE[0] * Math.PI / 180);
    for(let a = 0; a < 360; a += 6){
      const r = a * Math.PI / 180;
      hole.push([BASE[0] + kLat * Math.sin(r), BASE[1] + kLng * Math.cos(r)]);
    }
    L.polygon([[[-8.9, -76.4], [-8.9, -75.6], [-9.7, -75.6], [-9.7, -76.4]], hole], {
      stroke: false, fillColor: '#3d1029', fillOpacity: .32, interactive: false
    }).addTo(map);

    L.marker(BASE).addTo(map)
      .bindPopup('<b>CHUP Fruit</b><br>Jr. 28 de Marzo 245, Bella Durmiente<br>Repartimos 1.5 km a la redonda');

    const bounds = L.latLng(BASE).toBounds(R_CENTRO * 2);
    map.fitBounds(bounds, {padding: [12, 12]});
    map.setMaxBounds(bounds.pad(0.6));
    setTimeout(function(){ map.invalidateSize(); map.fitBounds(bounds, {padding: [12, 12]}); }, 200);

    map.on('click', function(){ map.scrollWheelZoom.enable(); });
    map.on('mouseout', function(){ map.scrollWheelZoom.disable(); });
  }

  /* ---------- Mapa para marcar la entrega ---------- */
  ensurePickMap(zone, pin, onPick){
    const L = window.L;
    if(!L){ el('pickMap').classList.add('nomap'); return; }
    if(this.pickMap){ this.pickMap.invalidateSize(); return; }
    this.pickMap = L.map('pickMap', {scrollWheelZoom: false, minZoom: 13, attributionControl: false}).setView(pin || zone.base, pin ? 16 : 15);
    L.tileLayer(TILES, {maxZoom: 19}).addTo(this.pickMap);
    L.circle(zone.base, {radius: zone.r, color: '#ef2f68', weight: 2, fillOpacity: .06, interactive: false}).addTo(this.pickMap);
    this.pickMap.on('click', function(e){ onPick([e.latlng.lat, e.latlng.lng], true); });
    this.onPick = onPick;
    const map = this.pickMap;
    setTimeout(function(){ map.invalidateSize(); }, 150);
  }

  placeMarker(pin, pan){
    if(!this.pickMap || !pin) return;
    if(!this.pickMarker){
      this.pickMarker = window.L.marker(pin, {draggable: true}).addTo(this.pickMap);
      this.pickMarker.on('dragend', () => { const ll = this.pickMarker.getLatLng(); this.onPick([ll.lat, ll.lng], false); });
    }else this.pickMarker.setLatLng(pin);
    if(pan) this.pickMap.setView(pin, Math.max(this.pickMap.getZoom(), 16));
  }

  locMessage(text, cls){
    const m = el('locMsg');
    m.textContent = text;
    m.className = 'locmsg' + (cls ? ' ' + cls : '');
  }
}
