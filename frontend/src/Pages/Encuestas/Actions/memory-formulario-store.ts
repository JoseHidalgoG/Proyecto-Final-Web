import type { FormularioCapturaInput, FormularioLocal } from "../interfaces/types"

let formularios: FormularioLocal[] = []

function createLocalId() {
  return `formulario-${crypto.randomUUID()}`
}

export const memoryFormularioStore = {
  create(usuarioId: string, input: FormularioCapturaInput) {
    const formulario: FormularioLocal = {
      id: createLocalId(),
      usuarioId,
      nombreEncuestado: input.nombreEncuestado,
      sector: input.sector,
      nivelEducacion: input.nivelEducacion,
      creadoEn: new Date().toISOString(),
      sincronizado: false,
      estado: true,
      estadoLocal: "DRAFT",
    }

    formularios = [formulario, ...formularios]

    return formulario
  },

  list() {
    return [...formularios]
  },

  clear() {
    formularios = []
  },
}
