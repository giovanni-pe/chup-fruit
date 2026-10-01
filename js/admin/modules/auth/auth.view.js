import { el } from '../../../core/dom.js';

/* Pantallas de acceso: carga, login, sin permisos y el panel */
export class AuthView {
  show(id){
    ['splash', 'authView', 'blockedView', 'appView'].forEach(function(v){ el(v).hidden = v !== id; });
  }

  showLoading(){ this.show('splash'); }

  showLogin(message){
    this.show('authView');
    this.error(message || '');
    this.busy(false);
    setTimeout(function(){ (el('loginEmail').value ? el('loginPass') : el('loginEmail')).focus(); }, 30);
  }

  showBlocked(title, text, canLogout){
    this.show('blockedView');
    el('blockedTitle').textContent = title;
    el('blockedText').textContent = text;
    el('blockedLogout').hidden = !canLogout;
  }

  showApp(email){
    this.show('appView');
    el('userEmail').textContent = email || '';
  }

  credentials(){ return {email: el('loginEmail').value, password: el('loginPass').value}; }
  clearPassword(){ el('loginPass').value = ''; }
  error(message){ el('loginError').textContent = message; }

  busy(on){
    el('loginBtn').classList.toggle('busy', on);
    el('loginBtn').textContent = on ? 'Ingresando…' : 'Ingresar';
  }

  onSubmit(fn){ el('loginForm').addEventListener('submit', function(e){ e.preventDefault(); fn(); }); }
  onLogout(fn){
    el('logoutBtn').addEventListener('click', fn);
    el('blockedLogout').addEventListener('click', fn);
  }
}
