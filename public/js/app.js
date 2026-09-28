// Lógica del frontend: gestión de archivos, tamaños y envío del formulario

// ─── Referencias a elementos del DOM ───────────────────────────────────────
const zonaArrastre     = document.getElementById('zonaArrastre');
const inputArchivos    = document.getElementById('inputArchivos');
const listaArchivos    = document.getElementById('listaArchivos');
const selectFormato    = document.getElementById('formato');
const sliderCalidad    = document.getElementById('calidad');
const etiquetaCalidad  = document.getElementById('etiquetaCalidad');
const notaCalidad      = document.getElementById('notaCalidad');
const contenedorTam    = document.getElementById('contenedorTamanios');
const btnAgregarTam    = document.getElementById('btnAgregarTamanio');
const formulario       = document.getElementById('formulario');
const btnProcesar      = document.getElementById('btnProcesar');
const mensajeEstado    = document.getElementById('mensajeEstado');
const overlay          = document.getElementById('overlay');

// ─── Estado interno ─────────────────────────────────────────────────────────
/** @type {File[]} */
let archivosSeleccionados = [];

// ─── Zona de arrastre ───────────────────────────────────────────────────────
zonaArrastre.addEventListener('click', () => inputArchivos.click());

zonaArrastre.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') inputArchivos.click();
});

zonaArrastre.addEventListener('dragover', (e) => {
  e.preventDefault();
  zonaArrastre.classList.add('activa');
});

zonaArrastre.addEventListener('dragleave', () => {
  zonaArrastre.classList.remove('activa');
});

zonaArrastre.addEventListener('drop', (e) => {
  e.preventDefault();
  zonaArrastre.classList.remove('activa');
  agregarArchivos(Array.from(e.dataTransfer.files));
});

inputArchivos.addEventListener('change', () => {
  agregarArchivos(Array.from(inputArchivos.files));
  // Resetear el input para que permita volver a seleccionar el mismo archivo
  inputArchivos.value = '';
});

// ─── Gestión de la lista de archivos ────────────────────────────────────────
/**
 * Añade archivos al estado y actualiza la vista.
 * @param {File[]} nuevos
 */
function agregarArchivos(nuevos) {
  const TIPOS_VALIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/tiff', 'image/gif'];
  const MAX_BYTES = 20 * 1024 * 1024;

  for (const archivo of nuevos) {
    if (!TIPOS_VALIDOS.includes(archivo.type)) {
      mostrarMensaje(`"${archivo.name}" tiene un formato no compatible.`, 'error');
      continue;
    }
    if (archivo.size > MAX_BYTES) {
      mostrarMensaje(`"${archivo.name}" supera el límite de 20 MB.`, 'error');
      continue;
    }
    // Evitar duplicados por nombre y tamaño
    const existeDuplicado = archivosSeleccionados.some(
      (a) => a.name === archivo.name && a.size === archivo.size
    );
    if (!existeDuplicado) {
      archivosSeleccionados.push(archivo);
    }
  }

  renderizarListaArchivos();
  actualizarEstadoBoton();
}

/** Renderiza la lista de archivos seleccionados */
function renderizarListaArchivos() {
  listaArchivos.innerHTML = '';
  for (let i = 0; i < archivosSeleccionados.length; i++) {
    const archivo = archivosSeleccionados[i];
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="nombre-archivo" title="${archivo.name}">${archivo.name}</span>
      <span class="peso-archivo">${formatearPeso(archivo.size)}</span>
      <button type="button" class="btn-eliminar" aria-label="Eliminar ${archivo.name}" data-indice="${i}">×</button>
    `;
    listaArchivos.appendChild(li);
  }

  listaArchivos.querySelectorAll('.btn-eliminar').forEach((btn) => {
    btn.addEventListener('click', () => {
      const indice = parseInt(btn.dataset.indice, 10);
      archivosSeleccionados.splice(indice, 1);
      renderizarListaArchivos();
      actualizarEstadoBoton();
    });
  });
}

/**
 * Formatea bytes a una cadena legible.
 * @param {number} bytes
 * @returns {string}
 */
function formatearPeso(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Gestión de tamaños de salida ───────────────────────────────────────────
/** Añade una nueva fila de tamaño al contenedor */
function agregarFilaTamanio(valorInicial = '') {
  const div = document.createElement('div');
  div.className = 'item-tamanio';
  div.innerHTML = `
    <input type="number" min="1" max="20000" placeholder="Ej: 1200" value="${valorInicial}" aria-label="Ancho en píxeles" />
    <span>px</span>
    <button type="button" class="btn-quitar" aria-label="Quitar tamaño">×</button>
  `;

  div.querySelector('.btn-quitar').addEventListener('click', () => {
    div.remove();
    actualizarEstadoBoton();
  });

  div.querySelector('input').addEventListener('input', actualizarEstadoBoton);

  contenedorTam.appendChild(div);
  div.querySelector('input').focus();
  actualizarEstadoBoton();
}

// Añadir un tamaño por defecto al cargar
agregarFilaTamanio(1200);

btnAgregarTam.addEventListener('click', () => agregarFilaTamanio());

// ─── Habilitación del botón de envío ────────────────────────────────────────
function actualizarEstadoBoton() {
  const hayArchivos  = archivosSeleccionados.length > 0;
  const hayFormato   = selectFormato.value !== '';
  const tamaniosValidos = obtenerTamaniosValidos().length > 0;

  btnProcesar.disabled = !(hayArchivos && hayFormato && tamaniosValidos);
}

selectFormato.addEventListener('change', () => {
  actualizarEstadoBoton();
  actualizarNotaCalidad();
});

// ─── Slider de calidad ───────────────────────────────────────────────────────
/**
 * Actualiza la etiqueta numérica, el degradado de la barra y la nota
 * informativa según el formato seleccionado.
 */
function actualizarSliderCalidad() {
  const valor = sliderCalidad.value;
  etiquetaCalidad.textContent = valor;

  // Colorear la barra de progreso del slider mediante una variable CSS
  const porcentaje = ((valor - 1) / 99) * 100;
  sliderCalidad.style.setProperty('--progreso', `${porcentaje}%`);
}

function actualizarNotaCalidad() {
  const fmt = selectFormato.value;
  if (fmt === 'gif') {
    notaCalidad.textContent = 'El formato GIF no admite ajuste de calidad.';
  } else if (fmt === 'png') {
    notaCalidad.textContent = 'En PNG controla el nivel de compresión (mayor calidad = archivo más grande).';
  } else if (fmt) {
    notaCalidad.textContent = 'Mayor calidad = menor compresión = archivo más grande.';
  } else {
    notaCalidad.textContent = '';
  }
}

sliderCalidad.addEventListener('input', actualizarSliderCalidad);

// Inicializar el estado visual del slider al cargar
actualizarSliderCalidad();

/**
 * Devuelve los valores numéricos válidos de los inputs de tamaño.
 * @returns {number[]}
 */
function obtenerTamaniosValidos() {
  return Array.from(contenedorTam.querySelectorAll('input[type="number"]'))
    .map((inp) => parseInt(inp.value, 10))
    .filter((v) => Number.isInteger(v) && v > 0 && v <= 20000);
}

// ─── Envío del formulario ────────────────────────────────────────────────────
formulario.addEventListener('submit', async (e) => {
  e.preventDefault();
  limpiarMensaje();

  const tamanios = obtenerTamaniosValidos();
  if (tamanios.length === 0) {
    mostrarMensaje('Añade al menos un tamaño de salida válido.', 'error');
    return;
  }

  const formData = new FormData();
  for (const archivo of archivosSeleccionados) {
    formData.append('imagenes', archivo);
  }
  formData.append('formato', selectFormato.value);
  formData.append('calidad', sliderCalidad.value);
  formData.append('tamanios', JSON.stringify(tamanios));

  mostrarOverlay(true);

  try {
    const respuesta = await fetch('/api/imagenes/procesar', {
      method: 'POST',
      body: formData,
    });

    if (!respuesta.ok) {
      const datos = await respuesta.json();
      throw new Error(datos.error || `Error ${respuesta.status}`);
    }

    // Obtener el nombre del archivo desde la cabecera Content-Disposition
    const disposition = respuesta.headers.get('Content-Disposition') || '';
    const coincidencia = disposition.match(/filename="?([^"]+)"?/);
    const nombreArchivo = coincidencia ? coincidencia[1] : 'resultado';

    // Descargar el blob recibido
    const blob = await respuesta.blob();
    const url  = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivo;
    enlace.click();
    URL.revokeObjectURL(url);

    mostrarMensaje('Descarga iniciada correctamente.', 'exito');
  } catch (error) {
    mostrarMensaje(`Error: ${error.message}`, 'error');
  } finally {
    mostrarOverlay(false);
  }
});

// ─── Utilidades de UI ────────────────────────────────────────────────────────
function mostrarOverlay(visible) {
  overlay.classList.toggle('oculto', !visible);
  overlay.setAttribute('aria-hidden', String(!visible));
}

function mostrarMensaje(texto, tipo) {
  mensajeEstado.textContent = texto;
  mensajeEstado.className = `mensaje-estado ${tipo}`;
}

function limpiarMensaje() {
  mensajeEstado.textContent = '';
  mensajeEstado.className = 'mensaje-estado';
}
