# Fix: Gambar Tidak Tampil di Production

## Problem
Gambar carousel iklan tampil normal di development tapi tidak tampil di production (deployed).

**Error yang muncul:**
```
GET https://myhome.co.id/_next/image?url=https%3A%2F%2Fres.cloudinary.com%2F...&w=828&q=75 400 (Bad Request)
```

## Root Cause Analysis
1. **Next.js Image Optimization API Error**: Next.js mencoba mengoptimasi gambar dari Cloudinary melalui `/_next/image` API yang gagal dengan error 400
2. **Image Loader**: Next.js default image loader tidak kompatibel dengan deployment standalone untuk external images
3. **Solution**: Menggunakan custom Cloudinary loader untuk bypass Next.js Image Optimization API

## ✅ Solution Implemented (RECOMMENDED)

### Custom Cloudinary Loader
Saya telah mengimplementasikan custom loader yang langsung menggunakan Cloudinary transformation API, tanpa melalui Next.js Image Optimization.

**File yang sudah diupdate:**
1. `next.config.js` - Menambahkan custom loader configuration
2. `src/lib/cloudinary-loader.ts` - Custom loader implementation

**Cara deploy:**
```bash
# 1. Build aplikasi
npm run build

# 2. Test di local production mode
npm start

# 3. Deploy ke production server
# Upload folder .next, public, dan file-file yang diperlukan
```

## Alternative Solutions (Jika masih bermasalah)

### Solusi 1: Disable Image Optimization (Quick Fix)
Tambahkan environment variable di production:
```bash
NEXT_PUBLIC_DISABLE_IMAGE_OPTIMIZATION=true
```

Kemudian rebuild aplikasi:
```bash
npm run build
```

### Solusi 2: Gunakan Cloudinary Loader (Recommended)
Update file `next.config.js` untuk menggunakan Cloudinary loader:

```javascript
images: {
  loader: 'custom',
  loaderFile: './src/lib/cloudinary-loader.ts',
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'res.cloudinary.com',
      port: '',
      pathname: '/**',
    },
  ],
}
```

Buat file `src/lib/cloudinary-loader.ts`:
```typescript
export default function cloudinaryLoader({ src, width, quality }: {
  src: string;
  width: number;
  quality?: number;
}) {
  // If already a full URL from Cloudinary, return as is
  if (src.startsWith('https://res.cloudinary.com')) {
    return src;
  }

  // Otherwise construct Cloudinary URL
  const params = ['f_auto', 'c_limit', `w_${width}`, `q_${quality || 'auto'}`];
  return `https://res.cloudinary.com/dg0ybxdbt/image/upload/${params.join(',')}/${src}`;
}
```

### Solusi 3: Update Docker/Deployment Configuration
Jika menggunakan Docker, pastikan Next.js server berjalan dengan benar:

**Dockerfile:**
```dockerfile
# Make sure to expose port 3000
EXPOSE 3000

# Use correct CMD to start Next.js
CMD ["node", "server.js"]
```

**docker-compose.yml:**
```yaml
environment:
  - NODE_ENV=production
  - CLOUDINARY_CLOUD_NAME=dg0ybxdbt
  - CLOUDINARY_API_KEY=836543447587342
  - CLOUDINARY_API_SECRET=joI9lZdqjlWNyCEnJ5gh0ugYuzQ
```

### Solusi 4: Verifikasi Environment Variables
Pastikan semua environment variables sudah terset di production:

```bash
# Check di server production
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY
echo $CLOUDINARY_API_SECRET
```

Atau tambahkan di file `.env.production`:
```env
CLOUDINARY_CLOUD_NAME=dg0ybxdbt
CLOUDINARY_API_KEY=836543447587342
CLOUDINARY_API_SECRET=joI9lZdqjlWNyCEnJ5gh0ugYuzQ
```

## Testing

1. **Development:**
```bash
npm run dev
# Buka http://localhost:3000
# Verifikasi gambar tampil
```

2. **Production Build:**
```bash
npm run build
npm start
# Buka http://localhost:3000
# Verifikasi gambar tampil
```

3. **Check Network Tab:**
- Buka DevTools (F12)
- Tab Network
- Reload halaman
- Cari request image dari Cloudinary
- Check status code (harus 200, bukan 404/403)

## Debug Commands

```bash
# Check image URLs di database
npx prisma studio
# Buka table Advertisement, check kolom imageUrl

# Check logs di production
docker logs <container-name> --tail 100

# Test API endpoint
curl https://myhome.co.id/api/public/iklan
```

## Expected Result

Gambar carousel iklan harus tampil dengan URL seperti:
```
https://res.cloudinary.com/dg0ybxdbt/image/upload/v1234567890/advertisements/abc123.jpg
```

## Additional Notes

1. Semua upload gambar sudah menggunakan preset `ml_default`
2. Image component menggunakan Next.js `<Image>` untuk optimization
3. Cloudinary configuration sudah benar di `src/lib/cloudinary.ts`

## Contacts
Jika masalah masih berlanjut, check:
1. Browser console untuk error messages
2. Server logs untuk error pada image optimization
3. Network tab untuk failed requests
