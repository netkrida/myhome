# UI/UX Testing Checklist - Mobile-First Refresh

## Overview
This checklist ensures all UI/UX updates meet the mobile-first design requirements and accessibility standards.

---

## 🎯 General Requirements

### Mobile-First Design (≤430px)
- [ ] All pages render correctly at 320px width (iPhone SE)
- [ ] All pages render correctly at 375px width (iPhone 12/13)
- [ ] All pages render correctly at 430px width (iPhone 14 Pro Max)
- [ ] No horizontal scrolling (except intentional carousels)
- [ ] Touch targets are ≥44px × 44px
- [ ] Text is readable without zooming
- [ ] Forms are usable without keyboard covering inputs

### Responsive Breakpoints
- [ ] **sm (640px)**: Tablet portrait - proper grid transitions
- [ ] **md (768px)**: Tablet landscape - 2-column layouts work
- [ ] **lg (1024px)**: Desktop - 3-column layouts work
- [ ] **xl (1280px)**: Large desktop - max-width containers centered

### Design System Consistency
- [ ] Spacing: p-3/p-4 for mobile, p-4/p-6 for desktop
- [ ] Gap: gap-3 for mobile, gap-4/gap-6 for desktop
- [ ] Border radius: rounded-2xl for cards, rounded-xl for smaller elements
- [ ] Shadows: shadow-sm default, hover:shadow-md on interactive elements
- [ ] Typography:
  - [ ] Titles: text-xl font-semibold (mobile), text-2xl (desktop)
  - [ ] Subtitles: text-sm
  - [ ] Meta text: text-xs text-muted-foreground

---

## 📱 Public Pages

### Homepage (`/`)
- [ ] Hero section displays correctly on mobile
- [ ] Property carousel scrolls smoothly
- [ ] Snap scrolling works (snap-x snap-mandatory)
- [ ] Cards are min-w-[260px] on mobile
- [ ] Grid layout (2-3 columns) on desktop
- [ ] All images load with proper aspect ratios
- [ ] CTA buttons are accessible and visible

### Properties Catalog (`/properties`)
- [ ] **Mobile**: Horizontal carousel with scrollbar-hide
- [ ] **Desktop**: Grid layout (2-3 columns)
- [ ] Property cards display all info (image, name, price, location)
- [ ] Cards have hover effects (scale-[1.02], shadow-md)
- [ ] Empty state shows when no properties
- [ ] Loading skeleton displays during fetch
- [ ] Filters work on mobile (if implemented)

### Property Detail (`/property/[id]`)
- [ ] **Hero Grid Layout**:
  - [ ] Mobile: Single large image with rounded-2xl
  - [ ] Desktop: 2x2 grid (1 large + 4 small images)
  - [ ] Heart button (save) is accessible
  - [ ] "+X foto lainnya" overlay on last image
- [ ] **Property Info**:
  - [ ] Title, description, badges display correctly
  - [ ] Location, room count, build year visible
  - [ ] Google Maps link works
- [ ] **Gallery Section**:
  - [ ] Mobile: Horizontal scroll per category (h-28 w-44)
  - [ ] Desktop: Grid layout per category
  - [ ] Categories: Building, Shared Facilities, Rooms, Bathrooms
- [ ] **Rooms Section**:
  - [ ] Room cards display with images
  - [ ] Price component shows IDR correctly
  - [ ] "Pesan" CTA button visible and functional
  - [ ] Room detail dialog opens on click
- [ ] **Loading State**: PropertyDetailSkeleton displays

### Checkout Page (`/checkout`)
- [ ] **Mobile**:
  - [ ] Form fields are accessible (not covered by keyboard)
  - [ ] Sticky CTA at bottom (fixed bottom-0)
  - [ ] Total price visible in sticky bar
  - [ ] "Bayar Sekarang" button functional
  - [ ] pb-32 padding prevents content overlap
- [ ] **Desktop**:
  - [ ] Sidebar summary visible
  - [ ] Regular CTA button at bottom of form
  - [ ] No sticky bar (lg:hidden)
- [ ] **Form Validation**:
  - [ ] All required fields validated
  - [ ] Error messages display clearly
  - [ ] Toast notifications work
- [ ] **Room Selection**:
  - [ ] Room mapping displays correctly
  - [ ] Selected room highlighted
  - [ ] Available/occupied status clear
- [ ] **Payment Flow**:
  - [ ] Midtrans Snap opens correctly
  - [ ] Success/failure redirects work

---

## 👤 Customer Dashboard

### Booking Page (`/dashboard/customer/booking`)
- [ ] **Sections**:
  - [ ] "Perlu Tindakan" section displays
  - [ ] "Aktif" section displays
  - [ ] Empty states show when no bookings
- [ ] **Booking Cards**:
  - [ ] All info visible (property, room, dates, status)
  - [ ] Status badges color-coded correctly:
    - [ ] Amber: UNPAID, PENDING
    - [ ] Red: EXPIRED, CANCELLED
    - [ ] Blue: DEPOSIT_PAID
    - [ ] Green: CONFIRMED, CHECKED_IN
  - [ ] Price component formats IDR correctly
  - [ ] Action buttons visible and functional
- [ ] **Responsive**:
  - [ ] Mobile: Single column cards
  - [ ] Tablet: 2 columns
  - [ ] Desktop: 3 columns
- [ ] **Loading State**: CardSkeleton displays

### History Transaction (`/dashboard/customer/history-transaction`)
- [ ] **Stats Cards**:
  - [ ] Total amount displays correctly
  - [ ] Pending count accurate
  - [ ] Completed count accurate
- [ ] **Mobile Layout**:
  - [ ] Card layout with compact info
  - [ ] Status badges visible
  - [ ] Price formatted correctly
  - [ ] Dates in Indonesian locale
- [ ] **Desktop Layout**:
  - [ ] Table layout with all columns
  - [ ] Sortable headers (if implemented)
  - [ ] Hover effects on rows
- [ ] **Empty State**: Shows when no transactions
- [ ] **Loading State**: 
  - [ ] Mobile: CardSkeleton
  - [ ] Desktop: TableSkeleton

### My Profile (`/dashboard/customer/my-profile`)
- [ ] **Tabs**:
  - [ ] All 3 tabs visible (Profil, Avatar, Password)
  - [ ] Tab switching works smoothly
  - [ ] Active tab highlighted
- [ ] **Profil Tab**:
  - [ ] Form fields pre-filled with user data
  - [ ] Mobile: Single column layout
  - [ ] Desktop: 2-column layout
  - [ ] Email field disabled (read-only)
  - [ ] Save button functional
  - [ ] Toast notification on success
- [ ] **Avatar Tab**:
  - [ ] Avatar preview displays (circle, 96px)
  - [ ] Initials fallback works
  - [ ] Upload area clickable
  - [ ] File size validation (max 2MB)
  - [ ] Progress indicator during upload
  - [ ] Toast notification on success/error
- [ ] **Password Tab**:
  - [ ] Current password field
  - [ ] New password field
  - [ ] Confirm password field
  - [ ] Show/hide toggle works (if implemented)
  - [ ] Validation messages clear
  - [ ] Toast notification on success
- [ ] **Loading State**: ProfileSkeleton displays

---

## ♿ Accessibility

### Keyboard Navigation
- [ ] All interactive elements focusable with Tab
- [ ] Focus order is logical
- [ ] Focus indicators visible (focus-visible:ring-2)
- [ ] Escape key closes dialogs/modals
- [ ] Enter key submits forms

### Screen Reader Support
- [ ] All images have alt text
- [ ] Buttons have aria-label where needed
- [ ] Form fields have associated labels
- [ ] Error messages announced
- [ ] Status changes announced

### Color & Contrast
- [ ] Text contrast ratio ≥4.5:1 (WCAG AA)
- [ ] Interactive elements distinguishable
- [ ] Status badges use color + icon/text
- [ ] Dark mode: All colors have sufficient contrast

### Touch Targets
- [ ] All buttons ≥44px × 44px
- [ ] Links have adequate spacing
- [ ] Form inputs easy to tap
- [ ] No overlapping touch areas

---

## 🌙 Dark Mode

### Theme Switching
- [ ] Dark mode toggle works
- [ ] Preference persists across sessions
- [ ] System preference respected

### Component Compatibility
- [ ] All cards render correctly
- [ ] Text remains readable
- [ ] Borders visible but subtle
- [ ] Images don't appear too bright
- [ ] Shadows adjusted for dark backgrounds
- [ ] Status badges maintain contrast

---

## ⚡ Performance

### Lighthouse Scores (Mobile)
- [ ] Performance: ≥90
- [ ] Accessibility: ≥90
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

### Loading States
- [ ] Skeleton screens display immediately
- [ ] No layout shift during load
- [ ] Images lazy load where appropriate
- [ ] Smooth transitions (no jank)

### Animations
- [ ] Hover effects smooth (transition-all)
- [ ] Scale transforms use GPU (scale-[1.02])
- [ ] No heavy parallax effects
- [ ] Reduced motion respected (prefers-reduced-motion)

### Bundle Size
- [ ] No unnecessary dependencies
- [ ] Images optimized (Next.js Image)
- [ ] Code splitting effective
- [ ] Tree shaking working

---

## 🧪 Browser Testing

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] Safari iOS (iPhone)
- [ ] Chrome Android
- [ ] Samsung Internet
- [ ] Firefox Mobile

### Device Testing
- [ ] iPhone SE (320px)
- [ ] iPhone 12/13 (375px)
- [ ] iPhone 14 Pro Max (430px)
- [ ] iPad (768px)
- [ ] iPad Pro (1024px)
- [ ] Desktop (1920px)

---

## 🐛 Known Issues & Edge Cases

### To Test
- [ ] Very long property names
- [ ] Properties with no images
- [ ] Properties with 100+ images
- [ ] Bookings with special characters
- [ ] Network errors during form submission
- [ ] Slow 3G connection
- [ ] Offline mode (if PWA)

### Error Handling
- [ ] 404 pages styled correctly
- [ ] 500 errors show friendly message
- [ ] Form validation errors clear
- [ ] Network errors have retry option
- [ ] Empty states informative

---

## ✅ Final Checklist

Before marking as complete:
- [ ] All pages tested on real devices
- [ ] Lighthouse scores meet targets
- [ ] Accessibility audit passed
- [ ] Dark mode fully functional
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] All loading states implemented
- [ ] All empty states implemented
- [ ] Documentation updated
- [ ] Screenshots captured for reference

---

## 📸 Testing Tools

### Recommended Tools
- **Chrome DevTools**: Device emulation, Lighthouse
- **Firefox DevTools**: Responsive design mode
- **Safari Web Inspector**: iOS testing
- **axe DevTools**: Accessibility testing
- **WAVE**: Web accessibility evaluation
- **Lighthouse CI**: Automated performance testing
- **BrowserStack**: Cross-browser testing
- **Real devices**: iPhone, Android, iPad

### Testing Commands
```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run Lighthouse
npm run lighthouse

# Type check
npm run type-check

# Lint
npm run lint
```

---

## 📝 Notes

- Test on real devices whenever possible
- Use Chrome DevTools throttling for slow connections
- Test with screen reader (VoiceOver on Mac, NVDA on Windows)
- Verify all interactive elements with keyboard only
- Check color contrast with browser extensions
- Test form submissions with various inputs
- Verify error states and edge cases

---

**Last Updated**: 2025-10-10
**Version**: 1.0
**Status**: Ready for Testing

