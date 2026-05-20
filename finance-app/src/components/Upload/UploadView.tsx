import { useRef, useState } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import type { Transaction } from '../../types'
import { parseCSV } from '../../utils/csvParser'

interface UploadViewProps {
  onUpload: (transactions: Transaction[]) => void
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

export function UploadView({ onUpload }: UploadViewProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showGuide, setShowGuide] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function processFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file. Most banks let you export transactions as CSV.')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const transactions = await parseCSV(file)
      setSuccess(`Successfully imported ${transactions.length} transactions.`)
      setTimeout(() => onUpload(transactions), 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file.')
    } finally {
      setIsLoading(false)
    }
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
          Export your transactions as CSV from your bank's online portal,<br />
          then drag and drop or click to upload below.
        </p>
      </div>

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
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) processFile(file)
            e.target.value = ''
          }}
        />
        <FileText size={36} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-600 font-medium mb-1">
          {isDragging ? 'Drop your CSV here' : 'Drag & drop your CSV file'}
        </p>
        <p className="text-slate-400 text-sm">or click to browse</p>
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
              { bank: 'FNB / RMB', steps: 'Online Banking → My Bank Accounts → Account → Transactions → Export → CSV' },
              { bank: 'Standard Bank', steps: 'Online Banking → Account → View Statements → Download CSV' },
              { bank: 'ABSA', steps: 'Online Banking → Accounts → Transaction History → Export → CSV' },
              { bank: 'Nedbank', steps: 'Online Banking → Accounts → Transaction History → Export to CSV' },
              { bank: 'Capitec', steps: 'App → Transactions → Download Statement → CSV format' },
            ].map(({ bank, steps }) => (
              <div key={bank}>
                <span className="font-medium text-slate-700 text-xs">{bank}</span>
                <p className="text-slate-400 text-xs mt-0.5">{steps}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        Your data never leaves your device. All processing happens in the browser.
      </p>
    </div>
  )
}
