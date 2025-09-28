import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProperties() {
  try {
    console.log('🔍 Checking all properties in database...\n');
    
    const allProperties = await prisma.property.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        latitude: true,
        longitude: true,
        propertyType: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Total properties found: ${allProperties.length}\n`);

    allProperties.forEach((property, index) => {
      console.log(`${index + 1}. ${property.name}`);
      console.log(`   ID: ${property.id}`);
      console.log(`   Status: ${property.status}`);
      console.log(`   Type: ${property.propertyType}`);
      console.log(`   Latitude: ${property.latitude}`);
      console.log(`   Longitude: ${property.longitude}`);
      console.log(`   Created: ${property.createdAt}`);
      console.log('');
    });

    // Check specifically approved properties with coordinates
    const approvedWithCoords = await prisma.property.findMany({
      where: {
        status: 'APPROVED',
        AND: [
          { latitude: { gt: 0 } },
          { longitude: { gt: 0 } },
        ],
      },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        propertyType: true,
      }
    });

    console.log(`🎯 Approved properties with valid coordinates: ${approvedWithCoords.length}\n`);
    
    if (approvedWithCoords.length > 0) {
      approvedWithCoords.forEach((property, index) => {
        console.log(`${index + 1}. ${property.name}`);
        console.log(`   Coordinates: ${property.latitude}, ${property.longitude}`);
        console.log(`   Type: ${property.propertyType}`);
        console.log('');
      });
    } else {
      console.log('❌ No approved properties with valid coordinates found!');
      console.log('💡 This explains why the map shows no markers.');
    }

  } catch (error) {
    console.error('❌ Error checking properties:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProperties();
