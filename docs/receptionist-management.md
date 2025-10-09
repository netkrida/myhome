# Receptionist Management System

Dokumentasi lengkap untuk sistem manajemen receptionist dan shift kerja di dashboard AdminKos.

## 📋 Overview

Sistem ini memungkinkan AdminKos untuk:
- ✅ Mendaftarkan receptionist baru
- ✅ Melihat daftar receptionist yang terdaftar
- ✅ Mengatur jadwal shift kerja (pagi/siang/malam)
- ✅ Melihat kalender shift mingguan
- ✅ Tracking jam kerja dan statistik
- ✅ Mengelola status aktif/nonaktif receptionist

## 🗄️ Database Schema

### ReceptionistProfile Model
```prisma
model ReceptionistProfile {
  id             String            @id @default(cuid())
  userId         String            @unique
  propertyId     String?
  startDate      DateTime?
  defaultShift   Shift?
  gender         String?
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt
  user           User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  property       Property?         @relation(fields: [propertyId], references: [id], onDelete: SetNull)
  shiftAssignments ShiftAssignment[]
}
```

### ShiftAssignment Model
```prisma
model ShiftAssignment {
  id                  String              @id @default(cuid())
  receptionistId      String
  propertyId          String
  shiftType           Shift
  date                DateTime            @db.Date
  startTime           String              @db.VarChar(5) // HH:mm format
  endTime             String              @db.VarChar(5) // HH:mm format
  notes               String?             @db.Text
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt
  createdBy           String
  receptionist        ReceptionistProfile @relation(fields: [receptionistId], references: [id], onDelete: Cascade)
  property            Property            @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  creator             User                @relation("ShiftCreator", fields: [createdBy], references: [id])

  @@unique([receptionistId, date, shiftType])
}
```

### Shift Enum
```prisma
enum Shift {
  MORNING   // Pagi: 07:00 - 15:00
  EVENING   // Siang: 15:00 - 23:00
  NIGHT     // Malam: 23:00 - 07:00
}
```

## 🏗️ Architecture (3-Tier)

### Tier 3: Data Access Layer
- **`src/server/repositories/receptionist.repository.ts`**
  - `getList()` - Get receptionists with filters
  - `getById()` - Get receptionist details
  - `create()` - Create receptionist profile
  - `update()` - Update receptionist
  - `delete()` - Soft delete (deactivate)

- **`src/server/repositories/shift.repository.ts`**
  - `getList()` - Get shift assignments
  - `getById()` - Get shift details
  - `create()` - Create shift assignment
  - `update()` - Update shift
  - `delete()` - Delete shift
  - `getWeeklyCalendar()` - Get weekly calendar view
  - `checkConflict()` - Check for shift conflicts

### Tier 2: Business Logic Layer
- **`src/server/services/receptionist.service.ts`**
  - Password generation
  - Validation logic
  - Email invitation content
  - Phone number sanitization

- **`src/server/services/shift.service.ts`**
  - Shift time calculations
  - Conflict detection
  - Date/time utilities
  - Statistics calculations

- **`src/server/api/receptionist.api.ts`**
  - Orchestrates receptionist CRUD operations
  - Handles user creation with RECEPTIONIST role
  - Manages profile creation

- **`src/server/api/shift.api.ts`**
  - Orchestrates shift management
  - Handles bulk shift creation
  - Manages calendar views

### Tier 1: HTTP API Layer
- **`GET/POST /api/adminkos/receptionist`**
  - List receptionists with filters
  - Create new receptionist

- **`GET/PATCH/DELETE /api/adminkos/receptionist/[id]`**
  - Get receptionist details
  - Update receptionist
  - Delete (deactivate) receptionist

- **`GET/POST /api/adminkos/shift`**
  - List shift assignments
  - Create shift (single or bulk)

- **`GET /api/adminkos/shift/calendar`**
  - Get weekly calendar view

## 🎨 UI Components

### Main Page
- **`src/app/(protected-pages)/dashboard/adminkos/receptionist/page.tsx`**
  - Server component
  - Fetches initial data
  - Role-based access control

- **`src/app/(protected-pages)/dashboard/adminkos/receptionist/receptionist-page-client.tsx`**
  - Client component with tabs
  - State management
  - Filter handling

### Components
1. **`ReceptionistTable`**
   - Displays receptionist list
   - Pagination
   - Quick actions (view, toggle status)
   - Avatar with initials
   - Shift badges with colors

2. **`AddReceptionistDialog`**
   - Multi-section form
   - Auto password generation
   - Email invitation option
   - Property assignment
   - Default shift selection

3. **`ReceptionistDetailDrawer`**
   - Full receptionist details
   - Contact information
   - Assignment info
   - Monthly statistics
   - Recent shift history (7 days)

4. **`ShiftCalendar`**
   - Weekly calendar grid view
   - Color-coded shifts
   - Week navigation
   - Property selector
   - Click to add shift

5. **`AddShiftDialog`**
   - Quick shift assignment
   - Receptionist selector
   - Auto time range
   - Notes field

## 🎯 Features

### Receptionist Management
- ✅ **Create Receptionist**
  - Auto-generate password (12 chars)
  - Email invitation (optional)
  - Property assignment
  - Default shift setting
  - Gender selection

- ✅ **List & Filter**
  - Search by name/email
  - Filter by property
  - Filter by shift
  - Filter by status (active/inactive)
  - Pagination (20 per page)

- ✅ **View Details**
  - Personal info
  - Contact details
  - Assignment info
  - Monthly statistics
  - Recent shift history

- ✅ **Update & Delete**
  - Edit receptionist info
  - Toggle active status
  - Soft delete (deactivate)

### Shift Management
- ✅ **Weekly Calendar View**
  - 7-day grid layout
  - 3 shift types per day
  - Color-coded shifts
  - Week navigation
  - Property filter

- ✅ **Assign Shifts**
  - Click-to-add interface
  - Auto time ranges
  - Conflict detection
  - Notes support
  - Bulk assignment (API ready)

- ✅ **Shift Statistics**
  - Total shifts this month
  - Total hours worked
  - Shift breakdown by type
  - Recent history

## 🎨 UI/UX Design

### Color Scheme
- **Morning Shift**: Emerald/Green (`bg-emerald-500`)
- **Evening Shift**: Blue (`bg-blue-500`)
- **Night Shift**: Purple (`bg-purple-500`)

### Status Badges
- **Active**: Default badge (blue)
- **Inactive**: Secondary badge (gray)

### Layout
- **Desktop**: Table + Calendar side-by-side
- **Mobile**: Responsive cards + stacked layout
- **Tabs**: List view | Shift calendar

### Icons (Lucide)
- `Users` - Receptionist list
- `Calendar` - Shift calendar
- `Plus` - Add actions
- `Eye` - View details
- `UserX` - Deactivate
- `Clock` - Shift time
- `MapPin` - Property location

## 📊 Data Flow

### Create Receptionist
```
User fills form → Validate → Create User (RECEPTIONIST role) → Create Profile → Send invitation (optional) → Success
```

### Assign Shift
```
Select date & shift → Choose receptionist → Check conflict → Create assignment → Update calendar → Success
```

### View Calendar
```
Select property → Select week → Fetch shifts → Group by date & shift type → Render grid → Display
```

## 🔐 Security & Permissions

### Authorization
- Only **ADMINKOS** role can access
- Can only manage receptionists for own properties
- Verified at API and repository level

### Validation
- Email format validation
- Phone number sanitization
- Password strength (min 8 chars)
- Date validation (no past dates for shifts)
- Conflict detection (unique constraint)

## 📝 API Examples

### Create Receptionist
```typescript
POST /api/adminkos/receptionist
{
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "08123456789",
  "gender": "MALE",
  "propertyId": "prop_123",
  "defaultShift": "MORNING",
  "sendInvitation": true
}
```

### Assign Shift
```typescript
POST /api/adminkos/shift
{
  "receptionistId": "recep_123",
  "propertyId": "prop_123",
  "shiftType": "MORNING",
  "date": "2024-01-15T00:00:00.000Z",
  "notes": "Training day"
}
```

### Get Weekly Calendar
```typescript
GET /api/adminkos/shift/calendar?propertyId=prop_123&weekStart=2024-01-15T00:00:00.000Z
```

## 🚀 Setup Instructions

### 1. Database Migration
```bash
npx prisma migrate dev --name add_receptionist_shift_management
npx prisma generate
```

### 2. Verify Installation
- Check `/dashboard/adminkos/receptionist` page loads
- Test creating a receptionist
- Test assigning shifts
- Verify calendar view

### 3. Optional: Email Integration
Update `ReceptionistAPI.create()` to send actual emails:
```typescript
if (data.sendInvitation) {
  const emailContent = ReceptionistService.generateInvitationEmail(...);
  await EmailService.send(data.email, emailContent);
}
```

## 🔄 Future Enhancements

- [ ] Drag & drop shift assignment
- [ ] Shift swap requests
- [ ] Attendance tracking
- [ ] Leave management
- [ ] Performance metrics
- [ ] Export shift reports
- [ ] WhatsApp notifications
- [ ] Shift templates
- [ ] Recurring shift patterns
- [ ] Overtime calculations

## 📚 Related Documentation

- [3-Tier Architecture](./architecture.md)
- [User Management](./user-management.md)
- [Property Management](./property-management.md)
- [Booking System](./booking-system.md)

## 🐛 Troubleshooting

### Issue: Receptionist not showing in calendar
- **Solution**: Check if receptionist is assigned to the selected property
- **Solution**: Verify receptionist status is active

### Issue: Cannot assign shift
- **Solution**: Check for existing shift on same date/type
- **Solution**: Verify date is not in the past

### Issue: Password not generated
- **Solution**: Check if password field is empty in form
- **Solution**: Verify bcrypt is installed

## ✅ Testing Checklist

- [ ] Create receptionist with all fields
- [ ] Create receptionist with minimal fields
- [ ] Search receptionist by name
- [ ] Filter by property
- [ ] Filter by shift
- [ ] View receptionist details
- [ ] Toggle receptionist status
- [ ] Assign shift to receptionist
- [ ] View weekly calendar
- [ ] Navigate between weeks
- [ ] Check conflict detection
- [ ] Verify statistics calculation
- [ ] Test pagination
- [ ] Test responsive design

