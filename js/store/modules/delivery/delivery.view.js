import { el, esc } from '../../../core/dom.js';
import { formatDistance } from '../../../shared/delivery/delivery.entities.js';

const TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

/* Mapas con Leaflet: cobertura (sección Delivery) y selector de ubicación (paso 2 del pedido) */
export class DeliveryView {
  constructor(){
    this.map = null;
    this.layers = null;
    this.pickMap = null;
    this.pickMarker = null;
    this.pickCircle = null;
  }

  /* textos de la página con la zona configurada: [data-zone="name|address|radius"] */
  renderTexts(zone){
    const values = {name: zone.name, address: zone.address, radius: formatDistance(zone.radius)};
    document.querySelectorAll('[data-zone]').forEach(function(n){
      if(values[n.dataset.zone] != null) n.textContent = values[n.dataset.zone];
    });
  }

  /* ---------- Mapa de cobertura: se redibuja si cambia la zona ---------- */
  renderCoverage(zone){
    const L = window.L;
    const BASE = [zone.lat, zone.lng], R = zone.radius;
    if(!this.map){
      this.map = L.map('map', {scrollWheelZoom: false, zoomControl: true, minZoom: 11, maxBoundsViscosity: 1}).setView(BASE, 15);
      L.tileLayer(TILES, {maxZoom: 18, attribution: '&copy; OpenStreetMap'}).addTo(this.map);
      this.layers = L.layerGroup().addTo(this.map);
      const map = this.map;
      map.on('click', function(){ map.scrollWheelZoom.enable(); });
      map.on('mouseout', function(){ map.scrollWheelZoom.disable(); });
    }
    this.layers.clearLayers();

    L.circle(BASE, {radius: R, color: '#ef2f68', weight: 2.5, fillColor: '#ef2f68', fillOpacity: .14})
      .addTo(this.layers).bindPopup('<b>' + esc(zone.name) + '</b><br>Pedido mínimo: 5 unidades');

    /* lo que queda fuera del círculo se sombrea: polígono grande con el círculo como hueco */
    const hole = [], kLat = R / 111320, kLng = kLat / Math.cos(BASE[0] * Math.PI / 180);
    for(let a = 0; a < 360; a += 6){
      const r = a * Math.PI / 180;
      hole.push([BASE[0] + kLat * Math.sin(r), BASE[1] + kLng * Math.cos(r)]);
    }
    const pad = Math.max(0.4, kLat * 6);
    L.polygon([[[BASE[0] + pad, BASE[1] - pad], [BASE[0] + pad, BASE[1] + pad], [BASE[0] - pad, BASE[1] + pad], [BASE[0] - pad, BASE[1] - pad]], hole], {
      stroke: false, fillColor: '#3d1029', fillOpacity: .32, interactive: false
    }).addTo(this.layers);

    L.marker(BASE).addTo(this.layers)
      .bindPopup('<b>CHUP Fruit</b><br>' + esc(zone.address) + '<br>Repartimos ' + formatDistance(R) + ' a la redonda');

    const bounds = L.latLng(BASE).toBounds(R * 2), map = this.map;
    map.setMaxBounds(null);
    map.fitBounds(bounds, {padding: [12, 12]});
    map.setMaxBounds(bounds.pad(1.2));
    setTimeout(function(){ map.invalidateSize(); map.fitBounds(bounds, {padding: [12, 12]}); }, 200);
  }

  /* ---------- Mapa para marcar la entrega ---------- */
  ensurePickMap(zone, pin, onPick){
    const L = window.L;
    if(!L){ el('pickMap').classList.add('nomap'); return; }
    if(this.pickMap){ this.updatePickZone(zone); this.pickMap.invalidateSize(); return; }
    const base = [zone.lat, zone.lng];
    this.pickMap = L.map('pickMap', {scrollWheelZoom: false, minZoom: 11, attributionControl: false}).setView(pin || base, pin ? 16 : 15);
    L.tileLayer(TILES, {maxZoom: 19}).addTo(this.pickMap);
    this.pickCircle = L.circle(base, {radius: zone.radius, color: '#ef2f68', weight: 2, fillOpacity: .06, interactive: false}).addTo(this.pickMap);
    this.pickMap.on('click', function(e){ onPick([e.latlng.lat, e.latlng.lng], true); });
    this.onPick = onPick;
    const map = this.pickMap;
    setTimeout(function(){ map.invalidateSize(); }, 150);
  }

  updatePickZone(zone){
    if(!this.pickCircle) return;
    this.pickCircle.setLatLng([zone.lat, zone.lng]);
    this.pickCircle.setRadius(zone.radius);
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
