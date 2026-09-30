import { el, esc, money } from '../../../core/dom.js';
import { buildProductVisual } from '../../../shared/popsicle/popsicle.view.js';

const STAR = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z"/></svg>';

/* Pinta el catálogo: mostrador de la portada, filtros, tarjetas, cinta y cifras */
export class CatalogView {
  constructor(){
    this.grid = el('grid');
    this.filters = el('filters');
    this.counter = el('counter');
    this.track = el('track');
    this.active = 'all';
  }

  renderLoading(){
    this.grid.innerHTML = Array.from({length: 8}, function(){
      return '<article class="fcard skel" aria-hidden="true"><div class="stage"><span class="sk-pop"></span></div>' +
        '<span class="sk-line sm"></span><span class="sk-line"></span><span class="sk-line pill"></span></article>';
    }).join('');
    this.grid.setAttribute('aria-busy', 'true');
  }

  /* devuelve las tarjetas nuevas para que el layout las revele al hacer scroll */
  render(model){
    this.renderCounter(model.featured());
    this.renderFilters(model);
    const cards = this.renderGrid(model);
    this.renderMarquee(model.products);
    this.renderStats(model);
    this.applyFilter(this.active, false);
    return cards;
  }

  renderCounter(featured){
    this.counter.querySelectorAll('.pop, .pic').forEach(function(n){ n.remove(); });
    const counter = this.counter;
    featured.forEach(function(p, i){
      counter.appendChild(buildProductVisual(p, {spin: true, mid: i === 1, delay: i * 4, eager: true}));
    });
  }

  renderFilters(model){
    if(this.active !== 'all' && !model.categories.some(c => c.slug === this.active)) this.active = 'all';
    const btn = function(slug, label, n, sel){
      return '<button type="button" data-f="' + esc(slug) + '"' + (sel ? ' class="sel"' : '') + '>' + label + '<span class="c">' + n + '</span></button>';
    };
    this.filters.innerHTML = btn('all', 'Todos', model.products.length, this.active === 'all') +
      model.categories.map(c => btn(c.slug, esc(c.name) + (c.badge ? ' · ' + esc(c.badge) : ''), model.countIn(c.id), this.active === c.slug)).join('');
  }

  renderGrid(model){
    this.grid.removeAttribute('aria-busy');
    this.grid.innerHTML = '';
    const cards = model.products.map((p, i) => {
      const cat = model.categoryOf(p);
      const card = document.createElement('article');
      card.className = 'fcard rv';
      card.dataset.t = cat ? cat.slug : '';
      card.dataset.id = p.id;
      card.style.setProperty('--acc', p.design.colorBottom);
      card.style.setProperty('--d', ((i % 5) * 0.06).toFixed(2) + 's');
      if(p.isAdult) card.insertAdjacentHTML('beforeend', '<span class="plus">+18</span>');
      const stage = document.createElement('div');
      stage.className = 'stage';
      stage.appendChild(buildProductVisual(p, {delay: (i % 5) * 1.4}));
      card.appendChild(stage);
      const name = esc(p.name), id = esc(p.id);
      card.insertAdjacentHTML('beforeend',
        (cat ? '<span class="tag">' + esc(cat.cardLabel) + '</span>' : '') +
        '<h3>' + name + '</h3>' +
        (p.description ? '<p class="desc">' + esc(p.description) + '</p>' : '') +
        '<div class="price">' + money(p.price) + '</div>' +
        '<button type="button" class="addbtn" data-add="' + id + '" aria-label="Agregar ' + name + '">+ Agregar</button>' +
        '<div class="qty" data-i="' + id + '">' +
          '<button type="button" data-d="-1" aria-label="Quitar uno de ' + name + '" disabled>−</button>' +
          '<span class="n">0</span>' +
          '<button type="button" data-d="1" aria-label="Agregar uno de ' + name + '">+</button>' +
        '</div>');
      this.grid.appendChild(card);
      return card;
    });
    if(!cards.length) this.grid.innerHTML = '<p class="empty-cat">Estamos preparando nuevos sabores. ¡Vuelve pronto!</p>';
    return cards;
  }

  renderMarquee(products){
    const row = products.map(function(p){ return '<span>' + esc(p.name) + STAR + '</span>'; }).join('');
    this.track.innerHTML = row + row;     // duplicado: el bucle -50% queda continuo
  }

  renderStats(model){
    const s = model.stats();
    document.querySelectorAll('[data-stat="count"]').forEach(function(n){
      if(n.hasAttribute('data-count')) n.dataset.count = s.count;
      n.textContent = s.count;
    });
    document.querySelectorAll('[data-stat="min-price"]').forEach(function(n){
      if(n.hasAttribute('data-count')) n.dataset.count = s.minPrice;
      n.textContent = n.dataset.prefix != null ? n.dataset.prefix + s.minPrice.toFixed(2) : s.minPrice.toFixed(2);
    });
    const adult = model.adultProducts().map(function(p){ return p.name; });
    const list = adult.length > 1 ? adult.slice(0, -1).join(', ') + ' y ' + adult[adult.length - 1] : (adult[0] || 'Ninguno por ahora');
    document.querySelectorAll('[data-stat="adult-list"]').forEach(function(n){ n.textContent = list; });
  }

  applyFilter(slug, animate){
    this.active = slug;
    this.filters.querySelectorAll('button').forEach(function(x){ x.classList.toggle('sel', x.dataset.f === slug); });
    let n = 0;
    this.grid.querySelectorAll('.fcard').forEach(function(c){
      const show = slug === 'all' || c.dataset.t === slug;
      c.classList.toggle('hide', !show);
      if(!animate) return;
      c.classList.remove('pop-in');
      if(show){
        c.classList.add('in');
        c.style.setProperty('--d', (n++ * 0.05).toFixed(2) + 's');
        void c.offsetWidth; c.classList.add('pop-in');
      }
    });
  }

  /* cantidades de la persona activa en cada tarjeta */
  syncQuantities(items){
    this.grid.querySelectorAll('.qty[data-i]').forEach(function(box){
      const q = items[box.dataset.i] || 0;
      box.querySelector('.n').textContent = q;
      box.querySelector('[data-d="-1"]').disabled = q === 0;
      box.closest('.fcard').classList.toggle('on', q > 0);
    });
  }

  /* Inclinación 3D y brillo que sigue al cursor */
  bindTilt(){
    if(!matchMedia('(pointer:fine)').matches) return;
    this.grid.addEventListener('mousemove', function(e){
      const c = e.target.closest('.fcard');
      if(!c) return;
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty('--ry', ((x - .5) * 10).toFixed(2) + 'deg');
      c.style.setProperty('--rx', ((.5 - y) * 8).toFixed(2) + 'deg');
      c.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      c.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    });
  }
}
