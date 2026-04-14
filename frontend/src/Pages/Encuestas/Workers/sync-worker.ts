/// <reference lib="webworker" />

import { toFormularioBody } from '../Actions/formulario-adapter'
import type { FormularioBody } from '../Actions/formularios-api'
import {
    findLocalForm,
    listLocalForms,
    markLocalFormError,
    markLocalFormSynced,
} from '../Actions/local-formulario-store'
import type { FormularioLocal } from '../interfaces/types'

type SyncQueueSummary = {
    failed: number
    skipped: number
    synced: number
}

type SyncFormResult = {
    servidorId?: string
    skipped: boolean
    synced: boolean
}

type SyncWorkerRequest =
    | {
          formularioId: string
          requestId: string
          type: 'SYNC_FORM'
      }
    | {
          requestId: string
          type: 'SYNC_QUEUE'
          usuarioId: string
      }
    | {
          type: 'STOP'
      }

type WsSyncResponse = {
    id?: string
    msg?: string
    ok: boolean
}

const formulariosEnProceso = new Set<string>()

let socket: WebSocket | null = null
let requestChain = Promise.resolve()

self.addEventListener('message', (event: MessageEvent<SyncWorkerRequest>) => {
    const request = event.data

    if (request.type === 'STOP') {
        closeSocket()
        return
    }

    requestChain = requestChain.then(
        () => handleRequest(request),
        () => handleRequest(request),
    )
})

const handleRequest = async (request: Exclude<SyncWorkerRequest, { type: 'STOP' }>) => {
    try {
        if (request.type === 'SYNC_FORM') {
            const result = await syncFormularioById(request.formularioId)
            postRequestDone(request.requestId, result)
            return
        }

        const result = await syncQueue(request.usuarioId)
        postRequestDone(request.requestId, result)
    } catch (error) {
        postRequestFailed(request.requestId, getErrorMessage(error))
    }
}

const syncQueue = async (usuarioId: string): Promise<SyncQueueSummary> => {
    const formularios = await listLocalForms(usuarioId)
    const pendientes = formularios.filter((formulario) => formulario.estadoLocal !== 'SYNCED')
    const summary: SyncQueueSummary = {
        failed: 0,
        skipped: 0,
        synced: 0,
    }

    for (const formulario of pendientes) {
        try {
            const result = await syncFormulario(formulario)

            if (result.synced) {
                summary.synced += 1
            } else {
                summary.skipped += 1
            }
        } catch {
            summary.failed += 1
        }
    }

    return summary
}

const syncFormularioById = async (formularioId: string) => {
    const formulario = await findLocalForm(formularioId)

    if (!formulario) {
        throw new Error('Formulario local no encontrado.')
    }

    return syncFormulario(formulario)
}

const syncFormulario = async (formulario: FormularioLocal): Promise<SyncFormResult> => {
    if (formulario.estadoLocal === 'SYNCED') {
        return {
            skipped: true,
            synced: false,
        }
    }

    if (formulariosEnProceso.has(formulario.id)) {
        return {
            skipped: true,
            synced: false,
        }
    }

    formulariosEnProceso.add(formulario.id)

    try {
        validarFormularioListo(formulario)
        const servidorId = await enviarFormularioPorWebSocket(toFormularioBody(formulario))
        await markLocalFormSynced(formulario.id, servidorId)

        return {
            servidorId,
            skipped: false,
            synced: true,
        }
    } catch (error) {
        const message = getErrorMessage(error)
        await markLocalFormError(formulario.id, message)
        throw new Error(message)
    } finally {
        formulariosEnProceso.delete(formulario.id)
    }
}

const validarFormularioListo = (formulario: FormularioLocal) => {
    if (!formulario.fotoBase64) {
        throw new Error('Este formulario no tiene foto capturada.')
    }

    if (formulario.latitud === 0 || formulario.longitud === 0) {
        throw new Error('Este formulario no tiene geolocalizacion valida.')
    }
}

const enviarFormularioPorWebSocket = async (body: FormularioBody) => {
    const currentSocket = await getSocket()

    return new Promise<string>((resolve, reject) => {
        function cleanup() {
            currentSocket.removeEventListener('message', handleMessage)
            currentSocket.removeEventListener('close', handleClose)
            currentSocket.removeEventListener('error', handleError)
        }

        function handleMessage(event: MessageEvent) {
            cleanup()

            try {
                const response = parseWsResponse(event.data)
                resolve(response.id)
            } catch (error) {
                reject(error)
            }
        }

        function handleClose() {
            cleanup()
            socket = null
            reject(
                new Error('La conexion WebSocket se cerro antes de confirmar la sincronizacion.'),
            )
        }

        function handleError() {
            cleanup()
            reject(new Error('No se pudo enviar el formulario por WebSocket.'))
        }

        currentSocket.addEventListener('message', handleMessage)
        currentSocket.addEventListener('close', handleClose)
        currentSocket.addEventListener('error', handleError)
        currentSocket.send(JSON.stringify(body))
    })
}

const parseWsResponse = (data: unknown) => {
    const response = JSON.parse(String(data)) as WsSyncResponse

    if (!response.ok) {
        throw new Error(response.msg || 'El servidor rechazo la sincronizacion.')
    }

    if (!response.id) {
        throw new Error('El servidor no devolvio el id del formulario sincronizado.')
    }

    return {
        id: response.id,
    }
}

const getSocket = () => {
    if (socket?.readyState === WebSocket.OPEN) {
        return Promise.resolve(socket)
    }

    closeSocket()

    return new Promise<WebSocket>((resolve, reject) => {
        const nextSocket = new WebSocket(getWebSocketUrl())
        let settled = false
        const timeoutId = self.setTimeout(() => {
            rejectConnection('No se pudo abrir el WebSocket de sincronizacion.')
        }, 10000)

        socket = nextSocket

        function cleanup() {
            self.clearTimeout(timeoutId)
            nextSocket.removeEventListener('open', handleOpen)
            nextSocket.removeEventListener('error', handleError)
            nextSocket.removeEventListener('close', handleCloseBeforeOpen)
        }

        function rejectConnection(message: string) {
            if (settled) {
                return
            }

            settled = true
            cleanup()
            socket = null
            nextSocket.close()
            reject(new Error(message))
        }

        function handleOpen() {
            if (settled) {
                return
            }

            settled = true
            cleanup()
            resolve(nextSocket)
        }

        function handleError() {
            rejectConnection('No se pudo abrir el WebSocket de sincronizacion.')
        }

        function handleCloseBeforeOpen() {
            rejectConnection('El WebSocket de sincronizacion fue cerrado por el servidor.')
        }

        nextSocket.addEventListener('open', handleOpen)
        nextSocket.addEventListener('error', handleError)
        nextSocket.addEventListener('close', handleCloseBeforeOpen)
        nextSocket.addEventListener('close', () => {
            if (socket === nextSocket) {
                socket = null
            }
        })
    })
}

const getWebSocketUrl = () => {
    const url = new URL('/api/ws/sync', self.location.origin)
    url.protocol = self.location.protocol === 'https:' ? 'wss:' : 'ws:'

    return url.toString()
}

const closeSocket = () => {
    if (!socket) {
        return
    }

    socket.close()
    socket = null
}

const postRequestDone = (requestId: string, result: SyncFormResult | SyncQueueSummary) => {
    self.postMessage({
        requestId,
        result,
        type: 'REQUEST_DONE',
    })
}

const postRequestFailed = (requestId: string, message: string) => {
    self.postMessage({
        message,
        requestId,
        type: 'REQUEST_FAILED',
    })
}

const getErrorMessage = (error: unknown) => {
    return error instanceof Error ? error.message : 'No se pudo sincronizar el formulario.'
}
