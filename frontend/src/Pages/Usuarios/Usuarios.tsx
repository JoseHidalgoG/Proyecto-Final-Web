import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  ArrowLeftCircle,
  Pencil,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/Pages/Auth/hooks/auth-context"
import { cn } from "@/lib/utils"

import {
  actualizarUsuario,
  crearUsuario,
  desactivarUsuario,
  listarUsuarios,
} from "./Actions/usuarios-api"
import type { Usuario, UsuarioFormInput, UsuarioRol } from "./interfaces/types"

type UsuarioErrors = Partial<Record<keyof UsuarioFormInput | "general", string>>

const initialForm: UsuarioFormInput = {
  email: "",
  nombre: "",
  password: "",
  rol: "PERSONAL",
}

const roles: Array<{ value: UsuarioRol; label: string }> = [
  { value: "PERSONAL", label: "Personal" },
  { value: "ADMIN", label: "Administrador" },
]

export function UsuariosPage() {
  const { session } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [form, setForm] = useState<UsuarioFormInput>(initialForm)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [errors, setErrors] = useState<UsuarioErrors>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")

  const title = editingUser ? "Editar usuario" : "Crear usuario"
  const submitText = editingUser ? "Guardar cambios" : "Crear usuario"
  const usuariosOrdenados = useMemo(
    () => [...usuarios].sort((first, second) => first.nombre.localeCompare(second.nombre)),
    [usuarios],
  )

  useEffect(() => {
    loadUsuarios()
  }, [])

  async function loadUsuarios() {
    setIsLoading(true)
    setErrors({})

    try {
      setUsuarios(await listarUsuarios())
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "No se pudo cargar la lista de usuarios.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  function updateField<Field extends keyof UsuarioFormInput>(
    field: Field,
    value: UsuarioFormInput[Field],
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
      general: undefined,
    }))
    setMessage("")
  }

  function validate() {
    const nextErrors: UsuarioErrors = {}

    if (!form.nombre.trim()) {
      nextErrors.nombre = "Ingresa el nombre del usuario."
    }

    if (!form.email.trim()) {
      nextErrors.email = "Ingresa el correo del usuario."
    }

    if (!form.email.includes("@")) {
      nextErrors.email = "Ingresa un correo valido."
    }

    if (!form.password.trim()) {
      nextErrors.password = "Ingresa la contraseña."
    }

    if (form.password.trim().length < 4) {
      nextErrors.password = "La contraseña debe tener al menos 4 caracteres."
    }

    return nextErrors
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validate()
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const input = {
        email: form.email.trim(),
        nombre: form.nombre.trim(),
        password: form.password,
        rol: form.rol,
      }

      if (editingUser) {
        await actualizarUsuario(editingUser.id, input)
        setMessage("Usuario actualizado.")
      } else {
        await crearUsuario(input)
        setMessage("Usuario creado.")
      }

      setForm(initialForm)
      setEditingUser(null)
      await loadUsuarios()
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el usuario.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleEdit(usuario: Usuario) {
    setEditingUser(usuario)
    setForm({
      email: usuario.email,
      nombre: usuario.nombre,
      password: "",
      rol: usuario.rol,
    })
    setErrors({})
    setMessage("")
  }

  function cancelEdit() {
    setEditingUser(null)
    setForm(initialForm)
    setErrors({})
    setMessage("")
  }

  async function handleDeactivate(usuario: Usuario) {
    if (usuario.id === session?.id) {
      setErrors({
        general: "No puedes desactivar tu propio usuario desde esta pantalla.",
      })
      return
    }

    if (!window.confirm(`Desactivar a ${usuario.nombre}?`)) {
      return
    }

    try {
      await desactivarUsuario(usuario.id)
      setMessage("Usuario desactivado.")
      await loadUsuarios()
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "No se pudo desactivar el usuario.",
      })
    }
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-4">
            <Button asChild size="icon" type="button" variant="secondary">
              <Link to="/app">
                <ArrowLeftCircle aria-hidden="true" className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                Usuarios y roles
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Administra el acceso del personal de levantamiento.
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <form
            className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6"
            noValidate
            onSubmit={handleSubmit}
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                {editingUser ? (
                  <Pencil aria-hidden="true" className="h-5 w-5" />
                ) : (
                  <UserPlus aria-hidden="true" className="h-5 w-5" />
                )}
              </span>
              <h2 className="text-xl font-bold text-foreground">{title}</h2>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  aria-describedby={errors.nombre ? "nombre-error" : undefined}
                  aria-invalid={Boolean(errors.nombre)}
                  id="nombre"
                  onChange={(event) => updateField("nombre", event.target.value)}
                  placeholder="Nombre del usuario"
                  value={form.nombre}
                />
                {errors.nombre ? (
                  <p className="text-sm font-medium text-destructive" id="nombre-error">
                    {errors.nombre}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input
                  aria-describedby={errors.email ? "email-error" : undefined}
                  aria-invalid={Boolean(errors.email)}
                  id="email"
                  inputMode="email"
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="usuario@ejemplo.com"
                  type="email"
                  value={form.email}
                />
                {errors.email ? (
                  <p className="text-sm font-medium text-destructive" id="email-error">
                    {errors.email}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  aria-describedby={errors.password ? "password-error" : undefined}
                  aria-invalid={Boolean(errors.password)}
                  id="password"
                  onChange={(event) => updateField("password", event.target.value)}
                  placeholder={editingUser ? "Nueva contraseña" : "Contraseña"}
                  type="password"
                  value={form.password}
                />
                {errors.password ? (
                  <p
                    className="text-sm font-medium text-destructive"
                    id="password-error"
                  >
                    {errors.password}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rol">Rol</Label>
                <select
                  className={cn(
                    "flex h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-55",
                  )}
                  id="rol"
                  onChange={(event) =>
                    updateField("rol", event.target.value as UsuarioRol)
                  }
                  value={form.rol}
                >
                  {roles.map((rol) => (
                    <option key={rol.value} value={rol.value}>
                      {rol.label}
                    </option>
                  ))}
                </select>
              </div>

              {errors.general ? (
                <p className="text-sm font-medium text-destructive">
                  {errors.general}
                </p>
              ) : null}

              {message ? (
                <p className="text-sm font-medium text-primary">{message}</p>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  className="w-full"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Guardando..." : submitText}
                </Button>
                {editingUser ? (
                  <Button
                    className="w-full"
                    onClick={cancelEdit}
                    type="button"
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                ) : null}
              </div>
            </div>
          </form>

          <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Usuarios activos
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {usuariosOrdenados.length} usuarios disponibles.
                </p>
              </div>
              <Button
                disabled={isLoading}
                onClick={loadUsuarios}
                type="button"
                variant="outline"
              >
                <RefreshCcw aria-hidden="true" className="h-4 w-4" />
                Actualizar
              </Button>
            </div>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
            ) : null}

            {!isLoading && usuariosOrdenados.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay usuarios activos.
              </p>
            ) : null}

            <div className="space-y-3">
              {usuariosOrdenados.map((usuario) => (
                <article
                  className="rounded-lg border border-border bg-background p-4"
                  key={usuario.id}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-foreground">
                          {usuario.nombre}
                        </h3>
                        <Badge
                          className={
                            usuario.rol === "ADMIN"
                              ? "border-primary/30 text-primary"
                              : undefined
                          }
                        >
                          <ShieldCheck aria-hidden="true" className="mr-1 h-3 w-3" />
                          {usuario.rol}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {usuario.email}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:min-w-40">
                      <Button
                        onClick={() => handleEdit(usuario)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Pencil aria-hidden="true" className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        disabled={usuario.id === session?.id}
                        onClick={() => handleDeactivate(usuario)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                        Desactivar
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}
