import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
import type { Transaction } from '../types'
import { categorizeTransaction } from './categorizer'
import { simpleId, finalizeTransactions } from './parseHelpers'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
}

const SKIP_LINE_KEYWORDS = [
  'opening balance', 'closing balance', 'balance brought forward',
  'balance carried forward', 'balance b/f', 'balance c/f',
  'statement period', 'account number', 'sort code', 'page ',
  'total', 'subtotal',
]

function makeDate(year: number, month: number, day: number): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const fullYear = year < 100 ? 2000 + year : year
  const d = new Date(fullYear, month - 1, day)
  return isNaN(d.getTime()) ? null : d
}

interface DateMatch {
  date: Date
  match: string
  index: number
}

const DATE_PATTERNS: { regex: RegExp; parse: (m: RegExpMatchArray) => Date | null }[] = [
  // YYYY-MM-DD or YYYY/MM/DD
  {
    regex: /\b(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})\b/,
    parse: (m) => makeDate(+m[1], +m[2], +m[3]),
  },
  // 15 Jan 2024 / 15 January 2024
  {
    regex: /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{2,4})\b/i,
    parse: (m) => makeDate(+m[3], MONTHS[m[2].toLowerCase()], +m[1]),
  },
  // Jan 15, 2024 / Jan 15 2024
  {
    regex: /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s+(\d{2,4})\b/i,
    parse: (m) => makeDate(+m[3], MONTHS[m[1].toLowerCase()], +m[2]),
  },
  // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY (day-first, international format)
  {
    regex: /\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/,
    parse: (m) => makeDate(+m[3], +m[2], +m[1]),
  },
]

function findDate(line: string): DateMatch | null {
  for (const { regex, parse } of DATE_PATTERNS) {
    const m = line.match(regex)
    if (m && m.index !== undefined) {
      const date = parse(m)
      if (date) return { date, match: m[0], index: m.index }
    }
  }
  return null
}

// Accepts both US/UK (1,234.56) and European (1.234,56) formatting — the final
// separator is always the decimal point since it's followed by exactly 2 digits,
// while any earlier separators group thousands, regardless of which character is used.
const AMOUNT_REGEX = /\(?-?\s?\b\d{1,3}(?:[.,\s]\d{3})*[.,]\d{2}\)?\s?(?:CR|DR)?-?/gi

interface AmountMatch {
  value: number
  raw: string
  index: number
  explicitSign: 'positive' | 'negative' | null
}

function parseAmount(raw: string): number | null {
  const digits = raw.match(/\d{1,3}(?:[.,\s]\d{3})*[.,]\d{2}/)
  if (!digits) return null
  const parts = digits[0].match(/^(.*)[.,](\d{2})$/)
  if (!parts) return null
  const value = parseFloat(`${parts[1].replace(/[.,\s]/g, '')}.${parts[2]}`)
  return isNaN(value) ? null : value
}

function findAmounts(line: string): AmountMatch[] {
  const matches: AmountMatch[] = []
  for (const m of line.matchAll(AMOUNT_REGEX)) {
    const raw = m[0]
    const value = parseAmount(raw)
    if (value === null) continue

    let explicitSign: 'positive' | 'negative' | null = null
    if (/\(.*\)/.test(raw) || /^-/.test(raw.trim()) || /-\s*$/.test(raw) || /\bDR\b/i.test(raw)) {
      explicitSign = 'negative'
    } else if (/\bCR\b/i.test(raw)) {
      explicitSign = 'positive'
    }

    matches.push({ value, raw, index: m.index ?? 0, explicitSign })
  }
  return matches
}

async function extractLines(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise

  const lines: string[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()

    const rows = new Map<number, { x: number; str: string }[]>()

    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue
      const y = Math.round(item.transform[5])
      let key = y
      for (const existingKey of rows.keys()) {
        if (Math.abs(existingKey - y) <= 2) {
          key = existingKey
          break
        }
      }
      if (!rows.has(key)) rows.set(key, [])
      rows.get(key)!.push({ x: item.transform[4], str: item.str })
    }

    const pageLines = Array.from(rows.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([, items]) =>
        items
          .sort((a, b) => a.x - b.x)
          .map((i) => i.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()
      )
      .filter((l) => l.length > 0)

    lines.push(...pageLines)
  }

  return lines
}

export async function parsePDF(file: File): Promise<Transaction[]> {
  const lines = await extractLines(file)
  const transactions: Transaction[] = []

  for (const line of lines) {
    const lower = line.toLowerCase()
    if (SKIP_LINE_KEYWORDS.some((kw) => lower.includes(kw))) continue

    const dateMatch = findDate(line)
    if (!dateMatch) continue

    const remainder = line.slice(0, dateMatch.index) + line.slice(dateMatch.index + dateMatch.match.length)
    // Lines with a second date (e.g. "Statement period: 01.01.2024 to 31.12.2024") are
    // metadata, not a transaction row — real rows only ever carry one date.
    if (findDate(remainder)) continue

    const amounts = findAmounts(remainder)
    if (amounts.length === 0) continue

    const primaryAmount = amounts[0]

    let description = remainder
    for (const amt of amounts) {
      description = description.replace(amt.raw, ' ')
    }
    description = description.replace(/\s+/g, ' ').trim()
    if (!description || !/[a-z]/i.test(description)) continue

    let amount: number
    if (primaryAmount.explicitSign === 'negative') {
      amount = -Math.abs(primaryAmount.value)
    } else if (primaryAmount.explicitSign === 'positive') {
      amount = Math.abs(primaryAmount.value)
    } else {
      const { type } = categorizeTransaction(description, primaryAmount.value)
      amount = type === 'income' ? Math.abs(primaryAmount.value) : -Math.abs(primaryAmount.value)
    }

    const { category, type } = categorizeTransaction(description, amount)

    transactions.push({
      id: simpleId(),
      date: dateMatch.date,
      description,
      amount,
      type,
      category,
      isSubscription: false,
    })
  }

  if (transactions.length === 0) {
    throw new Error(
      'No transactions could be detected in this PDF. PDF layouts vary widely between banks — ' +
        'try exporting as CSV or Excel from your bank for more reliable results.'
    )
  }

  return finalizeTransactions(transactions)
}
