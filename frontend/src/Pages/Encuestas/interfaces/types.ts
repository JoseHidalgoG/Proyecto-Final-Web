export type NivelEducacion =
  | "PRIMARIA"
  | "SECUNDARIA"
  | "GRADO_UNIVERSITARIO"
  | "POSTGRADO"
  | "DOCTORADO"

export type FormularioEstadoLocal = "PENDING" | "SYNCED" | "ERROR"

export type FormularioCapturaInput = {
  nombreEncuestado: string
  sector: string
  nivelEducacion: NivelEducacion
  latitud: number
  longitud: number
  fotoBase64: string
  usuarioId: string
}

export type FormularioLocal = FormularioCapturaInput & {
  id: string
  creadoEn: string
  actualizadoEn: string
  estadoLocal: FormularioEstadoLocal
  sincronizado: boolean
  servidorId?: string
  errorSincronizacion?: string
}
