// ============================================================
// DOCENTES JB — configuración
//
// ESTE ES EL ÚNICO ARCHIVO QUE SE EDITA A MANO.
//
// Al subir una versión nueva hay que cambiar VERSION AQUÍ **Y** en
// sw.js. Si solo se cambia en uno, los teléfonos se quedan con la
// versión vieja y parece que los cambios no se subieron.
// ============================================================

const CONFIG = {

  // La liga /exec del proyecto de Apps Script DOCENTES_JB_API,
  // publicado como «Cualquier persona». No es la del portal.
  //
  // Va en su forma simple, sin /a/macros/<dominio>/ ni /a/~/: esas dos
  // son para cuando una PERSONA abre la liga en el navegador. Aquí
  // quien llama es la app, sin sesión de Google de por medio.
  API: "https://script.google.com/macros/s/AKfycbyR7Y4jJwQNfk95jHdp65OqEtw4apXWR75DNBJ9dLznk8fyHXmIfDoO9B9Zfla8Ooj0/exec",

  // Sube este número en cada cambio. También en sw.js.
  VERSION: "1.1.2",

  NOMBRE: "Docentes JB",
  ESCUELA: "Colegio Jerome Bruner",
  CICLO: "Ciclo escolar 2026 - 2027",

  // Color del nivel, tomado del sitio informativo público.
  // Secundaria #C0562A · primaria #2B5EA8 · preescolar #1E7D72.
  // Hoy la app es solo de secundaria.
  NIVEL: { nombre: "SECUNDARIA", color: "#C0562A" },

  // Cuántos días la app recuerda el acceso en el teléfono. Tiene que
  // ser menor o igual a DIAS_VIGENCIA_SESION del 00_config.gs de la API.
  DIAS_RECORDAR: 180
};
