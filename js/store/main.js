/* Tienda CHUP Fruit — raíz de composición: crea los módulos y les inyecta sus dependencias.
   Cada módulo vive en js/store/modules/<módulo>/ con sus capas model / view / controller. */
import { isSupabaseConfigured } from '../core/config.js';

import { CatalogModel } from './modules/catalog/catalog.model.js';
import { CatalogView } from './modules/catalog/catalog.view.js';
import { CatalogController } from './modules/catalog/catalog.controller.js';
import { SupabaseCatalogRepository, SeedCatalogRepository, CatalogCache } from './modules/catalog/catalog.repository.js';

import { OrderModel } from './modules/order/order.model.js';
import { OrderView } from './modules/order/order.view.js';
import { OrderController } from './modules/order/order.controller.js';

import { HistoryModel } from './modules/history/history.model.js';
import { HistoryView } from './modules/history/history.view.js';
import { HistoryController } from './modules/history/history.controller.js';

import { DeliveryModel } from './modules/delivery/delivery.model.js';
import { DeliveryView } from './modules/delivery/delivery.view.js';
import { DeliveryController } from './modules/delivery/delivery.controller.js';

import { LayoutModel } from './modules/layout/layout.model.js';
import { LayoutView } from './modules/layout/layout.view.js';
import { LayoutController } from './modules/layout/layout.controller.js';

/* ---------- Modelos ---------- */
const catalog = new CatalogModel({
  remote: isSupabaseConfigured() ? new SupabaseCatalogRepository() : null,
  fallback: new SeedCatalogRepository(),
  cache: new CatalogCache()
});
const delivery = new DeliveryModel();
const order = new OrderModel({catalog: catalog, delivery: delivery});
const history = new HistoryModel();

/* ---------- Controladores (cada uno con su vista) ---------- */
const layout = new LayoutController(new LayoutModel(), new LayoutView());
layout.init();
new DeliveryController(delivery, new DeliveryView(), order).init();
new CatalogController(catalog, new CatalogView(), order, layout.reveal).init();
new OrderController(order, new OrderView(), history).init();
new HistoryController(history, new HistoryView(), order).init();

catalog.load();
