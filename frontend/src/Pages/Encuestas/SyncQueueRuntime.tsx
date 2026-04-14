import { useEffect } from "react"

import { useAuth } from "@/Pages/Auth/hooks/auth-context"

import {
  closeSyncForm,
  syncLocalQueue,
} from "./Actions/sync-formularios"

const AUTO_SYNC_DELAY_MS = 300

export function SyncQueueRuntime() {
  const { session } = useAuth()

  useEffect(() => {
    if (!session) {
      closeSyncForm()
      return
    }

    const usuarioId = session.id
    let timeoutId: number | undefined

    function syncQueue() {
      if (!navigator.onLine) {
        return
      }

      void syncLocalQueue(usuarioId).catch(() => undefined)
    }

    function scheduleSync() {
      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(syncQueue, AUTO_SYNC_DELAY_MS)
    }

    scheduleSync()
    window.addEventListener("online", scheduleSync)

    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener("online", scheduleSync)
    }
  }, [session])

  return null
}
