// ============================================================
// DOCENTES JB — la app
//
// Una sola página que cambia de vista: entrar, alta, código,
// contraseña, instalar, inicio y mis datos.
//
// El servidor es quien manda: la app nunca decide sola si alguien ya
// pasó el candado. Cada acción revalida la sesión del lado de Apps
// Script.
// ============================================================

const App = {

  docente: null,
  correoEnTramite: '',
  codigoEnTramite: '',
  usuarioSugerido: '',

  // ---------- arranque ----------

  async iniciar() {
    Instalar.escuchar();
    this.engancharVerContrasena();
    this.pintarCargando();

    if (!API.sesion()) { this.verEntrar(); return; }

    const r = await API.yo();
    if (!r.ok) {
      if (r.sinRed) { this.verSinRed(); return; }
      API.guardarSesion('');
      this.verEntrar();
      return;
    }

    this.docente = r.docente;
    if (!Instalar.yaInstalada()) this.verInstalar();
    else this.verInicio();
  },

  // ---------- armazón ----------

  pintar(contenido, opciones) {
    const o = opciones || {};
    const titulo = o.titulo || CONFIG.NOMBRE;
    const sub = o.sub || '';
    const nivel = o.nivel
      ? '<span class="et-niv"><i></i>' + CONFIG.NIVEL.nombre + '</span>'
      : (sub ? '<small>' + sub + '</small>' : '');

    document.getElementById('app').innerHTML =
      '<header class="barra">' +
        '<div class="esc"><img src="iconos/icono-96.png" alt=""></div>' +
        '<div class="tit">' + titulo + nivel + '</div>' +
        '<div class="der">' + (o.botones || '') + '</div>' +
      '</header>' +
      '<main class="' + (o.centrado ? 'centrado' : '') + '">' + contenido + '</main>' +
      '<div class="pie">' + CONFIG.ESCUELA + ' · ' + CONFIG.CICLO +
      '<br>' + CONFIG.NOMBRE + ' ' + CONFIG.VERSION + '</div>';

    if (o.despues) o.despues();
  },

  pintarCargando() {
    this.pintar('<div class="cargando"><div class="giro"></div><span>Un momento…</span></div>');
  },

  aviso(texto, tipo) {
    return '<div class="aviso ' + (tipo || 'r') + '">' + this.escapar(texto) + '</div>';
  },

  /**
   * Un campo de contraseña con su botón de «Ver».
   * El botón dice qué va a pasar al tocarlo, no en qué estado está:
   * «Ver» cuando está tapada y «Ocultar» cuando se ve.
   */
  campoPass(id, etiqueta, autocompletar) {
    return '<div class="campo"><label for="' + id + '">' + etiqueta + '</label>' +
      '<div class="conpass">' +
        '<input id="' + id + '" type="password" autocomplete="' + autocompletar + '">' +
        '<button type="button" class="verpass" data-ver="' + id + '" ' +
        'aria-label="Mostrar la contraseña">Ver</button>' +
      '</div></div>';
  },

  /** Un solo escucha para todos los botones de ver, puestos donde sea. */
  engancharVerContrasena() {
    document.addEventListener('click', (ev) => {
      const boton = ev.target.closest('.verpass');
      if (!boton) return;
      const campo = document.getElementById(boton.dataset.ver);
      if (!campo) return;

      const estaTapada = campo.type === 'password';
      campo.type = estaTapada ? 'text' : 'password';
      boton.textContent = estaTapada ? 'Ocultar' : 'Ver';
      boton.setAttribute('aria-label',
        estaTapada ? 'Ocultar la contraseña' : 'Mostrar la contraseña');

      // Se devuelve el cursor al final de lo escrito, para poder
      // seguir tecleando sin volver a tocar el campo.
      campo.focus();
      const n = campo.value.length;
      try { campo.setSelectionRange(n, n); } catch (e) {}
    });
  },

  escapar(t) {
    return (t || '').toString()
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  mostrarError(idCaja, texto) {
    const caja = document.getElementById(idCaja);
    if (caja) caja.innerHTML = this.aviso(texto, 'r');
  },

  limpiarError(idCaja) {
    const caja = document.getElementById(idCaja);
    if (caja) caja.innerHTML = '';
  },

  ocupado(boton, si, textoOcupado) {
    if (!boton) return;
    if (si) {
      boton.dataset.texto = boton.textContent;
      boton.textContent = textoOcupado || 'Un momento…';
      boton.disabled = true;
    } else {
      boton.textContent = boton.dataset.texto || boton.textContent;
      boton.disabled = false;
    }
  },

  // ---------- sin red ----------

  verSinRed() {
    this.pintar(
      '<h1 class="h">No hay conexión</h1>' +
      '<p class="s">La app necesita internet para entrar.</p>' +
      this.aviso('Conéctate al WiFi de la escuela y vuelve a intentar. ' +
                 'Con datos móviles a veces no abre.', 'a') +
      '<button class="btn" style="margin-top:14px" onclick="location.reload()">Reintentar</button>',
      { centrado: true }
    );
  },

  // ---------- entrar ----------

  verEntrar() {
    this.pintar(
      '<div class="bloque">' +
        '<h1 class="h" style="text-align:center;margin-bottom:14px">Entrar</h1>' +
        '<div class="campo"><label for="e-correo">Tu usuario o tu correo</label>' +
          '<input id="e-correo" type="text" autocomplete="username" ' +
          'autocapitalize="off" autocorrect="off" spellcheck="false" ' +
          'placeholder="aliciaam"></div>' +
        this.campoPass('e-pass', 'Contraseña', 'current-password') +
        '<div id="e-error"></div>' +
        '<button class="btn" id="e-btn" style="margin-top:12px">Entrar</button>' +
        '<p class="mini"><button class="enlace" id="e-olvide">Olvidé mi contraseña</button></p>' +
      '</div>' +
      '<button class="btn sec" id="e-alta">Es mi primera vez aquí</button>' +
      '<p class="mini">La app te recuerda en este teléfono. Solo vuelve a pedir ' +
      'la contraseña si cierras sesión o cambias de aparato.</p>',
      { centrado: true, despues: () => {
        document.getElementById('e-btn').onclick = () => this.hacerEntrar();
        document.getElementById('e-alta').onclick = () => this.verAlta(false);
        document.getElementById('e-olvide').onclick = () => this.verAlta(true);
        document.getElementById('e-pass').addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') this.hacerEntrar();
        });
      }}
    );
  },

  async hacerEntrar() {
    const correo = (document.getElementById('e-correo').value || '').trim();
    const pass = document.getElementById('e-pass').value || '';
    const btn = document.getElementById('e-btn');

    if (!correo || !pass) { this.mostrarError('e-error', 'Llena los dos campos.'); return; }
    // Si entró con su usuario, no hay correo que prellenar más adelante.
    const pareceCorreo = correo.indexOf('@') !== -1;

    this.limpiarError('e-error');
    this.ocupado(btn, true, 'Entrando…');
    const r = await API.entrar(correo, pass);
    this.ocupado(btn, false);

    if (!r.ok) {
      if (r.codigo === 'SIN_CONTRASENA') { this.verAlta(false, pareceCorreo ? correo : ''); return; }
      this.mostrarError('e-error', r.error);
      return;
    }

    API.guardarSesion(r.sesion);
    this.docente = r.docente;
    if (!Instalar.yaInstalada()) this.verInstalar();
    else this.verInicio();
  },

  // ---------- alta / olvidé mi contraseña ----------

  verAlta(esReposicion, correoPrellenado) {
    const titulo = esReposicion ? 'Recuperar mi acceso' : 'Dar de alta mi acceso';
    const sub = esReposicion
      ? 'Te mandamos un código y creas una contraseña nueva.'
      : 'Solo esta vez. Después entras con tu contraseña.';

    this.pintar(
      '<h1 class="h">' + titulo + '</h1>' +
      '<p class="s">' + sub + '</p>' +
      '<div class="bloque">' +
        '<div class="campo"><label for="a-correo">Tu correo institucional</label>' +
          '<input id="a-correo" type="email" inputmode="email" autocapitalize="off" ' +
          'autocorrect="off" placeholder="nombre@jeromebrunermorelia.edu.mx" value="' +
          this.escapar(correoPrellenado || '') + '"></div>' +
        '<div id="a-error"></div>' +
        '<button class="btn" id="a-btn">Mandarme mi código</button>' +
        '<p class="mini">Te llega un código de 5 caracteres a ese mismo correo. ' +
        'Revisa también «Correo no deseado».</p>' +
      '</div>' +
      this.aviso('Si tu correo no está en la lista del colegio, la app contesta lo mismo ' +
                 'y no manda nada. Así nadie averigua quién trabaja aquí probando correos.', 'a') +
      '<button class="btn gris" id="a-volver" style="margin-top:14px">Volver</button>',
      { despues: () => {
        document.getElementById('a-btn').onclick = () => this.pedirCodigo();
        document.getElementById('a-volver').onclick = () => this.verEntrar();
        document.getElementById('a-correo').addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') this.pedirCodigo();
        });
      }}
    );
  },

  async pedirCodigo() {
    const correo = (document.getElementById('a-correo').value || '').trim();
    const btn = document.getElementById('a-btn');

    if (!correo || correo.indexOf('@') === -1) {
      this.mostrarError('a-error', 'Escribe tu correo completo, con @.');
      return;
    }

    this.limpiarError('a-error');
    this.ocupado(btn, true, 'Mandando…');
    const r = await API.solicitarCodigo(correo);
    this.ocupado(btn, false);

    if (!r.ok) { this.mostrarError('a-error', r.error); return; }

    this.correoEnTramite = correo;
    this.verCodigo();
  },

  // ---------- código ----------

  verCodigo() {
    let casillas = '';
    for (let i = 0; i < 5; i++) {
      casillas += '<input id="c' + i + '" maxlength="1" inputmode="text" ' +
                  'autocapitalize="characters" autocomplete="off">';
    }

    this.pintar(
      '<h1 class="h">Escribe tu código</h1>' +
      '<p class="s">Lo mandamos a <b>' + this.escapar(this.correoEnTramite) + '</b></p>' +
      '<div class="bloque">' +
        '<div class="codigo">' + casillas + '</div>' +
        '<div id="c-error"></div>' +
        '<button class="btn" id="c-btn" style="margin-top:12px">Continuar</button>' +
        '<button class="btn gris" id="c-otro">Mandarme otro código</button>' +
        '<p class="mini">Sirve por 30 minutos. Tienes 5 intentos.</p>' +
      '</div>' +
      '<button class="btn gris" id="c-volver">Volver</button>',
      { despues: () => {
        document.getElementById('c-btn').onclick = () => this.mandarCodigo();
        document.getElementById('c-otro').onclick = () => this.pedirOtroCodigo();
        document.getElementById('c-volver').onclick = () => this.verEntrar();
        this.engancharCasillas();
        const p = document.getElementById('c0'); if (p) p.focus();
      }}
    );
  },

  /** Que al teclear salte sola a la siguiente casilla, y al borrar regrese. */
  engancharCasillas() {
    for (let i = 0; i < 5; i++) {
      const caja = document.getElementById('c' + i);
      caja.addEventListener('input', () => {
        caja.value = (caja.value || '').toUpperCase();
        if (caja.value && i < 4) document.getElementById('c' + (i + 1)).focus();
        if (i === 4 && this.leerCodigo().length === 5) this.mandarCodigo();
      });
      caja.addEventListener('keydown', (ev) => {
        if (ev.key === 'Backspace' && !caja.value && i > 0) {
          document.getElementById('c' + (i - 1)).focus();
        }
      });
      caja.addEventListener('paste', (ev) => {
        const texto = (ev.clipboardData.getData('text') || '').toUpperCase()
          .replace(/[^A-Z0-9]/g, '').substring(0, 5);
        if (!texto) return;
        ev.preventDefault();
        for (let k = 0; k < 5; k++) document.getElementById('c' + k).value = texto[k] || '';
        if (texto.length === 5) this.mandarCodigo();
      });
    }
  },

  leerCodigo() {
    let s = '';
    for (let i = 0; i < 5; i++) s += (document.getElementById('c' + i).value || '');
    return s.toUpperCase();
  },

  async mandarCodigo() {
    const codigo = this.leerCodigo();
    const btn = document.getElementById('c-btn');
    if (codigo.length < 5) { this.mostrarError('c-error', 'Faltan caracteres del código.'); return; }

    this.limpiarError('c-error');
    this.ocupado(btn, true, 'Revisando…');
    const r = await API.verificarCodigo(this.correoEnTramite, codigo);
    this.ocupado(btn, false);

    if (!r.ok) {
      this.mostrarError('c-error', r.error);
      for (let i = 0; i < 5; i++) document.getElementById('c' + i).value = '';
      document.getElementById('c0').focus();
      return;
    }

    this.codigoEnTramite = codigo;
    this.usuarioSugerido = r.usuarioSugerido || '';
    this.verContrasena();
  },

  async pedirOtroCodigo() {
    const btn = document.getElementById('c-otro');
    this.ocupado(btn, true, 'Mandando…');
    await API.solicitarCodigo(this.correoEnTramite);
    this.ocupado(btn, false);
    this.limpiarError('c-error');
    const caja = document.getElementById('c-error');
    if (caja) caja.innerHTML = this.aviso('Si ya había pasado un par de minutos desde el ' +
      'anterior, ya va en camino otro código.', 'v');
  },

  // ---------- contraseña ----------

  verContrasena() {
    this.pintar(
      '<h1 class="h">Tu usuario y tu contraseña</h1>' +
      '<p class="s">Con estos entras de aquí en adelante. Dirección no ve tu contraseña.</p>' +
      '<div class="bloque">' +
        '<div class="campo"><label for="pu">Nombre de usuario</label>' +
          '<input id="pu" type="text" autocapitalize="off" autocorrect="off" ' +
          'spellcheck="false" autocomplete="username" value="' +
          this.escapar(this.usuarioSugerido) + '"></div>' +
        '<p class="mini" style="text-align:left;margin:-6px 0 12px 2px">' +
        'Es con lo que vas a entrar, para no teclear tu correo completo. ' +
        'Puedes dejar el que te proponemos.</p>' +
        this.campoPass('p1', 'Contraseña nueva', 'new-password') +
        this.campoPass('p2', 'Escríbela otra vez', 'new-password') +
        '<div id="p-reglas">' + this.reglasHTML('') + '</div>' +
        '<div id="p-error"></div>' +
        '<button class="btn" id="p-btn" style="margin-top:12px">Guardar y entrar</button>' +
      '</div>' +
      '<p class="mini">Si la olvidas, pides otro código a tu correo y la cambias tú mismo. ' +
      'No hay que avisarle a nadie.</p>',
      { despues: () => {
        document.getElementById('p-btn').onclick = () => this.guardarContrasena();
        document.getElementById('p1').addEventListener('input', (ev) => {
          document.getElementById('p-reglas').innerHTML = this.reglasHTML(ev.target.value);
        });
      }}
    );
  },

  /** Las tres reglas, marcándose solas mientras escribe. */
  reglasHTML(p) {
    const correo = (this.correoEnTramite || '').split('@')[0].toLowerCase();
    const bajo = (p || '').toLowerCase();
    const reglas = [
      ['Al menos 8 caracteres', (p || '').length >= 8],
      ['Una mayúscula y un número', /[A-ZÁÉÍÓÚÑ]/.test(p || '') && /[0-9]/.test(p || '')],
      ['No es tu correo ni «jerome»',
        !!p && (!correo || bajo.indexOf(correo) === -1) &&
        bajo.indexOf('jerome') === -1 && bajo.indexOf('bruner') === -1]
    ];
    return reglas.map(r =>
      '<div class="reng ' + (r[1] ? 'ok' : 'no') + '"><span class="et">' + r[0] +
      '</span><span class="vl">' + (r[1] ? '✓' : '·') + '</span></div>').join('');
  },

  async guardarContrasena() {
    const usuario = (document.getElementById('pu').value || '').trim();
    const p1 = document.getElementById('p1').value || '';
    const p2 = document.getElementById('p2').value || '';
    const btn = document.getElementById('p-btn');

    if (!usuario) { this.mostrarError('p-error', 'Escribe un nombre de usuario.'); return; }
    if (p1 !== p2) { this.mostrarError('p-error', 'Las dos contraseñas no son iguales.'); return; }

    this.limpiarError('p-error');
    this.ocupado(btn, true, 'Guardando…');
    const r = await API.crearContrasena(
      this.correoEnTramite, this.codigoEnTramite, p1, usuario);
    this.ocupado(btn, false);

    if (!r.ok) { this.mostrarError('p-error', r.error); return; }

    API.guardarSesion(r.sesion);
    this.docente = r.docente;
    this.correoEnTramite = '';
    this.codigoEnTramite = '';
    this.verInstalar();
  },

  // ---------- instalar ----------

  verInstalar() {
    const situacion = Instalar.situacion();
    let caja = '';

    if (situacion === 'android-con-boton') {
      caja =
        '<div class="bloque"><h4>En este teléfono</h4>' +
        '<button class="btn" id="i-btn">Instalar ahora</button>' +
        '<p class="mini">Va a salir un cuadro de Chrome. Dale «Instalar».</p></div>';

    } else if (situacion === 'iphone') {
      caja =
        '<div class="bloque"><h4>En tu iPhone</h4>' +
        '<div class="reng"><span class="et">1 · Toca <b>Compartir</b>, el cuadrito con la flecha ' +
        'de abajo</span></div>' +
        '<div class="reng"><span class="et">2 · Baja y toca <b>Agregar a pantalla de inicio</b></span></div>' +
        '<div class="reng"><span class="et">3 · Toca <b>Agregar</b></span></div></div>' +
        this.aviso('Tiene que ser desde Safari. Si abriste esta liga en Chrome, ' +
                   'el paso no aparece.', 'a');

    } else if (situacion === 'navegador-de-otra-app') {
      caja =
        '<div class="bloque"><h4>Primero sal de WhatsApp</h4>' +
        '<p style="margin:0;font-size:14px">Esta liga se abrió dentro de otra app y desde ' +
        'ahí no se puede instalar. Toca los tres puntos de la esquina y elige ' +
        '<b>Abrir en Chrome</b> (o en Safari, si es iPhone).</p></div>';

    } else if (situacion === 'computadora') {
      caja =
        '<div class="bloque"><h4>Estás en una computadora</h4>' +
        '<p style="margin:0;font-size:14px">La app está pensada para el celular. ' +
        'Aquí puedes seguir sin instalar; cuando quieras, abre esta misma liga ' +
        'en tu teléfono.</p></div>';

    } else {
      caja =
        '<div class="bloque"><h4>En tu Android</h4>' +
        '<div class="reng"><span class="et">1 · Toca los <b>tres puntos</b> de la esquina ' +
        'de Chrome</span></div>' +
        '<div class="reng"><span class="et">2 · Elige <b>Agregar a pantalla principal</b> ' +
        'o <b>Instalar aplicación</b></span></div>' +
        '<div class="reng"><span class="et">3 · Confirma</span></div></div>';
    }

    this.pintar(
      '<h1 class="h">Instala la app</h1>' +
      '<p class="s">Para que te quede como ícono y abra de un toque, sin buscar la liga.</p>' +
      caja +
      '<p class="mini"><button class="enlace" id="i-seguir">Seguir sin instalar</button></p>',
      { despues: () => {
        const b = document.getElementById('i-btn');
        if (b) b.onclick = async () => {
          const listo = await Instalar.instalarAhora();
          if (listo) this.verInicio();
        };
        document.getElementById('i-seguir').onclick = () => this.verInicio();
      }}
    );
  },

  // ---------- inicio ----------

  verInicio() {
    const d = this.docente || {};

    // La foto y la portada son ligas de Drive. El 70 intenta publicarlas
    // como «cualquiera con el link», pero la política del dominio puede
    // impedirlo sin avisar. Por eso las dos se quitan solas si no cargan:
    // el profesor ve sus iniciales sobre el rojo, nunca una imagen rota.
    const portada = d.portada
      ? '<img class="portimg" src="' + this.escapar(d.portada) + '" alt="" ' +
        'onerror="this.remove()">'
      : '';
    const foto = d.foto
      ? '<img src="' + this.escapar(d.foto) + '" alt="" ' +
        'onerror="App.fotoNoCargo(this)">'
      : this.escapar(this.iniciales(d.nombre));

    let accesos = '';
    (d.accesos || []).forEach((a) => {
      const iconos = { portal: '🏫', avance: '📊', libro: '📗', portada: '🏫' };
      accesos +=
        '<button class="acceso" data-url="' + this.escapar(a.url) + '">' +
          '<span class="ic">' + (iconos[a.clave] || '›') + '</span>' +
          '<span class="tx"><b>' + this.escapar(a.titulo) + '</b>' +
          '<span>' + this.escapar(a.nota || '') + '</span></span>' +
          '<span class="fl">›</span>' +
        '</button>';
    });

    this.pintar(
      '<div class="perfil">' +
        // La foto va DENTRO de la portada: se posiciona contra ella, no
        // contra la tarjeta entera, o se sale por abajo.
        '<div class="port">' + portada + '<div class="foto">' + foto + '</div></div>' +
        '<div class="dat">' +
          '<b>' + this.escapar(d.nombre || '') + '</b>' +
          (d.asignaturas ? '<div class="mat">' + this.escapar(d.asignaturas.toUpperCase()) + '</div>' : '') +
          (d.grupos ? '<div class="grp">' + this.escapar(d.grupos) + '</div>' : '') +
        '</div>' +
      '</div>' +
      (d.aviso ? this.aviso(d.aviso, 'a') : '') +
      '<p class="rotulo">Mis herramientas</p>' +
      accesos +
      this.aviso('Al abrir tu portal, Google te va a pedir tu cuenta del colegio la primera vez. ' +
                 'Después ya no.', 'a'),
      { titulo: 'Hola, ' + this.escapar(this.primerNombre(d.nombre)),
        nivel: true,
        botones: '<button class="icono" id="b-datos" title="Mis datos">👤</button>',
        despues: () => {
          document.getElementById('b-datos').onclick = () => this.verMisDatos();
          document.querySelectorAll('.acceso').forEach((b) => {
            // En la MISMA ventana, no en una pestaña nueva. Lo que pase
            // después lo decide el teléfono: desde la app instalada,
            // Android abre la liga adentro con una flecha para regresar
            // y iPhone suele saltar a Safari. Eso no se controla desde
            // aquí; lo que sí, es no forzar una pestaña de más.
            b.onclick = () => { window.location.href = b.dataset.url; };
          });
        }}
    );
  },

  /** Si la foto de Drive no carga, se cambia por las iniciales. */
  fotoNoCargo(img) {
    const caja = img.parentNode;
    if (!caja) return;
    caja.textContent = this.iniciales((this.docente || {}).nombre);
  },

  primerNombre(nombre) {
    const partes = (nombre || '').trim().split(/\s+/);
    return partes.length ? partes[0] : 'profe';
  },

  iniciales(nombre) {
    const partes = (nombre || '').trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return 'JB';
    return (partes[0][0] + (partes[1] ? partes[1][0] : '')).toUpperCase();
  },

  // ---------- mis datos ----------

  verMisDatos() {
    const d = this.docente || {};
    this.pintar(
      '<div class="bloque"><h4>Mi cuenta</h4>' +
        '<div class="reng"><span class="et">Usuario</span>' +
          '<span class="vl">' + this.escapar(d.usuario || '—') + '</span></div>' +
        (d.asignaturas ? '<div class="reng"><span class="et">Asignaturas</span>' +
          '<span class="vl">' + this.escapar(d.asignaturas) + '</span></div>' : '') +
        (d.grupos ? '<div class="reng"><span class="et">Grupos</span>' +
          '<span class="vl">' + this.escapar(d.grupos) + '</span></div>' : '') +
      '</div>' +
      '<button class="btn sec" id="d-usuario">Cambiar mi nombre de usuario</button>' +
      '<button class="btn sec" id="d-cambiar">Cambiar mi contraseña</button>' +
      '<div class="bloque" style="margin-top:14px"><h4>La app</h4>' +
        '<div class="reng"><span class="et">Versión</span>' +
          '<span class="vl">' + CONFIG.VERSION + '</span></div>' +
        '<div class="reng"><span class="et">Instalada</span>' +
          '<span class="vl">' + (Instalar.yaInstalada() ? 'Sí' : 'No') + '</span></div>' +
      '</div>' +
      '<button class="btn gris" id="d-actualizar">Buscar actualización</button>' +
      '<button class="btn gris" id="d-salir">Cerrar sesión en este teléfono</button>' +
      '<p class="mini">Si algo se ve viejo o raro, «Buscar actualización» la pone al día ' +
      'sin desinstalar nada.</p>' +
      '<button class="btn gris" id="d-volver" style="margin-top:14px">Volver</button>',
      { titulo: 'Mis datos', sub: this.escapar(d.nombre || ''), despues: () => {
        document.getElementById('d-volver').onclick = () => this.verInicio();
        document.getElementById('d-cambiar').onclick = () => this.verCambiarContrasena();
        document.getElementById('d-usuario').onclick = () => this.verCambiarUsuario();
        document.getElementById('d-actualizar').onclick = () => this.actualizar();
        document.getElementById('d-salir').onclick = () => this.salir();
      }}
    );
  },

  verCambiarUsuario() {
    const d = this.docente || {};
    this.pintar(
      '<div class="bloque">' +
        '<div class="campo"><label for="u1">Nombre de usuario</label>' +
          '<input id="u1" type="text" autocapitalize="off" autocorrect="off" ' +
          'spellcheck="false" value="' + this.escapar(d.usuario || '') + '"></div>' +
        '<div id="u-error"></div>' +
        '<button class="btn" id="u-btn" style="margin-top:10px">Guardar</button>' +
      '</div>' +
      this.aviso('Con este nombre entras a la app, en lugar de tu correo. ' +
                 'Tu correo sigue sirviendo igual.', 'a') +
      '<button class="btn gris" id="u-volver" style="margin-top:14px">Volver</button>',
      { titulo: 'Nombre de usuario', despues: () => {
        document.getElementById('u-volver').onclick = () => this.verMisDatos();
        document.getElementById('u-btn').onclick = async () => {
          const u = (document.getElementById('u1').value || '').trim();
          const btn = document.getElementById('u-btn');

          this.limpiarError('u-error');
          this.ocupado(btn, true, 'Guardando…');
          const r = await API.cambiarUsuario(u);
          this.ocupado(btn, false);

          if (!r.ok) { this.mostrarError('u-error', r.error); return; }
          this.docente = r.docente;
          this.verMisDatos();
        };
      }}
    );
  },

  verCambiarContrasena() {
    this.pintar(
      '<div class="bloque">' +
        this.campoPass('x0', 'Tu contraseña de ahora', 'current-password') +
        this.campoPass('x1', 'La nueva', 'new-password') +
        this.campoPass('x2', 'Escríbela otra vez', 'new-password') +
        '<div id="x-error"></div>' +
        '<button class="btn" id="x-btn" style="margin-top:10px">Guardar</button>' +
      '</div>' +
      this.aviso('Al cambiarla se cierra la sesión en tus otros aparatos. ' +
                 'En este te quedas adentro.', 'a') +
      '<button class="btn gris" id="x-volver" style="margin-top:14px">Volver</button>',
      { titulo: 'Cambiar contraseña', despues: () => {
        document.getElementById('x-volver').onclick = () => this.verMisDatos();
        document.getElementById('x-btn').onclick = async () => {
          const a = document.getElementById('x0').value || '';
          const n1 = document.getElementById('x1').value || '';
          const n2 = document.getElementById('x2').value || '';
          const btn = document.getElementById('x-btn');

          if (n1 !== n2) { this.mostrarError('x-error', 'Las dos nuevas no son iguales.'); return; }

          this.limpiarError('x-error');
          this.ocupado(btn, true, 'Guardando…');
          const r = await API.cambiarContrasena(a, n1);
          this.ocupado(btn, false);

          if (!r.ok) { this.mostrarError('x-error', r.error); return; }
          API.guardarSesion(r.sesion);
          this.verMisDatos();
        };
      }}
    );
  },

  /** Tira el service worker y recarga: así se baja la versión nueva. */
  async actualizar() {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      if (window.caches) {
        const llaves = await caches.keys();
        await Promise.all(llaves.map(k => caches.delete(k)));
      }
    } catch (e) { /* si no se puede, la recarga de abajo igual ayuda */ }
    location.reload(true);
  },

  async salir() {
    await API.salir();
    API.guardarSesion('');
    this.docente = null;
    this.verEntrar();
  }
};

window.addEventListener('load', () => {
  App.iniciar();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
