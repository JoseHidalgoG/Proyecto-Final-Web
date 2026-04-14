import { obtenerEtiquetaNivelEducacion } from '@/Pages/Encuestas/constants/niveles-educacion'

import type { FiltrosMapa, RegistroMapa } from '../interfaces/types'

export const initialFiltrosMapa: FiltrosMapa = {
    nivelEscolar: '',
    sector: '',
    usuarioId: '',
}

export function filtrarRegistrosMapa(registros: RegistroMapa[], filtros: FiltrosMapa) {
    return registros.filter((registro) => {
        if (filtros.usuarioId && registro.usuarioId !== filtros.usuarioId) {
            return false
        }

        if (filtros.sector && registro.sector !== filtros.sector) {
            return false
        }

        if (filtros.nivelEscolar && registro.nivelEscolar !== filtros.nivelEscolar) {
            return false
        }

        return true
    })
}

export function hasValidCoordinates(registro: RegistroMapa) {
    // para que no se extrapole el codigo con coordenadas malas
    return (
        Number.isFinite(registro.latitud) &&
        Number.isFinite(registro.longitud) &&
        registro.latitud !== 0 &&
        registro.longitud !== 0
    )
}

export function orderRegisterMaps(registros: RegistroMapa[]) {
    return [...registros].sort((first, second) => second.creadoEn.localeCompare(first.creadoEn))
}

export function getNivelMapaLabel(nivelEscolar: string) {
    return obtenerEtiquetaNivelEducacion(nivelEscolar)
}

export function getUsuarioMapaLabel(usuarioId: string) {
    return `Usuario ${usuarioId.slice(-6)}`
}
