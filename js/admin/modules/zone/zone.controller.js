import { el } from '../../../core/dom.js';
import { friendlyError } from '../../../core/supabase-client.js';

/* Ubicar la tienda en el mapa, ajustar el radio y guardar la zona de reparto */
export class ZoneController {
  constructor(model, view, ui){
    this.model = model;
    this.view = view;
    this.toast = ui.toast;
    this.visible = false;
  }

  init(){
    const m = this.model, v = this.view;
    m.on('change', (e) => {
      v.fill(m.zone, e.source);
      v.renderMap(m.zone);
      if(e.source === 'load') v.fit(m.zone);
      v.errors({});
      const msg = m.error ? friendlyError(m.error) + ' ¿Ejecutaste la migración de la zona de reparto?'
        : m.missing ? 'La zona aún no está guardada en Supabase: revisa los datos y pulsa «Guardar zona».' : '';
      v.state(m.dirty || m.missing, msg);
    });

    v.form.addEventListener('input', (e) => {
      const t = e.target;
      if(t.id === 'zName') m.set({name: t.value}, t.id);
      else if(t.id === 'zAddress') m.set({address: t.value}, t.id);
      else if(t.id === 'zRadius') m.set({radius: +t.value}, t.id);
      else if(t.id === 'zLat' || t.id === 'zLng'){
        const r = v.read();
        if(isFinite(r.lat) && isFinite(r.lng)) m.set({lat: r.lat, lng: r.lng}, t.id);
      }
    });
    v.form.addEventListener('submit', (e) => { e.preventDefault(); this.save(); });
    el('zReset').addEventListener('click', () => m.reset());
    el('zLocate').addEventListener('click', () => this.locate());
    v.fill(m.zone);
    v.state(false);
  }

  /* lo llama el shell al abrir la pestaña */
  show(){
    this.visible = true;
    this.view.ensureMap(this.model.zone, {onMove: (lat, lng) => this.model.setCenter(lat, lng)});
  }

  async save(){
    const errors = this.model.validate();
    this.view.errors(errors);
    if(Object.keys(errors).length) return;
    this.view.busy(true);
    try{
      await this.model.save();
      this.toast.ok('Zona de reparto guardada. La tienda ya usa el nuevo mapa.');
    }catch(err){
      this.view.state(true, friendlyError(err));
    }finally{
      this.view.busy(false);
      this.view.state(this.model.dirty || this.model.missing, el('zError').textContent);
    }
  }

  locate(){
    if(!navigator.geolocation){ this.toast.error('Este navegador no permite obtener tu ubicación.'); return; }
    navigator.geolocation.getCurrentPosition((pos) => {
      this.model.setCenter(pos.coords.latitude, pos.coords.longitude, 'load');
    }, () => this.toast.error('No se pudo obtener tu ubicación.'), {enableHighAccuracy: true, timeout: 12000});
  }
}
