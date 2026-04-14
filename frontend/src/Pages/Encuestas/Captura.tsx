import { useState, type FormEvent } from "react"
import { CheckCircle2, ArrowLeftCircle } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useAuth } from "@/Pages/Auth/hooks/auth-context"

import {
  crearFormulario,
  type FormularioResponse,
} from "./Actions/formularios-api"
import {
  isNivelEducacion,
  nivelesEducacion,
} from "./constants/niveles-educacion"
import type { NivelEducacion } from "./interfaces/types"

type CapturaFormState = {
  nombreEncuestado: string
  sector: string
  nivelEducacion: NivelEducacion | ""
}

type CapturaErrors = Partial<Record<keyof CapturaFormState | "general", string>>

const initialFormState: CapturaFormState = {
  nombreEncuestado: "",
  sector: "",
  nivelEducacion: "",
}

export function CapturaPage() {
  const { session } = useAuth()
  const [form, setForm] = useState<CapturaFormState>(initialFormState)
  const [errors, setErrors] = useState<CapturaErrors>({})
  const [lastSaved, setLastSaved] = useState<FormularioResponse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField<Field extends keyof CapturaFormState>(
    field: Field,
    value: CapturaFormState[Field],
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }))
  }

  function validate() {
    const nextErrors: CapturaErrors = {}

    if (!form.nombreEncuestado.trim()) {
      nextErrors.nombreEncuestado = "Ingresa el nombre del encuestado."
    }

    if (!form.sector.trim()) {
      nextErrors.sector = "Ingresa el sector."
    }

    if (!form.nivelEducacion) {
      nextErrors.nivelEducacion = "Selecciona el nivel educativo."
    }

    return nextErrors
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validate()
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0 || !session) {
      return
    }

    if (!isNivelEducacion(form.nivelEducacion)) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        nivelEducacion: "Selecciona un nivel educativo valido.",
      }))
      return
    }

    setIsSubmitting(true)

    try {
      const position = await getCurrentPosition()

      if (position.coords.latitude === 0 || position.coords.longitude === 0) {
        throw new Error("No se pudo obtener una geolocalizacion valida.")
      }

      const savedFormulario = await crearFormulario(
        {
          nombreEncuestado: form.nombreEncuestado.trim(),
          sector: form.sector.trim(),
          nivelEscolar: form.nivelEducacion,
          latitud: position.coords.latitude,
          longitud: position.coords.longitude,
          fotoBase64: "",
        })

      setLastSaved(savedFormulario)
      setForm(initialFormState)
    } catch (error) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        general:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el formulario.",
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8 flex justify-center items-center">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
              <Link to="/app">
                <Button variant="secondary">
                  <ArrowLeftCircle aria-hidden="true" className="h-5 w-5" />
                </Button>
              </Link>
            </span>
            <div>
              <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                Captura de encuesta
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Registra los datos base del formulario. Al guardar se tomara la
                ubicacion actual del dispositivo.
              </p>
            </div>
          </div>
        </header>

        {lastSaved ? (
          <section className="rounded-lg border border-primary/25 bg-secondary p-4 text-secondary-foreground">
            <div className="flex gap-3">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Formulario guardado en el servidor.</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Ultima captura: {lastSaved.nombreEncuestado} en{" "}
                  {lastSaved.sector}.
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
          <form className="space-y-5" noValidate onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="nombreEncuestado">Nombre del encuestado</Label>
              <Input
                aria-describedby={
                  errors.nombreEncuestado ? "nombreEncuestado-error" : undefined
                }
                aria-invalid={Boolean(errors.nombreEncuestado)}
                id="nombreEncuestado"
                onChange={(event) =>
                  updateField("nombreEncuestado", event.target.value)
                }
                placeholder="Nombre completo"
                value={form.nombreEncuestado}
              />
              {errors.nombreEncuestado ? (
                <p
                  className="text-sm font-medium text-destructive"
                  id="nombreEncuestado-error"
                >
                  {errors.nombreEncuestado}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sector">Sector</Label>
              <Input
                aria-describedby={errors.sector ? "sector-error" : undefined}
                aria-invalid={Boolean(errors.sector)}
                id="sector"
                onChange={(event) => updateField("sector", event.target.value)}
                placeholder="Sector donde se realiza la encuesta"
                value={form.sector}
              />
              {errors.sector ? (
                <p className="text-sm font-medium text-destructive" id="sector-error">
                  {errors.sector}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nivelEducacion">Nivel educativo</Label>
              <select
                aria-describedby={
                  errors.nivelEducacion ? "nivelEducacion-error" : undefined
                }
                aria-invalid={Boolean(errors.nivelEducacion)}
                className={cn(
                  "flex h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-55",
                  !form.nivelEducacion && "text-muted-foreground",
                )}
                id="nivelEducacion"
                onChange={(event) => {
                  const selectedValue = event.target.value
                  updateField(
                    "nivelEducacion",
                    isNivelEducacion(selectedValue) ? selectedValue : "",
                  )
                }}
                value={form.nivelEducacion}
              >
                <option value="">Selecciona un nivel</option>
                {nivelesEducacion.map((nivel) => (
                  <option key={nivel.value} value={nivel.value}>
                    {nivel.label}
                  </option>
                ))}
              </select>
              {errors.nivelEducacion ? (
                <p
                  className="text-sm font-medium text-destructive"
                  id="nivelEducacion-error"
                >
                  {errors.nivelEducacion}
                </p>
              ) : null}
            </div>

            {errors.general ? (
              <p className="text-sm font-medium text-destructive">
                {errors.general}
              </p>
            ) : null}

            <Button className="w-full" disabled={isSubmitting} size="lg" type="submit">
              {isSubmitting ? "Guardando..." : "Guardar formulario"}
            </Button>
          </form>
        </section>
      </div>
    </main>
  )
}

function getCurrentPosition() {
  if (!navigator.geolocation) {
    return Promise.reject(
      new Error("El navegador no soporta geolocalizacion."),
    )
  }

  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    })
  })
}
