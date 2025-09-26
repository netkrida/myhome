import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
// import { seedProperties } from './seeders/properties'; // Commented out - file doesn't exist
import { seedBookings } from './seeders/bookings';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (optional - be careful in production)
  console.log('🧹 Cleaning existing data...');
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.kosProperty.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.receptionistProfile.deleteMany();
  await prisma.adminKosProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('👤 Creating user accounts...');

  // Hash password for all test accounts
  const hashedPassword = await bcrypt.hash('password123', 12);

  // 1. Create Superadmin Account
  const superadmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@multikost.com',
      password: hashedPassword,
      role: 'SUPERADMIN',
      isActive: true,
      emailVerified: new Date(),
    },
  });

  console.log('✅ Created Superadmin:', superadmin.email);

  // 2. Create AdminKos Accounts
  const adminkos1 = await prisma.user.create({
    data: {
      name: 'Ahmad Wijaya',
      email: 'admin@kosmawar.com',
      password: hashedPassword,
      role: 'ADMINKOS',
      isActive: true,
      emailVerified: new Date(),
      phoneNumber: '+62812-3456-7890',
      adminKosProfile: {
        create: {
          businessName: 'Kos Mawar Premium',
          businessAddress: 'Jl. Sudirman No. 123, Jakarta Pusat, DKI Jakarta 10220',
          businessPhone: '+62812-3456-7890',
          description: 'Premium boarding house with modern facilities near UI campus. Offering comfortable and secure accommodation for students and professionals.',
        },
      },
    },
    include: {
      adminKosProfile: true,
    },
  });

  const adminkos2 = await prisma.user.create({
    data: {
      name: 'Siti Rahayu',
      email: 'siti.rahayu@kosputri.com',
      password: hashedPassword,
      role: 'ADMINKOS',
      isActive: true,
      emailVerified: new Date(),
      phoneNumber: '+62813-9876-5432',
      adminKosProfile: {
        create: {
          businessName: 'Kos Putri Siti',
          businessAddress: 'Jl. Kemang Raya No. 456, Jakarta Selatan, DKI Jakarta 12560',
          businessPhone: '+62813-9876-5432',
          description: 'Kos khusus putri dengan keamanan tinggi dan fasilitas lengkap untuk kenyamanan penghuni.',
        },
      },
    },
    include: {
      adminKosProfile: true,
    },
  });

  const adminkos3 = await prisma.user.create({
    data: {
      name: 'Budi Santoso',
      email: 'budi.santoso@kosekonomi.com',
      password: hashedPassword,
      role: 'ADMINKOS',
      isActive: true,
      emailVerified: new Date(),
      phoneNumber: '+62814-5555-6666',
      adminKosProfile: {
        create: {
          businessName: 'Kos Ekonomis Budi',
          businessAddress: 'Jl. Margonda Raya No. 321, Depok, Jawa Barat 16424',
          businessPhone: '+62814-5555-6666',
          description: 'Kos terjangkau untuk mahasiswa dengan fasilitas standar dan lokasi strategis dekat kampus.',
        },
      },
    },
    include: {
      adminKosProfile: true,
    },
  });

  console.log('✅ Created AdminKos users:', [adminkos1.email, adminkos2.email, adminkos3.email].join(', '));

  // 3. Create Receptionist Account (managed by AdminKos)
  const receptionist = await prisma.user.create({
    data: {
      name: 'Siti Nurhaliza',
      email: 'receptionist@kosmawar.com',
      password: hashedPassword,
      role: 'RECEPTIONIST',
      isActive: true,
      emailVerified: new Date(),
      phoneNumber: '+62813-9876-5432',
      receptionistProfile: {
        create: {
          shift: 'MORNING',
          startDate: new Date('2024-01-15'),
        },
      },
    },
    include: {
      receptionistProfile: true,
    },
  });

  console.log('✅ Created Receptionist:', receptionist.email);

  // 4. Create Customer Account
  const customer = await prisma.user.create({
    data: {
      name: 'Budi Santoso',
      email: 'budi.santoso@student.ui.ac.id',
      password: hashedPassword,
      role: 'CUSTOMER',
      isActive: true,
      emailVerified: new Date(),
      phoneNumber: '+62814-1234-5678',
      customerProfile: {
        create: {
          dateOfBirth: new Date('2002-05-15'),
          gender: 'MALE',
          emergencyContact: 'Ibu Santoso',
          emergencyPhone: '+62815-9999-8888',
        },
      },
    },
    include: {
      customerProfile: true,
    },
  });

  console.log('✅ Created Customer:', customer.email);

  // 5. Create Additional Sample Customer
  const customer2 = await prisma.user.create({
    data: {
      name: 'Sarah Putri',
      email: 'sarah.putri@student.itb.ac.id',
      password: hashedPassword,
      role: 'CUSTOMER',
      isActive: true,
      emailVerified: new Date(),
      phoneNumber: '+62816-5555-4444',
      customerProfile: {
        create: {
          dateOfBirth: new Date('2003-08-22'),
          gender: 'FEMALE',
          emergencyContact: 'Ayah Putri',
          emergencyPhone: '+62817-7777-6666',
        },
      },
    },
    include: {
      customerProfile: true,
    },
  });

  console.log('✅ Created Customer 2:', customer2.email);

  // 6. Create Additional Sample Customers
  const customer3 = await prisma.user.create({
    data: {
      name: 'Andi Pratama',
      email: 'andi.pratama@student.unpad.ac.id',
      password: hashedPassword,
      role: 'CUSTOMER',
      isActive: true,
      emailVerified: new Date(),
      phoneNumber: '+62818-3333-4444',
      customerProfile: {
        create: {
          dateOfBirth: new Date('2001-12-10'),
          gender: 'MALE',
          emergencyContact: 'Bapak Pratama',
          emergencyPhone: '+62819-5555-6666',
        },
      },
    },
    include: {
      customerProfile: true,
    },
  });

  const customer4 = await prisma.user.create({
    data: {
      name: 'Dewi Sartika',
      email: 'dewi.sartika@worker.com',
      password: hashedPassword,
      role: 'CUSTOMER',
      isActive: true,
      emailVerified: new Date(),
      phoneNumber: '+62820-7777-8888',
      customerProfile: {
        create: {
          dateOfBirth: new Date('1998-03-25'),
          gender: 'FEMALE',
          emergencyContact: 'Ibu Sartika',
          emergencyPhone: '+62821-9999-0000',
        },
      },
    },
    include: {
      customerProfile: true,
    },
  });

  const customer5 = await prisma.user.create({
    data: {
      name: 'Rizki Ramadhan',
      email: 'rizki.ramadhan@freelancer.com',
      password: hashedPassword,
      role: 'CUSTOMER',
      isActive: true,
      emailVerified: new Date(),
      phoneNumber: '+62822-1111-2222',
      customerProfile: {
        create: {
          dateOfBirth: new Date('1996-07-18'),
          gender: 'MALE',
          emergencyContact: 'Ibu Ramadhan',
          emergencyPhone: '+62823-3333-4444',
        },
      },
    },
    include: {
      customerProfile: true,
    },
  });

  console.log('✅ Created additional customers:', [customer3.email, customer4.email, customer5.email].join(', '));

  // Seed additional data
  // await seedProperties(); // Commented out - function doesn't exist
  await seedBookings();

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📋 Test Account Credentials:');
  console.log('================================');
  console.log('🔴 SUPERADMIN:');
  console.log('   Email: superadmin@multikost.com');
  console.log('   Password: password123');
  console.log('   Role: Manage AdminKos accounts');
  console.log('');
  console.log('🔵 ADMINKOS:');
  console.log('   Email: admin@kosmawar.com');
  console.log('   Password: password123');
  console.log('   Role: Manage properties, rooms, and staff');
  console.log('');
  console.log('🟡 RECEPTIONIST:');
  console.log('   Email: receptionist@kosmawar.com');
  console.log('   Password: password123');
  console.log('   Role: Handle bookings and validations');
  console.log('');
  console.log('🟢 CUSTOMER 1:');
  console.log('   Email: budi.santoso@student.ui.ac.id');
  console.log('   Password: password123');
  console.log('   Role: Browse and book rooms');
  console.log('');
  console.log('🟢 CUSTOMER 2:');
  console.log('   Email: sarah.putri@student.itb.ac.id');
  console.log('   Password: password123');
  console.log('   Role: Browse and book rooms');
  console.log('');
  console.log('🟢 CUSTOMER 3:');
  console.log('   Email: andi.pratama@student.unpad.ac.id');
  console.log('   Password: password123');
  console.log('   Role: Browse and book rooms');
  console.log('');
  console.log('🟢 CUSTOMER 4:');
  console.log('   Email: dewi.sartika@worker.com');
  console.log('   Password: password123');
  console.log('   Role: Browse and book rooms');
  console.log('');
  console.log('🟢 CUSTOMER 5:');
  console.log('   Email: rizki.ramadhan@freelancer.com');
  console.log('   Password: password123');
  console.log('   Role: Browse and book rooms');
  console.log('================================');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
