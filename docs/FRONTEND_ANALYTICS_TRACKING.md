# Frontend Analytics Tracking

Dokumentasi implementasi frontend tracking otomatis untuk sistem analytics website.

## 📋 Overview

Sistem analytics tracking otomatis yang menangkap data visitors ketika seseorang mengakses website. Data yang dikumpulkan meliputi:

- **Page Views**: URL, title, referrer
- **Device Info**: Device type, browser, operating system  
- **Session Data**: Session ID, visitor ID, time spent
- **User Behavior**: Route changes, page interactions

## 🏗️ Arsitektur

### 1. **Utilities** (`src/lib/analytics-utils.ts`)
```typescript
// Generate unique session ID
generateSessionId(): string

// Detect device information
getDeviceInfo(): DeviceInfo

// Get current page information  
getPageInfo(): PageInfo

// Send tracking data to API
sendTrackingData(data: TrackingData): Promise<boolean>

// Track page view automatically
trackPageView(timeSpent?: number): Promise<boolean>
```

### 2. **Hook** (`src/hooks/use-page-tracking.ts`)
```typescript
// Main tracking hook
usePageTracking(options?: UsePageTrackingOptions)

// Simplified hooks
useBasicPageTracking()
useAdvancedPageTracking()
```

### 3. **Components** (`src/components/analytics/`)
```typescript
// Main tracker component
<AnalyticsTracker />

// Preset configurations
<BasicAnalyticsTracker />
<AdvancedAnalyticsTracker />
<ConditionalAnalyticsTracker />

// Manual testing
<ManualTracker />
```

## 🚀 Quick Start

### 1. **Automatic Integration**
Analytics tracking sudah terintegrasi otomatis di `src/app/layout.tsx`:

```tsx
import { ConditionalAnalyticsTracker } from "@/components/analytics/analytics-tracker";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>
          <ConditionalAnalyticsTracker 
            debug={process.env.NODE_ENV === 'development'}
            enableInDevelopment={true}
          />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

### 2. **Manual Usage**
```tsx
import { usePageTracking } from '@/hooks/use-page-tracking';

function MyComponent() {
  const tracking = usePageTracking({
    trackRouteChanges: true,
    trackTimeSpent: true,
    debounceDelay: 1000,
  });

  // Manual tracking
  const handleCustomEvent = () => {
    tracking.trackPage();
  };

  return <button onClick={handleCustomEvent}>Track Event</button>;
}
```

## ⚙️ Configuration Options

### **UsePageTrackingOptions**
```typescript
interface UsePageTrackingOptions {
  trackRouteChanges?: boolean;     // Default: true
  trackTimeSpent?: boolean;        // Default: false  
  debounceDelay?: number;          // Default: 1000ms
  trackVisibilityChanges?: boolean; // Default: false
}
```

### **Preset Configurations**

#### **Basic Tracking** (Recommended)
```tsx
<BasicAnalyticsTracker debug={false} />
```
- ✅ Route changes
- ❌ Time tracking
- ❌ Visibility changes

#### **Advanced Tracking**
```tsx
<AdvancedAnalyticsTracker debug={false} />
```
- ✅ Route changes
- ✅ Time tracking  
- ✅ Visibility changes

#### **Conditional Tracking**
```tsx
<ConditionalAnalyticsTracker 
  debug={false}
  enableInDevelopment={true}
/>
```
- ✅ Production: Always enabled
- ⚙️ Development: Configurable

## 📊 Data Collection

### **Automatic Data**
```typescript
{
  sessionId: "1234567890_abcdef",     // Unique per browser session
  page: "/dashboard/superadmin",       // Current page URL
  title: "Superadmin Dashboard",       // Page title
  referrer: "https://google.com",      // Previous page/site
  timeSpent: 45                        // Seconds on page (optional)
}
```

### **Device Detection**
```typescript
{
  device: "desktop" | "mobile" | "tablet",
  browser: "Chrome" | "Firefox" | "Safari" | "Edge" | "Opera" | "Other",
  os: "Windows" | "macOS" | "Linux" | "Android" | "iOS" | "Other"
}
```

### **Session Management**
- **Session ID**: Stored in `sessionStorage`, unique per browser session
- **Visitor ID**: Stored in `localStorage`, persistent across sessions
- **IP Address**: Automatically captured server-side
- **User Agent**: Automatically captured server-side

## 🔧 API Integration

### **Endpoint**
```
POST /api/analytics/track
Content-Type: application/json
```

### **Request Body**
```json
{
  "sessionId": "1234567890_abcdef",
  "page": "/dashboard/superadmin", 
  "title": "Superadmin Dashboard",
  "referrer": "https://google.com",
  "timeSpent": 45
}
```

### **Response**
```json
{
  "success": true
}
```

## 🧪 Testing

### **Test Page**
Akses `/test-analytics` untuk testing manual dan debugging:

- Manual tracking controls
- Real-time device info display
- Current page information
- Tracking status monitoring

### **Debug Mode**
```tsx
<AnalyticsTracker debug={true} />
```

Debug logs akan muncul di browser console:
```
🔍 Analytics Tracker Initialized: { enabled: true, deviceInfo: {...} }
📊 Analytics: Tracking page view { page: "/test-analytics", title: "..." }
```

### **Network Monitoring**
1. Buka Developer Tools → Network tab
2. Filter by "track" untuk melihat requests ke `/api/analytics/track`
3. Inspect request/response untuk debugging

## 🔒 Privacy & Security

### **Data Protection**
- Tidak mengumpulkan PII (Personally Identifiable Information)
- Session ID dan Visitor ID adalah random generated
- IP address hanya untuk geolocation, tidak disimpan dalam bentuk identifiable

### **Opt-out Mechanism**
```typescript
// Disable tracking
export function isTrackingEnabled(): boolean {
  // Check user consent, GDPR compliance, etc.
  return localStorage.getItem('analytics_consent') === 'true';
}
```

### **GDPR Compliance**
Untuk compliance GDPR, tambahkan:
```typescript
// Check consent before tracking
if (!hasUserConsent()) {
  return false;
}
```

## 📈 Performance

### **Optimization Features**
- **Debouncing**: Mencegah spam requests (default 1000ms)
- **Error Handling**: Tidak akan break aplikasi utama jika tracking gagal
- **Lazy Loading**: Hanya load di client-side
- **Conditional Loading**: Bisa disable di development

### **Bundle Size Impact**
- Analytics utilities: ~3KB gzipped
- Hook: ~2KB gzipped  
- Components: ~4KB gzipped
- **Total**: ~9KB gzipped

## 🐛 Troubleshooting

### **Common Issues**

#### **Tracking tidak berjalan**
1. Check console untuk error messages
2. Verify `/api/analytics/track` endpoint accessible
3. Check `isTrackingEnabled()` returns true
4. Verify component is client-side rendered

#### **Duplicate tracking calls**
1. Check debounce delay configuration
2. Verify tidak ada multiple tracker components
3. Check route change detection logic

#### **Data tidak muncul di dashboard**
1. Check database connection
2. Verify data masuk ke tabel `WebsiteVisitor`
3. Check analytics aggregation logic
4. Refresh dashboard analytics

### **Debug Commands**
```javascript
// Check session storage
sessionStorage.getItem('analytics_session_id')

// Check local storage  
localStorage.getItem('analytics_visitor_id')

// Manual tracking test
fetch('/api/analytics/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'test_session',
    page: '/test',
    title: 'Test Page'
  })
})
```

## 🔄 Migration & Updates

### **Adding New Tracking Data**
1. Update `TrackingData` interface in `analytics-utils.ts`
2. Update API endpoint to handle new fields
3. Update database schema if needed
4. Update analytics dashboard to display new data

### **Customizing Device Detection**
Modify `getDeviceInfo()` function in `analytics-utils.ts`:
```typescript
export function getDeviceInfo(): DeviceInfo {
  // Add custom detection logic
  const customDevice = detectCustomDevice();
  
  return {
    device: customDevice,
    browser: detectBrowser(),
    os: detectOS(),
  };
}
```

## 📚 Related Documentation

- [Analytics API Documentation](./ANALYTICS_API_TROUBLESHOOTING.md)
- [Database Schema](../prisma/schema.prisma)
- [3-Tier Architecture](./ARCHITECTURE.md)
