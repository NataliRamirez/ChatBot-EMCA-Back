// src/dtos/dtos.ts

// 1. Tipos y Clase para la tabla `reportes_documentos` (MultimediaDTO)
export interface MultimediaRow {
  id: number;
  nombre: string;
  archivo: string;
  fecha: string | Date;
  estado?: string;
  respuesta?: string;
}

export class MultimediaDTO {
  id: number;
  nombre: string;
  url: string;
  fecha: string | Date;

  constructor(row: MultimediaRow, baseUrl: string) {
    this.id = row.id;
    this.nombre = row.nombre;
    // Si ya viene con protocolo http/https se mantiene, de lo contrario concatena baseUrl
    this.url = row.archivo && row.archivo.startsWith('http')
      ? row.archivo 
      : `${baseUrl}/uploads/${row.archivo || ''}`;
    this.fecha = row.fecha;
  }
}

// 2. Tipos y Función para la creación/normalización de Multimedia en el Bot (crearMediaDTO)
export interface MediaDTOInput {
  telefono?: string;
  nombreArchivo: string;
  tipoMensaje?: 'USUARIO_IMAGEN' | 'USUARIO_AUDIO' | 'USUARIO_VIDEO' | 'USUARIO_DOCUMENTO' | 'USUARIO_MEDIA';
  leyendaTexto?: string;
  estado?: string;
  respuesta?: string;
  baseUrl?: string;
}

export interface MediaDTOOutput {
  telefono_usuario: string;
  nombre: string;
  url_media: string;
  tipo_mensaje: string;
  estado: string;
  respuesta: string;
  fecha_creacion: string;
}

export const crearMediaDTO = (data: MediaDTOInput): MediaDTOOutput => {
  const host = data.baseUrl || 'http://127.0.0.1:4000';

  return {
    telefono_usuario: data.telefono || 'N/A',
    nombre: data.leyendaTexto || 'Adjunto Bot',
    url_media: data.nombreArchivo && data.nombreArchivo.startsWith('http')
      ? data.nombreArchivo
      : `${host}/uploads/${data.nombreArchivo}`,
    tipo_mensaje: data.tipoMensaje || 'USUARIO_IMAGEN',
    estado: data.estado || 'Recibido',
    respuesta: data.respuesta || '',
    fecha_creacion: new Date().toISOString()
  };
};