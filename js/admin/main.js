/* Panel CHUP Fruit — raíz de composición.
   Cada módulo vive en js/admin/modules/<módulo>/ con model (+ repository hacia Supabase), view y controller. */
import { el } from '../core/dom.js';
import { isSupabaseConfigured } from '../core/config.js';
import { getSupabase, friendlyError } from '../core/supabase-client.js';
import { resizeImage } from '../core/image.js';
import { Toasts } from './ui/toast.js';
import { confirmAction } from './ui/confirm.js';
import { initShell } from './ui/shell.js';

import { AuthModel } from './modules/auth/auth.model.js';
import { AuthView } from './modules/auth/auth.view.js';
import { AuthController } from './modules/auth/auth.controller.js';

import { CategoriesRepository } from './modules/categories/categories.repository.js';
import { CategoriesModel } from './modules/categories/categories.model.js';
import { CategoriesView } from './modules/categories/categories.view.js';
import { CategoriesController } from './modules/categories/categories.controller.js';

import { ProductsRepository } from './modules/products/products.repository.js';
import { ProductsModel } from './modules/products/products.model.js';
import { ProductsView } from './modules/products/products.view.js';
import { ProductsController } from './modules/products/products.controller.js';

import { DesignerModel } from './modules/designer/designer.model.js';
import { DesignerView } from './modules/designer/designer.view.js';
import { DesignerController } from './modules/designer/designer.controller.js';

import { ImagesRepository } from './modules/images/images.repository.js';
import { ImagesModel } from './modules/images/images.model.js';
import { ImagesView } from './modules/images/images.view.js';
import { ImagesController } from './modules/images/images.controller.js';

import { ZoneRepository } from './modules/zone/zone.repository.js';
import { ZoneModel } from './modules/zone/zone.model.js';
import { ZoneView } from './modules/zone/zone.view.js';
import { ZoneController } from './modules/zone/zone.controller.js';

const ui = {toast: new Toasts(el('toasts')), confirm: confirmAction};
const authView = new AuthView();
let catalog = null;       // modelos del catálogo, se crean al primer ingreso

function startCatalog(sb){
  if(catalog){ catalog.categories.load(); catalog.products.load(); catalog.zone.load(); return; }   // volvió a ingresar

  const categories = new CategoriesModel(new CategoriesRepository(sb));
  const products = new ProductsModel(new ProductsRepository(sb));

  const designer = new DesignerController(new DesignerModel(), new DesignerView());
  designer.init();
  const images = new ImagesController(new ImagesModel(new ImagesRepository(sb), resizeImage), new ImagesView(), ui);
  images.init();

  new CategoriesController(categories, new CategoriesView(), ui).init();
  new ProductsController(products, new ProductsView(), {categories: categories, designer: designer, images: images, toast: ui.toast, confirm: ui.confirm}).init();
  const zoneModel = new ZoneModel(new ZoneRepository(sb));
  const zone = new ZoneController(zoneModel, new ZoneView(), ui);
  zone.init();
  initShell(function(view){ if(view === 'zone') zone.show(); });

  catalog = {categories: categories, products: products, zone: zoneModel};
  categories.load();
  products.load();
  zoneModel.load();
}

async function main(){
  authView.showLoading();
  if(!isSupabaseConfigured()){
    authView.showBlocked('Falta conectar Supabase',
      'Pega la clave publicable (sb_publishable_…) del proyecto en js/core/config.js y publica de nuevo. ' +
      'Está en Supabase → Project Settings → API Keys.', false);
    return;
  }
  let sb;
  try{
    sb = await getSupabase();
  }catch(err){
    authView.showBlocked('No se pudo conectar', friendlyError(err) + ' Revisa tu conexión y recarga la página.', false);
    return;
  }
  new AuthController(new AuthModel(sb), authView, function(){ startCatalog(sb); }).init();
}

main();
