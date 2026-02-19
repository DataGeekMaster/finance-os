# 🚀 Panduan Deploy ke Production

## 📦 Files yang DI-IGNORE (Tidak Diupload)

File `.gitignore` sudah dikonfigurasi untuk **TIDAK upload** file-file berikut:

### 🔒 CRITICAL - JANGAN PERNAH UPLOAD!
```
✅ .env.local              → Environment variables lokal
✅ .env                    → Environment variables (jika ada)
✅ supabase/functions/**/.env → Function secrets
✅ node_modules/           → Dependencies (otomatis install saat deploy)
✅ .next/                  → Build output (digenerate saat build)
```

### 🗄️ Database Files (OPTIONAL)
```
⚠️ supabase/new-features-schema.sql  → Jalankan manual di Supabase
⚠️ supabase/update-prices-cron.sql   → Jalankan manual di Supabase
⚠️ supabase/create-user-profiles.sql → Jalankan manual di Supabase
```

**Kenapa?** File SQL ini berisi credentials dan sebaiknya dijalankan manual via Supabase Dashboard SQL Editor.

---

## ✅ Files yang HARUS Diupload

```
✅ src/                          → Semua code React/Next.js
✅ public/                       → Static assets
✅ package.json                  → Dependencies list
✅ package-lock.json             → Locked dependencies versions
✅ next.config.ts                → Next.js configuration
✅ tsconfig.json                 → TypeScript configuration
✅ tailwind.config.ts            → Tailwind CSS configuration
✅ postcss.config.mjs            → PostCSS configuration
✅ eslint.config.mjs             → ESLint configuration
✅ README.md                     → Documentation
✅ IMPLEMENTATION_GUIDE.md       → Implementation guide
✅ DEPLOYMENT.md                 → Deployment guide
✅ .gitignore                    → Ini file!
✅ supabase/config.toml          → Supabase configuration
✅ supabase/functions/           → Edge Functions code (TANPA .env)
```

---

## 🛠️ Langkah Deploy

### 1. **Setup GitHub Repository**

```bash
# Initialize git (jika belum)
git init

# Add semua files (kecuali yang di .gitignore)
git add .

# Commit pertama
git commit -m "Initial commit - FinanceOS"

# Buat repository di GitHub, lalu:
git remote add origin https://github.com/YOUR_USERNAME/financeos.git
git branch -M main
git push -u origin main
```

---

### 2. **Deploy Frontend (Next.js)**

#### **Opsi A: Vercel (Recommended - Paling Mudah)**

1. **Buka** https://vercel.com/new
2. **Import** repository GitHub Anda
3. **Configure Project**:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (default)
4. **Environment Variables** (WAJIB!):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://qjlmhnymghnntvnujwpk.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NEXT_PUBLIC_GROQ_API_KEY=gsk_...
   ```
5. **Deploy!**

**Auto Deploy**: Setiap push ke `main` branch akan auto-deploy.

---

#### **Opsi B: Railway**

1. **Buka** https://railway.app/
2. **New Project** → **Deploy from GitHub**
3. **Select** repository Anda
4. **Add Variables** (sama seperti Vercel)
5. **Deploy**

---

#### **Opsi C: Manual VPS/Docker**

```bash
# Build
npm run build

# Start production server
npm run start
```

Atau pakai Docker:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

### 3. **Deploy Edge Functions (Supabase)**

```bash
# Login ke Supabase
supabase login

# Link project
supabase link --project-ref qjlmhnymghnntvnujwpk

# Deploy function
supabase functions deploy update-prices

# Set secrets (WAJIB!)
supabase secrets set SUPABASE_URL=https://qjlmhnymghnntvnujwpk.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 4. **Setup Database**

Jalankan SQL files manual di **Supabase Dashboard → SQL Editor**:

#### **Tabel Utama (Wajib)**
1. **Copy** isi `supabase/new-features-schema.sql`
2. **Paste** di SQL Editor
3. **Run**

#### **Tabel User Profiles (Baru - Untuk AI Personalization)**
1. **Copy** isi `supabase/create-user-profiles.sql`
2. **Paste** di SQL Editor
3. **Run**

#### **Cron Job (Optional - Auto-Update Prices)**
1. **Copy** isi `supabase/update-prices-cron.sql`
2. **Paste** di SQL Editor
3. **Run**

---

## 🔐 Environment Variables

### **Frontend (Vercel/Railway)**
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
NEXT_PUBLIC_GROQ_API_KEY=YOUR_GROQ_KEY
```

### **Edge Functions (Supabase Secrets)**
```env
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

**⚠️ PENTING**: Jangan pernah commit file `.env` ke GitHub!

---

## 📊 Monitoring & Logs

### **Vercel Logs**
```bash
vercel logs YOUR_DEPLOYMENT_URL
```

Atau via Dashboard: **Vercel → Project → Deployments → Logs**

### **Supabase Function Logs**
```bash
supabase functions logs update-prices --follow
```

Atau via Dashboard: **Edge Functions → update-prices → Logs**

---

## ✅ Checklist Pre-Deploy

```
✅ Test lokal: npm run dev (tidak ada error)
✅ Build test: npm run build (sukses)
✅ .env.local TIDAK tercommit (cek .gitignore)
✅ Supabase project sudah setup
✅ Database schema sudah dijalankan (termasuk user_profiles)
✅ Edge functions sudah deploy
✅ Environment variables sudah diset di Vercel
✅ README.md sudah update dengan instruksi
```

---

## 🎯 Post-Deploy Checklist

```
✅ Test production URL (buka di browser)
✅ Test login/signup (Supabase Auth)
✅ Test CRUD operations (transaksi, assets, dll)
✅ Test Edge Function (manual invoke)
✅ Check logs (tidak ada error)
✅ Setup custom domain (optional)
✅ Enable HTTPS (automatic di Vercel)
```

---

## 🔧 Troubleshooting

### **Build Failed**
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### **Environment Variables Not Working**
- Restart deployment
- Check variable names (harus exact match)
- Frontend vars pakai prefix `NEXT_PUBLIC_`

### **Edge Function 401/403**
- Check secrets di Supabase
- Check RLS policies di database
- Check CORS settings

### **Error "malformed array literal" pada notes**
- Pastikan tabel `user_profiles` sudah dibuat dengan `notes` bertipe TEXT
- Jalankan ulang `supabase/create-user-profiles.sql`

---

## 📞 Support

Jika ada masalah:
1. Check logs (Vercel/Supabase)
2. Test lokal dulu
3. Search error di GitHub Issues
4. Tanya di Discord/Forum

**Happy Deploying! 🚀**
