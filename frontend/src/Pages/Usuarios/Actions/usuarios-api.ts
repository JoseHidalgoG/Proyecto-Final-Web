import { request } from '@/api/http'

import type { Usuario, UsuarioFormInput } from '../interfaces/types'

type UsuarioBody = {
    nombre: string
    email: string
    password: string
}

function toUsuarioBody(input: UsuarioFormInput): UsuarioBody {
    return {
        email: input.email,
        nombre: input.nombre,
        password: input.password,
    }
}
//confimar si es admin
function getAdminQuery(input: UsuarioFormInput) {
    return input.rol === 'ADMIN' ? 'true' : 'false'
}

// para usuarios
export function listarUsuarios() {
    return request<Usuario[]>('/usuarios')
}

export function crearUsuario(input: UsuarioFormInput) {
    return request<Usuario>(`/usuarios?admin=${getAdminQuery(input)}`, {
        body: toUsuarioBody(input),
        method: 'POST',
    })
}

export function actualizarUsuario(id: string, input: UsuarioFormInput) {
    return request<Usuario>(`/usuarios/${id}?admin=${getAdminQuery(input)}`, {
        body: toUsuarioBody(input),
        method: 'PUT',
    })
}

export function desactivarUsuario(id: string) {
    return request<void>(`/usuarios/${id}`, {
        method: 'DELETE',
    })
}
