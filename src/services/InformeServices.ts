/**
 * @file informesService.ts
 * @author Juan David Nieto
 * @description Servicio encargado de la comunicación con la API de informes,
 * permitiendo consultar, crear, actualizar, eliminar y exportar informes
 * en formato PDF y Excel.
 */

const API_URL = 'http://127.0.0.1:4000/v1/informes';
const API_KEY = 'EmcaSecret2026';

/**
 * Cliente HTTP base centralizado.
 *
 * Agrega automáticamente la API Key y el Content-Type
 * cuando se envía información JSON.
 */
const apiFetch = async (
  endpoint: string = '',
  options: RequestInit = {}
): Promise<Response> => {

  const url = `${API_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'x-api-key': API_KEY,
    ...(options.headers as Record<string, string> || {})
  };

  if (
    options.body &&
    !(options.body instanceof FormData)
  ) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...options,
    headers
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));

    throw new Error(
      errorData.mensaje ||
      errorData.error ||
      `Error HTTP: ${res.status}`
    );
  }

  return res;
};

// =========================================================
// SERVICIOS CRUD DE INFORMES
// =========================================================

/**
 * Obtener todos los informes.
 */
export const obtenerInformes = async (): Promise<any> => {

  const res = await apiFetch();

  return await res.json();
};

/**
 * Crear un nuevo informe.
 */
export const crearInforme = async (
  datos: Record<string, any>
): Promise<any> => {

  const res = await apiFetch('', {
    method: 'POST',
    body: JSON.stringify(datos)
  });

  return await res.json();
};

/**
 * Actualizar un informe existente.
 */
export const actualizarInforme = async (
  id: number | string,
  datos: Record<string, any>
): Promise<any> => {

  const res = await apiFetch(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos)
  });

  return await res.json();
};

/**
 * Eliminar un informe existente.
 */
export const eliminarInforme = async (
  id: number | string
): Promise<any> => {

  const res = await apiFetch(`/${id}`, {
    method: 'DELETE'
  });

  return await res.json();
};

// =========================================================
// EXPORTACIÓN DE ARCHIVOS
// =========================================================

/**
 * Generar reporte PDF de informes.
 */
export const generarPDF = async (): Promise<Blob> => {

  const res = await apiFetch('/pdf');

  return await res.blob();
};

/**
 * Generar reporte Excel de informes.
 */
export const generarExcel = async (): Promise<Blob> => {

  const res = await apiFetch('/excel');

  return await res.blob();
};

// =========================================================
// DESCARGA DE ARCHIVOS
// =========================================================

/**
 * Descarga un Blob generado por la API.
 */
export const descargarBlob = (
  blob: Blob,
  nombreArchivo: string
): void => {

  const url = window.URL.createObjectURL(blob);

  const a = document.createElement('a');

  a.href = url;
  a.download = nombreArchivo;

  document.body.appendChild(a);

  a.click();

  a.remove();

  window.URL.revokeObjectURL(url);
};