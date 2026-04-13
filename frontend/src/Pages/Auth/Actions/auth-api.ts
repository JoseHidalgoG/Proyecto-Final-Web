import { request } from "@/api/http"

export type LoginBody = {
  email: string
  password: string
}

export type LoginResponse = {
  token: string
  usuario: {
    id: string
    nombre: string
    rol: "ADMIN" | "PERSONAL"
  }
}

export function login(body: LoginBody) {
  return request<LoginResponse>("/auth/login", {
    body,
    method: "POST",
  })
}
