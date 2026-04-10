import {
  ClipboardList,
  LogOut,
  MapPinned,
  SendHorizontal,
  UserCog,
  WifiOff,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/auth-context"

const modulePreviews = [
  {
    title: "Encuestas",
    description: "Captura de nombre, sector, nivel escolar, ubicación y foto.",
    icon: ClipboardList,
  },
  {
    title: "Pendientes",
    description: "Registros locales preparados para modificar, borrar o enviar.",
    icon: SendHorizontal,
  },
  {
    title: "Mapa",
    description: "Consulta geográfica de formularios recibidos por el servidor.",
    icon: MapPinned,
  },
  {
    title: "Usuarios",
    description: "Creación de usuarios, roles y acceso del personal autorizado.",
    icon: UserCog,
  },
]

export function AppHomePage() {
  const navigate = useNavigate()
  const { session, signOut } = useAuth()

  function handleSignOut() {
    signOut()
    navigate("/login")
  }

  return (
    <main className="min-h-svh px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="mt-4 text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                Proyecto Final Web
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Cliente inicial para el levantamiento de encuestas de la Oficina de
                Planeamiento. (Por Miguel Rodríguez y José Alberto)
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-3 sm:min-w-64">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Sesión local
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-foreground">
                  {session?.email}
                </p>
              </div>
              <Button onClick={handleSignOut} variant="outline">
                <LogOut aria-hidden="true" className="h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-lg border border-border bg-primary p-5 text-primary-foreground shadow-sm sm:p-6">
            <WifiOff aria-hidden="true" className="h-7 w-7" />
            <h2 className="mt-5 text-2xl font-bold">Modo local activo</h2>
            <p className="mt-3 text-sm leading-6 text-primary-foreground/85">
              Este corte trabaja sin servidor. La sesión vive solo en memoria y se
              limpia al cerrar o recargar la aplicación.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">

            <div className="grid gap-3 sm:grid-cols-2">
              {modulePreviews.map((module) => {
                const Icon = module.icon

                return (
                  <button
                    className="min-h-36 rounded-lg border border-border bg-background p-4 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    key={module.title}
                    type="button"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <span className="mt-4 block text-base font-bold text-foreground">
                      {module.title}
                    </span>
                    <span className="mt-2 block text-sm leading-6 text-muted-foreground">
                      {module.description}
                    </span>

                  </button>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
