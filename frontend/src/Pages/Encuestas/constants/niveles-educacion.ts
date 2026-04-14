import type { NivelEducacion } from "../interfaces/types"

export const nivelesEducacion = [
  { value: "BASICO", label: "Básico" },
  { value: "MEDIO", label: "Medio" },
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

export function normalizarNivelEducacion(value: string): NivelEducacion | null {
  const normalizedValue = value.trim().toUpperCase().replace(/\s+/g, "_")

  if (isNivelEducacion(normalizedValue)) {
    return normalizedValue
  }

  if (normalizedValue === "PRIMARIA") {
    return "BASICO"
  }

  if (normalizedValue === "SECUNDARIA") {
    return "MEDIO"
  }

  return null
}

export function obtenerEtiquetaNivelEducacion(value: string) {
  const normalizedValue = normalizarNivelEducacion(value)
  const nivel = nivelesEducacion.find(
    (currentNivel) => currentNivel.value === normalizedValue,
  )

  return nivel?.label ?? value
}
