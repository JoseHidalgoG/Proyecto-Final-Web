import type { NivelEducacion } from "../interfaces/types"

export const nivelesEducacion = [
  { value: "PRIMARIA", label: "Primaria" },
  { value: "SECUNDARIA", label: "Secundaria" },
  { value: "GRADO_UNIVERSITARIO", label: "Grado Universitario" },
  { value: "POSTGRADO", label: "Postgrado" },
  { value: "DOCTORADO", label: "Doctorado" },
] satisfies Array<{
  value: NivelEducacion
  label: string
}>

export function isNivelEducacion(value: string): value is NivelEducacion {
  return nivelesEducacion.some((nivel) => nivel.value === value)
}
