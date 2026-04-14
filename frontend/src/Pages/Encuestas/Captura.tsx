import { useEffect, useRef, useState, type FormEvent } from "react"
import {
  ArrowLeftCircle,
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  MapPin,
} from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useAuth } from "@/Pages/Auth/hooks/auth-context"

import { guardarFormularioLocal } from "./Actions/local-formulario-store"
import {
  isNivelEducacion,
  nivelesEducacion,
} from "./constants/niveles-educacion"
import type { FormularioLocal, NivelEducacion } from "./interfaces/types"

type CapturaFormState = {
  fotoBase64: string
  nivelEducacion: NivelEducacion | ""
  nombreEncuestado: string
  sector: string
}

type CapturaErrors = Partial<Record<keyof CapturaFormState | "general", string>>

const initialFormState: CapturaFormState = {
  fotoBase64: "",
  nivelEducacion: "",
  nombreEncuestado: "",
  sector: "",
}

export function CapturaPage() {
  const { session } = useAuth()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [form, setForm] = useState<CapturaFormState>(initialFormState)
  const [errors, setErrors] = useState<CapturaErrors>({})
  const [lastSaved, setLastSaved] = useState<FormularioLocal | null>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [isCameraStarting, setIsCameraStarting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = cameraStream
    }
  }, [cameraStream])

  useEffect(() => {
    return () => {
      stopCameraStream(cameraStream)
    }
  }, [cameraStream])

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
      general: undefined,
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

    if (!form.fotoBase64) {
      nextErrors.fotoBase64 = "Toma una foto antes de guardar."
    }

    return nextErrors
  }

  async function handleStartCamera() {
    setErrors((currentErrors) => ({
      ...currentErrors,
      fotoBase64: undefined,
      general: undefined,
    }))

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        fotoBase64: "El navegador no permite acceso a cámara.",
      }))
      return
    }

    setIsCameraStarting(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
        },
      })

      setCameraStream(stream)
    } catch (error) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        fotoBase64: getCameraErrorMessage(error),
      }))
    } finally {
      setIsCameraStarting(false)
    }
  }

  function handleStopCamera() {
    stopCameraStream(cameraStream)
    setCameraStream(null)
  }

  function handleTakePhoto() {
    const video = videoRef.current

    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        fotoBase64: "La cámara aún no está lista para tomar la foto.",
      }))
      return
    }

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const context = canvas.getContext("2d")

    if (!context) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        fotoBase64: "No se pudo procesar la foto.",
      }))
      return
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    updateField("fotoBase64", canvas.toDataURL("image/jpeg", 0.88))
  }

  function handleClearPhoto() {
    updateField("fotoBase64", "")
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
        nivelEducacion: "Selecciona un nivel educativo válido.",
      }))
      return
    }

    setIsSubmitting(true)

    try {
      const position = await getCurrentPosition()

      if (position.coords.latitude === 0 || position.coords.longitude === 0) {
        throw new Error("No se pudo obtener una geolocalización válida.")
      }

      const savedFormulario = await guardarFormularioLocal({
        fotoBase64: form.fotoBase64,
        latitud: position.coords.latitude,
        longitud: position.coords.longitude,
        nivelEducacion: form.nivelEducacion,
        nombreEncuestado: form.nombreEncuestado.trim(),
        sector: form.sector.trim(),
        usuarioId: session.id,
      })

      setLastSaved(savedFormulario)
      setForm(initialFormState)
      handleStopCamera()
    } catch (error) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        general:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el formulario local.",
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-4">
            <Button asChild size="icon" type="button" variant="secondary">
              <Link to="/app">
                <ArrowLeftCircle aria-hidden="true" className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                Captura de encuesta
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Guarda el formulario en el dispositivo y sincronízalo desde
                pendientes cuando corresponda.
              </p>
            </div>
          </div>
        </header>

        {lastSaved ? (
          <section className="rounded-lg border border-primary/25 bg-secondary p-4 text-secondary-foreground">
            <div className="flex gap-3">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Formulario guardado localmente.</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {lastSaved.nombreEncuestado} quedó pendiente de sincronización.
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
          <form className="space-y-5" noValidate onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="nivelEducacion">Nivel escolar</Label>
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

            <section className="space-y-3 rounded-lg border border-border bg-background p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Camera aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-bold text-foreground">Foto del registro</h2>
                  <p className="text-sm text-muted-foreground">
                    Usa la cámara del dispositivo antes de guardar.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                  {cameraStream ? (
                    <video
                      autoPlay
                      className="aspect-video w-full bg-background object-cover"
                      muted
                      playsInline
                      ref={videoRef}
                    />
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-secondary text-muted-foreground">
                      <ImageIcon aria-hidden="true" className="h-8 w-8" />
                    </div>
                  )}
                </div>

                <div className="overflow-hidden rounded-lg border border-border bg-card">
                  {form.fotoBase64 ? (
                    <img
                      alt="Foto capturada"
                      className="aspect-video w-full object-cover"
                      src={form.fotoBase64}
                    />
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-secondary text-sm text-muted-foreground">
                      Sin foto capturada
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Button
                  disabled={isCameraStarting || Boolean(cameraStream)}
                  onClick={handleStartCamera}
                  type="button"
                  variant="outline"
                >
                  {isCameraStarting ? "Activando..." : "Activar cámara"}
                </Button>
                <Button
                  disabled={!cameraStream}
                  onClick={handleTakePhoto}
                  type="button"
                  variant="outline"
                >
                  Tomar foto
                </Button>
                <Button
                  disabled={!form.fotoBase64}
                  onClick={handleClearPhoto}
                  type="button"
                  variant="outline"
                >
                  Repetir foto
                </Button>
                <Button
                  disabled={!cameraStream}
                  onClick={handleStopCamera}
                  type="button"
                  variant="outline"
                >
                  Apagar cámara
                </Button>
              </div>

              {errors.fotoBase64 ? (
                <p className="text-sm font-medium text-destructive">
                  {errors.fotoBase64}
                </p>
              ) : null}
            </section>

            <section className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-start gap-3">
                <MapPin aria-hidden="true" className="mt-0.5 h-5 w-5 text-primary" />
                <p className="text-sm leading-6 text-muted-foreground">
                  Al guardar se solicita la ubicación actual. Si el navegador no
                  permite geolocalización, el formulario no se guarda.
                </p>
              </div>
            </section>

            {errors.general ? (
              <p className="text-sm font-medium text-destructive">
                {errors.general}
              </p>
            ) : null}

            <Button className="w-full" disabled={isSubmitting} size="lg" type="submit">
              {isSubmitting ? "Guardando..." : "Guardar en pendientes"}
            </Button>
          </form>
        </section>
      </div>
    </main>
  )
}

function stopCameraStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

function getCameraErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Permite el acceso a la cámara para tomar la foto."
  }

  if (error instanceof DOMException && error.name === "NotFoundError") {
    return "No se encontró una cámara disponible."
  }

  return "No se pudo activar la cámara."
}

function getCurrentPosition() {
  if (!navigator.geolocation) {
    return Promise.reject(
      new Error("El navegador no soporta geolocalización."),
    )
  }

  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, (error) => {
      reject(new Error(getGeolocationErrorMessage(error)))
    }, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    })
  })
}

function getGeolocationErrorMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) {
    return "Permite el acceso a la ubicación para guardar el formulario."
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return "No se pudo obtener la ubicación actual del dispositivo."
  }

  if (error.code === error.TIMEOUT) {
    return "La solicitud de ubicación tardó demasiado."
  }

  return "No se pudo obtener la geolocalización."
}
