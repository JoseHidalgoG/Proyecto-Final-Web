export const FORMULARIOS_SYNC_EVENT = 'formularios-locales-sync'

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

type SyncWorkerCommand =
    | {
          formularioId: string
          type: 'SYNC_FORM'
      }
    | {
          type: 'SYNC_QUEUE'
          usuarioId: string
      }

type SyncWorkerResponse =
    | {
          requestId: string
          result: SyncFormResult | SyncQueueSummary
          type: 'REQUEST_DONE'
      }
    | {
          message: string
          requestId: string
          type: 'REQUEST_FAILED'
      }

type PendingRequest = {
    reject: (error: Error) => void
    resolve: (result: SyncFormResult | SyncQueueSummary) => void
}

let syncWorker: Worker | null = null
const pendingRequests = new Map<string, PendingRequest>()

export const getSyncWorker = () => {
    if (syncWorker) {
        return syncWorker
    }

    syncWorker = new Worker(new URL('../Workers/sync-worker.ts', import.meta.url), {
        type: 'module',
    })
    syncWorker.addEventListener('message', handleWorkerMessage)
    syncWorker.addEventListener('error', handleWorkerError)

    return syncWorker
}

export const handleWorkerMessage = (event: MessageEvent<SyncWorkerResponse>) => {
    const response = event.data
    const pendingRequest = pendingRequests.get(response.requestId)

    if (!pendingRequest) {
        return
    }

    pendingRequests.delete(response.requestId)

    if (response.type === 'REQUEST_FAILED') {
        pendingRequest.reject(new Error(response.message))
        window.dispatchEvent(new CustomEvent(FORMULARIOS_SYNC_EVENT))
        return
    }

    pendingRequest.resolve(response.result)
    window.dispatchEvent(new CustomEvent(FORMULARIOS_SYNC_EVENT))
}

export const handleWorkerError = (event: ErrorEvent) => {
    const message = event.message || 'No se pudo ejecutar el sincronizador local.'

    for (const pendingRequest of pendingRequests.values()) {
        pendingRequest.reject(new Error(message))
    }

    pendingRequests.clear()
    stopSyncForm()
}

export const sendWorkerRequest = <Result extends SyncFormResult | SyncQueueSummary>(
    request: SyncWorkerCommand,
) => {
    const requestId = crypto.randomUUID()

    return new Promise<Result>((resolve, reject) => {
        pendingRequests.set(requestId, {
            reject,
            resolve: (result) => resolve(result as Result),
        })
        getSyncWorker().postMessage({
            ...request,
            requestId,
        })
    })
}

export const getSyncForm = (formularioId: string) => {
    return sendWorkerRequest<SyncFormResult>({
        formularioId,
        type: 'SYNC_FORM',
    })
}

export const getSyncQueue = (usuarioId: string) => {
    return sendWorkerRequest<SyncQueueSummary>({
        type: 'SYNC_QUEUE',
        usuarioId,
    })
}

export const stopSyncForm = () => {
    if (!syncWorker) {
        return
    }

    syncWorker.postMessage({
        type: 'STOP',
    } satisfies SyncWorkerRequest)
    syncWorker.terminate()
    syncWorker = null

    for (const pendingRequest of pendingRequests.values()) {
        pendingRequest.reject(new Error('Sincronizador detenido.'))
    }

    pendingRequests.clear()
}
