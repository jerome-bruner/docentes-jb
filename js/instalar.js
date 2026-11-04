// ============================================================
// DOCENTES JB — instalar la app en el teléfono
//
// LO QUE NO SE PUEDE: obligar a instalar. No hay forma de hacerlo
// desde el código. En iPhone ni siquiera existe el aviso de Chrome, y
// dentro del navegador de WhatsApp es imposible. Por eso el paso de
// instalar se MUESTRA, con salida en letra chica, y cambia según de
// dónde abrió el profesor.
//
// Va DESPUÉS del código y de la contraseña, nunca antes: si abre desde
// el ícono, el paso se brinca solo.
// ============================================================

const Instalar = {

  evento: null,     // el aviso que Chrome guarda para poder instalar

  escuchar() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.evento = e;
    });
    window.addEventListener('appinstalled', () => {
      this.marcar();
      API.marcarInstalada();
    });
  },

  /** ¿La app ya está abierta como app, no como pestaña? */
  yaInstalada() {
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    if (window.navigator.standalone) return true;              // iPhone
    try { return localStorage.getItem('djb_instalada') === '1'; }
    catch (e) { return false; }
  },

  marcar() {
    try { localStorage.setItem('djb_instalada', '1'); } catch (e) {}
  },

  /** De dónde abrió: decide qué instrucciones se le enseñan. */
  situacion() {
    const ua = navigator.userAgent || '';
    const esIOS = /iPhone|iPad|iPod/i.test(ua);
    const dentroDeApp = /FBAN|FBAV|Instagram|WhatsApp|Line\//i.test(ua);
    const esMovil = esIOS || /Android/i.test(ua);

    if (dentroDeApp) return 'navegador-de-otra-app';
    if (!esMovil) return 'computadora';
    if (esIOS) return 'iphone';
    if (this.evento) return 'android-con-boton';
    return 'android-sin-boton';
  },

  /** Dispara el cuadro de Chrome. Solo sirve en android-con-boton. */
  async instalarAhora() {
    if (!this.evento) return false;
    this.evento.prompt();
    const r = await this.evento.userChoice;
    this.evento = null;
    if (r && r.outcome === 'accepted') { this.marcar(); API.marcarInstalada(); return true; }
    return false;
  }
};
