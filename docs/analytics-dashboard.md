# Analytics Dashboard Frontend

## Overview

Frontend dashboard analytics untuk superadmin yang menampilkan data visitor dalam bentuk visualisasi interaktif menggunakan Three.js globe, bar chart, line chart, dan pie chart.

## Features

### 1. 🌍 Interactive Globe Visualization
- **Library**: Three.js dengan `three-globe`, `@react-three/fiber`, `@react-three/drei`
- **Data Source**: Countries dan cities dari API analytics
- **Features**:
  - Interactive 3D globe dengan auto-rotate
  - Color-coded markers berdasarkan jumlah visitor
  - Arcs menghubungkan Jakarta (hub) ke kota lain
  - Legend untuk traffic levels
  - Stats summary (countries, cities, total visitors, peak country)

### 2. 📊 Device Statistics Bar Chart
- **Library**: Recharts dengan shadcn/ui chart components
- **Data Source**: Device breakdown (desktop, mobile, tablet)
- **Features**:
  - Interactive bar chart dengan hover tooltips
  - Clickable device tabs untuk filtering
  - Responsive design
  - Real-time visitor counts per device

### 3. 📈 Visitors Trend Line Chart
- **Library**: Recharts dengan shadcn/ui chart components
- **Data Source**: Monthly visitor trends
- **Features**:
  - 6-month trend visualization
  - Trend percentage calculation
  - Date range display
  - Smooth line curves dengan active dots

### 4. 🥧 Summary Pie Chart
- **Library**: Recharts dengan shadcn/ui chart components
- **Data Source**: Returning vs new visitors, unique browsers
- **Features**:
  - Donut-style pie chart
  - Inner labels untuk categories
  - Color-coded legend
  - Percentage calculations

## File Structure

```
src/components/analytics/
├── analytics-globe.tsx          # Globe wrapper dengan data transformation
├── globe.tsx                    # Core Three.js globe component
├── device-chart.tsx             # Bar chart untuk device statistics
├── visitors-trend-chart.tsx     # Line chart untuk visitor trends
├── summary-pie-chart.tsx        # Pie chart untuk summary data
└── loading-globe.tsx            # Loading component untuk globe

src/app/(protected-pages)/dashboard/superadmin/
└── page.tsx                     # Main dashboard page

public/data/
└── globe.json                   # GeoJSON data untuk countries
```

## Dependencies

### Core Dependencies
```json
{
  "three": "^0.x.x",
  "three-globe": "^2.x.x",
  "@react-three/fiber": "^8.x.x",
  "@react-three/drei": "^9.x.x",
  "framer-motion": "^10.x.x",
  "recharts": "^2.x.x"
}
```

### UI Components
- shadcn/ui chart components
- shadcn/ui card components
- Custom loading components

## API Integration

### Endpoint
```
GET /api/analytics/visitors/total?period=month
```

### Response Format
```typescript
interface AnalyticsData {
  totalVisitors: number;
  period: string;
  dateRange?: {
    start: string;
    end: string;
  };
  countries: { [key: string]: number };
  cities: { [key: string]: number };
  devices: { [key: string]: number };
  browsers: { [key: string]: number };
  operatingSystems: { [key: string]: number };
  summary: {
    totalVisitors: number;
    returningVisitors: number;
    newVisitors: number;
    totalPageViews: number;
    uniqueCountries: number;
    uniqueCities: number;
    uniqueDevices: number;
    uniqueBrowsers: number;
    uniqueOperatingSystems: number;
  };
}
```

## Globe Configuration

### City Coordinates
```typescript
const cityCoordinates = {
  "Jakarta": { lat: -6.2088, lng: 106.8456 },
  "Bandung": { lat: -6.9175, lng: 107.6191 },
  "Surabaya": { lat: -7.2575, lng: 112.7521 },
  "Medan": { lat: 3.5952, lng: 98.6722 },
  "Kuala Lumpur": { lat: 3.1390, lng: 101.6869 },
  "Penang": { lat: 5.4164, lng: 100.3327 },
  "Singapore": { lat: 1.3521, lng: 103.8198 },
  "Bangkok": { lat: 13.7563, lng: 100.5018 },
};
```

### Color Coding
- **Blue (#3b82f6)**: Low traffic (1-2 visitors)
- **Green (#22c55e)**: Medium traffic (3-4 visitors)  
- **Orange (#f97316)**: High traffic (5+ visitors)

### Globe Settings
```typescript
const globeConfig: GlobeConfig = {
  pointSize: 4,
  globeColor: "#062056",
  showAtmosphere: true,
  atmosphereColor: "#FFFFFF",
  atmosphereAltitude: 0.1,
  emissive: "#062056",
  emissiveIntensity: 0.1,
  shininess: 0.9,
  polygonColor: "rgba(255,255,255,0.7)",
  ambientLight: "#38bdf8",
  directionalLeftLight: "#ffffff",
  directionalTopLight: "#ffffff",
  pointLight: "#ffffff",
  arcTime: 1000,
  arcLength: 0.9,
  rings: 1,
  maxRings: 3,
  autoRotate: true,
  autoRotateSpeed: 0.5,
};
```

## Dashboard Layout

### Overview Cards (Top Row)
1. **Total Visitors**: Current month total dengan new visitors count
2. **Page Views**: Total page views across all visitors
3. **Countries**: Unique countries count
4. **Devices**: Unique device types count

### Globe Section (Full Width)
- Interactive 3D globe visualization
- Legend untuk traffic levels
- Stats summary grid

### Charts Grid (Bottom Row)
1. **Device Chart**: Bar chart dengan interactive tabs
2. **Visitors Trend**: Line chart dengan 6-month data
3. **Summary Pie**: Donut chart dengan visitor breakdown

## Performance Optimizations

### 1. Lazy Loading
- Globe component wrapped dalam `Suspense`
- Custom loading component dengan animated spinner
- Fallback untuk failed data fetching

### 2. Data Transformation
- Server-side data aggregation
- Client-side coordinate mapping
- Efficient color coding algorithm

### 3. Responsive Design
- Grid layouts dengan breakpoints
- Mobile-friendly chart sizing
- Adaptive text dan spacing

## Authentication & Authorization

### Requirements
- **Role**: SUPERADMIN only
- **Authentication**: NextAuth v5 session required
- **Middleware**: Route protection enabled

### Access Control
```typescript
// Ensure user has superadmin role
await requireRole(["SUPERADMIN"]);
```

## Error Handling

### Fallback Data
```typescript
// Return fallback data jika API gagal
return {
  totalVisitors: 0,
  period: 'month',
  countries: {},
  cities: {},
  devices: {},
  browsers: {},
  operatingSystems: {},
  summary: {
    totalVisitors: 0,
    returningVisitors: 0,
    newVisitors: 0,
    totalPageViews: 0,
    uniqueCountries: 0,
    uniqueCities: 0,
    uniqueDevices: 0,
    uniqueBrowsers: 0,
    uniqueOperatingSystems: 0,
  },
};
```

### Loading States
- Globe: Custom loading component dengan animated spinner
- Charts: Built-in loading states dari recharts
- Cards: Skeleton loading untuk data

## Usage

### Access Dashboard
1. Login sebagai SUPERADMIN
2. Navigate ke `/dashboard/superadmin`
3. View real-time analytics data

### Interact with Globe
- **Rotate**: Click dan drag untuk rotate globe
- **Zoom**: Disabled untuk consistent view
- **Auto-rotate**: Enabled dengan speed 0.5

### Chart Interactions
- **Device Chart**: Click tabs untuk filter by device
- **Trend Chart**: Hover untuk detail data points
- **Pie Chart**: Hover untuk category breakdown

## Future Enhancements

### Planned Features
1. **Real-time Updates**: WebSocket integration
2. **Date Range Picker**: Custom period selection
3. **Export Functionality**: PDF/CSV export
4. **Drill-down**: Click countries untuk city details
5. **Comparison Mode**: Period-over-period comparison

### Performance Improvements
1. **Data Caching**: Redis caching untuk analytics data
2. **Incremental Loading**: Progressive data loading
3. **WebGL Optimization**: Better Three.js performance
4. **Chart Virtualization**: Large dataset handling

## Troubleshooting

### Common Issues

1. **Globe tidak muncul**
   - Check browser WebGL support
   - Verify Three.js dependencies
   - Check console untuk errors

2. **Data tidak update**
   - Verify API endpoint accessibility
   - Check authentication status
   - Review database connection

3. **Performance lambat**
   - Reduce globe point count
   - Optimize chart data size
   - Check memory usage

### Debug Mode
```typescript
// Enable debug logging
console.log('Analytics data:', analyticsData);
```
