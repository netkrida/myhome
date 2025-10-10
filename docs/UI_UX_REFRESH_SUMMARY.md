# UI/UX Refresh Summary - Mobile-First with shadcn/ui

## Overview
This document summarizes the UI/UX refresh for public and customer pages with a mobile-first approach using Tailwind CSS and shadcn/ui components.

## Design System

### Mobile-First Approach
- **Optimal viewport**: ≤430px
- **Breakpoints**: sm (640px), md (768px), lg (1024px)
- **Spacing**: p-3/p-4, gap-3
- **Border radius**: rounded-2xl for cards & images
- **Shadows**: shadow-sm, hover→shadow-md
- **Typography**:
  - Title: text-xl font-semibold
  - Sub: text-sm
  - Meta: text-xs text-muted-foreground

### Accessibility
- Alt text for all images
- aria-label for buttons
- Focus rings: focus-visible:ring-2
- Tap targets ≥44px

### Animations
- Lightweight transitions
- Hover scale: scale-[1.02]
- Fade-in for images
- No heavy parallax effects

## Components Created

### 1. Utility Components

#### `components/ui/price.tsx`
- **Purpose**: Format currency to IDR
- **Usage**: `<Price amount={1500000} />`
- **Features**:
  - Automatic IDR formatting
  - Optional prefix toggle
  - Size variants (sm, md, lg)
  - Utility function `formatIDR()`

#### `components/ui/empty-state.tsx`
- **Purpose**: Display when no data is available
- **Usage**: `<EmptyState title="..." description="..." />`
- **Features**:
  - Customizable icon
  - Optional action button
  - Variants: default, search, error

#### `components/ui/skeletons.tsx`
- **Purpose**: Reusable skeleton components
- **Components**:
  - `CardSkeleton` - For property/booking cards
  - `ListSkeleton` - For list items
  - `ImageSkeleton` - For images with aspect ratios
  - `TableSkeleton` - For tables
  - `PropertyDetailSkeleton` - For property detail page
  - `ProfileSkeleton` - For profile page

#### `components/ui/section.tsx`
- **Purpose**: Wrapper for page sections
- **Usage**: `<Section title="..." description="..." action={<Button />}>`
- **Features**:
  - Optional title and description
  - Optional action slot
  - Consistent spacing

### 2. Customer Dashboard Components

#### `components/customer/booking-list-client.tsx`
- **Purpose**: Display bookings with sections
- **Features**:
  - **"Perlu Tindakan" section**: UNPAID, PENDING, EXPIRED statuses
  - **"Aktif" section**: DEPOSIT_PAID, CONFIRMED, CHECKED_IN statuses
  - Modern card layout
  - Color-coded status badges
  - Price component integration
  - Empty states

#### `components/customer/profile-tabs-client.tsx`
- **Purpose**: Tabbed profile management
- **Tabs**:
  1. **Profil**: Personal information and address
  2. **Avatar**: Photo upload (max 2MB)
  3. **Password**: Change password with validation
- **Features**:
  - Form validation
  - Toast notifications
  - Responsive layout
  - Avatar preview

## Pages Updated

### Public Pages

#### 1. Properties Catalog (`components/public/public-properties-section.tsx`)
**Changes**:
- ✅ Mobile: Horizontal carousel with snap scrolling
- ✅ Desktop: Grid layout (2-3 columns)
- ✅ Smooth scroll with `scrollbar-hide`
- ✅ Dark mode support

**Implementation**:
```tsx
{/* Mobile: Horizontal Carousel */}
<div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide sm:hidden">
  {properties.map((property) => (
    <div key={property.id} className="min-w-[260px] snap-start">
      <PublicPropertyCard property={property} />
    </div>
  ))}
</div>

{/* Desktop: Grid */}
<div className="hidden gap-6 sm:grid sm:grid-cols-2 xl:grid-cols-3">
  {properties.map((property) => (
    <PublicPropertyCard key={property.id} property={property} />
  ))}
</div>
```

#### 2. Property Detail Gallery (`components/public/property-detail-gallery.tsx`)
**Changes**:
- ✅ Mobile: Horizontal scroll per category (h-28 w-44)
- ✅ Desktop: Grid layout (2-3 columns)
- ✅ Organized by image categories
- ✅ Smooth transitions

**Categories**:
- Building Photos
- Shared Facilities Photos
- Room Photos
- Bathroom Photos

#### 3. Property Detail Rooms (`components/public/property-detail-rooms.tsx`)
**Changes**:
- ✅ Added Price component import
- ✅ Maintained existing card layout
- ✅ CTA "Pesan" button functional
- ✅ Dialog for room details

### Customer Dashboard Pages

#### 1. Booking Page (`app/(protected-pages)/dashboard/customer/booking/page.tsx`)
**Changes**:
- ✅ Split into two sections:
  - **Perlu Tindakan**: Bookings requiring action
  - **Aktif**: Active bookings
- ✅ Modern card layout
- ✅ Color-coded status badges:
  - Amber: UNPAID, PENDING
  - Red: EXPIRED, CANCELLED
  - Blue: DEPOSIT_PAID
  - Green: CONFIRMED, CHECKED_IN
- ✅ Price component for amounts
- ✅ Empty states for each section

#### 2. History Transaction Page (`app/(protected-pages)/dashboard/customer/history-transaction/page.tsx`)
**Changes**:
- ✅ Mobile: Card layout with compact info
- ✅ Desktop: Table layout with shadcn Table component
- ✅ Price component for amounts
- ✅ Date formatting with Indonesian locale
- ✅ Color-coded status badges
- ✅ Empty state component

**Mobile Card Structure**:
```tsx
<Card className="overflow-hidden rounded-2xl shadow-sm">
  <CardContent className="p-4">
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 space-y-2">
        {/* Booking code, property, date */}
      </div>
      <div className="text-right">
        <Badge>{status}</Badge>
        <Price amount={totalAmount} />
      </div>
    </div>
  </CardContent>
</Card>
```

#### 3. My Profile Page (`app/(protected-pages)/dashboard/customer/my-profile/page.tsx`)
**Changes**:
- ✅ Tabbed interface (Profil, Avatar, Password)
- ✅ Form validation
- ✅ Avatar upload with preview
- ✅ Password change with show/hide toggle
- ✅ Toast notifications
- ✅ Responsive forms (single column mobile, 2 columns desktop)

## Status Badges Color Scheme

### Booking Status
- **UNPAID**: Amber (bg-amber-100 text-amber-700)
- **PENDING**: Amber (bg-amber-100 text-amber-700)
- **EXPIRED**: Red (bg-red-100 text-red-700)
- **DEPOSIT_PAID**: Blue (bg-blue-100 text-blue-700)
- **CONFIRMED**: Green (bg-green-100 text-green-700)
- **CHECKED_IN**: Green (bg-green-100 text-green-700)
- **COMPLETED**: Slate (bg-slate-100 text-slate-700)
- **CANCELLED**: Red (bg-red-100 text-red-700)

## Responsive Patterns

### Card Layout
```tsx
<Card className="overflow-hidden rounded-2xl border shadow-sm transition-all hover:shadow-md">
  <CardContent className="p-4">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Left section */}
      <div className="flex-1 space-y-3">...</div>
      {/* Right section */}
      <div className="flex flex-col items-end gap-3 sm:min-w-[180px]">...</div>
    </div>
  </CardContent>
</Card>
```

### Grid Patterns
- Mobile: Single column
- Tablet (sm): 2 columns
- Desktop (lg): 3 columns

## Dark Mode Support
All components support dark mode through shadcn/ui's built-in dark mode system:
- Automatic color adjustments
- Consistent contrast ratios
- Accessible in both modes

## Performance Considerations
- Skeleton states for loading
- Optimized images with Next.js Image
- Smooth scrolling with CSS
- No heavy animations
- Lazy loading where appropriate

## Accessibility Features
- ✅ Semantic HTML
- ✅ ARIA labels
- ✅ Focus indicators
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Color contrast compliance

## Testing Checklist
- [ ] Mobile viewport (≤430px) - All pages responsive
- [ ] Tablet viewport (640-1024px) - Proper grid layouts
- [ ] Desktop viewport (≥1024px) - Full features visible
- [ ] Dark mode - All components render correctly
- [ ] Touch targets - All ≥44px
- [ ] Keyboard navigation - All interactive elements accessible
- [ ] Screen reader - Proper announcements
- [ ] Performance - Lighthouse score ≥90

## Next Steps
1. Add skeleton states to remaining pages
2. Implement sticky checkout CTA
3. Add property detail hero grid layout
4. Test on real devices
5. Gather user feedback
6. Iterate based on feedback

## Files Modified
- `src/components/ui/price.tsx` (NEW)
- `src/components/ui/empty-state.tsx` (NEW)
- `src/components/ui/skeletons.tsx` (NEW)
- `src/components/ui/section.tsx` (NEW)
- `src/components/customer/booking-list-client.tsx` (UPDATED)
- `src/components/customer/profile-tabs-client.tsx` (NEW)
- `src/components/public/public-properties-section.tsx` (UPDATED)
- `src/components/public/property-detail-gallery.tsx` (UPDATED)
- `src/components/public/property-detail-rooms.tsx` (UPDATED)
- `src/app/(protected-pages)/dashboard/customer/booking/page.tsx` (UPDATED)
- `src/app/(protected-pages)/dashboard/customer/history-transaction/page.tsx` (UPDATED)
- `src/app/(protected-pages)/dashboard/customer/my-profile/page.tsx` (UPDATED)

## Notes
- All logic remains unchanged - only UI/styling updates
- Existing API calls and data fetching preserved
- Compatible with existing 3-tier architecture
- No breaking changes to existing functionality

