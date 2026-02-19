| Nama Tabel    | Isi Kolom & Tipe Data                                                                                                                                                                                                                                                                                                                                 | Relasi (Foreign Keys)                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| assets        | id (uuid), updated_at (timestamp with time zone), user_id (uuid), created_at (timestamp with time zone), logo_url (text), current_price (numeric), class (USER-DEFINED), name (text), ticker (text)                                                                                                                                                   | Tidak ada relasi (Berdiri sendiri)                        |
| debts         | id (uuid), name (text), total_amount (numeric), paid_amount (numeric), type (USER-DEFINED), due_date (date), created_at (timestamp with time zone), user_id (uuid)                                                                                                                                                                                    | Tidak ada relasi (Berdiri sendiri)                        |
| goals         | id (uuid), user_id (uuid), due_date (date), emoji (text), current_amount (numeric), target_amount (numeric), name (text), created_at (timestamp with time zone)                                                                                                                                                                                       | Tidak ada relasi (Berdiri sendiri)                        |
| subscriptions | user_id (uuid), id (uuid), name (text), cost (numeric), billing_cycle (text), next_payment_date (date), category (text), is_active (boolean), created_at (timestamp with time zone)                                                                                                                                                                   | Tidak ada relasi (Berdiri sendiri)                        |
| trades        | quantity (numeric), id (uuid), asset_id (uuid), type (text), price (numeric), fee (numeric), date (date), created_at (timestamp with time zone), user_id (uuid)                                                                                                                                                                                       | asset_id ➔ assets(id), asset_id ➔ assets(id)              |
| transactions  | reference_id (uuid), date (date), financial_tag (USER-DEFINED), category (text), type (USER-DEFINED), amount (numeric), title (text), id (uuid), created_at (timestamp with time zone), user_id (uuid), wallet_id (uuid), split_from_id (uuid), is_split (boolean), split_total_amount (numeric), split_participants (integer), reference_type (text) | wallet_id ➔ wallets(id), split_from_id ➔ transactions(id) |
| user_profiles | created_at (timestamp with time zone), id (uuid), user_id (uuid), occupation (text), occupation_label (text), monthly_income (numeric), has_debt (boolean), financial_goals (text), risk_profile (text), notes (text), updated_at (timestamp with time zone)                                                                                          | Tidak ada relasi (Berdiri sendiri)                        |
| user_settings | user_id (uuid), needs_pct (numeric), wants_pct (numeric), savings_pct (numeric), liabilities_pct (numeric), created_at (timestamp with time zone), updated_at (timestamp with time zone)                                                                                                                                                              | Tidak ada relasi (Berdiri sendiri)                        |
| wallets       | created_at (timestamp with time zone), is_active (boolean), color (text), icon (text), id (uuid), balance (numeric), name (text), user_id (uuid), updated_at (timestamp with time zone)                                                                                                                                                               | Tidak ada relasi (Berdiri sendiri)                        |

## 📝 Detail Tabel

### `transactions`
Tabel utama untuk mencatat semua pemasukan dan pengeluaran keuangan.

**Kolom:**
- `id` - UUID primary key
- `user_id` - Reference ke auth.users
- `title` - Judul/nama transaksi
- `amount` - Nominal transaksi (IDR)
- `date` - Tanggal transaksi
- `type` - Tipe transaksi: `income` (pemasukan) atau `expense` (pengeluaran)
- `category` - Kategori transaksi (contoh: "Makanan", "Gaji", "Transportasi")
- `financial_tag` - Tag keuangan: `needs`, `wants`, `savings`, `liabilities`
- `wallet_id` - Reference ke wallets (untuk multi-wallet system)
- `is_split` - Boolean, apakah ini transaksi split bill
- `split_from_id` - Reference ke transaksi induk (jika split)
- `split_total_amount` - Total amount transaksi split
- `split_participants` - Jumlah peserta split
- `reference_id` - ID referensi untuk relasi dengan tabel lain
- `reference_type` - Tipe referensi (contoh: "debt", "subscription")
- `created_at` - Timestamp pembuatan

**RLS Policies:**
- Users can only view/modify their own transactions

---

### `wallets`
Tabel untuk sistem multi-wallet (mengelola beberapa dompet/akun sekaligus).

**Kolom:**
- `id` - UUID primary key
- `user_id` - Reference ke auth.users
- `name` - Nama wallet (contoh: "BCA", "GoPay", "Cash")
- `balance` - Saldo saat ini (IDR)
- `icon` - Emoji/icon wallet (contoh: "💳", "🏦", "📱")
- `color` - Warna wallet (hex code, contoh: "#3b82f6")
- `is_active` - Boolean, apakah wallet aktif
- `created_at` - Timestamp pembuatan
- `updated_at` - Timestamp update terakhir

**Trigger:**
- Auto-update balance saat INSERT/UPDATE/DELETE transaksi

**RLS Policies:**
- Users can only view/modify their own wallets

---

### `assets`
Tabel untuk menyimpan daftar aset investasi (saham, crypto, emas, dll).

**Kolom:**
- `id` - UUID primary key
- `user_id` - Reference ke auth.users
- `ticker` - Kode ticker (contoh: "BBCA", "BTC", "GOLD")
- `name` - Nama lengkap aset
- `class` - Kelas aset: `stock`, `crypto`, `gold`, `cash`, `bond`
- `current_price` - Harga pasar saat ini (IDR)
- `logo_url` - URL logo aset (optional)
- `created_at` - Timestamp pembuatan
- `updated_at` - Timestamp update terakhir

**RLS Policies:**
- Users can only view/modify their own assets

---

### `trades`
Tabel untuk mencatat riwayat transaksi jual/beli aset investasi.

**Kolom:**
- `id` - UUID primary key
- `user_id` - Reference ke auth.users
- `asset_id` - Reference ke assets
- `type` - Tipe trade: `BUY` atau `SELL`
- `quantity` - Jumlah aset yang ditradingkan
- `price` - Harga per unit saat trade (IDR)
- `fee` - Fee transaksi (IDR)
- `date` - Tanggal trade
- `created_at` - Timestamp pembuatan

**RLS Policies:**
- Users can only view/modify their own trades

---

### `goals`
Tabel untuk menabung demi tujuan keuangan tertentu (sinking funds).

**Kolom:**
- `id` - UUID primary key
- `user_id` - Reference ke auth.users
- `name` - Nama tujuan (contoh: "Liburan ke Jepang", "MacBook Pro")
- `target_amount` - Target tabungan (IDR)
- `current_amount` - Jumlah tabungan saat ini (IDR)
- `emoji` - Emoji/icon tujuan (contoh: "🌸", "💻")
- `due_date` - Tanggal target (optional)
- `created_at` - Timestamp pembuatan

**RLS Policies:**
- Users can only view/modify their own goals

---

### `debts`
Tabel untuk mengelola utang (payable) dan piutang (receivable).

**Kolom:**
- `id` - UUID primary key
- `user_id` - Reference ke auth.users
- `name` - Nama utang/piutang (contoh: "Pinjaman Bank", "Piutang Teman")
- `total_amount` - Total nominal utang (IDR)
- `paid_amount` - Jumlah yang sudah dibayar (IDR)
- `type` - Tipe: `payable` (utang) atau `receivable` (piutang)
- `due_date` - Tanggal jatuh tempo
- `notes` - Catatan tambahan (optional)
- `created_at` - Timestamp pembuatan

**RLS Policies:**
- Users can only view/modify their own debts

---

### `subscriptions`
Tabel untuk melacak langganan berulang (Netflix, Spotify, dll).

**Kolom:**
- `id` - UUID primary key
- `user_id` - Reference ke auth.users
- `name` - Nama langganan (contoh: "Netflix Premium")
- `cost` - Biaya langganan (IDR)
- `billing_cycle` - Siklus pembayaran: `monthly` atau `yearly`
- `next_payment_date` - Tanggal pembayaran berikutnya
- `category` - Kategori langganan (contoh: "Hiburan", "Software")
- `is_active` - Boolean, apakah langganan aktif
- `created_at` - Timestamp pembuatan

**RLS Policies:**
- Users can only view/modify their own subscriptions

---

### `user_profiles`
Tabel untuk menyimpan profil keuangan pengguna guna personalisasi AI Financial Advisor.

**Kolom:**
- `id` - UUID primary key
- `user_id` - Reference ke auth.users (UNIQUE)
- `occupation` - Pekerjaan: `student`, `employee`, `entrepreneur`, `freelancer`, `other`
- `occupation_label` - Label custom (contoh: "Mahasiswa Semester 5", "Karyawan IT")
- `monthly_income` - Penghasilan bulanan dalam IDR
- `has_debt` - Boolean, apakah punya utang
- `financial_goals` - String tujuan keuangan (contoh: "Dana darurat, Beli rumah")
- `risk_profile` - Profil risiko investasi:
  - `not_started` - Belum mulai investasi
  - `conservative` - Konservatif (aman, return kecil)
  - `moderate` - Moderat (seimbang)
  - `aggressive` - Agresif (berani rugi, return tinggi)
- `notes` - Catatan tambahan untuk AI (TEXT)
- `created_at` - Timestamp pembuatan
- `updated_at` - Timestamp update terakhir

**Trigger:**
- Auto-update `updated_at` saat ada perubahan

**RLS Policies:**
- Users can view own profile
- Users can insert own profile
- Users can update own profile

---

### `user_settings`
Tabel untuk menyimpan pengaturan persentase alokasi keuangan (Waterfall Method).

**Kolom:**
- `user_id` - UUID primary key (reference ke auth.users)
- `needs_pct` - Persentase untuk Needs (default: 50%)
- `wants_pct` - Persentase untuk Wants (default: 30%)
- `savings_pct` - Persentase untuk Savings (default: 20%)
- `liabilities_pct` - Persentase untuk Liabilities (default: 0%)
- `created_at` - Timestamp pembuatan
- `updated_at` - Timestamp update terakhir

**Default Allocation (50/30/20/0 Rule):**
- Needs: 50% (kebutuhan pokok)
- Wants: 30% (keinginan)
- Savings: 20% (tabungan/investasi)
- Liabilities: 0% (utang)

**RLS Policies:**
- Users can only view/modify their own settings
