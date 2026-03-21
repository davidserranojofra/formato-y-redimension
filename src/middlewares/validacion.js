// Middleware de validación de parámetros del cuerpo de la petición
import { configuracion } from '../config/configuracion.js';

/**
 * Valida que la petición contenga al menos un archivo, un formato de salida
 * válido y un array de tamaños con valores numéricos positivos.
 */
export function validarParametros(req, res, next) {
  // Verificar que se hayan subido archivos
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Debes subir al menos una imagen.' });
  }

  // Verificar el formato de salida
  const { formato } = req.body;
  if (!formato) {
    return res.status(400).json({ error: 'El parámetro "formato" es obligatorio.' });
  }
  if (!configuracion.formatosSalida.includes(formato)) {
    return res.status(400).json({
      error: `Formato de salida inválido: "${formato}". Opciones: ${configuracion.formatosSalida.join(', ')}.`,
    });
  }

  // Verificar y parsear el array de tamaños
  let tamanios;
  try {
    tamanios = typeof req.body.tamanios === 'string'
      ? JSON.parse(req.body.tamanios)
      : req.body.tamanios;
  } catch {
    return res.status(400).json({ error: 'El parámetro "tamanios" debe ser un JSON válido. Ejemplo: [1200, 800]' });
  }

  if (!Array.isArray(tamanios) || tamanios.length === 0) {
    return res.status(400).json({ error: 'El parámetro "tamanios" debe ser un array con al menos un valor.' });
  }

  // Validar que cada tamaño sea un número positivo
  for (const t of tamanios) {
    const valor = Number(t);
    if (!Number.isInteger(valor) || valor <= 0 || valor > 20000) {
      return res.status(400).json({
        error: `Tamaño inválido: "${t}". Cada tamaño debe ser un entero positivo entre 1 y 20000 píxeles.`,
      });
    }
  }

  // Guardar los tamaños ya parseados para el controlador
  req.tamaniosParsed = tamanios.map(Number);
  next();
}
