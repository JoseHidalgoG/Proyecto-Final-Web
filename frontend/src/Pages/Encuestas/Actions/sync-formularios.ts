import { stopSyncForm, getSyncQueue, getSyncForm } from './sync-worker-client'
import type { FormularioLocal } from '../interfaces/types'

export { FORMULARIOS_SYNC_EVENT } from './sync-worker-client'

export const syncFormLocal = async (formulario: FormularioLocal) => {
    if (formulario.estadoLocal === 'SYNCED') {
        return {
            skipped: true,
            synced: false,
        }
    }

    return getSyncForm(formulario.id)
}

export const syncLocalQueue = (usuarioId: string) => {
    return getSyncQueue(usuarioId)
}

export const closeSyncForm = () => {
    stopSyncForm()
}
