import "leaflet/dist/leaflet.css"

import L from "leaflet"
import {
  ArrowLeftCircle,
  Filter,
  LocateFixed,
  MapPinned,
  RefreshCcw,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

import { cleanMapRegisters } from "./Actions/mapa-api"
import {
  filtrarRegistrosMapa,
  getNivelMapaLabel,
  getUsuarioMapaLabel,
  hasValidCoordinates,
  initialFiltrosMapa,
  orderRegisterMaps,
} from "./helpers/mapa-registros"
import type { FiltrosMapa, RegistroMapa } from "./interfaces/types"

const DEFAULT_CENTER: L.LatLngExpression = [18.7357, -70.1627]
const DEFAULT_ZOOM = 7

const markerIcon = L.divIcon({
  className: "mapa-registro-marker",
  html: '<span class="mapa-registro-marker__dot"></span>',
  iconAnchor: [13, 26],
  iconSize: [26, 26],
  popupAnchor: [0, -24],
})

export function MapaPage() {
  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const markerRefs = useRef<Map<string, L.Marker>>(new Map())
  const [registros, setRegistros] = useState<RegistroMapa[]>([])
  const [filtros, setFiltros] = useState<FiltrosMapa>(initialFiltrosMapa)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const selectClassName =
    "flex h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

  const getUniqueOptions = (values: string[]) => {
    return Array.from(new Set(values.filter(Boolean))).sort((first, second) =>
      first.localeCompare(second),
    )
  }

  const getMarkerPopup = (registro: RegistroMapa) => {
    return `
    <strong>${escapeHtml(registro.nombreEncuestado)}</strong><br />
    ${escapeHtml(registro.sector)} · ${escapeHtml(getNivelMapaLabel(registro.nivelEscolar))}
  `
  }

  const escapeHtml = (value: string) => {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;")
  }

  const formatDate = (value: string) => {
    return new Date(value).toLocaleString("es-DO", {
      dateStyle: "short",
      timeStyle: "short",
    })
  }


  const registrosFiltrados = useMemo(
    () => orderRegisterMaps(filtrarRegistrosMapa(registros, filtros)),
    [filtros, registros],
  )

  const registrosConMapa = useMemo(
    () => registrosFiltrados.filter(hasValidCoordinates),
    [registrosFiltrados],
  )

  const selectedRegistro =
    registrosFiltrados.find((registro) => registro.id === selectedId) ?? null

  const usuariosOptions = useMemo(
    () => getUniqueOptions(registros.map((registro) => registro.usuarioId)),
    [registros],
  )
  const sectoresOptions = useMemo(
    () => getUniqueOptions(registros.map((registro) => registro.sector)),
    [registros],
  )
  const nivelesOptions = useMemo(
    () => getUniqueOptions(registros.map((registro) => registro.nivelEscolar)),
    [registros],
  )

  useEffect(() => {
    void loadRegistros()
  }, [])

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) {
      return
    }

    // Leaflet se monta una vez para no duplicar el mapa
    const map = L.map(mapElementRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    })
    const markerRefsMap = markerRefs.current

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map)

    const markersLayer = L.layerGroup().addTo(map)

    mapRef.current = map
    markersLayerRef.current = markersLayer

    window.setTimeout(() => map.invalidateSize(), 0)

    return () => {
      map.remove()
      mapRef.current = null
      markersLayerRef.current = null
      markerRefsMap.clear()
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const markersLayer = markersLayerRef.current

    if (!map || !markersLayer) {
      return
    }

    markersLayer.clearLayers()
    markerRefs.current.clear()

    for (const registro of registrosConMapa) {
      const marker = L.marker([registro.latitud, registro.longitud], {
        icon: markerIcon,
        title: registro.nombreEncuestado,
      })

      marker.bindPopup(getMarkerPopup(registro))
      marker.on("click", () => setSelectedId(registro.id))
      marker.addTo(markersLayer)
      markerRefs.current.set(registro.id, marker)
    }

    if (registrosConMapa.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
      return
    }

    if (registrosConMapa.length === 1) {
      const registro = registrosConMapa[0]
      map.setView([registro.latitud, registro.longitud], 14)
      return
    }

    const bounds = L.latLngBounds(
      registrosConMapa.map((registro) => [registro.latitud, registro.longitud]),
    )
    map.fitBounds(bounds, {
      padding: [24, 24],
    })
  }, [registrosConMapa])

  useEffect(() => {
    if (!selectedRegistro || !hasValidCoordinates(selectedRegistro)) {
      return
    }

    const marker = markerRefs.current.get(selectedRegistro.id)

    mapRef.current?.setView(
      [selectedRegistro.latitud, selectedRegistro.longitud],
      15,
    )
    marker?.openPopup()
  }, [selectedRegistro])

  async function loadRegistros() {
    setIsLoading(true)
    setError("")

    try {
      const nextRegistros = await cleanMapRegisters()
      setRegistros(nextRegistros)
      setSelectedId((currentId) =>
        currentId && nextRegistros.some((registro) => registro.id === currentId)
          ? currentId
          : null,
      )
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar los registros del servidor.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  function updateFiltro<Field extends keyof FiltrosMapa>(
    field: Field,
    value: FiltrosMapa[Field],
  ) {
    setFiltros((currentFiltros) => ({
      ...currentFiltros,
      [field]: value,
    }))
    setSelectedId(null)
  }

  function clearFiltros() {
    setFiltros(initialFiltrosMapa)
    setSelectedId(null)
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <Button asChild size="icon" type="button" variant="secondary">
                <Link to="/app">
                  <ArrowLeftCircle aria-hidden="true" className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                  Mapa de registros
                </h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Formularios recibidos por el servidor con ubicación registrada.
                </p>
              </div>
            </div>

            <Button disabled={isLoading} onClick={loadRegistros} type="button">
              <RefreshCcw aria-hidden="true" className="h-4 w-4" />
              {isLoading ? "Cargando..." : "Actualizar"}
            </Button>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[22rem_1fr]">
          <aside className="space-y-5">
            <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <Filter aria-hidden="true" className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Filtros</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="filtroUsuario">Usuario</Label>
                  <select
                    className={selectClassName}
                    id="filtroUsuario"
                    onChange={(event) =>
                      updateFiltro("usuarioId", event.target.value)
                    }
                    value={filtros.usuarioId}
                  >
                    <option value="">Todos</option>
                    {usuariosOptions.map((usuarioId) => (
                      <option key={usuarioId} value={usuarioId}>
                        {getUsuarioMapaLabel(usuarioId)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtroSector">Sector</Label>
                  <select
                    className={selectClassName}
                    id="filtroSector"
                    onChange={(event) => updateFiltro("sector", event.target.value)}
                    value={filtros.sector}
                  >
                    <option value="">Todos</option>
                    {sectoresOptions.map((sector) => (
                      <option key={sector} value={sector}>
                        {sector}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtroNivel">Nivel escolar</Label>
                  <select
                    className={selectClassName}
                    id="filtroNivel"
                    onChange={(event) =>
                      updateFiltro("nivelEscolar", event.target.value)
                    }
                    value={filtros.nivelEscolar}
                  >
                    <option value="">Todos</option>
                    {nivelesOptions.map((nivelEscolar) => (
                      <option key={nivelEscolar} value={nivelEscolar}>
                        {getNivelMapaLabel(nivelEscolar)}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  className="w-full"
                  onClick={clearFiltros}
                  type="button"
                  variant="outline"
                >
                  Limpiar filtros
                </Button>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <MapPinned aria-hidden="true" className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-xl font-bold text-foreground">Listado</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {registrosFiltrados.length} registro(s),{" "}
                    {registrosConMapa.length} con mapa.
                  </p>
                </div>
              </div>

              {error ? (
                <p className="mb-4 text-sm font-medium text-destructive">
                  {error}
                </p>
              ) : null}

              {isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Cargando registros del servidor...
                </p>
              ) : null}

              {!isLoading && registrosFiltrados.length === 0 ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  No hay registros recibidos con esos filtros.
                </p>
              ) : null}

              <div className="max-h-[34rem] space-y-3 overflow-auto pr-1">
                {registrosFiltrados.map((registro) => (
                  <button
                    className={cn(
                      "w-full rounded-lg border border-border bg-background p-4 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selectedId === registro.id && "border-primary bg-secondary",
                    )}
                    key={registro.id}
                    onClick={() => setSelectedId(registro.id)}
                    type="button"
                  >
                    <span className="block font-bold text-foreground">
                      {registro.nombreEncuestado}
                    </span>
                    <span className="mt-2 block text-sm leading-6 text-muted-foreground">
                      {registro.sector} · {getNivelMapaLabel(registro.nivelEscolar)}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {getUsuarioMapaLabel(registro.usuarioId)} ·{" "}
                      {formatDate(registro.creadoEn)}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <section className="space-y-5">
            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <div
                aria-label="Mapa de registros recibidos"
                className="h-[62svh] min-h-96 w-full"
                ref={mapElementRef}
              />
            </div>

            <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
              {selectedRegistro ? (
                <div className="grid gap-5 md:grid-cols-[11rem_1fr]">
                  {selectedRegistro.fotoBase64 ? (
                    <img
                      alt="Foto del registro seleccionado"
                      className="aspect-video w-full rounded-lg object-cover md:aspect-square"
                      src={selectedRegistro.fotoBase64}
                    />
                  ) : null}

                  <div className="space-y-3">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        {selectedRegistro.nombreEncuestado}
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {selectedRegistro.sector} ·{" "}
                        {getNivelMapaLabel(selectedRegistro.nivelEscolar)}
                      </p>
                    </div>

                    <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                      <p>
                        <span className="font-semibold text-foreground">
                          Usuario:
                        </span>{" "}
                        {getUsuarioMapaLabel(selectedRegistro.usuarioId)}
                      </p>
                      <p>
                        <span className="font-semibold text-foreground">
                          Recibido:
                        </span>{" "}
                        {formatDate(selectedRegistro.creadoEn)}
                      </p>
                      <p>
                        <span className="font-semibold text-foreground">
                          Latitud:
                        </span>{" "}
                        {selectedRegistro.latitud.toFixed(6)}
                      </p>
                      <p>
                        <span className="font-semibold text-foreground">
                          Longitud:
                        </span>{" "}
                        {selectedRegistro.longitud.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                  <LocateFixed aria-hidden="true" className="mt-1 h-5 w-5 text-primary" />
                  <p>Selecciona un registro del listado o toca un marcador.</p>
                </div>
              )}
            </section>
          </section>
        </section>
      </div>
    </main>
  )
}

