import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking properties in database...');
  
  const properties = await prisma.property.findMany({
    include: {
      owner: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  });

  console.log(`Found ${properties.length} properties:`);
  
  properties.forEach((property, index) => {
    console.log(`\n${index + 1}. Property: ${property.name}`);
    console.log(`   ID: ${property.id}`);
    console.log(`   Owner ID: ${property.ownerId}`);
    console.log(`   Owner Name: ${property.owner?.name || 'N/A'}`);
    console.log(`   Owner Email: ${property.owner?.email || 'N/A'}`);
    console.log(`   Status: ${property.status}`);
    console.log(`   Created: ${property.createdAt}`);
  });

  console.log('\n🔍 Checking current user...');
  const currentUserId = 'cmg0yqi010000uoyot022vy1r';
  const user = await prisma.user.findUnique({
    where: { id: currentUserId }
  });

  if (user) {
    console.log(`Current User: ${user.name} (${user.email})`);
    console.log(`User ID: ${user.id}`);
    console.log(`User Role: ${user.role}`);
  } else {
    console.log('Current user not found!');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
