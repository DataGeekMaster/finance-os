# FinanceOS - Aplikasi Pencatatan Keuangan Pribadi

Aplikasi web modern untuk manajemen keuangan pribadi dengan fitur lengkap termasuk tracking transaksi, investasi, utang, goals, dan analisis data.

---

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Struktur Proyek](#-struktur-proyek)
- [Setup & Instalasi](#-setup--instalasi)
- [Fitur Baru (Update 19/2/2026)](#-fitur-baru-update-1922026)
- [Database Schema](#-database-schema)
- [Panduan Penggunaan](#-panduan-penggunaan)

---

## ✨ Fitur Utama

### 1. **Dashboard**
- AI Financial Advisor (Groq API) dengan **User Personalization**
- 4 Stat Cards: Kekayaan Bersih, Portofolio, Pengeluaran, Arus Kas
- Waterfall Chart (Metode 50/30/20/0)
- Recent Activity
- **User Profile Modal** - Setup profil keuangan untuk saran AI yang lebih personal

### 2. **Arus Kas (Cashflow)**
- **Multi-Wallet System** - Kelola multiple dompet (BCA, GoPay, Cash, dll)
- Transaction history dengan filter tanggal
- Income vs Expense tracking
- Wallet balance tracking

### 3. **Investasi**
- Portfolio tracking (Stock, Crypto, Gold, Cash, Bond)
- Auto-calculate PnL (Profit & Loss)
- Real-time price updates via Yahoo Finance
- Trade history (BUY/SELL)

### 4. **Target & Kewajiban**
- Financial Goals (Sinking Funds)
- Subscriptions tracking
- **Utang & Piutang** dengan Split Bill feature
- Progress tracking per goal

### 5. **Analisis Data**
- Net Worth Trend (Line Chart)
- Income vs Expense (Bar Chart)
- **Export to CSV** untuk analisis lanjutan
- Data-driven insights

---

## 🛠️ Teknologi yang Digunakan

| Kategori | Teknologi |
|----------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Database** | Supabase (PostgreSQL) |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **AI** | Groq API (Kimi K2) |
| **Real-time** | Supabase Realtime |
| **Edge Functions** | Deno (Yahoo Finance API) |

---

## 📁 Struktur Proyek

```
E:\My Project\Catatan keuangan\
├── src/
│   └── app/
│       ├── page.tsx              # Main application (3770 lines)
│       ├── layout.tsx
│       ├── globals.css
│       └── input/
│           └── page.tsx
├── supabase/
│   ├── functions/
│   │   └── update-prices/
│   │       ├── index.ts          # Edge Function auto-update harga
│   │       └── deno.json
│   ├── new-features-schema.sql   # Schema Multi-Wallet & Split Bill
│   ├── update-prices-cron.sql    # Cron schedule auto-update
│   └── README-CRON.md
├── public/
├── .env.local                    # Environment variables
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── .gitignore
├── REFACTORING_SUMMARY.md
├── IMPLEMENTATION_GUIDE.md
└── README.md                     # File ini
```

---

## 🚀 Setup & Instalasi

### Prerequisites
- Node.js 18+
- Supabase account
- Groq API key (optional untuk AI)

### Instalasi

```bash
# 1. Clone atau extract project
cd "E:\My Project\Catatan keuangan"

# 2. Install dependencies
npm install

# 3. Setup environment variables
# Buat file .env.local dengan isi:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GROQ_API_KEY=your_groq_api_key

# 4. Setup database
# Buka Supabase Dashboard → SQL Editor
# Copy-paste dan jalankan:
# - supabase/new-features-schema.sql (Multi-Wallet)
# - supabase/update-prices-cron.sql (Auto-update prices)

# 5. Deploy Edge Function
npx supabase functions deploy update-prices

# 6. Run development server
npm run dev
```

---

## 🎉 Fitur Baru (Update 19/2/2026)

### 1. **Refactoring Layout - Tab Navigation**
File: `src/app/page.tsx`

**Perubahan:**
- ✅ Monolithic page di-refactor menjadi **5 Tab Navigation**
- ✅ Responsive Sidebar Layout (Desktop) + Hamburger Menu (Mobile)
- ✅ Clean architecture dengan `renderContent()` switch-case

**Tab Structure:**
```typescript
type TabId = 'dashboard' | 'cashflow' | 'investments' | 'goals_debts' | 'analytics';

const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'cashflow', label: 'Arus Kas', icon: ArrowUpDown },
  { id: 'investments', label: 'Investasi', icon: TrendingUp },
  { id: 'goals_debts', label: 'Target & Kewajiban', icon: Target },
  { id: 'analytics', label: 'Analisis Data', icon: LineChartIcon },
];
```

### 2. **Multi-Wallet System**
File: `supabase/new-features-schema.sql`

**Features:**
- ✅ Create multiple wallets (BCA, GoPay, Cash, dll)
- ✅ Auto-update wallet balance saat transaksi
- ✅ Wallet selector di form transaksi
- ✅ Visual wallet cards dengan icon & color

**Database Schema:**
```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  balance NUMERIC(15,2) DEFAULT 0,
  icon TEXT DEFAULT '💳',
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true
);
```

**Trigger Function:**
- Auto-update balance saat INSERT/UPDATE/DELETE transaksi
- Support wallet change (move transaction between wallets)

### 3. **Split Bill (Patungan)**
File: `src/app/page.tsx`

**Features:**
- ✅ Split expense ke multiple participants
- ✅ Auto-create Piutang (receivable) debts
- ✅ Track siapa saja yang berutang
- ✅ Integration dengan transaction form

**Handler Function:**
```typescript
const handleSplitBill = (
  transaction: Partial<Transaction>,
  participants: number,
  participantNames: string[]
) => {
  // Auto-create receivable debts
  const splitAmount = Math.round(transaction.amount / participants);
  // Create debt records for each participant
}
```

### 4. **Analytics & Export**
File: `src/app/page.tsx`

**Features:**
- ✅ Net Worth Trend LineChart
- ✅ Income vs Expense BarChart
- ✅ **Export to CSV** button
- ✅ Aggregated data per date (no duplicate dates)

**Export Function:**
```typescript
const exportToCSV = () => {
  const headers = ['Date', 'Title', 'Type', 'Amount', 'Category', 'Wallet'];
  const csv = transactions.map(t => [...]);
  // Download as .csv file
}
```

### 5. **Auto-Update Prices (Cron Job)**
Files:
- `supabase/functions/update-prices/index.ts`
- `supabase/update-prices-cron.sql`
- `supabase/README-CRON.md`

**Features:**
- ✅ Edge Function untuk fetch harga dari Yahoo Finance
- ✅ Cron schedule setiap **1 menit** saat market open
- ✅ IDX market hours detection (Mon-Fri, WIB timezone)
- ✅ Real-time sync ke semua users via Supabase Realtime

**Schedule (UTC+7 / WIB):**
| Hari | Sesi Pagi | Sesi Siang |
|------|-----------|------------|
| Mon-Thu | 09:00-12:00 | 13:30-16:30 |
| Friday | 09:00-11:30 | 14:00-16:30 |

**Cron Expression:**
```sql
-- Every minute during market hours
'* 2-4 * * 1-4'  -- Mon-Thu morning (UTC)
'* 7-9 * * 1-4'  -- Mon-Thu afternoon (UTC)
'* 2-4 * * 5'    -- Friday morning (UTC)
'* 7-9 * * 5'    -- Friday afternoon (UTC)
```

### 6. **Type Definitions & Interfaces**
File: `src/app/page.tsx`

**New Interfaces:**
```typescript
interface Wallet {
  id: string;
  user_id?: string;
  name: string;
  balance: number;
  icon: string;
  color: string;
  is_active: boolean;
}

interface Transaction {
  // ... existing fields
  wallet_id?: string;
  split_from_id?: string;
  is_split?: boolean;
  split_total_amount?: number;
  split_participants?: number;
}

interface WaterfallItem {
  name: string;
  value: number;
  color: string;
  percentage?: string;
}

interface WaterfallComparisonItem {
  name: string;
  actual: number;
  ideal: number;
}
```

### 7. **State Management Updates**
```typescript
// New states
const [wallets, setWallets] = useState<Wallet[]>([]);
const [activeTab, setActiveTab] = useState<TabId>('dashboard');
const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
const [isSplitBillModalOpen, setIsSplitBillModalOpen] = useState(false);

// New handlers
const exportToCSV = () => {...}
const handleSplitBill = (...) => {...}
const handleCreateWallet = (...) => {...}
const handleDeleteWallet = (...) => {...}
const handleUpdateWalletBalance = (...) => {...}

// New calculations
const analyticsData = useMemo(() => {...})  // Aggregated trend data
const totalWalletBalance = useMemo(() => {...})
```

### 8. **Bug Fixes**
- ✅ Fixed duplicate imports (recharts, lucide-react)
- ✅ Fixed TabId type mismatch
- ✅ Fixed duplicate dates in analytics charts (aggregated by date)
- ✅ Fixed N+1 query problem in Edge Function (batch updates)

---

## 🗄️ Database Schema

### Tables Overview

| Table | Description | RLS |
|-------|-------------|-----|
| `transactions` | Income & expense tracking | ✅ |
| `wallets` | Multi-wallet system | ✅ |
| `assets` | Investment assets (stock, crypto) | ✅ |
| `trades` | BUY/SELL history | ✅ |
| `debts` | Utang & Piutang | ✅ |
| `goals` | Financial goals/sinking funds | ✅ |
| `subscriptions` | Recurring subscriptions | ✅ |
| `user_settings` | Waterfall allocation % | ✅ |

### RLS Policies
Semua tabel memiliki Row Level Security dengan policy:
- Users can only view/modify their own data
- Policies for SELECT, INSERT, UPDATE, DELETE

---

## 📖 Panduan Penggunaan

### 1. Multi-Wallet
1. Buka tab **"Arus Kas"**
2. Lihat wallet cards di bagian atas
3. Klik **"+"** untuk tambah wallet baru
4. Pilih wallet saat tambah transaksi

### 2. Split Bill
1. Tambah transaksi baru
2. Centang opsi **"Split Bill"**
3. Masukkan jumlah peserta
4. Sistem auto-create piutang

### 3. Export Data
1. Buka tab **"Analisis Data"**
2. Klik **"Export CSV"**
3. File terdownload otomatis

### 4. Auto-Update Prices
1. Setup cron job di Supabase Dashboard
2. Copy-paste `supabase/update-prices-cron.sql`
3. Edge Function akan jalan otomatis saat market open

---

## 📝 Change Log - 19 Februari 2026

### Files Created
- ✅ `supabase/new-features-schema.sql` - Multi-Wallet & Split Bill schema
- ✅ `supabase/update-prices-cron.sql` - Cron schedule for auto-update
- ✅ `supabase/README-CRON.md` - Cron documentation
- ✅ `REFACTORING_SUMMARY.md` - Refactoring summary
- ✅ `IMPLEMENTATION_GUIDE.md` - Implementation guide

### Files Modified
- ✅ `src/app/page.tsx` - Complete refactoring (3770 lines)
  - 5 Tab navigation system
  - Multi-Wallet integration
  - Split Bill handler
  - Analytics charts (LineChart + BarChart)
  - Export CSV function
  - Fixed duplicate imports & types
  - Fixed duplicate dates in charts

- ✅ `.gitignore` - Added `supabase/new-features-schema.sql`

### Files Deleted
- None

### Total Changes
- **+1200 lines** added (new features, handlers, components)
- **-200 lines** removed (duplicate code, old structure)
- **Net: +1000 lines** of new functionality

---

## 🎯 Next Steps (Future Enhancements)

- [ ] Wallet transfer feature
- [ ] Budget limits per category
- [ ] Recurring transactions
- [ ] Bill reminders
- [ ] Investment dividend tracking
- [ ] Net worth projection
- [ ] Multi-currency support
- [ ] Mobile app (React Native)

---

## 📞 Support

Untuk pertanyaan atau issue, silakan buat issue di repository atau hubungi developer.

---

**Last Updated:** 19 Februari 2026  
**Version:** 2.0.0  
**Developer:** FinanceOS Team
