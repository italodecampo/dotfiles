import { useRef, useState } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import type { Account, Transaction } from '../../types'
import { parseFile, isSupportedFile, getExtension } from '../../utils/fileParser'

export type UploadTarget = { type: 'new'; name: string } | { type: 'existing'; id: string }

interface UploadViewProps {
  accounts: Account[]
  onUpload: (transactions: Transaction[], target: UploadTarget) => void
}

const SAMPLE_CSV = `Date,Description,Amount
2024-01-01,Salary Payment,35000
2024-01-02,Netflix Subscription,-199
2024-01-03,Woolworths Food,-1250
2024-01-04,Spotify Premium,-99
2024-01-05,Shell Petrol Station,-850
2024-01-06,Kauai Restaurant,-320
2024-01-07,Virgin Active Gym,-799
2024-01-08,City Power Electricity,-1200
2024-01-10,Amazon Purchase,-540
2024-01-12,Starbucks Coffee,-95
2024-01-14,Uber Eats,-280
2024-01-15,Netflix Subscription,-199
2024-01-18,ATM Cash Withdrawal,-500
2024-01-20,Pick n Pay Groceries,-980
2024-01-22,FNB Bank Service Fee,-69
2024-01-24,Checkers Supermarket,-1100
2024-01-25,Petrol Station BP,-720
2024-01-26,KFC Takeaway,-210
2024-01-28,Spotify Premium,-99
2024-02-01,Salary Payment,35000
2024-02-02,Netflix Subscription,-199
2024-02-05,Woolworths Food,-1430
2024-02-08,Uber Ride,-180
2024-02-10,Dentist Payment,-950
2024-02-12,Starbucks Coffee,-85
2024-02-14,Airbnb Cape Town,-3200
2024-02-15,Spotify Premium,-99
2024-02-18,Pick n Pay Groceries,-1050
2024-02-20,Shell Petrol,-790
2024-02-22,City Power Electricity,-1100
2024-02-24,Amazon Prime,-199
2024-02-26,Virgin Active Gym,-799`

/** Suggests a friendly account name from an uploaded filename, e.g. "fnb_jan_2025.csv" -> "Fnb Jan 2025". */
function suggestAccountName(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, '')
  const cleaned = base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (!cleaned) return 'New Account'
  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase())
}

export function UploadView({ accounts, onUpload }: UploadViewProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showGuide, setShowGuide] = useState(false)
  const [pending, setPending] = useState<{ transactions: Transaction[]; count: number } | null>(null)
  const [targetMode, setTargetMode] = useState<'new' | 'existing'>('new')
  const [newAccountName, setNewAccountName] = useState('')
  const [existingAccountId, setExistingAccountId] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function processFile(file: File) {
    if (!isSupportedFile(file.name)) {
      setError('Unsupported file type. Please upload a CSV, Excel (.xlsx/.xls), or PDF statement.')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)
    setPending(null)

    try {
      const transactions = await parseFile(file)
      const ext = getExtension(file.name)
      const note = ext === 'pdf' ? ' Review the results, as PDF parsing accuracy varies by bank.' : ''

      if (accounts.length === 0) {
        setSuccess(`Successfully imported ${transactions.length} transactions.${note}`)
        setTimeout(() => onUpload(transactions, { type: 'new', name: suggestAccountName(file.name) }), 800)
        return
      }

      setPending({ transactions, count: transactions.length })
      setNewAccountName(suggestAccountName(file.name))
      setTargetMode('new')
      setExistingAccountId(accounts[0].id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file.')
    } finally {
      setIsLoading(false)
    }
  }

  function confirmUpload() {
    if (!pending) return
    if (targetMode === 'new') {
      onUpload(pending.transactions, { type: 'new', name: newAccountName.trim() || 'New Account' })
    } else {
      onUpload(pending.transactions, { type: 'existing', id: existingAccountId })
    }
    setPending(null)
  }

  function loadSampleData() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const file = new File([blob], 'sample-transactions.csv', { type: 'text/csv' })
    processFile(file)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 mb-4">
          <Upload size={24} className="text-indigo-600" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">Upload Bank Statement</h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          Export your transactions from your bank's online portal as CSV, Excel, or PDF,<br />
          then drag and drop or click to upload below.
        </p>
      </div>

      {pending ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <CheckCircle size={20} className="text-emerald-500 shrink-0" />
            <p className="text-sm text-slate-700">
              Parsed <strong>{pending.count}</strong> transactions. Where should they go?
            </p>
          </div>

          <div className="flex rounded-xl border border-slate-200 overflow-hidden mb-4">
            <button
              onClick={() => setTargetMode('new')}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all cursor-pointer
                ${targetMode === 'new' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              New Account
            </button>
            <button
              onClick={() => setTargetMode('existing')}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all cursor-pointer
                ${targetMode === 'existing' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              Add to Existing Account
            </button>
          </div>

          {targetMode === 'new' ? (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Account name</label>
              <input
                type="text"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="e.g. FNB Cheque Account"
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 text-slate-700"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Account</label>
              <select
                value={existingAccountId}
                onChange={(e) => setExistingAccountId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 text-slate-700 cursor-pointer"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 mt-5">
            <button
              onClick={() => setPending(null)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 font-medium hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={confirmUpload}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-all cursor-pointer"
            >
              Continue
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              const file = e.dataTransfer.files[0]
              if (file) processFile(file)
            }}
            onClick={() => inputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
              ${isDragging
                ? 'border-indigo-400 bg-indigo-50'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) processFile(file)
                e.target.value = ''
              }}
            />
            <FileText size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium mb-1">
              {isDragging ? 'Drop your file here' : 'Drag & drop your statement'}
            </p>
            <p className="text-slate-400 text-sm">CSV, Excel (.xlsx, .xls) or PDF — or click to browse</p>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-slate-500">Parsing transactions...</span>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 flex gap-3 items-start p-4 bg-red-50 rounded-xl border border-red-100">
              <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-4 flex gap-3 items-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <CheckCircle size={18} className="text-emerald-500 shrink-0" />
              <p className="text-sm text-emerald-700">{success}</p>
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-400 text-xs">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <button
            onClick={loadSampleData}
            disabled={isLoading}
            className="mt-4 w-full py-3 rounded-xl border border-slate-200 text-sm text-slate-600 font-medium hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 cursor-pointer"
          >
            Load Sample Data to Explore
          </button>

          <div className="mt-6 bg-white rounded-2xl border border-slate-100">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-slate-700 cursor-pointer"
            >
              <span>How to export from your bank</span>
              {showGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showGuide && (
              <div className="px-5 pb-5 space-y-3 border-t border-slate-100 pt-4">
                {[
                  { bank: 'FNB / RMB', steps: 'Online Banking → My Bank Accounts → Account → Transactions → Export → CSV, Excel or PDF' },
                  { bank: 'Standard Bank', steps: 'Online Banking → Account → View Statements → Download as PDF, CSV or Excel' },
                  { bank: 'ABSA', steps: 'Online Banking → Accounts → Transaction History → Export → CSV or PDF' },
                  { bank: 'Nedbank', steps: 'Online Banking → Accounts → Transaction History → Export to CSV, Excel or PDF statement' },
                  { bank: 'Capitec', steps: 'App → Transactions → Download Statement → PDF or CSV' },
                ].map(({ bank, steps }) => (
                  <div key={bank}>
                    <span className="font-medium text-slate-700 text-xs">{bank}</span>
                    <p className="text-slate-400 text-xs mt-0.5">{steps}</p>
                  </div>
                ))}
                <div className="pt-2 mt-2 border-t border-slate-100">
                  <p className="text-slate-400 text-xs leading-relaxed">
                    <strong className="text-slate-500">Tip:</strong> CSV and Excel give the most accurate
                    results since they have clearly labeled columns. PDF statements are supported too —
                    the app reads the table layout automatically — but always double-check amounts and
                    dates afterwards, since formats vary between banks.
                  </p>
                </div>
              </div>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            Your data never leaves your device. All processing happens in the browser, and is saved locally so it's here when you come back.
          </p>
        </>
      )}
    </div>
  )
}
