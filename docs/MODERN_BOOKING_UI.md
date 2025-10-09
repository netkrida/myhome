# Modern Booking UI - Documentation

## 📄 Overview

Redesign halaman booking dengan tampilan modern menggunakan Magic UI components, animasi, dan layout yang lebih baik.

## ✅ Yang Sudah Dibuat

### **1. Animated Components** ✅

**File:** `src/components/ui/animated-card.tsx`

**Components:**
- `AnimatedCard` - Card dengan fade-in animation
- `AnimatedList` - List container dengan stagger animation
- `AnimatedListItem` - List item dengan slide-in animation

**Dependencies:**
- `framer-motion` - Animation library
- `clsx` & `tailwind-merge` - Utility functions

---

### **2. Booking List (Modern)** ✅

**File:** `src/components/customer/booking-list-client.tsx`

**Features:**
- ✅ Modern card-based layout
- ✅ Search functionality
- ✅ Status filter dropdown
- ✅ Sort by date (created/check-in)
- ✅ Animated list items
- ✅ Gradient text effects
- ✅ Hover effects
- ✅ Responsive design
- ✅ Empty state with CTA

**URL:** `/dashboard/customer/booking`

---

### **3. Booking Detail (Modern)** ✅

**File:** `src/app/(protected-pages)/dashboard/customer/booking/[id]/page.tsx`

**Features:**
- ✅ Header & Footer from components/layout
- ✅ Gradient background
- ✅ 2-column layout (main content + sidebar)
- ✅ Animated cards
- ✅ Payment history with animations
- ✅ Share & Download buttons
- ✅ Modern badges with icons
- ✅ Responsive design
- ✅ Loading skeleton
- ✅ Error handling

**URL:** `/dashboard/customer/booking/[id]`

---

## 📊 Struktur Folder

```
src/
├── app/
│   └── (protected-pages)/
│       └── dashboard/
│           └── customer/
│               └── booking/
│                   ├── page.tsx           ✅ Server component (data fetching)
│                   └── [id]/
│                       └── page.tsx       ✅ Client component (booking detail)
│
├── components/
│   ├── customer/
│   │   └── booking-list-client.tsx       ✅ Client component (booking list)
│   │
│   ├── layout/
│   │   ├── header.tsx                    ✅ Used in booking detail
│   │   └── footer.tsx                    ✅ Used in booking detail
│   │
│   └── ui/
│       └── animated-card.tsx             ✅ Animation components
│
└── docs/
    └── MODERN_BOOKING_UI.md              ✅ This file
```

---

## 🎨 Design Features

### **Booking List Page**

#### **Header Section:**
- Gradient text title
- Badge showing total bookings
- Description text

#### **Filter Section:**
- Search input with icon
- Status filter dropdown
- Sort by dropdown
- All in a bordered card

#### **Booking Cards:**
- Hover effects (shadow + border color)
- Status badges with icons
- Property & room info with icons
- Date badges with rounded pills
- Gradient price text
- "Lihat Detail" button
- Responsive grid layout

#### **Empty State:**
- Icon in circular background
- Helpful message
- CTA button to search properties

---

### **Booking Detail Page**

#### **Layout:**
- Header component (from layout)
- Gradient background
- Container with max-width
- Footer component (from layout)

#### **Header Actions:**
- Back button
- Share button
- Download button

#### **Main Content (2/3 width):**
- Booking info card with gradient header
- Property & room details
- Check-in/out dates
- Payment history with animated list

#### **Sidebar (1/3 width):**
- Payment summary card
- Lease type
- Deposit amount
- Total amount (large, gradient)
- Additional info card
- Created/updated timestamps

#### **Payment History:**
- Animated list items
- Payment type badges
- Transaction details
- Amount in large text
- Hover effects

---

## 🎯 Animation Details

### **Page Load:**
1. Header fades in (delay: 0ms)
2. Filters fade in (delay: 100ms)
3. Booking cards stagger in (delay: 100ms each)

### **Booking Detail:**
1. Header actions fade in (delay: 0ms)
2. Main card fades in (delay: 100ms)
3. Payment history fades in (delay: 200ms)
4. Sidebar cards fade in (delay: 150ms, 200ms)

### **Hover Effects:**
- Card shadow increases
- Border color changes to primary
- Text color transitions
- Button shadow appears

---

## 🔄 Navigation Flow

```
Customer Dashboard
  ↓
Booking List (/dashboard/customer/booking)
  ↓
[Search/Filter/Sort]
  ↓
Click "Lihat Detail"
  ↓
Booking Detail (/dashboard/customer/booking/[id])
  ↓
[View payment history, share, download]
  ↓
Click "Kembali"
  ↓
Back to Booking List
```

---

## 📱 Responsive Design

### **Mobile (< 768px):**
- Single column layout
- Stacked filters
- Full-width cards
- Vertical button layout

### **Tablet (768px - 1024px):**
- 2-column filter grid
- Card layout optimized
- Sidebar below main content

### **Desktop (> 1024px):**
- 3-column filter grid
- 2-column detail layout (2/3 + 1/3)
- Sidebar on the right
- Optimal spacing

---

## 🎨 Color Scheme

### **Status Badges:**
- `UNPAID` - Destructive (red)
- `DEPOSIT_PAID` - Secondary (yellow/orange)
- `CONFIRMED` - Default (blue/primary)
- `CHECKED_IN` - Default (blue/primary)
- `CHECKED_OUT` - Secondary (gray)
- `COMPLETED` - Outline (gray)
- `CANCELLED` - Destructive (red)
- `EXPIRED` - Destructive (red)

### **Payment Status:**
- `PENDING` - Secondary with Clock icon
- `SUCCESS` - Default with CheckCircle2 icon
- `FAILED` - Destructive with XCircle icon
- `EXPIRED` - Destructive with AlertCircle icon

### **Gradients:**
- Title: `from-primary to-primary/60`
- Price: `from-primary to-primary/60`
- Background: `from-background to-muted/20`
- Card header: `from-primary/10 to-primary/5`

---

## 🧪 Testing Checklist

### **Booking List:**
- [ ] Page loads without errors
- [ ] Bookings display correctly
- [ ] Search works
- [ ] Status filter works
- [ ] Sort works
- [ ] Empty state shows when no bookings
- [ ] Click "Lihat Detail" navigates correctly
- [ ] Animations play smoothly
- [ ] Responsive on mobile/tablet/desktop

### **Booking Detail:**
- [ ] Page loads without errors
- [ ] Header & Footer display
- [ ] Booking info displays correctly
- [ ] Payment history displays
- [ ] Back button works
- [ ] Share/Download buttons present
- [ ] Animations play smoothly
- [ ] Responsive on mobile/tablet/desktop
- [ ] Error state shows for invalid ID
- [ ] Loading skeleton displays

---

## 🚀 Usage Examples

### **Navigate to Booking List:**

```typescript
router.push("/dashboard/customer/booking");
```

### **Navigate to Booking Detail:**

```typescript
router.push(`/dashboard/customer/booking/${bookingId}`);
```

### **Use Animated Components:**

```typescript
import { AnimatedCard, AnimatedList, AnimatedListItem } from "@/components/ui/animated-card";

// Single card with delay
<AnimatedCard delay={0.2}>
  <Card>...</Card>
</AnimatedCard>

// List with stagger animation
<AnimatedList>
  {items.map((item) => (
    <AnimatedListItem key={item.id}>
      <div>...</div>
    </AnimatedListItem>
  ))}
</AnimatedList>
```

---

## 📦 Dependencies

```json
{
  "framer-motion": "^11.x.x",
  "clsx": "^2.x.x",
  "tailwind-merge": "^2.x.x",
  "date-fns": "^3.x.x",
  "lucide-react": "^0.x.x"
}
```

---

## 🎉 Summary

**Modern Booking UI Features:**
- ✅ Animated components with Framer Motion
- ✅ Modern card-based layouts
- ✅ Gradient effects
- ✅ Hover animations
- ✅ Search & filter functionality
- ✅ Responsive design
- ✅ Header & Footer integration
- ✅ Loading & error states
- ✅ Empty states with CTAs
- ✅ Icon-based UI elements
- ✅ Status badges with colors
- ✅ Clean, modern aesthetics

**Routes:**
- `/dashboard/customer/booking` - Booking list
- `/dashboard/customer/booking/[id]` - Booking detail

**Siap digunakan!** 🚀

