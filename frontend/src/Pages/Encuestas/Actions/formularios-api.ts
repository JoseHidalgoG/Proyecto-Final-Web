import { request } from "@/api/http"

export type FormularioBody = {
  nombreEncuestado: string
  sector: string
  nivelEscolar: string
  latitud: number
  longitud: number
  fotoBase64: string
}

export type FormularioResponse = {
  id: string
  usuarioId: string
  nombreEncuestado: string
  sector: string
  nivelEscolar: string
  latitud: number
  longitud: number
  fotoBase64: string
  creadoEn: string
  sincronizado: boolean
}

export function crearFormulario(body: FormularioBody) {
  return request<FormularioResponse>("/formularios", {
    body,
    method: "POST",
  })
}

export function listarFormularios() {
  return request<FormularioResponse[]>("/formularios")
}

export function listarMisFormularios() {
  return request<FormularioResponse[]>("/formularios/mis-registros")
}

export function actualizarFormulario(
  id: string,
  body: FormularioBody,
) {
  return request<FormularioResponse>(`/formularios/${id}`, {
    body,
    method: "PUT",
  })
}

export function eliminarFormulario(id: string) {
  return request<void>(`/formularios/${id}`, {
    method: "DELETE",
  })
}

export function marcarFormularioSincronizado(id: string) {
  return request<{ mensaje: string }>(`/formularios/${id}/sincronizar`, {
    method: "PATCH",
  })
}
