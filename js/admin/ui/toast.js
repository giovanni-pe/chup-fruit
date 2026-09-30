/* Avisos breves en la parte inferior del panel */
export class Toasts {
  constructor(root){ this.root = root; }

  show(message, type){
    const t = document.createElement('div');
    t.className = 'toast' + (type === 'error' ? ' error' : '');
    t.setAttribute('role', type === 'error' ? 'alert' : 'status');
    t.textContent = message;
    this.root.appendChild(t);
    setTimeout(function(){ t.remove(); }, type === 'error' ? 5200 : 2600);
  }

  ok(message){ this.show(message, 'ok'); }
  error(message){ this.show(message, 'error'); }
}
