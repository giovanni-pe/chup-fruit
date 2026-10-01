/* Preferencias del dispositivo y secciones de la página que siguen al menú */
export class LayoutModel {
  constructor(){
    this.sections = ['sabores', 'como', 'delivery', 'faq'];
    this.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.finePointer = matchMedia('(pointer:fine)').matches;
    this.canObserve = 'IntersectionObserver' in window;
    this.yapeNumber = '939617373';
  }

  get animate(){ return this.canObserve && !this.reduceMotion; }
}
