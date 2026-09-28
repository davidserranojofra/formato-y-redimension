// Servicio de procesamiento de imágenes usando Sharp
import sharp from 'sharp';
import path from 'path';

/**
 * Construye las opciones de calidad que acepta Sharp según el formato de salida.
 * - jpeg/webp/avif/tiff: opción "quality" (1-100).
 * - png: convierte la calidad (1-100) a compressionLevel (9-0, escala invertida).
 * - gif: Sharp no expone opciones de calidad, se ignora el parámetro.
 *
 * @param {string} formato
 * @param {number} calidad  - Valor entre 1 y 100.
 * @returns {object}
 */
function opcionesCalidad(formato, calidad) {
  if (['jpeg', 'webp', 'avif', 'tiff'].includes(formato)) {
    return { quality: calidad };
  }
  if (formato === 'png') {
    // compressionLevel 0 = sin compresión (máx. calidad), 9 = máx. compresión (mín. calidad)
    const nivel = Math.round((100 - calidad) / 100 * 9);
    return { compressionLevel: nivel };
  }
  return {};
}

/**
 * Procesa una imagen: la redimensiona a un ancho específico y la convierte
 * al formato de salida indicado con el nivel de calidad especificado.
 *
 * @param {string} rutaOrigen  - Ruta absoluta del archivo original subido.
 * @param {number} ancho       - Ancho en píxeles al que se redimensionará.
 * @param {string} formato     - Formato de salida (jpeg, png, webp, avif, tiff, gif).
 * @param {number} calidad     - Nivel de calidad entre 1 y 100.
 * @returns {Promise<Buffer>}  - Buffer con los datos de la imagen procesada.
 */
export async function procesarImagen(rutaOrigen, ancho, formato, calidad) {
  const imagen = sharp(rutaOrigen);

  // Obtener metadatos para no ampliar imágenes más allá de su tamaño original
  const metadatos = await imagen.metadata();
  const anchoFinal = Math.min(ancho, metadatos.width);

  return imagen
    .resize({ width: anchoFinal, withoutEnlargement: true })
    .toFormat(formato, opcionesCalidad(formato, calidad))
    .toBuffer();
}

/**
 * Genera el nombre de archivo para la imagen procesada.
 *
 * @param {string} nombreOriginal - Nombre original del archivo subido.
 * @param {number} ancho          - Ancho aplicado.
 * @param {string} formato        - Formato de salida.
 * @returns {string}
 */
export function generarNombreArchivo(nombreOriginal, ancho, formato) {
  const sinExtension = path.basename(nombreOriginal, path.extname(nombreOriginal));
  return `${sinExtension}_${ancho}px.${formato}`;
}

/**
 * Procesa todas las combinaciones imagen × tamaño en paralelo.
 *
 * @param {Express.Multer.File[]} archivos - Array de archivos subidos por Multer.
 * @param {number[]} tamanios              - Array de anchos de salida.
 * @param {string} formato                 - Formato de salida.
 * @param {number} calidad                 - Nivel de calidad entre 1 y 100.
 * @returns {Promise<Array<{nombre: string, buffer: Buffer, error?: string}>>}
 */
export async function procesarLote(archivos, tamanios, formato, calidad) {
  const tareas = [];

  for (const archivo of archivos) {
    for (const ancho of tamanios) {
      tareas.push(
        procesarImagen(archivo.path, ancho, formato, calidad)
          .then((buffer) => ({
            nombre: generarNombreArchivo(archivo.originalname, ancho, formato),
            buffer,
          }))
          .catch((err) => ({
            nombre: generarNombreArchivo(archivo.originalname, ancho, formato),
            buffer: null,
            error: err.message,
          }))
      );
    }
  }

  // Ejecutar todas las operaciones en paralelo para máxima eficiencia
  return Promise.all(tareas);
}
