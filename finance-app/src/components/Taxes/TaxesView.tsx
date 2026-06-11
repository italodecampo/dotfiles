import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Upload, FileText, Trash2, Download, Info, Lightbulb, FolderOpen,
} from 'lucide-react'
import type { Transaction, TaxDocument, TaxDocumentCategory } from '../../types'
import { formatCurrency } from '../../utils/stats'
import { simpleId } from '../../utils/parseHelpers'
import {
  saveTaxDocument, listTaxDocuments, getTaxDocumentBlob, updateTaxDocumentMeta, deleteTaxDocument,
} from '../../utils/taxStorage'

interface TaxesViewProps {
  transactions: Transaction[]
}

const DOCUMENT_CATEGORIES: TaxDocumentCategory[] = [
  'Income Statement', 'Receipt', 'Donation', 'Medical', 'Investment', 'Business Expense', 'Other',
]

/** Expense categories that commonly have tax implications (deductions, credits, relief). General guidance only. */
const TAX_RELEVANT_CATEGORIES: Transaction['category'][] = [
  'Health & Fitness', 'Education', 'Housing & Utilities', 'Financial',
]

const TAX_TIPS = [
  'Charitable donations to registered organizations may qualify for a tax deduction or credit — keep donation receipts.',
  'Medical expenses above your country\'s threshold can often be claimed — save invoices, prescriptions, and proof of payment.',
  'If you work from home, a portion of rent, utilities, and internet may be deductible as home-office expenses.',
  'Retirement fund or pension contributions often qualify for tax relief — keep your contribution certificates.',
  'Education and professional development costs may qualify for credits or deductions in some jurisdictions.',
  'Keep income statements (payslips, annual tax certificates) on hand — you\'ll need them to file accurately.',
  'If you\'re self-employed or freelance, track and categorize business expenses throughout the year, not just at filing time.',
]

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function TaxesView({ transactions }: TaxesViewProps) {
  const [documents, setDocuments] = useState<TaxDocument[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentYear = new Date().getFullYear()
  const transactionYears = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.date.getFullYear()))),
    [transactions]
  )
  const yearsWithData = useMemo(() => {
    const years = new Set(transactionYears)
    years.add(currentYear)
    return Array.from(years).sort((a, b) => b - a)
  }, [transactionYears, currentYear])

  const [insightsYear, setInsightsYear] = useState(
    transactionYears.length > 0 ? Math.max(...transactionYears) : currentYear
  )

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    setDocuments(await listTaxDocuments())
  }

  async function handleFiles(files: FileList | File[]) {
    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        const meta: TaxDocument = {
          id: simpleId(),
          name: file.name,
          category: 'Other',
          taxYear: currentYear,
          uploadedAt: new Date().toISOString(),
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size,
        }
        await saveTaxDocument(meta, file)
      }
      await refresh()
    } finally {
      setIsUploading(false)
    }
  }

  async function handleCategoryChange(id: string, category: TaxDocumentCategory) {
    await updateTaxDocumentMeta(id, { category })
    await refresh()
  }

  async function handleYearChange(id: string, taxYear: number) {
    await updateTaxDocumentMeta(id, { taxYear })
    await refresh()
  }

  async function handleDelete(id: string) {
    await deleteTaxDocument(id)
    await refresh()
  }

  async function handleDownload(doc: TaxDocument) {
    const blob = await getTaxDocumentBlob(doc.id)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.name
    a.click()
    URL.revokeObjectURL(url)
  }

  const groupedByYear = useMemo(() => {
    const groups = new Map<number, TaxDocument[]>()
    for (const doc of documents) {
      if (!groups.has(doc.taxYear)) groups.set(doc.taxYear, [])
      groups.get(doc.taxYear)!.push(doc)
    }
    return Array.from(groups.entries()).sort((a, b) => b[0] - a[0])
  }, [documents])

  const documentYearOptions = useMemo(() => {
    const years = new Set(yearsWithData)
    for (const doc of documents) years.add(doc.taxYear)
    return Array.from(years).sort((a, b) => b - a)
  }, [yearsWithData, documents])

  const insightsExpenses = useMemo(() => {
    const inYear = transactions.filter((t) => t.type === 'expense' && t.date.getFullYear() === insightsYear)
    const groups = new Map<Transaction['category'], { total: number; count: number }>()
    for (const tx of inYear) {
      const existing = groups.get(tx.category) ?? { total: 0, count: 0 }
      groups.set(tx.category, { total: existing.total + Math.abs(tx.amount), count: existing.count + 1 })
    }
    return Array.from(groups.entries())
      .map(([category, { total, count }]) => ({ category, total, count }))
      .sort((a, b) => b.total - a.total)
  }, [transactions, insightsYear])

  const totalIncomeForYear = useMemo(
    () => transactions
      .filter((t) => t.type === 'income' && t.date.getFullYear() === insightsYear)
      .reduce((s, t) => s + Math.abs(t.amount), 0),
    [transactions, insightsYear]
  )

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Taxes</h1>
        <p className="text-sm text-slate-400 mt-0.5">Organize documents and review tax-relevant spending</p>
      </div>

      <div className="flex gap-3 items-start p-4 bg-amber-50 rounded-xl border border-amber-100">
        <Info size={16} className="text-amber-500 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-700">
          This section is for general organization and education only — it is <strong>not</strong> professional
          tax advice. Tax rules vary widely by country and change over time. Please consult a qualified tax
          advisor or your local tax authority for guidance specific to your situation.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
            }}
            onClick={() => inputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
              ${isDragging
                ? 'border-indigo-400 bg-indigo-50'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) handleFiles(e.target.files)
                e.target.value = ''
              }}
            />
            <Upload size={28} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-600 font-medium text-sm mb-1">
              {isDragging ? 'Drop your documents here' : 'Drag & drop tax documents'}
            </p>
            <p className="text-slate-400 text-xs">Receipts, payslips, statements (PDF, images, etc.) — or click to browse</p>
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {documents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
              <FolderOpen size={32} className="mx-auto text-slate-200 mb-3" />
              <p className="text-slate-500 font-medium">No documents yet</p>
              <p className="text-slate-400 text-sm mt-1">
                Upload receipts, payslips, or statements to keep them organized by tax year.
              </p>
            </div>
          ) : (
            groupedByYear.map(([year, docs]) => (
              <div key={year} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-sm font-semibold text-slate-700">Tax Year {year}</h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {docs.map((doc) => (
                    <div key={doc.id} className="px-5 py-3.5 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                        <FileText size={15} className="text-indigo-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-700 truncate">{doc.name}</p>
                        <p className="text-xs text-slate-400">{formatDate(doc.uploadedAt)} · {formatFileSize(doc.fileSize)}</p>
                      </div>
                      <select
                        value={doc.category}
                        onChange={(e) => handleCategoryChange(doc.id, e.target.value as TaxDocumentCategory)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 focus:outline-none focus:border-indigo-400 cursor-pointer"
                      >
                        {DOCUMENT_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <select
                        value={doc.taxYear}
                        onChange={(e) => handleYearChange(doc.id, Number(e.target.value))}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 focus:outline-none focus:border-indigo-400 cursor-pointer"
                      >
                        {documentYearOptions.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="text-slate-400 hover:text-indigo-500 cursor-pointer shrink-0"
                        title="Download"
                      >
                        <Download size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-slate-300 hover:text-rose-500 cursor-pointer shrink-0"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700">Tax Year Overview</h3>
              <select
                value={insightsYear}
                onChange={(e) => setInsightsYear(Number(e.target.value))}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 focus:outline-none focus:border-indigo-400 cursor-pointer"
              >
                {yearsWithData.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="mb-4 pb-4 border-b border-slate-50">
              <p className="text-xs text-slate-400 mb-1">Total Income</p>
              <p className="text-lg font-semibold text-emerald-600">{formatCurrency(totalIncomeForYear)}</p>
            </div>

            {insightsExpenses.length === 0 ? (
              <p className="text-sm text-slate-400">No expenses recorded for {insightsYear}.</p>
            ) : (
              <div className="space-y-2.5">
                {insightsExpenses.map(({ category, total, count }) => (
                  <div key={category} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-slate-600 truncate">{category}</p>
                      {TAX_RELEVANT_CATEGORIES.includes(category) && (
                        <p className="text-xs text-indigo-500">Often tax-relevant</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-slate-700">{formatCurrency(total)}</p>
                      <p className="text-xs text-slate-400">{count}×</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={16} className="text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-700">General Tax Tips</h3>
            </div>
            <ul className="space-y-2.5">
              {TAX_TIPS.map((tip, i) => (
                <li key={i} className="text-xs text-slate-500 leading-relaxed flex gap-2">
                  <span className="text-indigo-300 shrink-0">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
