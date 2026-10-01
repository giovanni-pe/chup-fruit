/* localStorage puede fallar (modo privado, bloqueado): nunca rompe la página */
export const store = {
  get: function(k, def){ try{ const v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; }catch{ return def; } },
  set: function(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} },
  remove: function(k){ try{ localStorage.removeItem(k); }catch{} }
};
