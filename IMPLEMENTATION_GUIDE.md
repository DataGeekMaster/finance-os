# Implementasi Fitur Baru - Panduan Lengkap

## ✅ Yang Sudah Diimplementasikan

### 1. Database Schema (`supabase/new-features-schema.sql`)
- [x] Tabel `wallets` dengan RLS policies
- [x] Alter tabel `transactions` untuk split bill
- [x] Trigger function untuk auto-update wallet balance
- [x] Indexes untuk performa

### 2. Type Definitions (`src/app/page.tsx`)
```typescript
type TabId = 'dashboard' | 'cashflow' | 'investments' | 'goals_debts' | 'analytics';

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
```

### 3. State Management
```typescript
const [wallets, setWallets] = useState<Wallet[]>([]);
const [activeTab, setActiveTab] = useState<TabId>('dashboard');
const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
const [isSplitBillModalOpen, setIsSplitBillModalOpen] = useState(false);
```

### 4. Handler Functions
- `exportToCSV()` - Export transaksi ke CSV
- `handleSplitBill()` - Split bill dan auto-create piutang
- `handleCreateWallet()` - Buat wallet baru
- `handleDeleteWallet()` - Hapus wallet
- `handleUpdateWalletBalance()` - Update saldo wallet

### 5. Data Calculations
- `analyticsData` - Trend net worth over time
- `totalWalletBalance` - Total saldo semua wallet

---

## 📋 Yang Perlu Ditambahkan (Manual Implementation)

### A. Komponen UI Baru

#### 1. WalletCard Component
```typescript
const WalletCard = ({ wallet, onDelete }: { wallet: Wallet, onDelete: (id: string) => void }) => (
  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-white/5">
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{wallet.icon}</span>
        <div>
          <h3 className="text-white font-bold">{wallet.name}</h3>
          <p className="text-xs text-gray-500">Dompet Digital</p>
        </div>
      </div>
      <button onClick={() => onDelete(wallet.id)} className="text-gray-500 hover:text-red-500">
        <Trash2 size={16} />
      </button>
    </div>
    <div className="text-2xl font-bold font-mono text-white">
      {formatCurrency(wallet.balance)}
    </div>
  </div>
);
```

#### 2. SplitBillModal Component
```typescript
const SplitBillModal = ({
  isOpen,
  onClose,
  transaction,
  onSubmit
}: {
  isOpen: boolean;
  onClose: () => void;
  transaction: Partial<Transaction>;
  onSubmit: (participants: number, names: string[]) => void;
}) => {
  const [participants, setParticipants] = useState(2);
  const [names, setNames] = useState<string[]>(['', '']);

  // ... implementation
};
```

#### 3. WalletModal Component
```typescript
const WalletModal = ({
  isOpen,
  onClose,
  onSubmit
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (wallet: Omit<Wallet, 'id'>) => void;
}) => {
  const [formData, setFormData] = useState({
    name: '',
    balance: 0,
    icon: '💳',
    color: '#3b82f6'
  });

  // ... implementation
};
```

### B. Render Content untuk Setiap Tab

#### Tab 1: Dashboard (existing, tidak berubah banyak)
- AI Insight Widget ✅
- 4 Stat Cards (Net Worth, Portfolio, Expense, Cashflow) ✅
- Waterfall Chart ✅

#### Tab 2: Arus Kas (cashflow) - NEW
```typescript
case 'cashflow':
  return (
    <div className="space-y-6">
      {/* Wallet Cards */}
      <div>
        <SectionHeader
          title="Dompet & Akun"
          icon={Wallet}
          action={
            <button onClick={() => setIsWalletModalOpen(true)}>
              <Plus size={18} />
            </button>
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {wallets.map(wallet => (
            <WalletCard key={wallet.id} wallet={wallet} onDelete={handleDeleteWallet} />
          ))}
        </div>
      </div>

      {/* Transaction List with Wallet Selector */}
      <div className="bg-[#232323] border border-white/5 rounded-2xl p-6">
        <SectionHeader
          title="Riwayat Transaksi"
          icon={ArrowUpDown}
          action={
            <button onClick={() => setIsModalOpen(true)}>
              <Plus size={18} />
            </button>
          }
        />
        {/* ... transaction list with wallet badges ... */}
      </div>
    </div>
  );
```

#### Tab 3: Investasi (investments) - Existing
```typescript
case 'investments':
  return (
    <InvestmentModule
      positions={portfolio}
      onAddTrade={() => setIsTradeModalOpen(true)}
      onDeleteAsset={handleDeleteAsset}
      onUpdatePrice={handleUpdateAssetPrice}
    />
  );
```

#### Tab 4: Target & Kewajiban (goals_debts) - UPDATED
```typescript
case 'goals_debts':
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Financial Goals */}
      <FinancialGoalsWidget ... />
      
      {/* Subscriptions */}
      <SubscriptionModule ... />
      
      {/* Debts with Split Bill */}
      <div className="bg-[#232323] border border-white/5 rounded-2xl p-6">
        <SectionHeader
          title="Utang & Piutang"
          icon={CreditCard}
          action={
            <button onClick={() => setIsDebtModalOpen(true)}>
              <Plus size={18} />
            </button>
          }
        />
        {/* ... debt list with split bill indicator ... */}
      </div>
    </div>
  );
```

#### Tab 5: Analisis Data (analytics) - NEW
```typescript
case 'analytics':
  return (
    <div className="space-y-6">
      {/* Trend Chart */}
      <div className="bg-[#232323] border border-white/5 rounded-2xl p-6">
        <SectionHeader
          title="Trend Kekayaan Bersih"
          icon={LineChartIcon}
          action={
            <button onClick={exportToCSV} className="flex items-center gap-2 text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg">
              <Download size={14} /> Export CSV
            </button>
          }
        />
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => formatCompact(v)} />
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (active && payload?.length) {
                    return (
                      <div className="bg-[#1a1a1a] border border-white/10 p-3 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">{payload[0]?.payload.date}</p>
                        <p className="text-sm font-bold text-white">
                          {formatCurrency(payload[0]?.value as number)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="netWorth"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Income vs Expense Bar Chart */}
      <div className="bg-[#232323] border border-white/5 rounded-2xl p-6">
        <SectionHeader title="Pemasukan vs Pengeluaran" icon={BarChart} />
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="income" fill="#22c55e" name="Pemasukan" />
              <Bar dataKey="expense" fill="#ef4444" name="Pengeluaran" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
```

### C. Update TransactionModal untuk Wallet Support

Tambahkan field wallet selector di form transaksi:

```typescript
// Di dalam TransactionModal
const [selectedWallet, setSelectedWallet] = useState<string>('');

// Tambahkan di form:
<div>
  <label className={labelClass}>Dompet / Akun</label>
  <select
    className={inputClass}
    value={selectedWallet}
    onChange={(e) => setSelectedWallet(e.target.value)}
  >
    <option value="">Pilih Dompet</option>
    {wallets.map(w => (
      <option key={w.id} value={w.id}>{w.name} ({formatCurrency(w.balance)})</option>
    ))}
  </select>
</div>

// Update payload:
const payload = {
  // ... existing fields
  wallet_id: selectedWallet
};
```

---

## 🚀 Cara Menggunakan

### 1. Setup Database
```bash
# Buka Supabase Dashboard → SQL Editor
# Copy-paste isi file: supabase/new-features-schema.sql
# Klik Run
```

### 2. Update .gitignore (Sudah dilakukan ✅)
File `supabase/new-features-schema.sql` sudah di-ignore.

### 3. Jalankan Development Server
```bash
npm run dev
```

### 4. Test Fitur Baru

#### Multi-Wallet:
1. Buka tab "Arus Kas"
2. Klik "+" untuk tambah wallet baru
3. Isi nama, saldo awal, pilih icon dan warna
4. Wallet akan muncul di dashboard dengan saldo

#### Split Bill:
1. Saat tambah transaksi, centang "Split Bill"
2. Masukkan jumlah peserta
3. Nama peserta (opsional)
4. Sistem auto-create piutang untuk setiap peserta

#### Export CSV:
1. Buka tab "Analisis Data"
2. Klik tombol "Export CSV"
3. File akan terdownload otomatis

---

## 📊 Summary

| Fitur | Status | File |
|-------|--------|------|
| Database Schema | ✅ Done | `supabase/new-features-schema.sql` |
| Type Definitions | ✅ Done | `src/app/page.tsx` |
| State Management | ✅ Done | `src/app/page.tsx` |
| Handler Functions | ✅ Done | `src/app/page.tsx` |
| UI Components | ⏳ TODO | `src/app/page.tsx` |
| Tab Content Render | ⏳ TODO | `src/app/page.tsx` |

**Next Steps:**
1. Implement komponen UI (WalletCard, SplitBillModal, WalletModal)
2. Update `renderContent()` untuk semua 5 tab
3. Update TransactionModal dengan wallet selector
4. Test semua fitur end-to-end
