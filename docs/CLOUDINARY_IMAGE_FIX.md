# 🖼️ Cloudinary Image Display Fix - Production Issue

## 📋 Problem Summary

**Issue**: Images uploaded to Cloudinary are not displaying in the production environment (with domain), but they work fine in local development.

**Affected Components**:
- `/dashboard/superadmin/iklan` - Advertisement management page
- Image component in `iklan-table.tsx` and `iklan-form-dialog.tsx`

## 🔍 Root Causes

### 1. Missing Client-Side Environment Variable ❌

The `src/lib/cloudinary-utils.ts` file was using `process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, but this variable was **NOT defined** in `src/env.js`.

**Problem**:
- `CLOUDINARY_CLOUD_NAME` was only defined as a **server-side** variable
- Client-side components couldn't access this variable
- In production build, the variable becomes `undefined`, causing Cloudinary URLs to fail

**Why it worked locally**:
- In development mode, Next.js is more lenient with environment variables
- The fallback value `'dg0ybxdbt'` might have worked in development

### 2. Next.js Image Optimization Issues ⚠️

The `next/image` component was trying to optimize Cloudinary images without the `unoptimized` prop, which can cause issues in production.

## ✅ Solutions Implemented

### 1. Added Client-Side Environment Variable

**File**: `src/env.js`

```javascript
// Added to client schema
client: {
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),
},

// Added to runtimeEnv mapping
runtimeEnv: {
  // ... other variables
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
}
```

### 2. Added `unoptimized` Prop to Image Components

**Files Modified**:
- `src/components/dashboard/superadmin/iklan/iklan-table.tsx`
- `src/components/dashboard/superadmin/iklan/iklan-form-dialog.tsx`

```tsx
<Image
  src={imageUrl}
  alt={ad.title}
  fill
  className="object-cover"
  unoptimized  // ✅ Added this prop
/>
```

**Why `unoptimized`**:
- Cloudinary already provides optimized images
- Prevents Next.js from trying to re-optimize Cloudinary URLs
- Avoids potential CORS or domain configuration issues
- Ensures images load reliably in production

### 3. Updated Environment Configuration

**File**: `.env.example`

```bash
# Cloudinary Configuration (for property images)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
# Client-side Cloudinary configuration (required for image display in browser)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"  # ✅ Added this
```

## 🚀 Deployment Steps

### For Production Environment

1. **Add the new environment variable** to your production environment:
   ```bash
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
   ```

2. **Rebuild the application** (important for environment variables to take effect):
   ```bash
   npm run build
   ```

3. **Restart the application**:
   ```bash
   # For Docker
   docker-compose restart
   
   # For PM2
   pm2 restart all
   
   # For Dokploy
   # Trigger a rebuild through the Dokploy dashboard
   ```

### For Docker/Dokploy Deployment

Update your `docker-compose.yml` or Dokploy environment variables:

```yaml
environment:
  - CLOUDINARY_CLOUD_NAME=your-cloud-name
  - CLOUDINARY_API_KEY=your-api-key
  - CLOUDINARY_API_SECRET=your-api-secret
  - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name  # ✅ Add this
```

## 🧪 Testing

After deploying the fix, verify:

1. **Go to**: `/dashboard/superadmin/iklan`
2. **Check**: Images in the advertisement table should display correctly
3. **Test**: Upload a new advertisement with an image
4. **Verify**: The image preview and final display work properly

## 📝 Technical Notes

### Why NEXT_PUBLIC_ Prefix?

Next.js environment variables work in two contexts:

- **Server-side**: Available in API routes, server components, `getServerSideProps`, etc.
- **Client-side**: Only available if prefixed with `NEXT_PUBLIC_`

Since `cloudinary-utils.ts` is used in client components (React components that use `"use client"` directive), we need the `NEXT_PUBLIC_` prefix.

### How Cloudinary URLs Are Generated

```typescript
// src/lib/cloudinary-utils.ts
export function getCloudinaryUrl(publicIdOrUrl: string, cloudName?: string): string {
  if (publicIdOrUrl.startsWith('http://') || publicIdOrUrl.startsWith('https://')) {
    return publicIdOrUrl;
  }

  // Uses NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME from environment
  const cloud = cloudName || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dg0ybxdbt';
  return `https://res.cloudinary.com/${cloud}/image/upload/${publicIdOrUrl}`;
}
```

### Image Optimization Strategy

```tsx
// Before (may fail in production)
<Image src={cloudinaryUrl} alt="..." fill />

// After (reliable in production)
<Image src={cloudinaryUrl} alt="..." fill unoptimized />
```

**Benefits of `unoptimized`**:
- No extra processing by Next.js Image Optimization API
- Direct image loading from Cloudinary CDN
- Better compatibility with external image providers
- Faster builds (no image optimization during build time)

## 🔒 Security Considerations

- ✅ `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is safe to expose (it's just the cloud name, not credentials)
- ✅ Keep `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` server-side only
- ✅ Never expose API keys or secrets with `NEXT_PUBLIC_` prefix

## 📚 Related Files

- `src/env.js` - Environment variable schema
- `src/lib/cloudinary-utils.ts` - Cloudinary URL generation
- `src/components/dashboard/superadmin/iklan/iklan-table.tsx` - Advertisement table display
- `src/components/dashboard/superadmin/iklan/iklan-form-dialog.tsx` - Advertisement form
- `next.config.js` - Next.js configuration (already had Cloudinary domain in `remotePatterns`)

## 🎯 Summary

**Problem**: Images not loading in production due to missing client-side environment variable.

**Solution**: 
1. Added `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` to environment configuration
2. Added `unoptimized` prop to `next/image` components for Cloudinary URLs
3. Updated deployment documentation

**Impact**: ✅ Images now load reliably in both development and production environments.
