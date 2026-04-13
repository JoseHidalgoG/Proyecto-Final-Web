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

export function crearFormulario(body: FormularioBody, token: string) {
  return request<FormularioResponse>("/formularios", {
    body,
    method: "POST",
    token,
  })
}

export function listarFormularios(token: string) {
  return request<FormularioResponse[]>("/formularios", {
    token,
  })
}

export function listarMisFormularios(token: string) {
  return request<FormularioResponse[]>("/formularios/mis-registros", {
    token,
  })
}

export function actualizarFormulario(
  id: string,
  body: FormularioBody,
  token: string,
) {
  return request<FormularioResponse>(`/formularios/${id}`, {
    body,
    method: "PUT",
    token,
  })
}

export function eliminarFormulario(id: string, token: string) {
  return request<void>(`/formularios/${id}`, {
    method: "DELETE",
    token,
  })
}

export function marcarFormularioSincronizado(id: string, token: string) {
  return request<{ mensaje: string }>(`/formularios/${id}/sincronizar`, {
    method: "PATCH",
    token,
  })
}
