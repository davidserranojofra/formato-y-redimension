// Definición de rutas para el procesamiento de imágenes
import { Router } from 'express';
import { subida } from '../middlewares/subida.js';
import { validarParametros } from '../middlewares/validacion.js';
import { procesarImagenes } from '../controladores/imagenesControlador.js';
import { configuracion } from '../config/configuracion.js';

const router = Router();

/**
 * POST /api/imagenes/procesar
 *
 * Cuerpo (multipart/form-data):
 *   - imagenes (File[])  : Uno o más archivos de imagen.
 *   - formato   (string) : Formato de salida deseado (jpeg, png, webp, avif, tiff, gif).
 *   - tamanios  (string) : JSON con array de anchos en px. Ejemplo: [1200, 800, 400]
 *
 * Respuesta:
 *   - Un único archivo si solo hay un resultado.
 *   - Un ZIP con todos los resultados si hay varios.
 */
router.post(
  '/procesar',
  subida.array('imagenes', 20),
  validarParametros,
  procesarImagenes
);

/**
 * GET /api/imagenes/info
 * Devuelve la configuración disponible: formatos de entrada, salida y límites.
 */
router.get('/info', (_req, res) => {
  res.json({
    formatosEntrada: configuracion.formatosPermitidos,
    formatosSalida: configuracion.formatosSalida,
    tamanioMaximoMb: configuracion.tamanioMaximoMb,
    maxArchivos: 20,
  });
});

export default router;
