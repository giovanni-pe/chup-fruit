import { toCategory, categoryToRow } from '../../../shared/catalog/catalog.entities.js';

/* Acceso a public.categories (la RLS exige que el usuario sea administrador para escribir) */
const SELECT = '*, products(count)';

function check(res){
  if(res.error) throw res.error;
  return res.data;
}

export class CategoriesRepository {
  constructor(sb){ this.sb = sb; }

  async list(){
    const data = check(await this.sb.from('categories').select(SELECT).order('sort_order').order('name'));
    return data.map(toCategory);
  }

  async create(category){
    return toCategory(check(await this.sb.from('categories').insert(categoryToRow(category)).select(SELECT).single()));
  }

  async update(id, category){
    return toCategory(check(await this.sb.from('categories').update(categoryToRow(category)).eq('id', id).select(SELECT).single()));
  }

  async setActive(id, active){
    return toCategory(check(await this.sb.from('categories').update({is_active: active}).eq('id', id).select(SELECT).single()));
  }

  async remove(id){
    check(await this.sb.from('categories').delete().eq('id', id));
  }

  async reorder(ids){
    check(await this.sb.rpc('reorder_categories', {p_ids: ids}));
  }
}
