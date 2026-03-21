// Controlador principal: orquesta la subida, procesamiento y entrega de imágenes
import fs from 'fs';
import archiver from 'archiver';
import { procesarLote } from '../servicios/procesadorImagenes.js';

/**
 * Procesa las imágenes recibidas, genera las versiones solicitadas y responde:
 * - Con un ZIP si hay múltiples archivos de resultado.
 * - Con el archivo directamente si solo hay un resultado.
 */
export async function procesarImagenes(req, res) {
  const { formato } = req.body;
  const tamanios = req.tamaniosParsed;
  const archivos = req.files;

  let resultados;
  try {
    resultados = await procesarLote(archivos, tamanios, formato);
  } catch (err) {
    return res.status(500).json({ error: `Error inesperado en el procesamiento: ${err.message}` });
  } finally {
    // Eliminar archivos temporales sin importar el resultado
    for (const archivo of archivos) {
      fs.unlink(archivo.path, () => {});
    }
  }

  // Separar resultados exitosos de los que fallaron
  const exitosos = resultados.filter((r) => r.buffer !== null);
  const fallidos = resultados.filter((r) => r.buffer === null);

  if (exitosos.length === 0) {
    return res.status(422).json({
      error: 'No se pudo procesar ninguna imagen.',
      detalles: fallidos.map((f) => ({ archivo: f.nombre, error: f.error })),
    });
  }

  // Si solo hay un resultado exitoso, enviar el archivo directamente
  if (exitosos.length === 1) {
    const tipoMime = obtenerMimeType(formato);
    res.setHeader('Content-Type', tipoMime);
    res.setHeader('Content-Disposition', `attachment; filename="${exitosos[0].nombre}"`);

    // Incluir advertencias en cabecera si algunos fallaron
    if (fallidos.length > 0) {
      res.setHeader('X-Advertencias', JSON.stringify(fallidos.map((f) => f.error)));
    }
    return res.send(exitosos[0].buffer);
  }

  // Si hay múltiples resultados, empaquetar en un ZIP
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="imagenes_procesadas.zip"');

  const archivo = archiver('zip', { zlib: { level: 6 } });
  archivo.on('error', (err) => res.status(500).json({ error: err.message }));
  archivo.pipe(res);

  for (const resultado of exitosos) {
    archivo.append(resultado.buffer, { name: resultado.nombre });
  }

  // Incluir un resumen de errores en el ZIP si los hubo
  if (fallidos.length > 0) {
    const resumenErrores = fallidos
      .map((f) => `${f.nombre}: ${f.error}`)
      .join('\n');
    archivo.append(resumenErrores, { name: 'errores.txt' });
  }

  await archivo.finalize();
}

/**
 * Devuelve el MIME type correspondiente al formato de imagen.
 * @param {string} formato
 * @returns {string}
 */
function obtenerMimeType(formato) {
  const mimeTypes = {
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    avif: 'image/avif',
    tiff: 'image/tiff',
    gif: 'image/gif',
  };
  return mimeTypes[formato] || 'application/octet-stream';
}
