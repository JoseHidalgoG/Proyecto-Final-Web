import type { FormularioBody } from './formularios-api'
import type { FormularioLocal } from '../interfaces/types'

export const toFormularioBody = (formulario: FormularioLocal): FormularioBody => {
    return {
        fotoBase64: formulario.fotoBase64,
        latitud: formulario.latitud,
        longitud: formulario.longitud,
        nivelEscolar: formulario.nivelEducacion,
        nombreEncuestado: formulario.nombreEncuestado,
        sector: formulario.sector,
    }
}
