/**
 * Demo seed data for local development.
 * Creates: one factory org, one agency org, one CA firm, and sample users.
 * Run with: pnpm db:seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.info('Seeding FactoryOS demo data...');

  const factory = await prisma.organisation.upsert({
    where: { gstin: '36ABCDE1234F1Z5' },
    update: {},
    create: {
      name: 'Hyderabad Precision Components',
      gstin: '36ABCDE1234F1Z5',
      type: 'FACTORY',
      plan: 'PRO',
    },
  });

  const agency = await prisma.organisation.upsert({
    where: { gstin: '36XYZAB5678G2H9' },
    update: {},
    create: {
      name: 'Deccan Labour Services',
      gstin: '36XYZAB5678G2H9',
      type: 'AGENCY',
      plan: 'FREE',
    },
  });

  const caFirm = await prisma.organisation.upsert({
    where: { gstin: '36PQRST9012C3D4' },
    update: {},
    create: {
      name: 'Reddy & Associates, CA',
      gstin: '36PQRST9012C3D4',
      type: 'CA_FIRM',
      plan: 'PRO',
    },
  });

  await prisma.user.upsert({
    where: { phone: '+919876543210' },
    update: {},
    create: {
      orgId: factory.id,
      name: 'Ravi Kumar',
      phone: '+919876543210',
      email: 'ravi@hyderabadprecision.in',
      role: 'OWNER',
    },
  });

  await prisma.user.upsert({
    where: { phone: '+919876543211' },
    update: {},
    create: {
      orgId: agency.id,
      name: 'Suresh Naidu',
      phone: '+919876543211',
      role: 'AGENCY_ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { phone: '+919876543212' },
    update: {},
    create: {
      orgId: caFirm.id,
      name: 'Lakshmi Reddy',
      phone: '+919876543212',
      email: 'lakshmi@reddyca.in',
      role: 'CA',
    },
  });

  console.info('Seed complete. Factory, agency, CA firm created.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
