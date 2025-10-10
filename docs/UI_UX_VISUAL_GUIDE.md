# UI/UX Visual Guide - Before & After

## 📱 Mobile-First Design Improvements

---

## 1. Properties Catalog

### Before
```
┌─────────────────────────┐
│  Property Card 1        │
├─────────────────────────┤
│  Property Card 2        │
├─────────────────────────┤
│  Property Card 3        │
└─────────────────────────┘
Vertical list, no carousel
```

### After (Mobile)
```
┌──────┬──────┬──────┬──────→
│ Card │ Card │ Card │ Card
│  1   │  2   │  3   │  4
└──────┴──────┴──────┴──────→
Horizontal carousel with snap
min-w-[260px], smooth scroll
```

### After (Desktop)
```
┌──────┬──────┬──────┐
│ Card │ Card │ Card │
│  1   │  2   │  3   │
├──────┼──────┼──────┤
│ Card │ Card │ Card │
│  4   │  5   │  6   │
└──────┴──────┴──────┘
Grid layout (2-3 columns)
```

**Key Improvements**:
- ✅ Mobile: Horizontal scroll with snap
- ✅ Desktop: Grid layout
- ✅ Consistent card sizing
- ✅ Better use of screen space

---

## 2. Property Detail Hero

### Before
```
┌─────────────────────────┐
│                         │
│    Main Image           │
│                         │
├──────────┬──────────────┤
│ Image 2  │  Image 3     │
└──────────┴──────────────┘
Simple grid layout
```

### After (Mobile)
```
┌─────────────────────────┐
│                         │
│                         │
│    Single Large Image   │
│                         │
│                         │
└─────────────────────────┘
Full-width, aspect-[4/3]
rounded-2xl
```

### After (Desktop)
```
┌──────────────┬─────┬─────┐
│              │  2  │  3  │
│              ├─────┼─────┤
│   Main (1)   │  4  │ +X  │
│              │     │foto │
└──────────────┴─────┴─────┘
Hero grid: 1 large + 4 small
2x2 grid layout
```

**Key Improvements**:
- ✅ Mobile: Single focused image
- ✅ Desktop: Hero grid layout
- ✅ Better visual hierarchy
- ✅ "+X foto" overlay on last image

---

## 3. Property Detail Gallery

### Before
```
Building Photos
┌────┬────┬────┐
│ 1  │ 2  │ 3  │
└────┴────┴────┘

Room Photos
┌────┬────┬────┐
│ 1  │ 2  │ 3  │
└────┴────┴────┘
Grid only
```

### After (Mobile)
```
Building Photos
┌───┬───┬───┬───→
│ 1 │ 2 │ 3 │ 4
└───┴───┴───┴───→
h-28 w-44, horizontal scroll

Room Photos
┌───┬───┬───┬───→
│ 1 │ 2 │ 3 │ 4
└───┴───┴───┴───→
Smooth scroll per category
```

### After (Desktop)
```
Building Photos
┌─────┬─────┬─────┐
│  1  │  2  │  3  │
├─────┼─────┼─────┤
│  4  │  5  │  6  │
└─────┴─────┴─────┘
Grid layout (2-3 columns)
```

**Key Improvements**:
- ✅ Mobile: Horizontal scroll per category
- ✅ Desktop: Grid layout
- ✅ Organized by categories
- ✅ Better browsing experience

---

## 4. Checkout Page

### Before (Mobile)
```
┌─────────────────────────┐
│  Form Fields            │
│  ...                    │
│  ...                    │
│  [Submit Button]        │
└─────────────────────────┘
Button at bottom of form
Can be covered by keyboard
```

### After (Mobile)
```
┌─────────────────────────┐
│  Form Fields            │
│  ...                    │
│  ...                    │
│                         │
│  (pb-32 padding)        │
└─────────────────────────┘
┌─────────────────────────┐
│ Total: Rp 1.500.000     │
│ [Bayar Sekarang]        │
└─────────────────────────┘
Sticky CTA at bottom
Always visible
```

### After (Desktop)
```
┌──────────────┬──────────┐
│  Form        │ Summary  │
│  Fields      │ Card     │
│  ...         │          │
│              │ Total:   │
│ [Submit]     │ Rp 1.5jt │
└──────────────┴──────────┘
Regular layout
No sticky bar
```

**Key Improvements**:
- ✅ Mobile: Sticky CTA always visible
- ✅ Desktop: Sidebar summary
- ✅ No keyboard overlap
- ✅ Better UX on mobile

---

## 5. Customer Booking Page

### Before
```
All Bookings
┌─────────────────────────┐
│ Booking 1 (UNPAID)      │
├─────────────────────────┤
│ Booking 2 (CONFIRMED)   │
├─────────────────────────┤
│ Booking 3 (EXPIRED)     │
└─────────────────────────┘
Single list, mixed statuses
```

### After
```
Perlu Tindakan
┌──────┬──────┬──────┐
│UNPAID│PNDNG│EXPRD │
│ Bkg1 │ Bkg2 │ Bkg3 │
└──────┴──────┴──────┘

Booking Aktif
┌──────┬──────┬──────┐
│DPAID │CNFRM │CHKIN │
│ Bkg4 │ Bkg5 │ Bkg6 │
└──────┴──────┴──────┘
Organized sections
Color-coded badges
```

**Key Improvements**:
- ✅ Split into sections
- ✅ "Perlu Tindakan" vs "Aktif"
- ✅ Color-coded status badges
- ✅ Better organization
- ✅ Empty states per section

---

## 6. History Transaction Page

### Before
```
┌─────────────────────────┐
│ Transaction 1           │
├─────────────────────────┤
│ Transaction 2           │
├─────────────────────────┤
│ Transaction 3           │
└─────────────────────────┘
Simple list
```

### After (Mobile)
```
Stats
┌──────┬──────┬──────┐
│Total │Pndng│Cmptd │
│ 15jt │  3  │  12  │
└──────┴──────┴──────┘

Transactions
┌─────────────────────────┐
│ Property Name           │
│ Room Type • Date        │
│ [CONFIRMED] Rp 1.500.000│
└─────────────────────────┘
Card layout with stats
```

### After (Desktop)
```
Stats
┌──────┬──────┬──────┐
│Total │Pndng│Cmptd │
│ 15jt │  3  │  12  │
└──────┴──────┴──────┘

┌────────┬────────┬────────┬────────┬────────┐
│ Code   │Property│ Room   │ Date   │ Status │
├────────┼────────┼────────┼────────┼────────┤
│ BK001  │ Kos A  │ Type A │ 1 Jan  │ PAID   │
│ BK002  │ Kos B  │ Type B │ 2 Jan  │ PNDNG  │
└────────┴────────┴────────┴────────┴────────┘
Table layout with all details
```

**Key Improvements**:
- ✅ Stats cards at top
- ✅ Mobile: Card layout
- ✅ Desktop: Table layout
- ✅ Price component
- ✅ Indonesian date format

---

## 7. My Profile Page

### Before
```
┌─────────────────────────┐
│ Personal Info           │
│ Name: John Doe          │
│ Email: john@email.com   │
│ Phone: 08123456789      │
│                         │
│ Address                 │
│ Street: Jl. Example     │
│ ...                     │
└─────────────────────────┘
Read-only display
```

### After
```
┌─────────────────────────┐
│ [Profil][Avatar][Pass]  │
├─────────────────────────┤
│ Profil Tab              │
│ ┌─────────┬─────────┐   │
│ │ Name    │ Phone   │   │
│ └─────────┴─────────┘   │
│ ┌───────────────────┐   │
│ │ Email (disabled)  │   │
│ └───────────────────┘   │
│ [Save Changes]          │
└─────────────────────────┘
Editable with tabs
```

**Tabs**:
1. **Profil**: Edit personal info & address
2. **Avatar**: Upload profile photo
3. **Password**: Change password

**Key Improvements**:
- ✅ Tabbed interface
- ✅ Editable forms
- ✅ Avatar upload
- ✅ Password change
- ✅ Form validation
- ✅ Toast notifications

---

## 🎨 Design System Elements

### Status Badges

```
┌──────────────────────────────────┐
│ UNPAID    │ Amber bg-amber-100   │
│ PENDING   │ Amber bg-amber-100   │
│ EXPIRED   │ Red bg-red-100       │
│ CANCELLED │ Red bg-red-100       │
│ DEPOSIT_PAID │ Blue bg-blue-100  │
│ CONFIRMED │ Green bg-green-100   │
│ CHECKED_IN│ Green bg-green-100   │
│ COMPLETED │ Slate bg-slate-100   │
└──────────────────────────────────┘
```

### Spacing Scale

```
Mobile:
- Padding: p-3 (12px)
- Gap: gap-3 (12px)

Desktop:
- Padding: p-4 (16px) / p-6 (24px)
- Gap: gap-4 (16px) / gap-6 (24px)
```

### Border Radius

```
- Cards: rounded-2xl (16px)
- Smaller elements: rounded-xl (12px)
- Buttons: rounded-full
- Images: rounded-2xl
```

### Typography

```
- Title: text-xl font-semibold (mobile)
         text-2xl font-semibold (desktop)
- Subtitle: text-sm
- Meta: text-xs text-muted-foreground
- Body: text-sm / text-base
```

---

## 📐 Responsive Grid Patterns

### 1-2-3 Column Pattern
```
Mobile (< 640px):
┌─────────────┐
│   Card 1    │
├─────────────┤
│   Card 2    │
├─────────────┤
│   Card 3    │
└─────────────┘

Tablet (640px+):
┌──────┬──────┐
│ Card │ Card │
│  1   │  2   │
├──────┼──────┤
│ Card │ Card │
│  3   │  4   │
└──────┴──────┘

Desktop (1024px+):
┌────┬────┬────┐
│ C1 │ C2 │ C3 │
├────┼────┼────┤
│ C4 │ C5 │ C6 │
└────┴────┴────┘
```

### Sidebar Pattern
```
Mobile:
┌─────────────┐
│   Main      │
│   Content   │
├─────────────┤
│   Sidebar   │
└─────────────┘

Desktop:
┌──────────┬────┐
│   Main   │Side│
│  Content │bar │
│          │    │
└──────────┴────┘
```

---

## 🌙 Dark Mode Examples

### Light Mode
```
┌─────────────────────────┐
│ bg-white                │
│ text-slate-900          │
│ border-slate-200        │
└─────────────────────────┘
```

### Dark Mode
```
┌─────────────────────────┐
│ bg-slate-900            │
│ text-slate-100          │
│ border-slate-700        │
└─────────────────────────┘
```

**All components support dark mode automatically via shadcn/ui theme system**

---

## ♿ Accessibility Features

### Focus Indicators
```
Default:
┌─────────┐
│ Button  │
└─────────┘

Focused:
┌─────────┐
│ Button  │ ← ring-2 ring-ring
└─────────┘
```

### Touch Targets
```
Minimum: 44px × 44px

┌──────────────┐
│              │ ≥44px
│    Button    │
│              │
└──────────────┘
   ≥44px
```

### Alt Text
```tsx
<Image 
  src="/property.jpg" 
  alt="Kos Putri Melati - Tampilan depan bangunan"
/>
```

---

## 📊 Performance Optimizations

### Image Loading
```
Priority images: Hero images
Lazy loading: Below-fold images
Responsive sizes: Different sizes per breakpoint
```

### Code Splitting
```
Route-based: Automatic with Next.js
Component-based: Dynamic imports where needed
```

### Bundle Size
```
Before: Check with `npm run build`
After: Optimized with tree shaking
```

---

## 🎯 Key Metrics

### Lighthouse Targets
- Performance: ≥90
- Accessibility: ≥90
- Best Practices: ≥90
- SEO: ≥90

### Core Web Vitals
- LCP (Largest Contentful Paint): <2.5s
- FID (First Input Delay): <100ms
- CLS (Cumulative Layout Shift): <0.1

---

**Visual Guide Version**: 1.0  
**Last Updated**: 2025-10-10  
**Status**: Complete

