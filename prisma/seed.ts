import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
// import { seedProperties } from './seeders/properties'; // Commented out - file doesn't exist
// import { seedBookings } from './seeders/bookings'; // Removed - file doesn't exist

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (optional - be careful in production)
  console.log('🧹 Cleaning existing data...');
  await prisma.room.deleteMany();
  await prisma.property.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.receptionistProfile.deleteMany();
  await prisma.adminKosProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('👤 Creating user accounts...');

  // Hash password for all test accounts
  const hashedPassword = await bcrypt.hash('@superadmin@myhome.co5432', 12);

  // 1. Create Superadmin Account
  const superadmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@myhome.co.id',
      password: hashedPassword,
      role: 'SUPERADMIN',
      isActive: true,
      emailVerified: new Date(),
    },
  });

  console.log('✅ Created Superadmin:', superadmin.email);
  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📋 Test Account Credentials:');
  console.log('================================');
  console.log('🔴 SUPERADMIN:');
  console.log('   Email: superadmin@myhome.co.id');
  console.log('   Password: @superadmin@myhome.co5432');
  console.log('   Role: Manage AdminKos accounts');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
