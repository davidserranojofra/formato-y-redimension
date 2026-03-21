// Carga las variables de entorno desde el archivo .env
import 'dotenv/config';

export const configuracion = {
  puerto: parseInt(process.env.PUERTO) || 3000,
  tamanioMaximoMb: parseInt(process.env.TAMANIO_MAXIMO_MB) || 20,
  carpetaSubidas: process.env.CARPETA_SUBIDAS || 'uploads',

  // Formatos de imagen aceptados como entrada
  formatosPermitidos: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/tiff', 'image/gif'],

  // Formatos de salida disponibles para la conversión
  formatosSalida: ['jpeg', 'png', 'webp', 'avif', 'tiff', 'gif'],
};
