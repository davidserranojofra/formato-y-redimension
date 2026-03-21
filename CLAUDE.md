# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos principales

```bash
# Instalar dependencias
npm install

# Arrancar en producción
npm start

# Arrancar en desarrollo (recarga automática con --watch)
npm run dev
```

El servidor queda disponible en `http://localhost:3000` (configurable en `.env`).

## Estructura del proyecto

```
redimensionamiento/
├── src/
│   ├── servidor.js                  # Punto de entrada: Express, rutas, manejador global de errores
│   ├── config/configuracion.js      # Variables de entorno y constantes de la app
│   ├── rutas/imagenes.js            # Definición de endpoints /api/imagenes
│   ├── controladores/
│   │   └── imagenesControlador.js   # Orquesta procesamiento y construye la respuesta (ZIP o archivo único)
│   ├── middlewares/
│   │   ├── subida.js                # Multer: almacenamiento en disco, filtro MIME, límite de tamaño
│   │   └── validacion.js            # Valida formato de salida y array de tamaños antes del controlador
│   └── servicios/
│       └── procesadorImagenes.js    # Sharp: redimensiona y convierte; procesarLote() ejecuta todo en paralelo
└── public/                          # Frontend estático servido por Express
    ├── index.html
    ├── css/estilos.css
    └── js/app.js                    # Drag & drop, gestión de tamaños dinámicos, fetch + descarga blob
```

## Arquitectura y flujo de datos

**Backend:**
`POST /api/imagenes/procesar` → `subida` (Multer, guarda en `uploads/`) → `validarParametros` → `procesarImagenes` (controlador) → `procesarLote` (servicio Sharp) → respuesta ZIP o archivo único → limpieza de temporales.

**Frontend:**
El JS es un módulo ES nativo (`type="module"`). Acumula archivos en un array en memoria, construye un `FormData` y hace `fetch` al endpoint. El resultado llega como `Blob` y se descarga mediante un `<a>` temporal.

## Variables de entorno (`.env`)

| Variable            | Por defecto | Descripción                        |
|---------------------|-------------|-------------------------------------|
| `PUERTO`            | `3000`      | Puerto del servidor HTTP            |
| `TAMANIO_MAXIMO_MB` | `20`        | Límite de peso por archivo          |
| `CARPETA_SUBIDAS`   | `uploads`   | Directorio temporal de Multer       |

## API REST — referencia rápida

```bash
# Procesar imágenes (devuelve ZIP o imagen directa)
curl -X POST http://localhost:3000/api/imagenes/procesar \
  -F "imagenes=@foto.jpg" \
  -F "formato=webp" \
  -F 'tamanios=[1200,800,400]' \
  --output resultado.zip

# Consultar formatos y límites disponibles
curl http://localhost:3000/api/imagenes/info
```

## Notas de implementación

- Todo el código, comentarios y mensajes están en **español**.
- El módulo usa **ES Modules** (`import/export`); no usar `require()`.
- `procesarLote()` ejecuta todas las combinaciones imagen × tamaño con `Promise.all()` para no bloquear el event loop.
- Los archivos temporales de Multer se eliminan en el bloque `finally` del controlador, independientemente de si el procesamiento tuvo éxito o falló.
- Sharp aplica `withoutEnlargement: true` para no escalar imágenes por encima de su resolución original.
