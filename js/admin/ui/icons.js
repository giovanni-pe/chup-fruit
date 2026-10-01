/* Íconos SVG en línea del panel */
const svg = function(d){
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
};

export const ICON = {
  up: svg('<path d="M6 15l6-6 6 6"/>'),
  down: svg('<path d="M6 9l6 6 6-6"/>'),
  edit: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
  del: svg('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>'),
  star: svg('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'),
  upload: svg('<path d="M12 16V4M6 10l6-6 6 6"/><path d="M4 20h16"/>')
};
