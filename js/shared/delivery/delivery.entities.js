/* Zona de reparto: fila de public.delivery_settings <-> objeto de la app.
   Tienda y panel comparten este contrato. */

export const DEFAULT_ZONE = Object.freeze({
  name: 'Tingo María centro',
  address: 'Jr. 28 de Marzo 245, Bella Durmiente',
  lat: -9.3064229,
  lng: -75.9996039,
  radius: 1500                       // metros
});

export function toZone(r){
  if(!r) return Object.assign({}, DEFAULT_ZONE);
  return {name: r.zone_name, address: r.store_address, lat: Number(r.store_lat), lng: Number(r.store_lng), radius: Number(r.radius_m)};
}

export function zoneToRow(z){
  return {
    id: true,
    zone_name: z.name.trim(), store_address: z.address.trim(),
    store_lat: +Number(z.lat).toFixed(7), store_lng: +Number(z.lng).toFixed(7),
    radius_m: Math.round(Number(z.radius))
  };
}

/* 1500 -> "1.5 km", 800 -> "800 m" */
export function formatDistance(m){
  return m >= 1000 ? (Math.round(m / 100) / 10).toString() + ' km' : Math.round(m) + ' m';
}
