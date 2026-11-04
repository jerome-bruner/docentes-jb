// ============================================================
// DOCENTES JB — hablar con Apps Script
//
// LA REGLA QUE HACE QUE ESTO FUNCIONE
// Apps Script no manda cabeceras CORS. Un POST con
// 'Content-Type: application/json' obliga al navegador a preguntar
// antes (preflight), Apps Script no contesta esa pregunta y la llamada
// se cae con un error de red que PARECE que el servidor está apagado.
//
// Con 'text/plain' el navegador manda el POST derecho, sin preguntar.
// Por eso el JSON viaja como TEXTO. No lo cambies.
// ============================================================

const API = {

  /** La sesión guardada en este teléfono, o "". */
  sesion() {
    try { return localStorage.getItem('djb_sesion') || ''; }
    catch (e) { return ''; }
  },

  guardarSesion(token) {
    try {
      if (token) localStorage.setItem('djb_sesion', token);
      else localStorage.removeItem('djb_sesion');
    } catch (e) { /* modo privado: la sesión dura lo que la pestaña */ }
  },

  /** Una descripción corta del aparato, para que se vea en tu panel. */
  aparato() {
    const ua = navigator.userAgent || '';
    let s = 'Navegador';
    if (/iPhone|iPad|iPod/i.test(ua)) s = 'iPhone/iPad';
    else if (/Android/i.test(ua)) s = 'Android';
    else if (/Windows/i.test(ua)) s = 'Windows';
    else if (/Macintosh/i.test(ua)) s = 'Mac';
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone) s += ' · app instalada';
    return s;
  },

  /**
   * Manda una acción al servidor y devuelve lo que conteste.
   * Nunca truena: si no hay red, devuelve {ok:false} con un mensaje
   * que el profesor pueda entender.
   */
  async llamar(accion, datos) {
    if (!CONFIG.API || CONFIG.API.indexOf('PEGA_AQUI') === 0) {
      return { ok: false, error: 'Falta configurar la liga de la API en js/config.js.' };
    }

    const cuerpo = Object.assign({ accion, aparato: this.aparato() }, datos || {});

    try {
      const r = await fetch(CONFIG.API, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(cuerpo),
        redirect: 'follow'
      });

      const texto = await r.text();

      // Si Apps Script contesta HTML en vez de JSON, casi siempre es
      // que la implementación NO está publicada como «Cualquier
      // persona» y Google está mandando su pantalla de inicio de sesión.
      try {
        return JSON.parse(texto);
      } catch (e) {
        return {
          ok: false,
          error: 'El servidor no contestó datos. Revisa que la app web esté ' +
                 'publicada como «Cualquier persona».'
        };
      }

    } catch (e) {
      return {
        ok: false,
        error: 'No hay conexión. Conéctate al WiFi de la escuela e inténtalo otra vez.',
        sinRed: true
      };
    }
  },

  // ---- las acciones, una por una ----

  solicitarCodigo(correo)            { return this.llamar('solicitarCodigo', { correo }); },
  verificarCodigo(correo, codigo)    { return this.llamar('verificarCodigo', { correo, codigo }); },
  crearContrasena(correo, codigo, contrasena, usuario) {
    return this.llamar('crearContrasena', { correo, codigo, contrasena, usuario });
  },
  entrar(correo, contrasena)         { return this.llamar('entrar', { correo, contrasena }); },
  yo()                               { return this.llamar('yo', { sesion: this.sesion() }); },
  cambiarContrasena(actual, nueva)   {
    return this.llamar('cambiarContrasena', { sesion: this.sesion(), actual, nueva });
  },
  cambiarUsuario(usuario)            {
    return this.llamar('cambiarUsuario', { sesion: this.sesion(), usuario });
  },
  marcarInstalada()                  { return this.llamar('marcarInstalada', { sesion: this.sesion() }); },
  salir()                            { return this.llamar('salir', { sesion: this.sesion() }); }
};
