export type UsuarioRol = "ADMIN" | "PERSONAL"

export type Usuario = {
  id: string
  nombre: string
  email: string
  rol: UsuarioRol
  fechaCreacion: string
  activo: boolean
}

export type UsuarioFormInput = {
  nombre: string
  email: string
  password: string
  rol: UsuarioRol
}
