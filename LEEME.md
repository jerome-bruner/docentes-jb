# Docentes JB — app instalable para los profesores

App de la secundaria del Colegio Jerome Bruner. Vive en GitHub Pages y
habla con un proyecto de Apps Script que solo hace de API.

## Qué hace hoy

Es **la puerta**: el profesor instala la app, entra con su correo
institucional y una contraseña que él mismo crea, y de ahí abre su
portal de siempre. Ninguna pantalla de captura vive aquí todavía.

## Archivos

```
index.html          la cáscara
manifest.json       nombre, colores e íconos de la app instalada
sw.js               service worker  ← la VERSION va igual que en config.js
favicon.ico/.png
css/estilos.css
js/config.js        EL ÚNICO que se edita a mano: API y VERSION
js/api.js           hablar con Apps Script (POST + text/plain)
js/instalar.js      el paso de instalar, con sus 5 variantes
js/app.js           las vistas
iconos/             el juego completo
```

## Para subir una versión nueva

1. Cambia `VERSION` en **js/config.js** y en **sw.js**. Las dos.
2. Sube los archivos al repositorio.
3. En el teléfono, «Mis datos → Buscar actualización».

Si solo cambias una de las dos, los teléfonos se quedan con la versión
vieja y parece que no subiste nada.

## Lo que hay que configurar la primera vez

En `js/config.js`:

- `API` — la liga `/exec` del proyecto **DOCENTES_JB_API**, publicado
  como **Cualquier persona**. No es la liga del portal.

Si quedó publicado como «cualquiera con cuenta de Google», la app
recibe la pantalla de Google en vez del JSON y marca que el servidor no
contestó datos.
