import { friendlyError } from '../../../core/supabase-client.js';

/* Login -> verificación de rol -> panel. onReady se llama cada vez que entra un administrador. */
export class AuthController {
  constructor(model, view, onReady){
    this.model = model;
    this.view = view;
    this.onReady = onReady;
  }

  async init(){
    this.view.onSubmit(() => this.login());
    this.view.onLogout(() => this.logout());
    this.model.onSignedOut(() => this.view.showLogin('Tu sesión se cerró. Vuelve a ingresar.'));
    try{
      const user = await this.model.restore();
      if(user) await this.enter(user); else this.view.showLogin();
    }catch(err){
      this.view.showLogin(friendlyError(err));
    }
  }

  async login(){
    const c = this.view.credentials();
    const problem = this.model.validate(c.email, c.password);
    if(problem){ this.view.error(problem); return; }
    this.view.error('');
    this.view.busy(true);
    try{
      const user = await this.model.signIn(c.email, c.password);
      this.view.clearPassword();
      await this.enter(user);
    }catch(err){
      this.view.error(friendlyError(err));
    }finally{
      this.view.busy(false);
    }
  }

  async enter(user){
    if(!(await this.model.isAdmin())){
      this.view.showBlocked('Tu cuenta no es administradora',
        'Ingresaste como ' + user.email + ', pero esta cuenta no está en la lista de administradores. ' +
        'Pide al dueño de la tienda que te agregue (tabla public.admins en Supabase).', true);
      return;
    }
    this.view.showApp(user.email);
    this.onReady(user);
  }

  async logout(){
    try{ await this.model.signOut(); }catch{ /* igual se sale */ }
    this.view.showLogin();
  }
}
