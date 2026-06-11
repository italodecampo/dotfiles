import type { TaxDocument } from '../types'

const DB_NAME = 'financetrack'
const DB_VERSION = 1
const STORE_NAME = 'taxDocuments'

interface StoredRecord extends TaxDocument {
  blob: Blob
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode)
    const request = fn(tx.objectStore(STORE_NAME))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

export async function saveTaxDocument(meta: TaxDocument, blob: Blob): Promise<void> {
  const record: StoredRecord = { ...meta, blob }
  await withStore('readwrite', (store) => store.put(record))
}

export async function listTaxDocuments(): Promise<TaxDocument[]> {
  const records = await withStore<StoredRecord[]>('readonly', (store) => store.getAll())
  return records
    .map(({ id, name, category, taxYear, uploadedAt, fileType, fileSize }) => ({
      id, name, category, taxYear, uploadedAt, fileType, fileSize,
    }))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
}

export async function getTaxDocumentBlob(id: string): Promise<Blob | null> {
  const record = await withStore<StoredRecord | undefined>('readonly', (store) => store.get(id))
  return record?.blob ?? null
}

export async function updateTaxDocumentMeta(id: string, updates: Partial<Omit<TaxDocument, 'id'>>): Promise<void> {
  const record = await withStore<StoredRecord | undefined>('readonly', (store) => store.get(id))
  if (!record) return
  await withStore('readwrite', (store) => store.put({ ...record, ...updates }))
}

export async function deleteTaxDocument(id: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(id))
}
