# Property Detail Page - Feature Guide

## 🎨 UI Components Overview

### 1. QuickBookingCard - Sticky Sidebar

**Location**: Sidebar kanan (desktop) / Bottom section (mobile)

**Features**:
```
┌────────────────────────────────────┐
│ Mulai dari                         │
│ Rp 1.500.000         [Promo Badge] │
│ /bulan                             │
├────────────────────────────────────┤
│                                    │
│ ┌ Pilih Tipe Kamar ───────────┐  │
│ │ Kamar AC  [3 tersedia]       │  │
│ └──────────────────────────────┘  │
│                                    │
│ ┌ Periode Sewa ────────────────┐  │
│ │ Bulanan                       │  │
│ └──────────────────────────────┘  │
│                                    │
│ ┌ Tanggal Mulai ───────────────┐  │
│ │ 📅 15 Januari 2025            │  │
│ └──────────────────────────────┘  │
│                                    │
│ ╔══════════════════════════════╗  │
│ ║ Harga Sewa:   Rp 1.500.000   ║  │
│ ║ Deposit:      Rp 1.500.000   ║  │
│ ║ ──────────────────────────── ║  │
│ ║ Total:        Rp 3.000.000   ║  │
│ ╚══════════════════════════════╝  │
│                                    │
│ [    PESAN SEKARANG (Gradient)  ] │
│                                    │
│        ─────── atau ───────        │
│                                    │
│ [ 💬 Hubungi via WhatsApp (Green)]│
│                                    │
│ ┌────────────────────────────┐   │
│ │ 📍 Kec. Lowokwaru           │   │
│ │    Kota Malang, Jawa Timur  │   │
│ └────────────────────────────┘   │
└────────────────────────────────────┘
```

**User Flow**:
1. User select tipe kamar → Badge menunjukkan availability
2. User select periode sewa → Dropdown filtered berdasarkan available periods
3. User pilih tanggal mulai → Calendar dengan min date = today
4. System auto-calculate total (sewa + deposit)
5. Button "Pesan Sekarang" enabled → Redirect ke `/booking/[id]?params`
6. Alternative: Click WhatsApp → Open WA with prefilled message

**Props**:
- `property: PublicPropertyDetailDTO` - Full property data
- `adminWa?: string | null` - Admin WhatsApp number

---

### 2. PropertyDetailGalleryImproved - Interactive Gallery

**Layout**: Grouped by category

```
Galeri Properti                      [12 foto]
─────────────────────────────────────────────

✨ FOTO BANGUNAN
┌─────┐ ┌─────┐ ┌─────┐
│ IMG │ │ IMG │ │ IMG │  ← Click untuk buka lightbox
└─────┘ └─────┘ └─────┘

✨ FASILITAS BERSAMA
┌─────┐ ┌─────┐ ┌─────┐
│ IMG │ │ IMG │ │ IMG │
└─────┘ └─────┘ └─────┘

✨ DENAH LANTAI
┌─────┐ ┌─────┐
│ IMG │ │ IMG │
└─────┘ └─────┘
```

**Lightbox View**:
```
┌─────────────────────────────────────────┐
│                                    [×]  │  ← Close button
│                                         │
│  [←]        [IMAGE FULL SCREEN]    [→] │  ← Navigation
│                                         │
│                                         │
│              [3 / 12]                   │  ← Counter
│        "Caption text here"              │  ← Caption
└─────────────────────────────────────────┘
```

**Interactions**:
- Click image → Open lightbox full screen
- Click [←][→] or use Arrow keys → Navigate
- Click [×] or ESC key → Close lightbox
- Responsive: Horizontal scroll (mobile), Grid (desktop)

---

### 3. Layout Structure

#### Desktop (≥1024px)
```
┌────────────────────────────────────────────────────────────┐
│                     🏠 HERO SECTION                         │
│  [Large Image Gallery] + [Property Name & Basic Info]      │
└────────────────────────────────────────────────────────────┘

┌──────────────────────────┬─────────────────────────────────┐
│                          │ ┌─────────────────────────────┐ │
│  📊 METRICS             │ │                             │ │
│  [Stats Cards]          │ │   QuickBookingCard          │ │
│                          │ │   (STICKY - follows scroll) │ │
│  📝 OVERVIEW            │ │                             │ │
│  [About Property]       │ │   • Select Room Type        │ │
│                          │ │   • Select Period           │ │
│  🏊 FACILITIES          │ │   • Pick Date               │ │
│  [Amenities + Rules]    │ │   • Price Breakdown         │ │
│                          │ │   • [PESAN SEKARANG]        │ │
│  🖼️ GALLERY             │ │   • [WhatsApp]              │ │
│  [Interactive Images]   │ │                             │ │
│                          │ │                             │ │
│  🛏️ ROOMS               │ │                             │ │
│  [Room Cards with Price]│ │                             │ │
│                          │ └─────────────────────────────┘ │
└──────────────────────────┴─────────────────────────────────┘
```

#### Mobile (<1024px)
```
┌────────────────────────────┐
│      🏠 HERO SECTION       │
│   [Single Large Image]     │
│   [Property Info]          │
└────────────────────────────┘
│                            │
│  📊 METRICS                │
│  📝 OVERVIEW               │
│  🏊 FACILITIES             │
│  🖼️ GALLERY                │
│  🛏️ ROOMS                  │
│                            │
├────────────────────────────┤
│  📝 BOOKING CARD           │
│  (Anchor section)          │
└────────────────────────────┘
┌────────────────────────────┐
│  FIXED BOTTOM BAR          │
│  [Price] [Pesan Sekarang]  │  ← Scroll to booking
└────────────────────────────┘
```

---

## 🎯 Key User Interactions

### Booking Flow
```
1. View Property Detail
   ↓
2. Browse Gallery (Click images)
   ↓
3. Read Facilities & Rules
   ↓
4. Select Room Type in Sidebar
   ↓
5. Choose Rental Period
   ↓
6. Pick Start Date
   ↓
7. Review Total Price
   ↓
8. Click "Pesan Sekarang"
   ↓
9. Redirect to /booking/[id]?roomType=xxx&period=xxx&startDate=xxx
```

### Contact Owner Flow
```
1. View Property Detail
   ↓
2. Click "Hubungi via WhatsApp" in Sidebar
   OR
   Click WhatsApp Float Button
   ↓
3. Open WhatsApp with prefilled message:
   "Halo Admin, saya tertarik dengan properti [Name]

   Tipe Kamar: [Selected Room Type]
   Periode: [Selected Period]
   Tanggal Mulai: [Selected Date]

   Apakah kamar tersedia?"
```

---

## 💡 Smart Features

### 1. Availability Badges
```typescript
// Available rooms
<Badge className="bg-emerald-500">
  ✓ Tersedia (5 kamar)
</Badge>

// Limited availability
<Badge className="bg-amber-500">
  ⚠ Sisa 2 kamar
</Badge>

// Fully booked
<Badge className="bg-muted">
  ✗ Tidak tersedia
</Badge>
```

### 2. Dynamic Pricing
```typescript
// Hitung deposit berdasarkan tipe
if (depositType === "FIXED") {
  deposit = depositValue;
} else if (depositType === "PERCENTAGE") {
  deposit = (price * depositValue) / 100;
}

// Total = Sewa + Deposit
total = calculatedPrice + depositAmount;
```

### 3. Responsive Image Gallery
```typescript
// Mobile: Horizontal scroll
<div className="flex gap-3 overflow-x-auto snap-x">
  {images.map(img => <Image />)}
</div>

// Desktop: Grid layout
<div className="grid sm:grid-cols-2 lg:grid-cols-3">
  {images.map(img => <Image />)}
</div>
```

### 4. Sticky Positioning
```typescript
// Desktop sticky sidebar
<aside className="hidden lg:block">
  <Card className="sticky top-24"> {/* 24 = header height */}
    <QuickBookingCard />
  </Card>
</aside>

// Mobile fixed bottom
<div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
  <BottomBar />
</div>
```

---

## 🎨 Design Tokens

### Colors
```css
/* Primary Actions */
--cta-gradient: from-blue-600 to-blue-500;
--cta-hover: from-blue-700 to-blue-600;

/* Price Display */
--price-color: text-rose-600;
--price-color-dark: text-rose-400;

/* Status Colors */
--available: bg-emerald-500;
--limited: bg-amber-500;
--unavailable: bg-muted;

/* WhatsApp */
--whatsapp-bg: bg-green-50;
--whatsapp-text: text-green-700;
```

### Spacing
```css
/* Sticky offset */
top-24  /* 6rem - header height */

/* Section gaps */
space-y-12  /* 3rem between sections */

/* Card padding */
p-4 (mobile)
p-6 (desktop)
```

### Typography
```css
/* Headers */
text-2xl font-semibold  /* Section titles */
text-xl font-bold       /* Card titles */

/* Prices */
text-2xl font-bold      /* Sidebar price */
text-xl font-semibold   /* Room price */

/* Body */
text-sm                 /* Descriptions */
text-xs                 /* Labels, meta info */
```

---

## 📱 Mobile Optimizations

### Fixed Bottom Bar
- Height: auto (content-based)
- Background: `bg-background/95 backdrop-blur-sm`
- Border: `border-t border-border`
- z-index: 40 (above content, below header)
- Contains: Price preview + CTA button

### Scroll Behavior
- Click "Pesan Sekarang" di bottom bar → Smooth scroll ke `#booking-section`
- Booking section di-render di bottom page untuk mobile

### Touch Interactions
- Gallery: Horizontal scroll dengan snap points
- Room cards: Horizontal scroll carousel
- Form inputs: Large touch targets (min 44px)

---

## ♿ Accessibility

### Keyboard Navigation
- **Gallery Lightbox**:
  - `Arrow Left/Right` → Navigate images
  - `ESC` → Close lightbox
  - `Tab` → Focus navigation buttons

- **Form Inputs**:
  - `Tab` → Navigate between fields
  - `Enter/Space` → Open select/calendar
  - `ESC` → Close dropdowns

### Screen Readers
- ARIA labels on all interactive elements
- Semantic HTML (`<main>`, `<aside>`, `<section>`)
- Alt text on all images
- Button labels (not just icons)

### Focus Management
- Visible focus rings on interactive elements
- Skip to main content link (dari header)
- Logical tab order

---

## 🔧 Technical Details

### State Management
```typescript
// QuickBookingCard internal state
const [selectedRoomType, setSelectedRoomType] = useState<string>("");
const [pricePeriod, setPricePeriod] = useState<PricePeriod>("monthly");
const [startDate, setStartDate] = useState<Date>();

// Computed values
const calculatedPrice = useMemo(() => { ... });
const depositAmount = useMemo(() => { ... });
const totalAmount = calculatedPrice + depositAmount;
```

### Data Flow
```
Server (RSC) → Fetch property data
     ↓
Page Component → Pass to child components
     ↓
QuickBookingCard → Internal state for form
     ↓
User interaction → Update state
     ↓
Form validation → Enable/disable CTA
     ↓
Click CTA → Navigate with query params
```

### Performance
- Server Components untuk static content
- Client Components only for interactivity (QuickBookingCard, Gallery)
- Image optimization dengan Next.js Image
- Lazy loading images (off-screen)
- Memoization untuk expensive calculations

---

## 🚀 Future Enhancements

### Priority 1 (High Impact)
- [ ] Add reviews/ratings section
- [ ] Similar properties recommendation
- [ ] Map integration (Google Maps embed)
- [ ] Social share buttons

### Priority 2 (Nice to Have)
- [ ] 360° virtual tour
- [ ] Price history chart
- [ ] Favorite/bookmark property
- [ ] Compare with other properties
- [ ] Room availability calendar view

### Priority 3 (Advanced)
- [ ] Live chat with owner
- [ ] Video walkthrough
- [ ] AR room preview
- [ ] Smart recommendations based on preferences

---

## 📊 Analytics Events (Recommended)

Track user interactions untuk optimization:

```typescript
// Page view
analytics.track('property_detail_viewed', {
  property_id: property.id,
  property_name: property.name,
  property_type: property.propertyType,
});

// Room selection
analytics.track('room_type_selected', {
  room_type: selectedRoomType,
  property_id: property.id,
});

// Booking initiated
analytics.track('booking_initiated', {
  property_id: property.id,
  room_type: selectedRoomType,
  period: pricePeriod,
  total_amount: totalAmount,
});

// WhatsApp contact
analytics.track('whatsapp_contact_clicked', {
  property_id: property.id,
  source: 'quick_booking_card', // or 'floating_button'
});

// Gallery interaction
analytics.track('gallery_image_viewed', {
  property_id: property.id,
  image_category: category,
  image_index: currentImageIndex,
});
```

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. **No persistence**: Form state hilang saat refresh
2. **No validation**: Date picker allows past dates (fixed dengan disabled prop)
3. **No loading states**: Instant navigation (could add skeleton)
4. **No error handling**: Assumes all data valid

### Planned Fixes
- Add form persistence dengan localStorage
- Add loading states untuk better UX
- Add error boundaries
- Add form validation

---

## 📝 Testing Scenarios

### Functional Testing
- [ ] Select room type → Check price updates
- [ ] Change period → Check price recalculates
- [ ] Pick date → Check CTA enables
- [ ] Click "Pesan Sekarang" → Navigate with correct params
- [ ] Click WhatsApp → Opens WA with correct message
- [ ] Gallery click → Opens lightbox
- [ ] Lightbox navigation → Shows correct images
- [ ] Keyboard navigation → All interactive

### Edge Cases
- [ ] Property tanpa gambar → Placeholder shown
- [ ] Property tanpa room tersedia → Badge "Penuh"
- [ ] Room tanpa daily/weekly price → Period disabled
- [ ] Mobile bottom bar → Scroll to booking works
- [ ] Sticky sidebar → Stays in viewport

### Responsive Testing
- [ ] Mobile (375px) → Layout correct
- [ ] Tablet (768px) → Layout correct
- [ ] Desktop (1024px+) → Sidebar sticky
- [ ] Large desktop (1920px) → Max width constrained

---

Dokumentasi ini akan terus di-update seiring development! 🚀
