import { PrismaClient, BookingStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedBookings() {
  console.log('📅 Creating comprehensive sample bookings...');

  // Get sample data
  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    orderBy: { createdAt: 'asc' },
  });

  const availableRooms = await prisma.room.findMany({
    where: {
      isAvailable: true,
      isActive: true,
      property: { isActive: true }
    },
    include: { property: true },
  });

  const allRooms = await prisma.room.findMany({
    where: {
      isActive: true,
      property: { isActive: true }
    },
    include: { property: true },
  });

  if (customers.length === 0 || allRooms.length === 0) {
    console.log('⚠️ No customers or rooms found, skipping booking seeding');
    return;
  }

  // Create comprehensive sample bookings
  const bookings = [];

  // Booking 1: Active booking - Customer 1 (Budi) in Kos Mawar Premium
  if (customers[0] && availableRooms.length > 0) {
    const room = availableRooms[0];
    if (room) {
      const booking1 = await prisma.booking.create({
        data: {
          customerId: customers[0].id,
          propertyId: room.propertyId,
          roomId: room.id,
          checkInDate: new Date('2024-02-01'),
          checkOutDate: new Date('2024-08-01'), // 6 months
          bookingType: 'MONTHLY',
          totalAmount: Number(room.monthlyPrice) * 6,
        paidAmount: Number(room.monthlyPrice) * 6,
        status: BookingStatus.CHECKED_IN,
        isValidated: true,
        validatedAt: new Date('2024-01-28'),
        notes: 'Mahasiswa UI semester genap. Pembayaran lunas 6 bulan.',
        specialRequests: 'Kamar menghadap taman jika memungkinkan',
      },
    });
    bookings.push(booking1);

      // Mark room as unavailable since it's occupied
      await prisma.room.update({
        where: { id: room.id },
        data: { isAvailable: false },
      });
    }
  }

  // Booking 2: Pending booking - Customer 2 (Sarah) waiting for confirmation
  if (customers[1] && availableRooms.length > 1) {
    const room = availableRooms[1];
    if (room) {
      const booking2 = await prisma.booking.create({
        data: {
          customerId: customers[1].id,
          propertyId: room.propertyId,
          roomId: room.id,
        checkInDate: new Date('2024-03-15'),
        checkOutDate: new Date('2024-12-15'), // 9 months
        bookingType: 'MONTHLY',
        totalAmount: Number(room.monthlyPrice) * 9,
        paidAmount: Number(room.monthlyPrice) * 2, // Partial payment
        status: BookingStatus.PENDING,
        isValidated: false,
        notes: 'Menunggu verifikasi dokumen dan pelunasan pembayaran.',
        specialRequests: 'Butuh akses WiFi yang stabil untuk kuliah online',
      },
      });
      bookings.push(booking2);
    }
  }

  // Booking 3: Confirmed booking - Customer 3 (Andi) ready to check in
  if (customers[2] && availableRooms.length > 2) {
    const room = availableRooms[2];
    if (room) {
      const booking3 = await prisma.booking.create({
        data: {
          customerId: customers[2].id,
          propertyId: room.propertyId,
          roomId: room.id,
        checkInDate: new Date('2024-04-01'),
        checkOutDate: new Date('2025-01-31'), // 10 months
        bookingType: 'MONTHLY',
        totalAmount: Number(room.monthlyPrice) * 10,
        paidAmount: Number(room.monthlyPrice) * 3, // 3 months advance
        status: BookingStatus.CONFIRMED,
        isValidated: true,
        validatedAt: new Date(),
        notes: 'Mahasiswa Unpad. Sudah transfer DP 3 bulan.',
        specialRequests: 'Dekat dengan area parkir motor',
      },
      });
      bookings.push(booking3);
    }
  }

  // Booking 4: Completed booking - Customer 1 (Budi) previous stay
  if (customers[0] && allRooms.length > 3) {
    const room = allRooms[3];
    if (room) {
      const booking4 = await prisma.booking.create({
        data: {
          customerId: customers[0].id,
          propertyId: room.propertyId,
          roomId: room.id,
        checkInDate: new Date('2023-08-01'),
        checkOutDate: new Date('2023-12-31'),
        bookingType: 'MONTHLY',
        totalAmount: Number(room.monthlyPrice) * 5,
        paidAmount: Number(room.monthlyPrice) * 5,
        status: BookingStatus.CHECKED_OUT,
        isValidated: true,
        validatedAt: new Date('2023-07-28'),
        notes: 'Semester ganjil 2023. Selesai dengan baik.',
      },
      });
      bookings.push(booking4);
    }
  }

  // Booking 5: Cancelled booking - Customer 4 (Dewi) changed plans
  if (customers[3] && allRooms.length > 4) {
    const room = allRooms[4];
    if (room) {
      const booking5 = await prisma.booking.create({
        data: {
          customerId: customers[3].id,
          propertyId: room.propertyId,
          roomId: room.id,
        checkInDate: new Date('2024-05-01'),
        checkOutDate: new Date('2024-11-01'), // 6 months
        bookingType: 'MONTHLY',
        totalAmount: Number(room.monthlyPrice) * 6,
        paidAmount: 0,
        status: BookingStatus.CANCELLED,
        isValidated: false,
        notes: 'Dibatalkan karena mendapat pekerjaan di kota lain.',
      },
      });
      bookings.push(booking5);
    }
  }

  // Booking 6: Daily booking - Customer 5 (Rizki) short term stay
  if (customers[4] && availableRooms.length > 3) {
    const room = availableRooms[3];
    if (room) {
      const booking6 = await prisma.booking.create({
        data: {
          customerId: customers[4].id,
          propertyId: room.propertyId,
          roomId: room.id,
        checkInDate: new Date('2024-03-20'),
        checkOutDate: new Date('2024-03-27'), // 7 days
        bookingType: 'DAILY',
        totalAmount: Number(room.dailyPrice || 50000) * 7,
        paidAmount: Number(room.dailyPrice || 50000) * 7,
        status: BookingStatus.CHECKED_IN,
        isValidated: true,
        validatedAt: new Date('2024-03-19'),
        notes: 'Freelancer sedang project di Jakarta. Menginap seminggu.',
        specialRequests: 'Butuh meja kerja yang nyaman',
      },
      });
      bookings.push(booking6);
    }
  }

  console.log('✅ Created', bookings.length, 'comprehensive sample bookings');

  return bookings;
}
