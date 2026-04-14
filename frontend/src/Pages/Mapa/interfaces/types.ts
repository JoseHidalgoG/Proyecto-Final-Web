export type RegistroMapaApi = {
  id: string
  usuarioId: string
  nombreEncuestado: string
  sector: string
  nivelEscolar: string
  latitud: number
  longitud: number
  fotoBase64: string
  creadoEn: string | number[]
  sincronizado: boolean
}

export type RegistroMapa = Omit<RegistroMapaApi, "creadoEn"> & {
  creadoEn: string
}

export type FiltrosMapa = {
  usuarioId: string
  sector: string
  nivelEscolar: string
}
