import { request } from '@/api/http'

import type { RegistroMapa, RegistroMapaApi } from '../interfaces/types'

// Conectando la parte de jose
export const cleanMapRegisters = async () => {
    const registros = await request<RegistroMapaApi[]>('/formularios')

    return registros.map(mapRegister)
}

const mapRegister = (registro: RegistroMapaApi): RegistroMapa => {
    return {
        ...registro,
        creadoEn: normalizeCreationDate(registro.creadoEn),
    }
}

const normalizeCreationDate = (value: RegistroMapaApi['creadoEn']) => {
    if (typeof value === 'string') {
        return value
    }

    const [year, month, day, hour = 0, minute = 0, second = 0, nanos = 0] = value
    const date = new Date(year, month - 1, day, hour, minute, second, Math.floor(nanos / 1_000_000))

    return date.toISOString()
}
