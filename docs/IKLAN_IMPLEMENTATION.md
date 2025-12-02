# Advertisement Management System - Implementation Summary

## Overview
Sistem manajemen iklan dengan approval workflow lengkap. AdminKos mengajukan iklan → SuperAdmin approve/reject → SuperAdmin pasang di layout → Tampil di public page dengan 2 carousel.

## Database Schema

### Advertisement Model
```prisma
model Advertisement {
  id               String              @id @default(uuid())
  title            String
  description      String?             @db.Text
  imageUrl         String
  linkUrl          String?
  startDate        DateTime?
  endDate          DateTime?
  position         Int?                // Order in carousel
  isActive         Boolean             @default(true)
  
  // Approval workflow
  status           AdvertisementStatus @default(PENDING)
  submittedBy      String
  submitter        User                @relation("SubmittedAdvertisements", fields: [submittedBy], references: [id], onDelete: Cascade)
  submittedAt      DateTime            @default(now())
  
  reviewedBy       String?
  reviewer         User?               @relation("ReviewedAdvertisements", fields: [reviewedBy], references: [id], onDelete: SetNull)
  reviewedAt       DateTime?
  rejectionReason  String?             @db.Text
  
  // Layout management
  layoutSlot       Int?                // 1 = top carousel, 2 = bottom carousel
  placedAt         DateTime?
  
  createdAt        DateTime            @default(now())
  updatedAt        DateTime            @updatedAt

  @@index([status])
  @@index([layoutSlot])
  @@index([submittedBy])
  @@index([isActive])
}

enum AdvertisementStatus {
  PENDING   // Submitted, awaiting review
  APPROVED  // Approved but not placed yet
  PLACED    // Currently displayed on public page
  REJECTED  // Rejected by SuperAdmin
  EXPIRED   // End date passed (for future use)
}
```

## Architecture

### Server Layer

#### 1. Schemas (`src/server/schemas/advertisement.schema.ts`)
- `advertisementSubmitSchema`: Validasi form pengajuan (title, description, imageUrl, linkUrl, dates)
- `advertisementUpdateSchema`: Validasi update (partial fields)
- `advertisementApprovalSchema`: Validasi approve/reject (action, rejectionReason)
- `advertisementPlacementSchema`: Validasi placement (layoutSlot: 1 atau 2)

#### 2. Types (`src/server/types/advertisement.types.ts`)
```typescript
// DTO for internal use
interface AdvertisementDTO {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  linkUrl: string | null;
  startDate: Date | null;
  endDate: Date | null;
  position: number | null;
  isActive: boolean;
  status: AdvertisementStatus;
  submittedBy: string;
  submittedAt: Date;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  layoutSlot: number | null;
  placedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  submitter: { id: string; name: string | null; email: string };
  reviewer: { id: string; name: string | null; email: string } | null;
}

// Public DTO (hanya data yang ditampilkan di public page)
interface PublicAdvertisementDTO {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  linkUrl: string | null;
  position: number | null;
  layoutSlot: number;
}
```

#### 3. Repository (`src/server/repositories/advertisement.repository.ts`)
17 methods untuk database operations:
- `createSubmission()`: Create new advertisement with PENDING status
- `getById()`: Get single advertisement with full relations
- `getBySubmitter()`: Get all ads from specific AdminKos
- `getPendingAdvertisements()`: For SuperAdmin approval queue
- `getApprovedUnplacedAdvertisements()`: For SuperAdmin placement queue
- `getPlacedAdvertisements()`: Currently active ads in layout
- `getAllAdvertisements()`: All ads (SuperAdmin overview)
- `approveAdvertisement()`: Change status to APPROVED
- `rejectAdvertisement()`: Change status to REJECTED with reason
- `placeAdvertisement()`: Change status to PLACED + set layoutSlot
- `removeFromLayout()`: Change status back to APPROVED
- `updateAdvertisement()`: Update ad fields (only if PENDING/APPROVED)
- `deleteAdvertisement()`: Hard delete (only if PENDING/REJECTED)
- `toggleActiveStatus()`: Pause/resume ad without removing
- `getPublicAdvertisementsBySlot()`: For public page carousel (PLACED + isActive + layoutSlot + date range)

#### 4. Service (`src/server/services/advertisement.service.ts`)
Business logic layer dengan Result<T> pattern:
- `submitAdvertisement()`: Validate date range, create submission
- `getAdvertisementById()`: Get single ad with authorization check
- `getMyAdvertisements()`: AdminKos view their submissions
- `getPendingAdvertisements()`: SuperAdmin approval queue
- `getApprovedUnplacedAdvertisements()`: SuperAdmin placement queue
- `getPlacedAdvertisements()`: SuperAdmin layout management
- `getAllAdvertisements()`: SuperAdmin complete view
- `reviewAdvertisement()`: Approve/reject with validation (must be PENDING)
- `placeAdvertisement()`: Place in slot with validation (must be APPROVED)
- `removeFromLayout()`: Remove from public display (must be PLACED)
- `updateAdvertisement()`: Update with ownership + status checks
- `deleteAdvertisement()`: Delete with ownership + status checks (AdminKos)
- `forceDeleteAdvertisement()`: Delete any ad (SuperAdmin)
- `toggleActiveStatus()`: Pause/resume without status change
- `getPublicAdvertisementsBySlot()`: Public carousel data

### API Routes

#### AdminKos Routes

**GET /api/adminkos/iklan**
- Get all advertisements submitted by current AdminKos
- Returns: `AdvertisementDTO[]`

**POST /api/adminkos/iklan**
- Submit new advertisement
- Body: `AdvertisementSubmitInput`
- Returns: `AdvertisementDTO`

**GET /api/adminkos/iklan/[id]**
- Get single advertisement detail (with ownership check)
- Returns: `AdvertisementDTO`

**PATCH /api/adminkos/iklan/[id]**
- Update advertisement (only if PENDING or APPROVED)
- Body: `AdvertisementUpdateInput`
- Returns: `AdvertisementDTO`

**DELETE /api/adminkos/iklan/[id]**
- Delete advertisement (only if PENDING or REJECTED)
- Returns: success message

#### SuperAdmin Routes

**GET /api/superadmin/iklan**
- Get advertisements by status
- Query: `status?: 'PENDING' | 'APPROVED' | 'PLACED'`
- Returns: `AdvertisementDTO[]`

**GET /api/superadmin/iklan/[id]**
- Get single advertisement detail
- Returns: `AdvertisementDTO`

**POST /api/superadmin/iklan/[id]/review**
- Approve or reject advertisement
- Body: `{ action: 'APPROVE' | 'REJECT', rejectionReason?: string }`
- Returns: `AdvertisementDTO`

**POST /api/superadmin/iklan/[id]/place**
- Place approved ad in layout slot
- Body: `{ layoutSlot: 1 | 2 }`
- Returns: `AdvertisementDTO`

**DELETE /api/superadmin/iklan/[id]/place**
- Remove ad from layout (status back to APPROVED)
- Returns: `AdvertisementDTO`

**DELETE /api/superadmin/iklan/[id]**
- Force delete any advertisement
- Returns: success message

#### Public Route

**GET /api/public/iklan**
- Get active advertisements for specific slot
- Query: `layoutSlot: 1 | 2`
- Returns: `PublicAdvertisementDTO[]`
- Filters: status=PLACED, isActive=true, current date within range, sorted by position

### Frontend Components

#### AdminKos Dashboard (`/dashboard/adminkos/iklan`)

**Page Component** (`src/app/(protected-pages)/dashboard/adminkos/iklan/page.tsx`)
- Statistics cards (Total, Pending, Approved, Placed, Rejected)
- "Ajukan Iklan Baru" button opens dialog
- Tabbed list view with status filtering
- Real-time refresh after actions

**AdvertisementSubmitDialog** (`src/components/dashboard/adminkos/iklan/advertisement-submit-dialog.tsx`)
- React Hook Form with Zod validation
- Cloudinary image upload integration
- Date range picker (start & end date)
- Link URL input
- Dual mode: create new / edit existing
- Validation: dates, URL format

**AdvertisementList** (`src/components/dashboard/adminkos/iklan/advertisement-list.tsx`)
- 5 tabs: Semua, Pending, Approved, Terpasang, Ditolak
- Card-based layout with image preview
- Status badges with color coding
- Conditional actions based on status:
  - PENDING/REJECTED: Edit + Delete
  - APPROVED/PLACED: View only (message "Iklan tidak dapat diubah")
- Rejection reason display
- Placement info (slot number) for placed ads

#### SuperAdmin Dashboard (`/dashboard/superadmin/iklan`)

**Page Component** (`src/app/(protected-pages)/dashboard/superadmin/iklan/page.tsx`)
- Statistics cards (Total, Pending, Approved, Placed)
- 4 main tabs: Persetujuan, Penempatan, Layout, Semua Iklan
- Centralized state management for all tabs
- Parallel data fetching (4 API calls)

**PendingAdvertisements** (`src/components/dashboard/superadmin/iklan/pending-advertisements.tsx`)
- Approval queue for PENDING ads
- Image preview with enlarge dialog
- Submitter info display
- Approve button (green)
- Reject button (red) opens rejection reason dialog
- Textarea for rejection reason (required)
- Real-time UI update after approval/rejection

**ApprovedAdvertisements** (`src/components/dashboard/superadmin/iklan/approved-advertisements.tsx`)
- Placement queue for APPROVED ads
- Select dropdown for layout slot (1 or 2)
- Reviewer info display
- "Pasang ke Layout" button
- Real-time UI update after placement

**LayoutManagement** (`src/components/dashboard/superadmin/iklan/layout-management.tsx`)
- Visual layout view with 2 sections:
  - Slot 1 (Carousel Atas)
  - Slot 2 (Carousel Bawah)
- Cards grouped by layoutSlot
- Position badges
- "Lepas dari Layout" button
- Confirmation dialog before removing
- Real-time UI update after removal

**AllAdvertisements** (`src/components/dashboard/superadmin/iklan/all-advertisements.tsx`)
- Complete advertisement list
- Status filter dropdown (All, Pending, Approved, Placed, Rejected)
- Status count badges
- Detailed metadata display:
  - Submitter name & email
  - Reviewer name & email (if reviewed)
  - Dates (submitted, reviewed, placed)
  - Layout slot (if placed)
  - Rejection reason (if rejected)
- Color-coded status badges
- Force delete button (any status)

#### Public Page (`/`)

**AdvertisementCarouselSlot** (`src/components/public/advertisement-carousel-slot.tsx`)
- Embla Carousel integration
- Autoplay (5 seconds delay)
- Infinite loop
- Click handling (opens linkUrl in new tab)
- Responsive design with Tailwind
- Cloudinary image optimization
- Loading state
- Empty state fallback
- Error handling

**Homepage Integration** (`src/app/(public-pages)/page.tsx`)
```tsx
<AdvertisementCarouselSlot layoutSlot={1} /> {/* Top carousel */}
<PropertyListingSection />
<AdvertisementCarouselSlot layoutSlot={2} /> {/* Bottom carousel */}
```

### Cloudinary Integration

**CloudinaryUploadWidget** (`src/components/cloudinary/cloudinary-upload-widget.tsx`)
- Dynamic script loading
- Upload preset configuration
- Success callback with URL
- Error handling
- Button customization
- Supports single/multiple uploads

Environment variables required:
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

## User Flows

### AdminKos Flow

1. **Submit New Advertisement**
   - Navigate to `/dashboard/adminkos/iklan`
   - Click "Ajukan Iklan Baru"
   - Fill form: title, description, upload image (Cloudinary), link URL, dates
   - Submit → Status: PENDING
   - Appears in "Pending" tab

2. **Edit Pending/Rejected Advertisement**
   - Click "Edit" button on card
   - Modify fields in dialog
   - Save → Updates advertisement
   - Cannot edit APPROVED/PLACED ads

3. **Delete Pending/Rejected Advertisement**
   - Click "Hapus" button on card
   - Confirm deletion
   - Cannot delete APPROVED/PLACED ads (must contact SuperAdmin)

4. **Monitor Status**
   - Check tabs to see status changes
   - View rejection reason if rejected
   - See placement info if placed

### SuperAdmin Flow

1. **Review Pending Advertisements**
   - Navigate to `/dashboard/superadmin/iklan` → "Persetujuan" tab
   - View submitted ads with full details
   - Click "Approve" → Status: PENDING → APPROVED
   - OR Click "Reject" → Enter reason → Status: PENDING → REJECTED

2. **Place Approved Advertisements**
   - Switch to "Penempatan" tab
   - Select layout slot (1 = top, 2 = bottom)
   - Click "Pasang ke Layout" → Status: APPROVED → PLACED
   - Ad appears on public page immediately

3. **Manage Active Layout**
   - Switch to "Layout" tab
   - View ads grouped by slot
   - Click "Lepas dari Layout" to remove → Status: PLACED → APPROVED
   - Ad removed from public page immediately

4. **Overview & Cleanup**
   - Switch to "Semua Iklan" tab
   - Filter by status
   - Force delete any ad (any status)
   - View complete metadata (submitter, reviewer, dates)

### Public User Flow

1. **View Advertisements**
   - Visit homepage `/`
   - See carousel at top (layoutSlot=1)
   - Scroll down past property listings
   - See carousel at bottom (layoutSlot=2)
   - Auto-rotation every 5 seconds

2. **Click Advertisement**
   - Click on ad image/card
   - Opens linkUrl in new tab
   - Tracks engagement (future: add analytics)

## Status Workflow

```
PENDING (Initial submission by AdminKos)
  ↓
  ├─→ APPROVED (SuperAdmin approves)
  │     ↓
  │     ├─→ PLACED (SuperAdmin places in layout)
  │     │     ↓
  │     │     └─→ APPROVED (SuperAdmin removes from layout - can be re-placed)
  │     │
  │     └─→ Can edit/delete before placing
  │
  └─→ REJECTED (SuperAdmin rejects with reason)
        ↓
        └─→ AdminKos can edit & resubmit OR delete
```

## Validation Rules

### Date Validation
- If both startDate and endDate provided: `endDate >= startDate`
- Public query filters by current date: `now >= startDate AND now <= endDate`
- Empty dates = no restriction (always active)

### Status Transitions
- **Can APPROVE**: Only PENDING ads
- **Can REJECT**: Only PENDING ads
- **Can PLACE**: Only APPROVED ads
- **Can REMOVE**: Only PLACED ads
- **Can EDIT (AdminKos)**: Only PENDING or APPROVED ads
- **Can DELETE (AdminKos)**: Only PENDING or REJECTED ads
- **Can FORCE DELETE (SuperAdmin)**: Any status

### Ownership Rules
- AdminKos can only view/edit/delete their own submissions
- SuperAdmin can view/manage all advertisements
- Public users only see PLACED + isActive ads

## Error Handling

### Error Codes
- `VALIDATION_ERROR`: Invalid input (dates, required fields)
- `RESOURCE_NOT_FOUND`: Advertisement not found
- `FORBIDDEN`: Ownership violation (AdminKos accessing other's ads)
- `BUSINESS_RULE_VIOLATION`: Invalid status transition
- `INTERNAL_ERROR`: Database or unexpected errors

### Result<T> Pattern
All service methods return:
```typescript
Result<T> = 
  | { success: true; data: T; statusCode?: number }
  | { success: false; error: DomainError; statusCode: number }
```

Helpers:
- `ok(data)`: Success result
- `fail({ code, message })`: Error result (default statusCode=400)

## Testing Checklist

### AdminKos Dashboard
- [ ] Submit new advertisement with all fields
- [ ] Submit with minimal fields (only title + image)
- [ ] Upload image via Cloudinary widget
- [ ] Edit PENDING advertisement
- [ ] Edit REJECTED advertisement (after rejection)
- [ ] Try edit APPROVED ad (should show message)
- [ ] Try edit PLACED ad (should show message)
- [ ] Delete PENDING advertisement
- [ ] Delete REJECTED advertisement
- [ ] Try delete APPROVED/PLACED (should show message)
- [ ] View tabs: Semua, Pending, Approved, Terpasang, Ditolak
- [ ] Statistics cards update correctly

### SuperAdmin Dashboard
- [ ] Approve pending advertisement
- [ ] Reject pending advertisement with reason
- [ ] Try approve already approved ad (should error)
- [ ] Place approved ad to slot 1
- [ ] Place approved ad to slot 2
- [ ] Try place PENDING ad (should error)
- [ ] Remove placed ad from layout
- [ ] Re-place removed ad (back to layout)
- [ ] Force delete any status advertisement
- [ ] Filter by status in "Semua Iklan" tab
- [ ] View complete metadata for all ads
- [ ] Statistics cards update correctly

### Public Page
- [ ] Both carousels render correctly
- [ ] Autoplay works (5s interval)
- [ ] Infinite loop works
- [ ] Click on ad opens linkUrl in new tab
- [ ] Only PLACED + isActive ads appear
- [ ] Date range filtering works
- [ ] Position ordering works
- [ ] Images load from Cloudinary
- [ ] Empty state shows gracefully (no ads)

### Database Integrity
- [ ] Cascade delete: Deleting user removes their submitted ads
- [ ] SetNull: Deleting reviewer keeps reviewed ads (reviewedBy=null)
- [ ] Indexes work (status, layoutSlot, submittedBy, isActive)
- [ ] Dates stored correctly (UTC)
- [ ] Enum values validate correctly

### API Security
- [ ] AdminKos can't access other AdminKos ads
- [ ] AdminKos can't approve/reject ads (403)
- [ ] AdminKos can't place ads (403)
- [ ] SuperAdmin can access all ads
- [ ] Unauthenticated requests blocked (401)
- [ ] CORS headers correct for public API

## Deployment Notes

### Environment Variables
```env
# Required
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...

# Optional
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### Database Migration
```bash
# Development
npx prisma db push

# Production
npx prisma migrate deploy
```

### Seed SuperAdmin
```bash
npm run db:seed
# Creates superadmin@example.com / superadmin123
```

### Build & Start
```bash
npm run build
npm run start
```

### Docker (if using)
```bash
docker-compose up -d
```

## Future Enhancements

### Analytics
- Click tracking (impressions, clicks)
- A/B testing different ad positions
- Performance metrics dashboard

### Scheduling
- Cron job to auto-expire ads (status → EXPIRED)
- Auto-approve based on rules
- Scheduled placement (future startDate)

### Advanced Features
- Multiple images per ad (gallery/slideshow)
- Video ads support
- Geo-targeting (show different ads by region)
- User engagement tracking
- Payment integration (paid ads)
- Ad performance score (CTR)

### UI Improvements
- Drag & drop reordering (position)
- Bulk operations (approve multiple, delete multiple)
- Preview mode before placement
- Dark mode support
- Mobile-optimized carousels

### Notifications
- Email notification on approval/rejection
- Real-time updates via WebSocket
- Push notifications for AdminKos

## Troubleshooting

### TypeScript Errors
- Run `npx prisma generate` after schema changes
- Run `npm run typecheck` before committing
- Ensure `Result<T>` uses `ok()` and `fail()` helpers

### Cloudinary Upload Not Working
- Check `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is set
- Verify upload preset is unsigned
- Check browser console for CORS errors

### Carousel Not Auto-playing
- Ensure `autoplay` plugin initialized
- Check `delay` prop passed to Autoplay
- Verify ads exist for that layoutSlot

### Ads Not Appearing Publicly
- Verify status = PLACED
- Check isActive = true
- Verify layoutSlot matches (1 or 2)
- Check date range (startDate <= now <= endDate)
- Inspect API response `/api/public/iklan?layoutSlot=1`

## Code Maintenance

### Adding New Status
1. Update enum in `prisma/schema.prisma`
2. Run migration: `npx prisma db push`
3. Update `AdvertisementStatus` in types
4. Add transition logic in service
5. Update UI components with new status handling
6. Add tests for new status

### Adding New Layout Slot
1. Update placement schema: `layoutSlot: z.enum(['1', '2', '3'])`
2. Update UI dropdown options
3. Update public page with new carousel
4. Update documentation

### Changing Approval Workflow
1. Update service validation logic
2. Update repository methods
3. Update API controllers
4. Update UI components
5. Update tests

## Performance Optimization

### Database
- Indexes already on: status, layoutSlot, submittedBy, isActive
- Consider composite index for public query: `[status, isActive, layoutSlot]`
- Use `select` in repository to limit fields

### Frontend
- React.memo for carousel items
- useMemo for filtered lists
- Debounce search/filter inputs
- Lazy load admin components

### Caching
- Redis for public ads (5min TTL)
- SWR/React Query for admin dashboards
- CDN caching for public API

## Contact & Support
For questions about this implementation, refer to:
- This document (`IKLAN_IMPLEMENTATION.md`)
- Copilot instructions (`.github/copilot-instructions.md`)
- Database schema (`prisma/schema.prisma`)
- API documentation (`docs/API_DOCUMENTATION.md`)
