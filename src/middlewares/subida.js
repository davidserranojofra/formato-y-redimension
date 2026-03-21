// Configuración de Multer para gestionar la subida de archivos
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { configuracion } from '../config/configuracion.js';

// Asegura que la carpeta de subidas exista
if (!fs.existsSync(configuracion.carpetaSubidas)) {
  fs.mkdirSync(configuracion.carpetaSubidas, { recursive: true });
}

// Guarda los archivos en disco con nombre único para evitar colisiones
const almacenamiento = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, configuracion.carpetaSubidas);
  },
  filename: (_req, file, cb) => {
    const unicoId = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname);
    cb(null, `${unicoId}${extension}`);
  },
});

// Filtra que solo se acepten archivos de imagen válidos
const filtroArchivo = (_req, file, cb) => {
  if (configuracion.formatosPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Formato no permitido: "${file.mimetype}". Formatos aceptados: JPG, PNG, WebP, AVIF, TIFF, GIF.`
      ),
      false
    );
  }
};

export const subida = multer({
  storage: almacenamiento,
  fileFilter: filtroArchivo,
  limits: {
    fileSize: configuracion.tamanioMaximoMb * 1024 * 1024,
  },
});
