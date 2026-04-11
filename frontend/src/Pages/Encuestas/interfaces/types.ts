export type NivelEducacion =
  | "PRIMARIA"
  | "SECUNDARIA"
  | "GRADO_UNIVERSITARIO"
  | "POSTGRADO"
  | "DOCTORADO"

export type FormularioEstadoLocal = "DRAFT"

export type FormularioCapturaInput = {
  nombreEncuestado: string
  sector: string
  nivelEducacion: NivelEducacion
}

export type FormularioLocal = FormularioCapturaInput & {
  id: string
  usuarioId: string
  creadoEn: string
  sincronizado: false
  estado: true
  estadoLocal: FormularioEstadoLocal
}
