# Database Seeding Guide

This directory contains database seeders for the MultiKost application, providing sample data for testing all user roles in the RBAC system.

## Quick Start

To seed the database with sample data:

```bash
npm run db:seed
```

## What Gets Seeded

### 1. User Accounts (All Roles)

#### 🔴 Superadmin Account
- **Email:** `superadmin@multikost.com`
- **Password:** `password123`
- **Role:** Manage AdminKos accounts and system settings
- **Permissions:** Full system access

#### 🔵 AdminKos Account
- **Email:** `admin@kosmawar.com`
- **Password:** `password123`
- **Role:** Property manager
- **Business:** Kos Mawar Premium
- **Permissions:** Manage properties, rooms, staff, and bookings

#### 🟡 Receptionist Account
- **Email:** `receptionist@kosmawar.com`
- **Password:** `password123`
- **Role:** Front desk staff
- **Managed by:** AdminKos (admin@kosmawar.com)
- **Permissions:** Handle bookings, validations, check-ins/check-outs

#### 🟢 Customer Accounts

**Customer 1:**
- **Email:** `budi.santoso@student.ui.ac.id`
- **Password:** `password123`
- **University:** Universitas Indonesia
- **Student ID:** 2206123456

**Customer 2:**
- **Email:** `sarah.putri@student.itb.ac.id`
- **Password:** `password123`
- **University:** Institut Teknologi Bandung
- **Student ID:** 13220456

### 2. Sample Properties

#### Kos Mawar Premium
- **Location:** Jl. Sudirman No. 123, Jakarta Pusat
- **Owner:** AdminKos (Ahmad Wijaya)
- **Amenities:** WiFi, AC, Parking, Laundry, Kitchen, Security, Cleaning Service
- **Rooms:** 4 rooms (Single, Shared, Studio types)

#### Kos Melati Modern
- **Location:** Jl. Kemang Raya No. 456, Jakarta Selatan
- **Owner:** AdminKos (Ahmad Wijaya)
- **Amenities:** WiFi, Parking, Kitchen, Security, Laundry
- **Rooms:** 3 rooms (Single, Shared types)

### 3. Sample Rooms

Total of 7 rooms across both properties:
- **Single Rooms:** 4 rooms (₹1.6M - ₹1.8M/month)
- **Shared Rooms:** 2 rooms (₹1.0M - ₹1.2M/month)
- **Studio:** 1 room (₹2.5M/month)

### 4. Sample Bookings

- **Confirmed Booking:** Customer 1 → 6-month stay (PAID)
- **Pending Booking:** Customer 2 → 9-month stay (PENDING)
- **Completed Booking:** Customer 1 → Past 5-month stay (COMPLETED)

## File Structure

```
prisma/
├── seed.ts              # Main seeder file
├── seeders/
│   ├── properties.ts    # Properties and rooms seeder
│   └── bookings.ts      # Sample bookings seeder
└── README.md           # This file
```

## Available Commands

```bash
# Run all seeders
npm run db:seed

# Reset database and run migrations
npm run db:push

# View database in Prisma Studio
npm run db:studio

# Generate Prisma client
npm run db:generate
```

## Testing Different User Roles

After seeding, you can test the application with different user roles:

### 1. Test Superadmin Features
1. Login with `superadmin@multikost.com`
2. Navigate to `/dashboard/superadmin`
3. Test AdminKos management features

### 2. Test AdminKos Features
1. Login with `admin@kosmawar.com`
2. Navigate to `/dashboard/adminkos`
3. Test property, room, and staff management

### 3. Test Receptionist Features
1. Login with `receptionist@kosmawar.com`
2. Navigate to `/dashboard/receptionist`
3. Test booking validation and check-in/check-out

### 4. Test Customer Features
1. Login with `budi.santoso@student.ui.ac.id` or `sarah.putri@student.itb.ac.id`
2. Navigate to `/dashboard/customer`
3. Test room browsing and booking features

## Important Notes

⚠️ **Development Only**: These seeders are for development and testing purposes only. Do not run in production.

🔒 **Security**: All test accounts use the same password (`password123`) for convenience. Change this in production.

🗑️ **Data Cleanup**: The seeder clears existing data before creating new records. Be careful when running on databases with important data.

## Customization

To add more sample data:

1. **More Users**: Edit `seed.ts` to add additional user accounts
2. **More Properties**: Edit `seeders/properties.ts` to add more kos properties
3. **More Bookings**: Edit `seeders/bookings.ts` to add more booking scenarios

## Troubleshooting

If seeding fails:

1. **Check Database Connection**: Ensure your database is running and accessible
2. **Run Migrations**: Make sure all Prisma migrations are applied (`npm run db:push`)
3. **Check Dependencies**: Ensure all required packages are installed (`npm install`)
4. **Clear Database**: If needed, manually clear the database and try again

For more help, check the Prisma documentation or contact the development team.
