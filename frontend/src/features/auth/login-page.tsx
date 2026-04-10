import { useState, type FormEvent } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useAuth } from "./auth-context"

type LoginErrors = {
  email?: string
  password?: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const { session, signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<LoginErrors>({})

  if (session) {
    return <Navigate replace to="/app" />
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: LoginErrors = {}

    if (!email.trim()) {
      nextErrors.email = "Ingresa el correo del usuario."
    }

    if (!password.trim()) {
      nextErrors.password = "Ingresa la contraseña."
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    signIn({
      email: email.trim(),
      password,
    })
    navigate("/app")
  }

  return (
    <main className="px-4 min-h-screen py-6 sm:px-6 lg:px-8 flex justify-center items-center">
      <div className="mx-auto grid w-full max-w-xl">
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="mt-5 text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                Acceso
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                Inicia sesión para entrar al espacio de captura y preparación de
                encuestas.
              </p>
            </div>
          </div>

          <form className="space-y-5" noValidate onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                aria-describedby={errors.email ? "email-error" : undefined}
                aria-invalid={Boolean(errors.email)}
                autoComplete="email"
                id="email"
                inputMode="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="test@pucmm.edu.do"
                type="email"
                value={email}
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
                autoComplete="current-password"
                id="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Contraseña asignada"
                type="password"
                value={password}
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

            <Button className="w-full" size="lg" type="submit">
              Entrar
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Button>
          </form>
        </section>
      </div>
    </main>
  )
}
