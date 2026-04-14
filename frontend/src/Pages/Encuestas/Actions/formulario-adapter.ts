import type { FormularioBody } from './formularios-api'
import type { FormularioLocal } from '../interfaces/types'
import { normalizarNivelEducacion } from '../constants/niveles-educacion'

export const toFormularioBody = (formulario: FormularioLocal): FormularioBody => {
    const nivelEducacion = normalizarNivelEducacion(formulario.nivelEducacion)

    return {
        fotoBase64: formulario.fotoBase64,
        latitud: formulario.latitud,
        longitud: formulario.longitud,
        nivelEscolar: nivelEducacion as string,
        nombreEncuestado: formulario.nombreEncuestado,
        sector: formulario.sector,
    }
}
