import type { FormularioCapturaInput, FormularioLocal } from '../interfaces/types'

const DATABASE_NAME = 'op-encuestas-local'
const DATABASE_VERSION = 1
const FORMULARIOS_STORE = 'formularios'

function openDatabase() {
    return new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

        request.onupgradeneeded = () => {
            const database = request.result

            if (!database.objectStoreNames.contains(FORMULARIOS_STORE)) {
                const store = database.createObjectStore(FORMULARIOS_STORE, {
                    keyPath: 'id',
                })
                store.createIndex('usuarioId', 'usuarioId')
                store.createIndex('estadoLocal', 'estadoLocal')
            }
        }

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)
    })
}

function requestToPromise<T>(request: IDBRequest<T>) {
    return new Promise<T>((resolve, reject) => {
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)
    })
}

function transactionDone(transaction: IDBTransaction) {
    return new Promise<void>((resolve, reject) => {
        transaction.onerror = () => reject(transaction.error)
        transaction.onabort = () => reject(transaction.error)
        transaction.oncomplete = () => resolve()
    })
}

async function getStore(mode: IDBTransactionMode) {
    const database = await openDatabase()
    const transaction = database.transaction(FORMULARIOS_STORE, mode)
    const store = transaction.objectStore(FORMULARIOS_STORE)

    return { database, store, transaction }
}

export async function saveLocalForm(input: FormularioCapturaInput) {
    const now = new Date().toISOString()
    const formulario: FormularioLocal = {
        ...input,
        actualizadoEn: now,
        creadoEn: now,
        estadoLocal: 'PENDING',
        id: crypto.randomUUID(),
        sincronizado: false,
    }
    const { database, store, transaction } = await getStore('readwrite')

    try {
        store.add(formulario)
        await transactionDone(transaction)
        return formulario
    } finally {
        database.close()
    }
}

export async function listLocalForms(usuarioId: string) {
    const { database, store } = await getStore('readonly')

    try {
        const formularios = await requestToPromise<FormularioLocal[]>(store.getAll())

        return formularios
            .filter((formulario) => formulario.usuarioId === usuarioId)
            .sort((first, second) => second.creadoEn.localeCompare(first.creadoEn))
    } finally {
        database.close()
    }
}

export async function findLocalForm(id: string) {
    const { database, store } = await getStore('readonly')

    try {
        const formulario = await requestToPromise<FormularioLocal | undefined>(store.get(id))

        return formulario ?? null
    } finally {
        database.close()
    }
}

export async function updateLocalForm(
    id: string,
    input: Pick<FormularioCapturaInput, 'nombreEncuestado' | 'sector' | 'nivelEducacion'>,
) {
    const currentFormulario = await findLocalForm(id)

    if (!currentFormulario) {
        throw new Error('Formulario local no encontrado.')
    }

    if (currentFormulario.estadoLocal === 'SYNCED') {
        throw new Error('No se puede modificar un formulario sincronizado.')
    }

    const nextFormulario: FormularioLocal = {
        ...currentFormulario,
        ...input,
        actualizadoEn: new Date().toISOString(),
        errorSincronizacion: undefined,
        estadoLocal: 'PENDING',
    }
    const { database, store, transaction } = await getStore('readwrite')

    try {
        store.put(nextFormulario)
        await transactionDone(transaction)
        return nextFormulario
    } finally {
        database.close()
    }
}

export async function deleteLocalForm(id: string) {
    const currentFormulario = await findLocalForm(id)

    if (!currentFormulario) {
        throw new Error('Formulario local no encontrado.')
    }

    if (currentFormulario.estadoLocal === 'SYNCED') {
        throw new Error('No se puede borrar un formulario sincronizado.')
    }

    const { database, store, transaction } = await getStore('readwrite')

    try {
        store.delete(id)
        await transactionDone(transaction)
    } finally {
        database.close()
    }
}

export async function markLocalFormSynced(id: string, servidorId: string) {
    const currentFormulario = await findLocalForm(id)

    if (!currentFormulario) {
        throw new Error('Formulario local no encontrado.')
    }

    const nextFormulario: FormularioLocal = {
        ...currentFormulario,
        actualizadoEn: new Date().toISOString(),
        errorSincronizacion: undefined,
        estadoLocal: 'SYNCED',
        servidorId,
        sincronizado: true,
    }
    const { database, store, transaction } = await getStore('readwrite')

    try {
        store.put(nextFormulario)
        await transactionDone(transaction)
        return nextFormulario
    } finally {
        database.close()
    }
}

export async function markLocalFormError(id: string, message: string) {
    const currentFormulario = await findLocalForm(id)

    if (!currentFormulario) {
        throw new Error('Formulario local no encontrado.')
    }

    const nextFormulario: FormularioLocal = {
        ...currentFormulario,
        actualizadoEn: new Date().toISOString(),
        errorSincronizacion: message,
        estadoLocal: 'ERROR',
        sincronizado: false,
    }
    const { database, store, transaction } = await getStore('readwrite')

    try {
        store.put(nextFormulario)
        await transactionDone(transaction)
        return nextFormulario
    } finally {
        database.close()
    }
}
