/* Zona de reparto: se usa en el mapa de cobertura y para validar la ubicación del pedido */
export const ZONA = {base: [-9.3064229, -75.9996039], r: 1500};   // tienda CHUP Fruit (Bella Durmiente), 1.5 km
const TOLERANCIA = 80;                                             // metros de gracia en el borde

export class DeliveryModel {
  constructor(zone){ this.zone = zone || ZONA; }

  /* distancia en metros (haversine) */
  distance(a, b){
    const R = 6371000, rad = Math.PI / 180;
    const dLat = (b[0] - a[0]) * rad, dLng = (b[1] - a[1]) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  inZone(pin){ return !!pin && this.distance(pin, this.zone.base) <= this.zone.r + TOLERANCIA; }

  /* Leaflet viene de un CDN: si no carga, el pedido sigue sin mapa */
  hasMap(){ return typeof window.L !== 'undefined'; }
}
