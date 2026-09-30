/* Sesión del administrador con Supabase Auth.
   Entrar no basta: la cuenta debe estar en public.admins (lo confirma is_admin() en la base). */
export class AuthModel {
  constructor(sb){
    this.sb = sb;
    this.user = null;
  }

  validate(email, password){
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) return 'Escribe un correo válido.';
    if(!password) return 'Escribe tu contraseña.';
    return '';
  }

  async restore(){
    const res = await this.sb.auth.getSession();
    this.user = res.data && res.data.session ? res.data.session.user : null;
    return this.user;
  }

  async signIn(email, password){
    const res = await this.sb.auth.signInWithPassword({email: String(email).trim(), password: password});
    if(res.error) throw res.error;
    this.user = res.data.user;
    return this.user;
  }

  async isAdmin(){
    const res = await this.sb.rpc('is_admin');
    if(res.error) throw res.error;
    return res.data === true;
  }

  async signOut(){
    this.user = null;
    await this.sb.auth.signOut();
  }

  /* avisa si la sesión se cierra en otra pestaña o vence */
  onSignedOut(fn){
    this.sb.auth.onAuthStateChange(function(event){ if(event === 'SIGNED_OUT') fn(); });
  }
}
