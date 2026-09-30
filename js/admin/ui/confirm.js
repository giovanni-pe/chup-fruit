import { el } from '../../core/dom.js';

/* Confirmación con <dialog>: devuelve una promesa con true si el usuario acepta */
export function confirmAction(opts){
  const dlg = el('confirmDialog');
  el('cfTitle').textContent = opts.title;
  el('cfText').textContent = opts.text || '';
  el('cfOk').textContent = opts.okLabel || 'Eliminar';
  el('cfOk').className = 'btn ' + (opts.danger === false ? 'primary' : 'danger');
  return new Promise(function(resolve){
    dlg.returnValue = '';
    dlg.addEventListener('close', function done(){
      dlg.removeEventListener('close', done);
      resolve(dlg.returnValue === 'ok');
    });
    dlg.showModal();
  });
}
