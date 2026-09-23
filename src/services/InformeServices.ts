const API = 'http://127.0.0.1:4000/v1/informes';

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': 'EmcaSecret2026'
};

export const obtenerInformes = async () => {
  const res = await fetch(API, {
    headers
  });

  return await res.json();
};

export const crearInforme = async (datos) => {
  const res = await fetch(API, {
    method: 'POST',
    headers,
    body: JSON.stringify(datos)
  });

  return await res.json();
};

export const actualizarInforme = async (id, datos) => {
  const res = await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(datos)
  });

  return await res.json();
};

export const eliminarInforme = async (id) => {
  const res = await fetch(`${API}/${id}`, {
    method: 'DELETE',
    headers: {
      'x-api-key': 'EmcaSecret2026'
    }
  });

  return await res.json();
};

export const generarPDF = async () => {
  const res = await fetch(`${API}/pdf`, {
    headers: {
      'x-api-key': 'EmcaSecret2026'
    }
  });

  return await res.blob();
};

export const generarExcel = async () => {
  const res = await fetch(`${API}/excel`, {
    headers: {
      'x-api-key': 'EmcaSecret2026'
    }
  });

  return await res.blob();
};