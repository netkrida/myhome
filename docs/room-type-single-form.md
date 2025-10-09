# Room Type Single Form - Documentation

## Overview

Form untuk menambahkan jenis kamar telah diubah dari **multi-step form** menjadi **single-page form** yang mencakup semua input dalam satu halaman dengan scrolling.

## Changes Made

### From Multi-Step to Single Form

**Before**: 5 separate steps dengan navigation
**After**: 1 halaman dengan 5 sections yang dapat di-scroll

### Benefits

1. **Faster Input** - User dapat melihat semua field sekaligus
2. **Better Overview** - Dapat melihat progress keseluruhan
3. **Easier Navigation** - Scroll lebih natural daripada next/previous
4. **Simpler UX** - Tidak perlu navigasi antar step
5. **Better for Desktop** - Memanfaatkan layar besar dengan baik

## Form Structure

### Section 1: Informasi Jenis Kamar 📋

**Fields**:
- Nama Jenis Kamar* (text)
- Jumlah Kamar* (number, 1-100)
- Lantai* (number, 1-50)
- Ukuran Kamar (text, optional)

**Layout**: 2-column grid (responsive)

**Validation**:
- ✅ Room type name required (max 100 chars)
- ✅ Total rooms: 1-100
- ✅ Floor: 1-50
- ✅ Size: max 50 chars (optional)

---

### Section 2: Deskripsi Jenis Kamar ✍️

**Fields**:
- Deskripsi (textarea, optional, max 1000 chars)

**Features**:
- Tips menulis deskripsi yang baik
- Character counter (via validation)

**Layout**: Full-width textarea

---

### Section 3: Foto Kamar 📸

**Features**:
- Upload 1-10 foto kamar
- Auto-upload to Cloudinary
- Image preview grid (2-4 columns responsive)
- Upload progress indicators
- Remove/retry functionality
- Drag & drop support

**Validation**:
- ✅ Minimal 1 foto required
- ✅ Max 10 foto
- ✅ File type: image/* only
- ✅ Max size: 5MB per file

**Upload Process**:
1. User selects images
2. Client validates file type & size
3. Creates preview with object URL
4. Uploads to `/api/upload/image`
5. Stores Cloudinary URL
6. Shows upload progress & status

**Visual States**:
- Uploading: Spinner overlay
- Uploaded: Normal display with remove button
- Error: Red overlay with retry button

---

### Section 4: Fasilitas Kamar 🛋️

**Categories**:
1. **Fasilitas Kamar** (Bed icon)
   - Kasur, Lemari, Meja belajar, AC, TV, dll.
2. **Fasilitas Kamar Mandi** (Bath icon)
   - Kamar mandi dalam, Water heater, Shower, dll.

**Features**:
- Checkbox grid (3 columns responsive)
- "Pilih Semua" / "Hapus Semua" per category
- Visual feedback for selected items
- Counter badges showing selected/total
- Click anywhere on card to toggle

**Validation**:
- ✅ Minimal 1 fasilitas required (any category)

**Visual Design**:
- Selected: Primary border + background tint + checkmark icon
- Unselected: Muted border + hover effect

---

### Section 5: Harga Sewa 💰

**Fields**:
- Harga Bulanan* (number, required)
- Harga Harian (number, optional)
- Harga Mingguan (number, optional)
- Harga 3 Bulan (number, optional)
- Harga Tahunan (number, optional)

**Layout**: 
- Monthly price: Full width (highlighted)
- Other prices: 2-column grid

**Validation**:
- ✅ Monthly price required & must be > 0
- ✅ All optional prices must be > 0 if provided

**Features**:
- Number input with step 10000
- Tips menentukan harga

---

## Form Behavior

### Validation

**Real-time Validation**:
- Uses React Hook Form with Zod schema
- Validates on change (`mode: "onChange"`)
- Shows error messages below fields
- Required fields marked with red asterisk

**Submit Validation**:
- Validates all required fields
- Checks uploaded images count
- Shows toast error if validation fails

### Image Upload

**State Management**:
```typescript
interface ImageUpload {
  file: File;
  preview: string;
  uploading: boolean;
  uploaded: boolean;
  url?: string;
  error?: string;
}
```

**Upload Flow**:
1. File selection triggers validation
2. Valid files added to uploads array
3. Auto-upload starts immediately
4. Progress tracked per image
5. Success/error states updated
6. Toast notifications for feedback

### Facility Selection

**State Management**:
- `selectedFacilities`: Array of facility IDs
- Synced with form.facilities via setValue

**Toggle Logic**:
- Click anywhere on card to toggle
- Checkbox also clickable independently
- Updates both visual state and form value

**Bulk Actions**:
- "Pilih Semua": Selects all in category
- "Hapus Semua": Deselects all in category
- Preserves selections in other category

### Form Submission

**Data Structure**:
```typescript
{
  propertyId: string;
  roomType: string;
  totalRooms: number;
  floor: number;
  size?: string;
  description?: string;
  images: Array<{ url: string; publicId: string }>;
  facilities: RoomFacility[];
  monthlyPrice: number;
  dailyPrice?: number;
  weeklyPrice?: number;
  quarterlyPrice?: number;
  yearlyPrice?: number;
}
```

**Submission Flow**:
1. Validate form data
2. Check uploaded images
3. Combine all data
4. Call API (TODO: implement)
5. Show loading state
6. Redirect on success
7. Show error toast on failure

---

## UI/UX Features

### Visual Hierarchy

**Card-based Sections**:
- Each section in separate Card component
- Clear titles with icons
- Descriptive subtitles
- Consistent spacing

**Icons**:
- 📋 Bed - Room Type Info
- ✍️ FileText - Description
- 📸 ImageIcon - Photos
- 🛋️ Home - Facilities
- 💰 DollarSign - Pricing

### Responsive Design

**Breakpoints**:
- Mobile: 1 column
- Tablet (md): 2 columns
- Desktop (lg): 3 columns (facilities)

**Grid Layouts**:
- Form fields: 1-2 columns
- Image grid: 2-4 columns
- Facility grid: 1-3 columns

### User Feedback

**Loading States**:
- Image upload: Spinner overlay
- Form submit: Button disabled + spinner

**Success States**:
- Upload complete: Checkmark icon
- Facility selected: Primary styling + checkmark

**Error States**:
- Upload failed: Red overlay + retry button
- Validation error: Red text below field

**Toast Notifications**:
- Upload success/error per image
- Form submit success/error
- File validation errors

---

## Technical Implementation

### Dependencies

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ROOM_FACILITIES } from "@/server/types/room";
```

### Form Schema

```typescript
const roomTypeSchema = z.object({
  roomType: z.string().min(1).max(100),
  totalRooms: z.coerce.number().int().min(1).max(100),
  floor: z.coerce.number().int().min(1).max(50),
  size: z.string().max(50).optional(),
  description: z.string().max(1000).optional(),
  facilities: z.array(z.any()).min(1),
  monthlyPrice: z.coerce.number().positive(),
  dailyPrice: z.coerce.number().positive().nullable().optional(),
  weeklyPrice: z.coerce.number().positive().nullable().optional(),
  quarterlyPrice: z.coerce.number().positive().nullable().optional(),
  yearlyPrice: z.coerce.number().positive().nullable().optional(),
});
```

### State Management

**Form State**: React Hook Form
**Upload State**: Local useState
**Facility State**: Local useState + synced to form

### API Integration

**Image Upload**: `/api/upload/image`
- Method: POST
- Body: FormData with file
- Category: `room-photos`
- Subcategory: `room-type`

**Room Type Creation**: TODO
- Will create N rooms with same type
- Auto-generate room numbers
- Apply same data to all rooms

---

## Files Modified

**Modified**:
- `src/app/(protected-pages)/dashboard/adminkos/properties/[id]/add-room-type/page.tsx`
  - Complete rewrite from multi-step to single form
  - Added all 5 sections in one page
  - Implemented image upload logic
  - Implemented facility selection logic
  - Added form validation and submission

**Removed** (no longer needed):
- `src/components/dashboard/adminkos/room-type/step-1-room-type-info.tsx`
- `src/components/dashboard/adminkos/room-type/step-2-description.tsx`
- `src/components/dashboard/adminkos/room-type/step-3-photos.tsx`
- `src/components/dashboard/adminkos/room-type/step-4-facilities.tsx`
- `src/components/dashboard/adminkos/room-type/step-5-pricing.tsx`
- `src/components/dashboard/adminkos/room-type/index.ts`

---

## Next Steps

1. **Implement API Endpoint** for creating room type
   - Create multiple rooms with same type
   - Auto-generate room numbers
   - Handle image associations
   - Handle facility associations

2. **Test Form** thoroughly
   - All field validations
   - Image upload flow
   - Facility selection
   - Form submission

3. **Consider Enhancements**
   - Form auto-save (localStorage)
   - Room number preview
   - Price calculator
   - Facility templates

---

## Comparison: Multi-Step vs Single Form

| Aspect | Multi-Step | Single Form |
|--------|-----------|-------------|
| **Navigation** | Next/Previous buttons | Scroll |
| **Overview** | One step at a time | All sections visible |
| **Progress** | Step indicator | Scroll position |
| **Validation** | Per step | Real-time all fields |
| **UX** | Guided, sequential | Free-form, flexible |
| **Mobile** | Better for small screens | Requires more scrolling |
| **Desktop** | Underutilizes space | Better space usage |
| **Complexity** | More components | Single component |
| **State** | Distributed | Centralized |

**Decision**: Single form chosen for better desktop experience and simpler implementation.


