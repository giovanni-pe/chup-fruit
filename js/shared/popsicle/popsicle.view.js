import { esc } from '../../core/dom.js';
import { showsPhoto } from '../catalog/catalog.entities.js';

/* Vista del chupete 3D (marciano de bolsa) a partir del diseño guardado en product_designs.
   La usan la tienda (catálogo y portada) y el diseñador del panel (vista previa en vivo). */

/* Sección elíptica del tubo: semieje X = A (ancho), semieje Z = B (fondo).
   ZLABEL > ZMAX para que la etiqueta quede IMPRESA encima y no la tapen las rebanadas frontales. */
const A = 29, B = 19, LAYERS = 17, ZMAX = 18, W = 94, ZLABEL = 19.5;
const TAIL_Z = [-2, 0, 2];

/* Generador pseudoaleatorio con semilla: cada sabor tiene siempre los mismos trocitos */
function rng(seed){
  return function(){ seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

/* Cobertura de chocolate: baña la parte de arriba y chorrea en gotas irregulares */
function coating(c){
  return 'radial-gradient(9% 5% at 22% 37%,' + c + ' 96%,transparent),' +
    'radial-gradient(8% 7% at 52% 39%,' + c + ' 96%,transparent),' +
    'radial-gradient(9% 4.5% at 80% 36%,' + c + ' 96%,transparent),' +
    'linear-gradient(180deg,#5a2e14 0,' + c + ' 12%,#1f0d04 33.5%,transparent 34%)';
}

/* design: {colorTop, colorBottom, colorEdge, speckColor, speckCount, speckLight, coatingColor, labelLine1, labelLine2} */
export function buildPop(design, name, opts){
  opts = opts || {};
  const f = design;
  const n = String(name || ' ');
  const rand = rng(n.length * 131 + n.charCodeAt(0) * 7 + 1);
  const pop = document.createElement('div');
  pop.className = 'pop' + (opts.spin ? ' spin' : '') + (opts.mid ? ' mid' : '');
  pop.style.cssText = '--c1:' + f.colorTop + ';--c2:' + f.colorBottom + ';--edge:' + f.colorEdge;

  const rot = document.createElement('div');
  rot.className = 'rot';
  rot.style.animationDelay = '-' + (opts.delay || 0).toFixed(1) + 's';

  /* Cuerpo: rebanadas de ancho variable -> silueta redondeada */
  for(let i = 0; i < LAYERS; i++){
    const z = -ZMAX + (2 * ZMAX) * i / (LAYERS - 1);
    const w = 2 * A * Math.sqrt(Math.max(0, 1 - (z / B) * (z / B)));
    const front = i === LAYERS - 1;

    const l = document.createElement('div');
    l.className = 'lay' + (front ? ' face' : '');
    l.style.width = w.toFixed(1) + 'px';
    l.style.left = ((W - w) / 2).toFixed(1) + 'px';
    l.style.transform = 'translateZ(' + z.toFixed(2) + 'px)';
    l.style.background = 'var(--ice) 0 0/90px 90px, ' + (f.coatingColor ? coating(f.coatingColor) + ', ' : '') + 'linear-gradient(168deg,' + f.colorTop + ' 6%,' + f.colorBottom + ')';
    l.style.backgroundBlendMode = f.coatingColor ? 'soft-light, normal, normal, normal, normal, normal' : 'soft-light, normal';
    /* rango amplio de sombreado: centro iluminado y bordes oscuros = volumen cilíndrico */
    l.style.filter = 'brightness(' + (0.62 + 0.44 * ((z / ZMAX) + 1) / 2).toFixed(2) + ')';

    /* escarcha: en la mitad frontal, cada rebanada aporta el anillo que queda a la vista */
    if(i >= LAYERS / 2) l.appendChild(Object.assign(document.createElement('div'), {className:'frost'}));

    /* el brillo va en una rebanada ancha, a la izquierda de la etiqueta, donde sí se ve */
    if(i === LAYERS - 4) l.appendChild(Object.assign(document.createElement('div'), {className:'gloss'}));

    rot.appendChild(l);
  }

  /* trocitos (galleta, pasas, maní, semillas) pegados a la superficie curva del tubo:
     cada uno va a la profundidad de la sección elíptica en su posición horizontal */
  for(let j = 0; j < (f.speckCount || 0); j++){
    const d = document.createElement('div');
    const x = (rand() * 2 - 1) * (A - 5);
    const z = Math.min(ZMAX, B * Math.sqrt(Math.max(0, 1 - (x / A) * (x / A)))) + 0.4;
    const sz = 2.4 + rand() * 3.4, r1 = 30 + rand() * 40, r2 = 30 + rand() * 40;
    d.className = 'speck' + (f.speckLight ? ' lt' : '');
    d.style.cssText = 'left:' + (W / 2 + x - sz / 2).toFixed(1) + 'px;top:' + (22 + rand() * 196).toFixed(1) + 'px;' +
      'width:' + sz.toFixed(1) + 'px;height:' + (sz * (0.7 + rand() * 0.6)).toFixed(1) + 'px;' +
      'border-radius:' + r1.toFixed(0) + '% ' + r2.toFixed(0) + '% ' + r1.toFixed(0) + '% ' + r2.toFixed(0) + '%;' +
      'transform:translateZ(' + z.toFixed(2) + 'px) rotate(' + (rand() * 180).toFixed(0) + 'deg);background:' + f.speckColor;
    rot.appendChild(d);
  }

  /* Nudo y cola de plástico abajo */
  TAIL_Z.forEach(function(z){
    ['knot','tail'].forEach(function(cls){
      const s = document.createElement('div');
      s.className = cls;
      s.style.transform = 'translateZ(' + z + 'px)';
      rot.appendChild(s);
    });
  });

  /* Etiqueta impresa, al frente y al reverso */
  const text = f.labelLine1
    ? '<span class="flav">' + esc(f.labelLine1) + '</span>' + (f.labelLine2 ? '<span class="flav sm">' + esc(f.labelLine2) + '</span>' : '')
    : '<span class="brandline">CHUP<em> Fruit</em></span><span class="flav">' + esc(n) + '</span>';
  [[ZLABEL, 0], [-ZLABEL, 180]].forEach(function(cfg){
    const lb = document.createElement('div');
    lb.className = 'mklabel';
    lb.style.transform = 'translateZ(' + cfg[0] + 'px) rotateY(' + cfg[1] + 'deg)';
    /* nombres largos: dos líneas sin la marca, para que quepan en la etiqueta */
    lb.innerHTML = '<span class="mktext">' + text + '</span>';
    rot.appendChild(lb);
  });

  pop.appendChild(rot);
  return pop;
}

/* Foto del producto en el mismo alto que el chupete, para que la grilla no salte */
export function buildPhoto(image, name, opts){
  opts = opts || {};
  const box = document.createElement('div');
  box.className = 'pic' + (opts.mid ? ' mid' : '');
  const img = document.createElement('img');
  img.src = image.url;
  img.alt = image.alt || name || '';
  img.loading = opts.eager ? 'eager' : 'lazy';
  img.decoding = 'async';
  box.appendChild(img);
  return box;
}

export function buildProductVisual(product, opts){
  return showsPhoto(product) ? buildPhoto(product.primaryImage, product.name, opts) : buildPop(product.design, product.name, opts);
}
