# 🚀 Setup Environment Variables di Vercel

## Domain Anda: `myhome-mocha-five.vercel.app`

### **Step 1: Buka Vercel Dashboard**
1. Go to: https://vercel.com/dashboard
2. Pilih project `myhome`
3. Klik **Settings** tab
4. Klik **Environment Variables** di sidebar

### **Step 2: Tambahkan Environment Variables**

Tambahkan variables berikut **SATU PER SATU**:

#### **AUTH_SECRET** (REQUIRED)
```
Name: AUTH_SECRET
Value: [Generate dengan command di bawah]
Environment: Production, Preview, Development
```

**Generate AUTH_SECRET:**
```bash
# Jalankan di terminal lokal:
npx auth secret

# Atau gunakan:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### **NEXTAUTH_URL** (REQUIRED untuk Production)
```
Name: NEXTAUTH_URL
Value: https://myhome-mocha-five.vercel.app
Environment: Production, Preview
```

#### **DATABASE_URL** (REQUIRED)
```
Name: DATABASE_URL
Value: [Your PostgreSQL connection string]
Environment: Production, Preview, Development
```

#### **NODE_ENV** (REQUIRED)
```
Name: NODE_ENV
Value: production
Environment: Production
```

### **Step 3: Redeploy Project**

Setelah menambahkan environment variables:

1. Go to **Deployments** tab
2. Klik **...** pada deployment terbaru
3. Klik **Redeploy**
4. Atau push commit baru ke GitHub

### **Step 4: Test Deployment**

Setelah deployment selesai:

1. **Health Check**: https://myhome-mocha-five.vercel.app/api/health
2. **Auth Test**: https://myhome-mocha-five.vercel.app/api/auth/providers
3. **Login Test**: https://myhome-mocha-five.vercel.app/login

### **Step 5: Debug Login Issues**

Jika masih ada masalah login:

1. **Buka Browser Console** saat login
2. **Check Network Tab** untuk melihat request yang gagal
3. **Visit Health Check** untuk melihat status sistem
4. **Check Vercel Function Logs** di dashboard

### **Expected Health Check Response:**
```json
{
  "status": "OK",
  "checks": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "environment": "production",
    "deployment": "OK",
    "database": "OK",
    "auth_secret": "OK",
    "nextauth_url": "OK",
    "api_routes": {
      "auth_providers": "OK",
      "auth_signin": "OK",
      "auth_callback": "OK"
    }
  }
}
```

### **Common Issues & Solutions:**

#### **Issue: 404 on /api/auth/***
- ❌ Missing `AUTH_SECRET`
- ❌ Wrong `NEXTAUTH_URL`
- ✅ **Solution**: Set correct environment variables

#### **Issue: Login berhasil tapi tidak redirect**
- ❌ Session tidak tersimpan
- ❌ Middleware tidak mendeteksi role
- ✅ **Solution**: Check browser console untuk error

#### **Issue: Database connection error**
- ❌ Wrong `DATABASE_URL`
- ❌ Database tidak accessible dari Vercel
- ✅ **Solution**: Verify database connection string

### **Vercel CLI Commands (Optional):**

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variables via CLI
vercel env add AUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add DATABASE_URL

# Deploy
vercel --prod
```
