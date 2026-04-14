import { request } from "@/api/http"

export type LoginBody = {
  email: string
  password: string
}

export type LoginResponse = {
  usuario: {
    id: string
    nombre: string
    email: string
    rol: "ADMIN" | "PERSONAL"
  }
}

export function login(body: LoginBody) {
  return request<LoginResponse>("/auth/login", {
    body,
    method: "POST",
  })
}

export function getCurrentSession() {
  return request<LoginResponse>("/auth/me")
}

export function logout() {
  return request<void>("/auth/logout", {
    method: "POST",
  })
}
