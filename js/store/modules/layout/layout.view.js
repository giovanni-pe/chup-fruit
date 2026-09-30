import { el } from '../../../core/dom.js';

/* Efectos de la página: revelado al scroll, contadores, barra de progreso, menú y banner 3D */
export class LayoutView {
  constructor(){
    this.io = null;
    this.links = document.querySelectorAll('.nav-links a');
  }

  /* ---------- Revelado al scroll ---------- */
  initReveal(animate){
    if(animate){
      this.io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if(en.isIntersecting){ en.target.classList.add('in'); this.io.unobserve(en.target); }
        });
      }, {rootMargin: '0px 0px -8% 0px'});
    }
    this.reveal(document.querySelectorAll('.rv'));
  }

  reveal(nodes, instantly){
    Array.prototype.forEach.call(nodes, (n) => {
      if(this.io && !instantly) this.io.observe(n); else n.classList.add('in');
    });
  }

  /* los contadores leen data-count en cada cuadro: el catálogo puede actualizarlo al llegar de Supabase */
  animateCounters(){
    document.querySelectorAll('[data-count]').forEach(function(n){
      const t0 = performance.now() + 700;
      (function tick(now){
        const end = parseFloat(n.dataset.count), dec = parseInt(n.dataset.dec || '0', 10);
        const k = Math.min(1, Math.max(0, (now - t0) / 1200)), e = 1 - Math.pow(1 - k, 3);
        n.textContent = (end * e).toFixed(dec);
        if(k < 1) requestAnimationFrame(tick);
      })(performance.now());
    });
  }

  /* enlace activo del menú según la sección visible */
  spySections(ids){
    const links = this.links;
    const spy = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(!en.isIntersecting) return;
        links.forEach(function(a){ a.classList.toggle('act', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, {rootMargin: '-45% 0px -50% 0px'});
    ids.forEach(function(id){ if(el(id)) spy.observe(el(id)); });
  }

  /* ---------- Barra de progreso y cabecera al hacer scroll ---------- */
  bindScroll(){
    let ticking = false;
    const onScroll = function(){
      const h = document.documentElement, max = h.scrollHeight - h.clientHeight;
      el('progress').style.transform = 'scaleX(' + (max > 0 ? h.scrollTop / max : 0).toFixed(4) + ')';
      el('top').classList.toggle('scrolled', h.scrollTop > 8);
      ticking = false;
    };
    addEventListener('scroll', function(){ if(!ticking){ ticking = true; requestAnimationFrame(onScroll); } }, {passive: true});
    onScroll();
  }

  /* ---------- Menú móvil ---------- */
  setMenu(open){
    el('top').classList.toggle('menu-open', open);
    el('burger').setAttribute('aria-expanded', open);
  }
  menuOpen(){ return el('top').classList.contains('menu-open'); }

  /* ---------- Banner 3D: se inclina siguiendo el cursor ---------- */
  bindBannerTilt(){
    const box = el('b3d'), card = box.querySelector('.b3d-card');
    box.addEventListener('mousemove', function(e){
      const r = box.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      box.classList.add('live');
      card.style.setProperty('--ry', ((x - .5) * 16).toFixed(2) + 'deg');
      card.style.setProperty('--rx', ((.5 - y) * 12).toFixed(2) + 'deg');
      card.style.setProperty('--sx', ((x - .5) * 140).toFixed(1) + '%');
    });
    box.addEventListener('mouseleave', function(){
      box.classList.remove('live');
      card.style.removeProperty('--rx'); card.style.removeProperty('--ry');
    });
  }

  /* botón que copia el número de Yape y confirma con su propio texto */
  flashCopied(btn, text, restore, ms){
    btn.textContent = text;
    setTimeout(function(){ btn.textContent = restore; }, ms || 2000);
  }

  setYear(){ el('yr').textContent = new Date().getFullYear(); }
}
