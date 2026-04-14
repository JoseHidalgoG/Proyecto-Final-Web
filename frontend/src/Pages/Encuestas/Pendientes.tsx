import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import {
  ArrowLeftCircle,
  CloudUpload,
  Pencil,
  RefreshCcw,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/Pages/Auth/hooks/auth-context"
import { cn } from "@/lib/utils"

import {
  actualizarFormularioLocal,
  eliminarFormularioLocal,
  listarFormulariosLocales,
} from "./Actions/local-formulario-store"
import { sincronizarFormularioLocal } from "./Actions/sync-formularios"
import {
  isNivelEducacion,
  nivelesEducacion,
  normalizarNivelEducacion,
  obtenerEtiquetaNivelEducacion,
} from "./constants/niveles-educacion"
import type { FormularioLocal, NivelEducacion } from "./interfaces/types"

type EditFormState = {
  nivelEducacion: NivelEducacion | ""
  nombreEncuestado: string
  sector: string
}

type EditErrors = Partial<Record<keyof EditFormState | "general", string>>

const initialEditForm: EditFormState = {
  nivelEducacion: "",
  nombreEncuestado: "",
  sector: "",
}

const estadoLabels = {
  ERROR: "Error",
  PENDING: "Pendiente",
  SYNCED: "Sincronizado",
} satisfies Record<FormularioLocal["estadoLocal"], string>


// ver lo pendiente a sincronizar para ser mandado al server

export function PendientesPage() {
  const { session } = useAuth()
  const [formularios, setFormularios] = useState<FormularioLocal[]>([])
  const [editForm, setEditForm] = useState<EditFormState>(initialEditForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [errors, setErrors] = useState<EditErrors>({})
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [isSyncingAll, setIsSyncingAll] = useState(false)
  const isOnline = useOnlineStatus()

  const pendientes = useMemo(
    () =>
      formularios.filter(
        (formulario) => formulario.estadoLocal !== "SYNCED",
      ),
    [formularios],
  )

  const loadFormularios = useCallback(async () => {
    if (!session) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      setFormularios(await listarFormulariosLocales(session.id))
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los formularios locales.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [session])

  useEffect(() => {
    void loadFormularios()
  }, [loadFormularios])

  function updateEditField<Field extends keyof EditFormState>(
    field: Field,
    value: EditFormState[Field],
  ) {
    setEditForm((currentForm) => ({
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

  function validateEdit() {
    const nextErrors: EditErrors = {}

    if (!editForm.nombreEncuestado.trim()) {
      nextErrors.nombreEncuestado = "Ingresa el nombre del encuestado."
    }

    if (!editForm.sector.trim()) {
      nextErrors.sector = "Ingresa el sector."
    }

    if (!editForm.nivelEducacion) {
      nextErrors.nivelEducacion = "Selecciona el nivel escolar."
    }

    return nextErrors
  }

  function startEdit(formulario: FormularioLocal) {
    const nivelEducacion = normalizarNivelEducacion(formulario.nivelEducacion)

    setEditId(formulario.id)
    setEditForm({
      nivelEducacion: nivelEducacion ?? "",
      nombreEncuestado: formulario.nombreEncuestado,
      sector: formulario.sector,
    })
    setErrors(
      nivelEducacion
        ? {}
        : { nivelEducacion: "Este formulario tiene un nivel escolar inválido." },
    )
    setMessage("")
  }

  function cancelEdit() {
    setEditId(null)
    setEditForm(initialEditForm)
    setErrors({})
    setMessage("")
  }

  async function handleSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editId) {
      return
    }

    const nextErrors = validateEdit()
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    if (!isNivelEducacion(editForm.nivelEducacion)) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        nivelEducacion: "Selecciona un nivel escolar válido.",
      }))
      return
    }

    try {
      await actualizarFormularioLocal(editId, {
        nivelEducacion: editForm.nivelEducacion,
        nombreEncuestado: editForm.nombreEncuestado.trim(),
        sector: editForm.sector.trim(),
      })
      setMessage("Formulario local actualizado.")
      cancelEdit()
      await loadFormularios()
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el formulario local.",
      })
    }
  }

  async function handleDelete(formulario: FormularioLocal) {
    if (!window.confirm(`Borrar el registro de ${formulario.nombreEncuestado}?`)) {
      return
    }

    try {
      await eliminarFormularioLocal(formulario.id)
      setMessage("Formulario local borrado.")
      await loadFormularios()
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "No se pudo borrar el formulario local.",
      })
    }
  }

  async function handleSync(formulario: FormularioLocal) {
    if (!isOnline) {
      setErrors({ general: "No hay conexión para sincronizar." })
      return
    }

    setSyncingId(formulario.id)
    setErrors({})
    setMessage("")

    try {
      await sincronizarFormularioLocal(formulario)
      setMessage("Formulario sincronizado.")
      await loadFormularios()
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "No se pudo sincronizar el formulario.",
      })
      await loadFormularios()
    } finally {
      setSyncingId(null)
    }
  }

  async function handleSyncAll() {
    if (!isOnline) {
      setErrors({ general: "No hay conexión para sincronizar." })
      return
    }

    setIsSyncingAll(true)
    setErrors({})
    setMessage("")

    let enviados = 0
    let fallidos = 0

    for (const formulario of pendientes) {
      try {
        await sincronizarFormularioLocal(formulario)
        enviados += 1
      } catch {
        fallidos += 1
      }
    }

    await loadFormularios()
    setIsSyncingAll(false)

    if (fallidos > 0) {
      setErrors({
        general: `${fallidos} formulario(s) no se pudieron sincronizar.`,
      })
      return
    }

    setMessage(`${enviados} formulario(s) sincronizado(s).`)
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
                Formularios pendientes
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Revisa, modifica, borra o sincroniza registros locales.
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
          <form
            className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6"
            noValidate
            onSubmit={handleSaveEdit}
          >
            <div className="mb-5 flex items-center gap-3">
              <Pencil aria-hidden="true" className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                Editar pendiente
              </h2>
            </div>

            {editId ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="editNombre">Nombre del encuestado</Label>
                  <Input
                    aria-describedby={
                      errors.nombreEncuestado ? "editNombre-error" : undefined
                    }
                    aria-invalid={Boolean(errors.nombreEncuestado)}
                    id="editNombre"
                    onChange={(event) =>
                      updateEditField("nombreEncuestado", event.target.value)
                    }
                    value={editForm.nombreEncuestado}
                  />
                  {errors.nombreEncuestado ? (
                    <p
                      className="text-sm font-medium text-destructive"
                      id="editNombre-error"
                    >
                      {errors.nombreEncuestado}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editSector">Sector</Label>
                  <Input
                    aria-describedby={errors.sector ? "editSector-error" : undefined}
                    aria-invalid={Boolean(errors.sector)}
                    id="editSector"
                    onChange={(event) =>
                      updateEditField("sector", event.target.value)
                    }
                    value={editForm.sector}
                  />
                  {errors.sector ? (
                    <p
                      className="text-sm font-medium text-destructive"
                      id="editSector-error"
                    >
                      {errors.sector}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editNivel">Nivel escolar</Label>
                  <select
                    className={cn(
                      "flex h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                    id="editNivel"
                    onChange={(event) => {
                      const selectedValue = event.target.value
                      updateEditField(
                        "nivelEducacion",
                        isNivelEducacion(selectedValue) ? selectedValue : "",
                      )
                    }}
                    value={editForm.nivelEducacion}
                  >
                    <option value="">Selecciona un nivel</option>
                    {nivelesEducacion.map((nivel) => (
                      <option key={nivel.value} value={nivel.value}>
                        {nivel.label}
                      </option>
                    ))}
                  </select>
                  {errors.nivelEducacion ? (
                    <p className="text-sm font-medium text-destructive">
                      {errors.nivelEducacion}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button className="w-full" type="submit">
                    Guardar cambios
                  </Button>
                  <Button
                    className="w-full"
                    onClick={cancelEdit}
                    type="button"
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                Selecciona un formulario pendiente para modificar sus datos antes
                de enviarlo al servidor.
              </p>
            )}
          </form>

          <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <Wifi aria-hidden="true" className="h-5 w-5 text-primary" />
                  ) : (
                    <WifiOff
                      aria-hidden="true"
                      className="h-5 w-5 text-destructive"
                    />
                  )}
                  <h2 className="text-xl font-bold text-foreground">
                    Cola local
                  </h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isOnline ? "Con conexión" : "Sin conexión"} ·{" "}
                  {pendientes.length} pendiente(s).
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  disabled={isLoading}
                  onClick={loadFormularios}
                  type="button"
                  variant="outline"
                >
                  <RefreshCcw aria-hidden="true" className="h-4 w-4" />
                  Actualizar
                </Button>
                <Button
                  disabled={!isOnline || pendientes.length === 0 || isSyncingAll}
                  onClick={handleSyncAll}
                  type="button"
                >
                  <CloudUpload aria-hidden="true" className="h-4 w-4" />
                  {isSyncingAll ? "Sincronizando..." : "Sincronizar"}
                </Button>
              </div>
            </div>

            {errors.general ? (
              <p className="mb-4 text-sm font-medium text-destructive">
                {errors.general}
              </p>
            ) : null}

            {message ? (
              <p className="mb-4 text-sm font-medium text-primary">{message}</p>
            ) : null}

            {isLoading ? (
              <p className="text-sm text-muted-foreground">
                Cargando formularios locales...
              </p>
            ) : null}

            {!isLoading && pendientes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay formularios pendientes.
              </p>
            ) : null}

            <div className="space-y-3">
              {pendientes.map((formulario) => (
                <article
                  className="rounded-lg border border-border bg-background p-4"
                  key={formulario.id}
                >
                  <div className="grid gap-4 md:grid-cols-[8rem_1fr]">
                    <img
                      alt="Foto del formulario"
                      className="aspect-video w-full rounded-lg object-cover md:aspect-square"
                      src={formulario.fotoBase64}
                    />
                    <div className="space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="font-bold text-foreground">
                            {formulario.nombreEncuestado}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {formulario.sector} ·{" "}
                            {obtenerEtiquetaNivelEducacion(
                              formulario.nivelEducacion,
                            )}
                          </p>
                        </div>
                        <Badge
                          className={
                            formulario.estadoLocal === "ERROR"
                              ? "border-destructive/30 text-destructive"
                              : "border-primary/30 text-primary"
                          }
                        >
                          {estadoLabels[formulario.estadoLocal]}
                        </Badge>
                      </div>

                      <p className="text-sm leading-6 text-muted-foreground">
                        Latitud {formulario.latitud.toFixed(6)}, longitud{" "}
                        {formulario.longitud.toFixed(6)} ·{" "}
                        {formatDate(formulario.creadoEn)}
                      </p>

                      {formulario.errorSincronizacion ? (
                        <p className="text-sm font-medium text-destructive">
                          {formulario.errorSincronizacion}
                        </p>
                      ) : null}

                      <div className="grid gap-2 sm:grid-cols-3">
                        <Button
                          onClick={() => startEdit(formulario)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <Pencil aria-hidden="true" className="h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          onClick={() => handleDelete(formulario)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                          Borrar
                        </Button>
                        <Button
                          disabled={!isOnline || syncingId === formulario.id}
                          onClick={() => handleSync(formulario)}
                          size="sm"
                          type="button"
                        >
                          <CloudUpload aria-hidden="true" className="h-4 w-4" />
                          {syncingId === formulario.id ? "Enviando..." : "Enviar"}
                        </Button>
                      </div>
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

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
    }

    function handleOffline() {
      setIsOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return isOnline
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-DO", {
    dateStyle: "short",
    timeStyle: "short",
  })
}
