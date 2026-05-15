import type { Category, TransactionType } from '../types'

const CATEGORY_RULES: { category: Category; type: TransactionType; keywords: string[] }[] = [
  {
    category: 'Income',
    type: 'income',
    keywords: [
      'salary', 'payroll', 'wages', 'direct dep', 'direct deposit', 'paycheck',
      'employer', 'compensation', 'income', 'payment received', 'transfer in',
      'refund', 'cashback', 'dividend', 'interest earned', 'commission',
    ],
  },
  {
    category: 'Subscriptions',
    type: 'expense',
    keywords: [
      'netflix', 'spotify', 'apple music', 'youtube premium', 'hulu', 'disney+',
      'amazon prime', 'prime video', 'showmax', 'dstv', 'hbo', 'paramount+',
      'adobe', 'microsoft 365', 'office 365', 'dropbox', 'icloud', 'google one',
      'github', 'notion', 'figma', 'canva', 'slack', 'zoom', 'chatgpt',
      'claude', 'openai', 'lastpass', '1password', 'nordvpn', 'expressvpn',
    ],
  },
  {
    category: 'Food & Dining',
    type: 'expense',
    keywords: [
      'restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonald', 'mcdonalds',
      'kfc', 'burger king', 'subway', 'pizza', 'sushi', 'uber eats', 'doordash',
      'grubhub', 'mr delivery', 'food', 'dining', 'bakery', 'deli', 'bar ',
      'pub ', 'grill', 'kitchen', 'eatery', 'takeaway', 'takeout', 'nandos',
      'dominos', 'steers', 'ocean basket', 'vida e caffe',
    ],
  },
  {
    category: 'Groceries',
    type: 'expense',
    keywords: [
      'woolworths food', 'checkers', 'pick n pay', 'shoprite', 'spar',
      'whole foods', 'trader joe', 'kroger', 'safeway', 'publix', 'aldi',
      'lidl', 'tesco', 'asda', 'waitrose', 'sainsbury', 'grocery', 'supermarket',
      'market', 'fresh produce', 'food store',
    ],
  },
  {
    category: 'Transportation',
    type: 'expense',
    keywords: [
      'uber', 'lyft', 'bolt', 'indriver', 'taxi', 'cab ', 'petrol', 'fuel',
      'shell', 'engen', 'bp ', 'caltex', 'total ', 'garage', 'parking',
      'toll ', 'e-toll', 'bus ', 'train', 'metro', 'transit', 'transport',
      'vehicle', 'auto', 'car wash', 'service station', 'motor',
    ],
  },
  {
    category: 'Housing & Utilities',
    type: 'expense',
    keywords: [
      'rent', 'mortgage', 'lease', 'landlord', 'property',
      'electricity', 'eskom', 'city power', 'water', 'sewage', 'rates',
      'internet', 'fibre', 'vodacom', 'mtn ', 'telkom', 'cell c', 'rain ',
      'gas ', 'heating', 'cooling', 'aircon', 'security', 'alarm',
      'homeowners', 'hoa ', 'body corporate',
    ],
  },
  {
    category: 'Entertainment',
    type: 'expense',
    keywords: [
      'cinema', 'movie', 'theatre', 'theater', 'concert', 'ticket',
      'eventbrite', 'ticketmaster', 'game ', 'steam', 'playstation', 'xbox',
      'nintendo', 'appstore', 'google play', 'itunes', 'museum', 'zoo',
      'amusement', 'bowling', 'mini golf', 'escape room', 'laser tag',
    ],
  },
  {
    category: 'Shopping',
    type: 'expense',
    keywords: [
      'amazon', 'takealot', 'mr price', 'ackermans', 'pep ', 'zara', 'h&m',
      'uniqlo', 'woolworths clothing', 'cotton on', 'sportscene', 'nike',
      'adidas', 'clothing', 'fashion', 'apparel', 'shoes', 'retail',
      'department store', 'mall', 'boutique', 'store',
    ],
  },
  {
    category: 'Health & Fitness',
    type: 'expense',
    keywords: [
      'gym', 'virgin active', 'planet fitness', 'anytime fitness', 'crossfit',
      'yoga', 'pilates', 'pharmacy', 'clicks', 'dischem', 'doctor', 'medical',
      'dentist', 'dental', 'optometry', 'hospital', 'clinic', 'health',
      'vitamin', 'supplement', 'prescription',
    ],
  },
  {
    category: 'Financial',
    type: 'expense',
    keywords: [
      'bank fee', 'service fee', 'monthly fee', 'account fee',
      'atm ', 'cash withdrawal', 'transfer fee', 'interest charge',
      'insurance', 'life cover', 'short term', 'fnb', 'standard bank',
      'absa', 'nedbank', 'capitec', 'discovery bank', 'investec',
      'investment', 'unit trust', 'tax payment', 'sars', 'irs ',
    ],
  },
  {
    category: 'Travel',
    type: 'expense',
    keywords: [
      'hotel', 'airbnb', 'booking.com', 'expedia', 'flight', 'airline',
      'airport', 'airlink', 'kulula', 'safair', 'british airways', 'emirates',
      'passport', 'visa fee', 'travel', 'holiday', 'vacation', 'resort',
      'cruise', 'hostel', 'accommodation',
    ],
  },
  {
    category: 'Education',
    type: 'expense',
    keywords: [
      'school', 'university', 'college', 'tuition', 'course', 'udemy',
      'coursera', 'skillshare', 'masterclass', 'pluralsight', 'linkedin learning',
      'books', 'textbook', 'stationery', 'education', 'training', 'workshop',
      'seminar', 'certification',
    ],
  },
]

export function categorizeTransaction(description: string, amount: number): {
  category: Category
  type: TransactionType
} {
  const lower = description.toLowerCase()

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      const type: TransactionType =
        rule.type === 'income' ? 'income' : amount < 0 ? 'expense' : 'income'
      return { category: rule.category, type }
    }
  }

  const type: TransactionType = amount >= 0 ? 'income' : 'expense'
  return { category: 'Other', type }
}

export const CATEGORY_COLORS: Record<Category, string> = {
  Income: '#10B981',
  'Food & Dining': '#F59E0B',
  Groceries: '#84CC16',
  Transportation: '#3B82F6',
  'Housing & Utilities': '#8B5CF6',
  Entertainment: '#EC4899',
  Shopping: '#F97316',
  'Health & Fitness': '#14B8A6',
  Subscriptions: '#6366F1',
  Financial: '#64748B',
  Travel: '#0EA5E9',
  Education: '#A78BFA',
  Other: '#94A3B8',
}
