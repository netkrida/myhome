# 🌱 Comprehensive Seed Data Guide

This guide explains the comprehensive seed data that has been created for the MultiKost property management system.

## 📋 Overview

The seed data includes:
- **6 Properties** across different types and locations
- **24 Rooms** with varied pricing and facilities
- **8 Users** across all roles (SUPERADMIN, ADMINKOS, RECEPTIONIST, CUSTOMER)
- **6 Bookings** with different statuses and scenarios

## 🏠 Properties Created

### 1. **Kos Mawar Premium** (Mixed - Premium)
- **Location**: Jl. Sudirman No. 123, Menteng, Jakarta Pusat
- **Type**: KOS_CAMPUR (Mixed)
- **Owner**: Ahmad Wijaya (admin@kosmawar.com)
- **Rooms**: 8 rooms (Single, Shared, VIP)
- **Price Range**: Rp 1,100,000 - Rp 2,700,000/month
- **Features**: Co-working space, rooftop garden, near MRT

### 2. **Kos Melati Putri Kemang** (Female Only)
- **Location**: Jl. Kemang Raya No. 456, Kemang, Jakarta Selatan
- **Type**: KOS_PUTRI (Female Only)
- **Owner**: Siti Rahayu (siti.rahayu@kosputri.com)
- **Rooms**: 5 rooms (Single, Shared)
- **Price Range**: Rp 1,000,000 - Rp 1,650,000/month
- **Features**: Female security 24/7, near TransJakarta

### 3. **Kos Putra Mandiri Tebet** (Male Only)
- **Location**: Jl. Tebet Raya No. 789, Tebet, Jakarta Selatan
- **Type**: KOS_PUTRA (Male Only)
- **Owner**: Ahmad Wijaya (admin@kosmawar.com)
- **Rooms**: 4 rooms (Single, Double, Shared)
- **Price Range**: Rp 950,000 - Rp 1,800,000/month
- **Features**: Near Tebet station, mosque

### 4. **Kos Ekonomis Margonda Depok** (Budget)
- **Location**: Jl. Margonda Raya No. 321, Pondok Cina, Depok
- **Type**: KOS_CAMPUR (Mixed)
- **Owner**: Budi Santoso (budi.santoso@kosekonomi.com)
- **Rooms**: 3 rooms (Single, Shared)
- **Price Range**: Rp 800,000 - Rp 1,200,000/month
- **Features**: Near UI campus, budget-friendly

### 5. **Kos Premium Senayan City** (Luxury)
- **Location**: Jl. Asia Afrika No. 88, Senayan, Jakarta Pusat
- **Type**: KOS_CAMPUR (Mixed)
- **Owner**: Ahmad Wijaya (admin@kosmawar.com)
- **Rooms**: 2 VIP rooms
- **Price Range**: Rp 4,000,000 - Rp 4,500,000/month
- **Features**: Gym & spa, rooftop pool, business center

### 6. **Kos Putri Bintaro Residence** (Inactive)
- **Location**: Jl. Bintaro Utama No. 456, Bintaro, Tangerang Selatan
- **Type**: KOS_PUTRI (Female Only)
- **Owner**: Siti Rahayu (siti.rahayu@kosputri.com)
- **Status**: **INACTIVE** (for testing inactive properties)
- **Rooms**: 2 rooms (inactive)

## 👥 User Accounts

### 🔴 SUPERADMIN
- **Email**: superadmin@multikost.com
- **Password**: password123
- **Role**: Manage AdminKos accounts and system overview

### 🔵 ADMINKOS (Property Owners)
1. **Ahmad Wijaya**
   - **Email**: admin@kosmawar.com
   - **Password**: password123
   - **Properties**: Kos Mawar Premium, Kos Putra Tebet, Kos Premium Senayan

2. **Siti Rahayu**
   - **Email**: siti.rahayu@kosputri.com
   - **Password**: password123
   - **Properties**: Kos Melati Putri, Kos Putri Bintaro (inactive)

3. **Budi Santoso**
   - **Email**: budi.santoso@kosekonomi.com
   - **Password**: password123
   - **Properties**: Kos Ekonomis Depok

### 🟡 RECEPTIONIST
- **Email**: receptionist@kosmawar.com
- **Password**: password123
- **Shift**: Morning shift
- **Role**: Handle bookings and validations

### 🟢 CUSTOMERS
1. **Budi Santoso** (Student)
   - **Email**: budi.santoso@student.ui.ac.id
   - **Password**: password123
   - **Status**: Has active and past bookings

2. **Sarah Putri** (Student)
   - **Email**: sarah.putri@student.itb.ac.id
   - **Password**: password123
   - **Status**: Has pending booking

3. **Andi Pratama** (Student)
   - **Email**: andi.pratama@student.unpad.ac.id
   - **Password**: password123
   - **Status**: Has confirmed booking

4. **Dewi Sartika** (Worker)
   - **Email**: dewi.sartika@worker.com
   - **Password**: password123
   - **Status**: Has cancelled booking

5. **Rizki Ramadhan** (Freelancer)
   - **Email**: rizki.ramadhan@freelancer.com
   - **Password**: password123
   - **Status**: Has daily booking

## 📅 Booking Scenarios

### 1. **Active Booking** (CHECKED_IN)
- **Customer**: Budi Santoso
- **Property**: Kos Mawar Premium
- **Duration**: 6 months (Feb - Aug 2024)
- **Status**: Currently staying
- **Payment**: Fully paid

### 2. **Pending Booking** (PENDING)
- **Customer**: Sarah Putri
- **Property**: Kos Melati Putri
- **Duration**: 9 months (Mar - Dec 2024)
- **Status**: Waiting for document verification
- **Payment**: Partial payment (2 months)

### 3. **Confirmed Booking** (CONFIRMED)
- **Customer**: Andi Pratama
- **Property**: Kos Putra Tebet
- **Duration**: 10 months (Apr 2024 - Jan 2025)
- **Status**: Ready to check in
- **Payment**: 3 months advance

### 4. **Completed Booking** (CHECKED_OUT)
- **Customer**: Budi Santoso
- **Property**: Previous stay
- **Duration**: 5 months (Aug - Dec 2023)
- **Status**: Successfully completed
- **Payment**: Fully paid

### 5. **Cancelled Booking** (CANCELLED)
- **Customer**: Dewi Sartika
- **Duration**: 6 months (May - Nov 2024)
- **Status**: Cancelled due to job relocation
- **Payment**: No payment made

### 6. **Daily Booking** (CHECKED_IN)
- **Customer**: Rizki Ramadhan
- **Duration**: 7 days (Mar 20-27, 2024)
- **Status**: Short-term stay for project
- **Payment**: Fully paid

## 🚀 How to Use

### 1. **Run the Seed Script**
```bash
npm run db:seed
```

### 2. **Access the System**
- Navigate to `http://localhost:3000`
- Use any of the provided credentials above
- Each role will redirect to appropriate dashboard

### 3. **Test Different Scenarios**
- **SUPERADMIN**: View all properties and manage AdminKos accounts
- **ADMINKOS**: Manage your properties and bookings
- **RECEPTIONIST**: Handle booking validations
- **CUSTOMER**: Browse properties and view booking history

### 4. **Property Management Testing**
- Navigate to `/dashboard/superadmin/properties`
- View properties on map (coordinates included)
- Filter by type, status, location
- View detailed property information
- Test search functionality

## 📊 Data Statistics

- **Total Properties**: 6 (5 active, 1 inactive)
- **Total Rooms**: 24 (varied availability)
- **Total Users**: 8 (across all roles)
- **Total Bookings**: 6 (different statuses)
- **Property Types**: Mixed (3), Female Only (2), Male Only (1)
- **Price Range**: Rp 800,000 - Rp 4,500,000/month
- **Locations**: Jakarta Pusat, Jakarta Selatan, Depok, Tangerang Selatan

## 🔧 Resetting Data

To reset and re-seed the database:
```bash
npm run db:push  # Reset database schema
npm run db:seed  # Re-run seed script
```

This comprehensive seed data provides realistic scenarios for testing all aspects of the property management system! 🎉
