// Punto de entrada principal de la aplicación
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { configuracion } from './config/configuracion.js';
import rutasImagenes from './rutas/imagenes.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Servir los archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// Parsear cuerpos JSON (para peticiones que no usen multipart)
app.use(express.json());

// Registrar las rutas de la API
app.use('/api/imagenes', rutasImagenes);

// Manejador global de errores de Multer y otros errores conocidos
app.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: `El archivo supera el tamaño máximo permitido de ${configuracion.tamanioMaximoMb} MB.`,
    });
  }
  if (err.message) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Error interno del servidor.' });
});

// Iniciar el servidor
app.listen(configuracion.puerto, () => {
  console.log(`Servidor escuchando en http://localhost:${configuracion.puerto}`);
  console.log(`API disponible en http://localhost:${configuracion.puerto}/api/imagenes`);
});
