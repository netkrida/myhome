# WhatsApp Contact Feature - Property Detail Page

## Overview
Fitur tombol "Chat AdminKos" yang mengambang di halaman detail properti publik, memungkinkan pengunjung untuk langsung menghubungi pemilik properti via WhatsApp.

## Architecture

Implementasi mengikuti **3-tier architecture pattern**:

### Tier 1: Presentation Layer (Server Component)
- **File**: `src/app/(public-pages)/property/[id]/page.tsx`
- **Responsibility**: Mengambil data dari service layer dan merender UI
- **Component**: `WhatsAppFloat` (Client Component untuk interaksi)

### Tier 2: Service Layer (Domain Logic)
- **File**: `src/server/services/property.service.ts`
- **Function**: `getPublicPropertyWithAdminWA(id: string)`
- **Responsibility**: 
  - Mengambil data dari repository
  - Normalisasi nomor telepon ke format E.164
  - Return data yang sudah diproses

### Tier 3: Data Access Layer
- **File**: `src/server/repositories/property.repository.ts`
- **Function**: `getPropertyOwnerContact(id: string)`
- **Responsibility**: Query database untuk mendapatkan informasi owner

## Files Created/Modified

### New Files
1. **`src/lib/phone.ts`**
   - Utility untuk normalisasi nomor telepon ke format E.164 Indonesia
   - Function: `normalizePhoneToE164ID(raw?: string | null): string | null`
   - Handles: `0812...`, `+62812...`, `62812...` → `628123456789`

2. **`src/lib/wa.ts`**
   - Utility untuk membuat WhatsApp link
   - Function: `buildWaLink(opts: BuildWaLinkOptions): string`
   - Supports: prefilled text, UTM parameters

3. **`src/components/public/whatsapp-float.tsx`**
   - Client Component untuk tombol WhatsApp mengambang
   - Props: `number`, `presetText`, `className`
   - Features: Auto-hide jika nomor tidak tersedia

### Modified Files
1. **`src/server/repositories/property.repository.ts`**
   - Added: `getPropertyOwnerContact()` method
   - Modified: `getPublicPropertyDetail()` to include owner data

2. **`src/server/services/property.service.ts`**
   - Added: `getPublicPropertyWithAdminWA()` method
   - Import: `normalizePhoneToE164ID` from phone utils

3. **`src/app/(public-pages)/property/[id]/page.tsx`**
   - Added: WhatsApp contact data fetching
   - Added: `<WhatsAppFloat />` component rendering

4. **`src/components/public/index.ts`**
   - Export: `WhatsAppFloat` component

## Data Flow

```
User visits /property/[id]
    ↓
PropertyDetailPage (Server Component)
    ↓
PropertyService.getPublicPropertyWithAdminWA(id)
    ↓
PropertyRepository.getPropertyOwnerContact(id)
    ↓
Prisma Query: Property + Owner (phoneNumber)
    ↓
normalizePhoneToE164ID(phoneNumber)
    ↓
Return { property, adminWa }
    ↓
Render <WhatsAppFloat number={adminWa} />
    ↓
User clicks → Opens WhatsApp with prefilled message
```

## Phone Number Normalization

### Input Formats Supported
- `0812-3456-7890` → `628123456789`
- `+62 812 3456 7890` → `628123456789`
- `62812 3456 7890` → `628123456789`
- `0812 3456 7890` → `628123456789`

### Validation Rules
1. Remove spaces and dashes
2. Remove `+` prefix if present
3. Replace leading `0` with `62`
4. Validate: only digits, starts with `62`, length 10-15 chars
5. Return `null` if invalid

## WhatsApp Link Format

```
https://wa.me/{number}?text={message}&utm_source=myhome&utm_medium=wa-float&utm_campaign=property-detail
```

### Example
```
https://wa.me/628123456789?text=Halo%20AdminKos%2C%20saya%20tertarik%20dengan%20properti%20%22Kos%20Putri%20Melati%22.%20Apakah%20kamar%20tersedia%3F&utm_source=myhome&utm_medium=wa-float&utm_campaign=property-detail
```

## UI/UX Behavior

### Display Conditions
- ✅ Show: Owner has valid phone number
- ❌ Hide: Owner has no phone number or invalid format

### Button Position
- Fixed position: bottom-right corner
- Mobile: `bottom-4 right-4`
- Desktop: `bottom-6 right-6`
- Z-index: `50` (above content, below modals)

### Styling
- Background: Green (`bg-green-500`)
- Hover: Darker green (`hover:bg-green-600`)
- Animation: Scale on hover/click
- Shadow: Large shadow for visibility
- Icon: MessageCircle (Lucide React)

### Accessibility
- `aria-label="Chat via WhatsApp"`
- `target="_blank"` with `rel="noopener noreferrer"`
- `data-analytics="wa-float"` for tracking

## Preset Message

Default message includes:
1. Property name
2. Availability question
3. Current page URL (for context)

Example:
```
Halo AdminKos, saya tertarik dengan properti "Kos Putri Melati". Apakah kamar tersedia?
```

## Security & Privacy

### Data Protection
- Phone numbers are only exposed to authenticated users in admin dashboards
- Public pages only show WhatsApp button (number is in href, not displayed)
- No phone number is rendered in HTML text

### Validation
- Only APPROVED properties show WhatsApp button
- Phone number validation prevents injection attacks
- UTM parameters are properly URL-encoded

## Testing Checklist

### Manual Testing
- [ ] Visit property detail page with owner having phone number
- [ ] Verify WhatsApp button appears at bottom-right
- [ ] Click button → Opens WhatsApp with correct number
- [ ] Verify prefilled message includes property name
- [ ] Test with different phone formats (0812, +62, 62)
- [ ] Visit property with no owner phone → Button should not appear
- [ ] Test on mobile and desktop viewports
- [ ] Verify button is above footer but below modals

### Edge Cases
- [ ] Owner with invalid phone number → Button hidden
- [ ] Owner with null phone number → Button hidden
- [ ] Property not APPROVED → No WhatsApp data returned
- [ ] Property not found → 404 page (no WhatsApp button)

## Future Enhancements

### Potential Improvements
1. **Multiple Contacts**: Support receptionist phone numbers as fallback
2. **Business Hours**: Show availability status
3. **Analytics**: Track WhatsApp button clicks
4. **A/B Testing**: Test different button positions/styles
5. **Internationalization**: Support multiple languages for preset text
6. **Rate Limiting**: Prevent spam by limiting clicks per session

### Database Schema Extension (Optional)
```prisma
model Property {
  // ... existing fields
  whatsappNumber String? @db.VarChar(20) // Override owner's number
  whatsappEnabled Boolean @default(true) // Toggle feature per property
}
```

## Troubleshooting

### Button Not Showing
1. Check if owner has `phoneNumber` in database
2. Verify phone number format is valid
3. Check property status is `APPROVED`
4. Check browser console for errors

### Wrong Number Format
1. Verify `normalizePhoneToE164ID()` logic
2. Check database value for `User.phoneNumber`
3. Test with different input formats

### WhatsApp Not Opening
1. Verify link format in browser DevTools
2. Check URL encoding of message text
3. Test on different devices/browsers

## Related Files

### Dependencies
- `lucide-react` - Icon library (MessageCircle icon)
- `@prisma/client` - Database access
- Next.js 15 - App Router, Server Components

### Type Definitions
- `src/server/types/property.ts` - Property DTOs
- `@prisma/client` - Generated Prisma types

## Maintenance Notes

### When to Update
- Owner phone number changes → Automatic (uses latest DB value)
- WhatsApp API changes → Update `buildWaLink()` function
- UI/UX changes → Update `WhatsAppFloat` component
- Business logic changes → Update `PropertyService`

### Performance Considerations
- Phone normalization is lightweight (regex + string ops)
- Repository query is optimized (select only needed fields)
- Component is client-side for interactivity
- No additional API calls (uses existing property data)

---

**Last Updated**: 2025-01-11
**Version**: 1.0.0
**Author**: Development Team

