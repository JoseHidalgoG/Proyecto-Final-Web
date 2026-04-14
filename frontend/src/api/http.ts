type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

type RequestOptions = {
  body?: unknown
  method?: HttpMethod
}

function getApiBaseUrl() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

  if (!apiBaseUrl) {
    throw new Error("Configura VITE_API_BASE_URL en el archivo .env")
  }

  return apiBaseUrl.replace(/\/+$/, "")
}

async function readResponse(response: Response) {
  if (response.status === 204) {
    return null
  }

  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

function getErrorMessage(data: unknown) {
  if (typeof data === "object" && data !== null) {
    const record = data as Record<string, unknown>
    const message = record.error ?? record.mensaje ?? record.msg

    if (typeof message === "string") {
      return message
    }
  }

  return "No se pudo completar la solicitud."
}

export async function request<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers()

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: "include",
    headers,
    method: options.method ?? "GET",
  })

  const data = await readResponse(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(data))
  }

  return data as T
}
