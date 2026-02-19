# Setup Auto-Update Harga Saham

Panduan ini menjelaskan cara mengaktifkan auto-update harga saham menggunakan Supabase Cron dan Realtime.

## 📋 Prerequisites

1. Supabase project dengan **pg_cron** dan **pg_net** enabled
2. Edge Function `update-prices` sudah di-deploy
3. Service Role Key dari Supabase Dashboard

## 🚀 Langkah Setup

### 1. Enable pg_cron dan pg_net

Di **Supabase Dashboard** > **SQL Editor**, jalankan:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

> ⚠️ **Catatan**: pg_cron hanya tersedia di **Supabase Pro Plan** ($25/bulan). Jika menggunakan Free Plan, Anda perlu alternatif lain (lihat bagian "Alternatif Tanpa pg_cron").

### 2. Konfigurasi Cron Schedule

1. Buka file `supabase/update-prices-cron.sql`
2. Ganti nilai berikut:
   - `YOUR_PROJECT_ID` → Project ID Anda (contoh: `abcdefghijk` dari `https://abcdefghijk.supabase.co`)
   - `YOUR_SERVICE_ROLE_KEY` → Service Role Key dari **Settings** > **API**

3. Copy semua isi file dan jalankan di **SQL Editor**

### 3. Verifikasi Schedule

Jalankan query ini untuk melihat semua job yang terjadwal:

```sql
SELECT jobname, schedule FROM cron.job;
```

Anda akan melihat 6 job:
- `update-prices-mon-thu-morning` - Senin-Kamis 09:00-12:00 WIB
- `update-prices-mon-thu-afternoon-1` - Senin-Kamis 13:30-14:00 WIB
- `update-prices-mon-thu-afternoon-2` - Senin-Kamis 14:00-16:30 WIB
- `update-prices-fri-morning` - Jumat 09:00-11:30 WIB
- `update-prices-fri-morning-last` - Jumat 11:00-11:30 WIB
- `update-prices-fri-afternoon` - Jumat 14:00-16:30 WIB

### 4. Enable Realtime di Frontend

Realtime sudah ditambahkan di `src/app/page.tsx`. Tidak ada konfigurasi tambahan yang diperlukan.

Untuk memverifikasi realtime berjalan:
1. Buka aplikasi di browser
2. Login dengan user Anda
3. Buka **Developer Console** (F12)
4. Jalankan Edge Function secara manual atau tunggu cron berjalan
5. Anda akan melihat log: `🔄 Realtime asset update: ...`

## 🕒 Jadwal Update

Edge Function akan dipanggil **setiap 1 menit** selama jam bursa IDX:

| Hari | Sesi Pagi (WIB) | Sesi Siang (WIB) |
|------|----------------|-----------------|
| Senin-Kamis | 09:00 - 12:00 | 13:30 - 16:30 |
| Jumat | 09:00 - 11:30 | 14:00 - 16:30 |

Di luar jam ini, function akan skip update (karena market closed).

**Catatan:** Edge Function memiliki pengecekan `isMarketOpen()` yang akan skip update jika market sedang tutup, meskipun cron dijalankan setiap menit.

## 📊 Monitoring

### Cek History Eksekusi

```sql
SELECT jobname, run_start, run_end, status 
FROM cron.job_run_details 
ORDER BY run_start DESC 
LIMIT 20;
```

### Cek Log Edge Function

Di **Supabase Dashboard** > **Edge Functions** > `update-prices` > **Logs**

## 🔧 Troubleshooting

### Cron tidak jalan

1. Pastikan pg_cron sudah enabled
2. Cek apakah project Anda menggunakan **Pro Plan**
3. Verifikasi job ada dengan: `SELECT * FROM cron.job;`

### Harga tidak update

1. Cek log Edge Function untuk error
2. Pastikan environment variables `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` sudah diset
3. Verifikasi tabel `assets` memiliki kolom `user_id`

### Realtime tidak connect

1. Pastikan RLS (Row Level Security) sudah dikonfigurasi dengan benar
2. Cek console browser untuk error connection
3. Verifikasi user sedang login

## 🔄 Alternatif Tanpa pg_cron (Free Plan)

Jika menggunakan **Supabase Free Plan**, Anda bisa menggunakan layanan eksternal:

### Opsi 1: GitHub Actions

Buat file `.github/workflows/update-prices.yml`:

```yaml
name: Update Prices

on:
  schedule:
    # Senin-Kamis 02:00-09:30 UTC (setiap 1 menit)
    - cron: '* 2-4 * * 1-4'
    - cron: '* 6-9 * * 1-4'
    # Jumat 02:00-09:30 UTC (setiap 1 menit)
    - cron: '* 2-4 * * 5'
    - cron: '* 7-9 * * 5'

jobs:
  update-prices:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Edge Function
        run: |
          curl -X POST 'https://${{ secrets.SUPABASE_PROJECT_ID }}.supabase.co/functions/v1/update-prices' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}' \
            -H 'Content-Type: application/json'
```

⚠️ **Catatan:** GitHub Actions minimum interval adalah 1 menit. Namun untuk Free Plan, GitHub membatasi jumlah executions. Pertimbangkan untuk menggunakan interval 5-15 menit jika limit tercapai.

### Opsi 2: Cron Service Eksternal

Gunakan layanan seperti:
- [Cron-job.org](https://cron-job.org) (gratis)
- [EasyCron](https://easycron.com) (gratis)
- [UptimeRobot](https://uptimerobot.com) (gratis)

Setel untuk memanggil:
```
POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/update-prices
Authorization: Bearer YOUR_SERVICE_ROLE_KEY
```

## 📝 Notes

- Edge Function sudah dikonfigurasi untuk **skip update** jika market sedang tutup
- Realtime akan otomatis sync perubahan harga ke semua client yang connected
- Setiap user hanya melihat update untuk assets mereka sendiri (filter by `user_id`)
