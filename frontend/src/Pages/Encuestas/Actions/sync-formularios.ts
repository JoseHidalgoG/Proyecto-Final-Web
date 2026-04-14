import { crearFormulario } from './formularios-api'
import { toFormularioBody } from './formulario-adapter'
import {
    marcarFormularioLocalConError,
    marcarFormularioLocalSincronizado,
} from './local-formulario-store'
import type { FormularioLocal } from '../interfaces/types'

// sincronizacion con local del form
export async function sincronizarFormularioLocal(formulario: FormularioLocal) {
    if (formulario.estadoLocal === 'SYNCED') {
        return formulario
    }

    try {
        const response = await crearFormulario(toFormularioBody(formulario))
        return await marcarFormularioLocalSincronizado(formulario.id, response.id)
    } catch (error) {
        const message =
            error instanceof Error ? error.message : 'No se pudo sincronizar el formulario.'

        await marcarFormularioLocalConError(formulario.id, message)
        throw new Error(message)
    }
}
