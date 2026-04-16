/**
 * FactoryOS comprehensive seed data.
 *
 * Tells a complete manufacturing story so every screen has data:
 * - Hyderabad Precision Components (factory) with 5 direct employees
 * - 4 customers, 6 inventory items, 2 BOMs, 6 departments
 * - Orders in every stage: delivered, in-production, confirmed, enquiry
 * - Deccan Labour Services (agency) with 8 workers, 6 deployed
 * - 7 days of attendance records + journal entries
 * - Reddy & Associates CA firm
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}

async function main(): Promise<void> {
  console.info('Seeding FactoryOS...');

  // ================================================================
  // Platform org + Super admin
  // ================================================================
  const platform = await prisma.organisation.upsert({
    where: { gstin: 'PLATFORM' },
    update: {},
    create: {
      name: 'FactoryOS Platform', gstin: 'PLATFORM',
      type: 'PLATFORM', plan: 'PRO', isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { phone: '+919999999999' },
    update: {},
    create: {
      orgId: platform.id, name: 'Platform Admin',
      phone: '+919999999999', email: 'admin@factoryos.in',
      role: 'SUPER_ADMIN',
    },
  });

  // ================================================================
  // Organisations
  // ================================================================
  const factory = await prisma.organisation.upsert({
    where: { gstin: '36AABCH1234F1Z5' },
    update: {},
    create: {
      name: 'Hyderabad Precision Components',
      gstin: '36AABCH1234F1Z5',
      type: 'FACTORY',
      plan: 'PRO',
      isActive: true,
    },
  });

  const agency = await prisma.organisation.upsert({
    where: { gstin: '36AADCD5678G2H9' },
    update: {},
    create: {
      name: 'Deccan Labour Services',
      gstin: '36AADCD5678G2H9',
      type: 'AGENCY',
      plan: 'FREE',
      isActive: true,
    },
  });

  const caFirm = await prisma.organisation.upsert({
    where: { gstin: '36AABCR9012C3D4' },
    update: {},
    create: {
      name: 'Reddy & Associates, CA',
      gstin: '36AABCR9012C3D4',
      type: 'CA_FIRM',
      plan: 'PRO',
      isActive: true,
    },
  });

  // ================================================================
  // Users — Factory owner + direct employees
  // ================================================================
  const owner = await prisma.user.upsert({
    where: { phone: '+919876543210' },
    update: {},
    create: {
      orgId: factory.id, name: 'Ravi Kumar', phone: '+919876543210',
      email: 'ravi@hpcfactory.in', role: 'OWNER',
    },
  });

  const prodManager = await prisma.user.upsert({
    where: { phone: '+919876543220' },
    update: {},
    create: {
      orgId: factory.id, name: 'Venkat Rao', phone: '+919876543220',
      role: 'MANAGER',
    },
  });

  const qcHead = await prisma.user.upsert({
    where: { phone: '+919876543221' },
    update: {},
    create: {
      orgId: factory.id, name: 'Priya Sharma', phone: '+919876543221',
      role: 'MANAGER',
    },
  });

  const storeKeeper = await prisma.user.upsert({
    where: { phone: '+919876543222' },
    update: {},
    create: {
      orgId: factory.id, name: 'Ramesh Babu', phone: '+919876543222',
      role: 'WORKER',
    },
  });

  const machineOp1 = await prisma.user.upsert({
    where: { phone: '+919876543223' },
    update: {},
    create: {
      orgId: factory.id, name: 'Srinivas Reddy', phone: '+919876543223',
      role: 'WORKER',
    },
  });

  const machineOp2 = await prisma.user.upsert({
    where: { phone: '+919876543224' },
    update: {},
    create: {
      orgId: factory.id, name: 'Anil Kumar', phone: '+919876543224',
      role: 'WORKER',
    },
  });

  // Factory accountant
  const accountant = await prisma.user.upsert({
    where: { phone: '+919876543225' },
    update: {},
    create: {
      orgId: factory.id, name: 'Geetha Iyer', phone: '+919876543225',
      email: 'geetha@hpcfactory.in', role: 'ACCOUNTANT',
    },
  });

  // Agency admin
  const agencyAdmin = await prisma.user.upsert({
    where: { phone: '+919876543211' },
    update: {},
    create: {
      orgId: agency.id, name: 'Suresh Naidu', phone: '+919876543211',
      role: 'AGENCY_ADMIN',
    },
  });

  // Agency supervisor
  await prisma.user.upsert({
    where: { phone: '+919876543226' },
    update: {},
    create: {
      orgId: agency.id, name: 'Mahesh Yadav', phone: '+919876543226',
      role: 'AGENCY_SUPERVISOR',
    },
  });

  // CA
  await prisma.user.upsert({
    where: { phone: '+919876543212' },
    update: {},
    create: {
      orgId: caFirm.id, name: 'Lakshmi Reddy', phone: '+919876543212',
      email: 'lakshmi@reddyca.in', role: 'CA',
    },
  });

  // ================================================================
  // Departments
  // ================================================================
  const deptData = [
    { name: 'Cutting', sequence: 1 },
    { name: 'Machining', sequence: 2 },
    { name: 'Assembly', sequence: 3 },
    { name: 'Quality Check', sequence: 4 },
    { name: 'Packing', sequence: 5 },
    { name: 'Dispatch', sequence: 6 },
  ];
  const departments: Array<{ id: string; name: string; sequence: number }> = [];
  for (const d of deptData) {
    const existing = await prisma.department.findFirst({
      where: { orgId: factory.id, name: d.name },
    });
    if (existing) {
      departments.push(existing);
    } else {
      const dept = await prisma.department.create({
        data: { ...d, orgId: factory.id, isActive: true },
      });
      departments.push(dept);
    }
  }

  // Set Venkat as Production Manager (Machining) and Priya as QC Head
  await prisma.department.update({
    where: { id: departments[1]!.id },
    data: { managerId: prodManager.id },
  });
  await prisma.department.update({
    where: { id: departments[3]!.id },
    data: { managerId: qcHead.id },
  });

  // ================================================================
  // Employee profiles for factory direct staff
  // ================================================================
  const profiles = [
    { userId: prodManager.id, deptIdx: 1, designation: 'Production Manager', salary: 4500000 },
    { userId: qcHead.id, deptIdx: 3, designation: 'QC Head', salary: 3500000 },
    { userId: storeKeeper.id, deptIdx: null, designation: 'Store Keeper', salary: 2000000 },
    { userId: machineOp1.id, deptIdx: 1, designation: 'CNC Operator', salary: 2500000 },
    { userId: machineOp2.id, deptIdx: 0, designation: 'Cutting Operator', salary: 2200000 },
    { userId: accountant.id, deptIdx: null, designation: 'Accountant', salary: 3000000 },
  ];
  for (const p of profiles) {
    const exists = await prisma.employeeProfile.findUnique({ where: { userId: p.userId } });
    if (!exists) {
      await prisma.employeeProfile.create({
        data: {
          userId: p.userId, orgId: factory.id,
          departmentId: p.deptIdx !== null ? departments[p.deptIdx]!.id : null,
          designation: p.designation,
          monthlySalary: BigInt(p.salary),
          joiningDate: daysAgo(365),
        },
      });
    }
  }

  // ================================================================
  // Customers
  // ================================================================
  const customerData = [
    { name: 'Mahindra Auto Parts Vendor', phone: '+919900100001', gstin: '36AAACM1234A1Z5', address: 'Patancheru, Hyderabad' },
    { name: 'Tata Motors Tier-2 Supplier', phone: '+919900100002', gstin: '36AAACT5678B2Z3', address: 'Shamshabad, Hyderabad' },
    { name: 'Sai Engineering Works', phone: '+919900100003', gstin: null, address: 'Jeedimetla, Hyderabad' },
    { name: 'Bharat Forge Ancillary', phone: '+919900100004', gstin: '36AAACB9012D4Z1', address: 'Balanagar, Hyderabad' },
  ];
  const customers: Array<{ id: string; name: string }> = [];
  for (const c of customerData) {
    const existing = await prisma.customer.findFirst({
      where: { orgId: factory.id, phone: c.phone },
    });
    if (existing) {
      customers.push({ id: existing.id, name: existing.name });
    } else {
      const cust = await prisma.customer.create({
        data: { orgId: factory.id, ...c },
      });
      customers.push({ id: cust.id, name: cust.name });
    }
  }

  // ================================================================
  // Vendors
  // ================================================================
  const vendorData = [
    { name: 'Sri Balaji Steel Traders', phone: '+919900200001', gstin: '36AAACS1234S1Z5' },
    { name: 'Hyderabad Industrial Supplies', phone: '+919900200002', gstin: '36AAACH5678H2Z3' },
    { name: 'Deccan Consumables', phone: '+919900200003', gstin: null },
  ];
  const vendors: Array<{ id: string }> = [];
  for (const v of vendorData) {
    const existing = await prisma.vendor.findFirst({
      where: { orgId: factory.id, phone: v.phone },
    });
    if (existing) {
      vendors.push({ id: existing.id });
    } else {
      const ven = await prisma.vendor.create({
        data: { orgId: factory.id, ...v },
      });
      vendors.push({ id: ven.id });
    }
  }

  // ================================================================
  // Inventory items
  // ================================================================
  const inventoryData = [
    { name: 'MS Round Bar 20mm', sku: 'RAW-001', unit: 'kg', currentStock: 450, minimumStock: 200, category: 'Raw Material', costPerUnit: 8500 },
    { name: 'MS Flat Bar 40x10', sku: 'RAW-002', unit: 'kg', currentStock: 120, minimumStock: 150, category: 'Raw Material', costPerUnit: 9000 },
    { name: 'Cutting Oil', sku: 'CON-001', unit: 'litre', currentStock: 80, minimumStock: 50, category: 'Consumable', costPerUnit: 25000 },
    { name: 'Grinding Wheels 150mm', sku: 'CON-002', unit: 'pcs', currentStock: 12, minimumStock: 20, category: 'Consumable', costPerUnit: 45000 },
    { name: 'M8 Bolts (pack of 100)', sku: 'HDW-001', unit: 'pack', currentStock: 35, minimumStock: 10, category: 'Hardware', costPerUnit: 15000 },
    { name: 'Packing Corrugated Box', sku: 'PKG-001', unit: 'pcs', currentStock: 200, minimumStock: 100, category: 'Packing', costPerUnit: 5000 },
  ];
  const inventory: Array<{ id: string }> = [];
  for (const item of inventoryData) {
    const existing = await prisma.inventoryItem.findFirst({
      where: { orgId: factory.id, sku: item.sku },
    });
    if (existing) {
      inventory.push({ id: existing.id });
    } else {
      const inv = await prisma.inventoryItem.create({
        data: { orgId: factory.id, ...item, costPerUnit: BigInt(item.costPerUnit) },
      });
      inventory.push({ id: inv.id });
    }
  }

  // ================================================================
  // Ledgers (chart of accounts)
  // ================================================================
  const ledgerData = [
    { code: '1100', name: 'Bank', type: 'ASSET' },
    { code: '1200', name: 'Accounts Receivable', type: 'ASSET' },
    { code: '1300', name: 'Raw Material Inventory', type: 'ASSET' },
    { code: '1400', name: 'Input GST (ITC)', type: 'ASSET' },
    { code: '2100', name: 'Accounts Payable', type: 'LIABILITY' },
    { code: '2200', name: 'Wages Payable', type: 'LIABILITY' },
    { code: '2300', name: 'Output GST', type: 'LIABILITY' },
    { code: '3100', name: "Owner's Capital", type: 'EQUITY' },
    { code: '4100', name: 'Sales Revenue', type: 'INCOME' },
    { code: '5100', name: 'Wages Expense', type: 'EXPENSE' },
    { code: '5200', name: 'Raw Materials Consumed', type: 'EXPENSE' },
  ];
  for (const l of ledgerData) {
    const existing = await prisma.ledger.findUnique({
      where: { orgId_code: { orgId: factory.id, code: l.code } },
    });
    if (!existing) {
      await prisma.ledger.create({
        data: { orgId: factory.id, ...l, type: l.type as never, isSystem: true },
      });
    }
  }

  // ================================================================
  // Orders in every stage (the story)
  // ================================================================

  // ORDER 1: Delivered last week (complete story with journal entries)
  const order1 = await prisma.order.upsert({
    where: { orgId_orderNumber: { orgId: factory.id, orderNumber: 'ORD-2025-001' } },
    update: {},
    create: {
      orgId: factory.id, customerId: customers[0]!.id, orderNumber: 'ORD-2025-001',
      productName: 'Brake Bracket Assembly', quantity: 500, unit: 'pcs',
      deliveryDate: daysAgo(3), status: 'DELIVERED',
      totalValue: 35000000n, advancePaid: 10000000n,
      createdBy: owner.id, createdAt: daysAgo(20),
    },
  });

  // ORDER 2: In production (job cards partially done)
  const order2 = await prisma.order.upsert({
    where: { orgId_orderNumber: { orgId: factory.id, orderNumber: 'ORD-2025-002' } },
    update: {},
    create: {
      orgId: factory.id, customerId: customers[1]!.id, orderNumber: 'ORD-2025-002',
      productName: 'Shaft Coupling 25mm', quantity: 200, unit: 'pcs',
      deliveryDate: daysAgo(-5), status: 'IN_PRODUCTION',
      totalValue: 18000000n, advancePaid: 5000000n,
      createdBy: owner.id, createdAt: daysAgo(10),
    },
  });

  // ORDER 3: Just confirmed yesterday (needs job cards)
  const order3 = await prisma.order.upsert({
    where: { orgId_orderNumber: { orgId: factory.id, orderNumber: 'ORD-2025-003' } },
    update: {},
    create: {
      orgId: factory.id, customerId: customers[2]!.id, orderNumber: 'ORD-2025-003',
      productName: 'Custom Flange Ring', quantity: 100, unit: 'pcs',
      deliveryDate: daysAgo(-15), status: 'CONFIRMED',
      totalValue: 12000000n, advancePaid: 0n,
      createdBy: owner.id, createdAt: daysAgo(2),
    },
  });

  // ORDER 4: Fresh enquiry (just came in today)
  await prisma.order.upsert({
    where: { orgId_orderNumber: { orgId: factory.id, orderNumber: 'ORD-2025-004' } },
    update: {},
    create: {
      orgId: factory.id, customerId: customers[3]!.id, orderNumber: 'ORD-2025-004',
      productName: 'Hydraulic Cylinder Pin', quantity: 1000, unit: 'pcs',
      deliveryDate: daysAgo(-30), status: 'ENQUIRY',
      totalValue: 45000000n, advancePaid: 0n,
      notes: 'Customer wants sample first. Need to send quotation.',
      createdBy: owner.id, createdAt: daysAgo(0),
    },
  });

  // Job cards for Order 2 (in production — first 2 done, 3rd in progress)
  const existingJc = await prisma.jobCard.count({ where: { orderId: order2.id } });
  if (existingJc === 0) {
    const statuses = ['COMPLETED', 'COMPLETED', 'IN_PROGRESS', 'PENDING', 'PENDING', 'PENDING'];
    // Assign machining (stage 2, in progress) to Srinivas, assembly (stage 3) to Anil
    const assignees: Array<string | null> = [
      machineOp2.id, // Cutting → Anil
      machineOp1.id, // Machining → Srinivas (in progress)
      machineOp1.id, // Assembly → Srinivas (pending, next up)
      null, null, null,
    ];
    for (let i = 0; i < departments.length; i++) {
      await prisma.jobCard.create({
        data: {
          orderId: order2.id, departmentId: departments[i]!.id, orgId: factory.id,
          status: statuses[i] as never,
          assignedTo: assignees[i] ?? null,
          ...(statuses[i] === 'COMPLETED' ? { startedAt: daysAgo(8 - i), completedAt: daysAgo(7 - i) } : {}),
          ...(statuses[i] === 'IN_PROGRESS' ? { startedAt: daysAgo(2) } : {}),
        },
      });
    }
  }

  // ================================================================
  // Quotation (draft for the new enquiry)
  // ================================================================
  const existingQtn = await prisma.quotation.findFirst({
    where: { orgId: factory.id, quotationNumber: 'QTN-2025-004' },
  });
  if (!existingQtn) {
    await prisma.quotation.create({
      data: {
        orgId: factory.id, customerId: customers[3]!.id,
        quotationNumber: 'QTN-2025-004',
        items: [
          { description: 'Hydraulic Cylinder Pin - EN8 Steel', quantity: 1000, unit: 'pcs', unitPrice: 38000, gstRate: 18 },
        ] as never,
        subtotal: 38000000n, gstAmount: 6840000n, totalAmount: 44840000n,
        validUntil: daysAgo(-30), status: 'DRAFT', createdBy: owner.id,
      },
    });
  }

  // ================================================================
  // Purchase Order (one received, one pending)
  // ================================================================
  const existingPo = await prisma.purchaseOrder.findFirst({
    where: { orgId: factory.id, poNumber: 'PO-2025-001' },
  });
  if (!existingPo) {
    await prisma.purchaseOrder.create({
      data: {
        orgId: factory.id, vendorId: vendors[0]!.id, poNumber: 'PO-2025-001',
        items: [{ description: 'MS Round Bar 20mm', quantity: 500, unit: 'kg', unitPrice: 8500, gstRate: 18 }] as never,
        totalAmount: 5015000n, gstAmount: 765000n, status: 'RECEIVED', receivedDate: daysAgo(5),
      },
    });
  }
  const existingPo2 = await prisma.purchaseOrder.findFirst({
    where: { orgId: factory.id, poNumber: 'PO-2025-002' },
  });
  if (!existingPo2) {
    await prisma.purchaseOrder.create({
      data: {
        orgId: factory.id, vendorId: vendors[1]!.id, poNumber: 'PO-2025-002',
        items: [
          { description: 'Grinding Wheels 150mm', quantity: 50, unit: 'pcs', unitPrice: 45000, gstRate: 18 },
          { description: 'Cutting Oil', quantity: 100, unit: 'litre', unitPrice: 25000, gstRate: 18 },
        ] as never,
        totalAmount: 5192500n, gstAmount: 792500n, status: 'SENT', expectedDate: daysAgo(-3),
      },
    });
  }

  // ================================================================
  // Invoice for delivered order
  // ================================================================
  const existingInv = await prisma.invoice.findFirst({
    where: { orgId: factory.id, invoiceNumber: 'INV-2025-001' },
  });
  if (!existingInv) {
    const gst = (35000000n * 18n) / 118n;
    await prisma.invoice.create({
      data: {
        orgId: factory.id, orderId: order1.id, customerId: customers[0]!.id,
        invoiceNumber: 'INV-2025-001', invoiceDate: daysAgo(5),
        dueDate: daysAgo(-25),
        items: [{ description: 'Brake Bracket Assembly', quantity: 500, unit: 'pcs', unitPrice: 59322, gstRate: 18 }] as never,
        subtotal: 35000000n - gst, gstAmount: gst, totalAmount: 35000000n,
        paidAmount: 10000000n, status: 'PARTIALLY_PAID', createdBy: owner.id,
      },
    });
  }

  // ================================================================
  // Agency workers + deployments
  // ================================================================
  const workerData = [
    { name: 'Rajesh Yadav', phone: '+919900300001', skill: 'Welding', dailyRate: 80000 },
    { name: 'Sunil Goud', phone: '+919900300002', skill: 'Welding', dailyRate: 80000 },
    { name: 'Mohan Das', phone: '+919900300003', skill: 'Fitting', dailyRate: 75000 },
    { name: 'Prakash Nair', phone: '+919900300004', skill: 'Fitting', dailyRate: 75000 },
    { name: 'Ganesh Babu', phone: '+919900300005', skill: 'Helper', dailyRate: 55000 },
    { name: 'Raju Kiran', phone: '+919900300006', skill: 'Helper', dailyRate: 55000 },
    { name: 'Krishna Murthy', phone: '+919900300007', skill: 'Grinding', dailyRate: 70000 },
    { name: 'Naveen Kumar', phone: '+919900300008', skill: 'Packing', dailyRate: 50000 },
  ];
  const workers: Array<{ id: string }> = [];
  for (const w of workerData) {
    const existing = await prisma.worker.findFirst({
      where: { agencyOrgId: agency.id, phone: w.phone },
    });
    if (existing) {
      workers.push({ id: existing.id });
    } else {
      const worker = await prisma.worker.create({
        data: {
          agencyOrgId: agency.id, name: w.name, phone: w.phone,
          aadhaarLast4: String(1000 + workers.length), skill: w.skill,
          dailyRate: BigInt(w.dailyRate),
        },
      });
      workers.push({ id: worker.id });
    }
  }

  // Deploy first 6 workers to the factory
  for (let i = 0; i < 6; i++) {
    const existing = await prisma.workerDeployment.findFirst({
      where: { workerId: workers[i]!.id, factoryOrgId: factory.id, status: 'ACTIVE' },
    });
    if (!existing) {
      await prisma.workerDeployment.create({
        data: {
          workerId: workers[i]!.id, factoryOrgId: factory.id,
          agencyOrgId: agency.id, startDate: daysAgo(60), status: 'ACTIVE',
        },
      });
    }
  }

  // ================================================================
  // Attendance records for last 7 days (6 deployed workers)
  // ================================================================
  for (let day = 1; day <= 7; day++) {
    const date = daysAgo(day);
    const dateOnly = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    for (let w = 0; w < 6; w++) {
      const existing = await prisma.attendanceRecord.findFirst({
        where: { workerId: workers[w]!.id, date: dateOnly },
      });
      if (existing) continue;

      const isPresent = Math.random() > 0.15; // 85% present
      const isApproved = day >= 3; // older records are approved
      await prisma.attendanceRecord.create({
        data: {
          workerId: workers[w]!.id, factoryOrgId: factory.id, agencyOrgId: agency.id,
          date: dateOnly,
          status: isPresent ? 'PRESENT' : (Math.random() > 0.5 ? 'ABSENT' : 'HALF_DAY'),
          overtime: isPresent ? (Math.random() > 0.7 ? 2 : 0) : 0,
          markedBy: agencyAdmin.id,
          ...(isApproved ? { approvedBy: owner.id, approvedAt: daysAgo(day - 1) } : {}),
        },
      });
    }
  }

  // ================================================================
  // Journal entries for the delivered order (auto-posted story)
  // ================================================================
  const fy = '2025-26';
  const existingJournal = await prisma.journalEntry.count({ where: { orgId: factory.id } });
  if (existingJournal === 0) {
    const gstOrder1 = (35000000n * 18n) / 118n;
    const netOrder1 = 35000000n - gstOrder1;

    await prisma.journalEntry.createMany({
      data: [
        // Sale on dispatch
        {
          orgId: factory.id, date: daysAgo(5),
          description: 'Sale — Order ORD-2025-001', debitLedger: '1200',
          creditLedger: '4100', amount: netOrder1,
          sourceType: 'ORDER', sourceId: order1.id, createdAuto: true, financialYear: fy,
        },
        {
          orgId: factory.id, date: daysAgo(5),
          description: 'Output GST — Order ORD-2025-001', debitLedger: '1200',
          creditLedger: '2300', amount: gstOrder1,
          sourceType: 'ORDER', sourceId: order1.id, createdAuto: true, financialYear: fy,
        },
        // Advance payment received
        {
          orgId: factory.id, date: daysAgo(18),
          description: 'Advance received — Mahindra Auto Parts', debitLedger: '1100',
          creditLedger: '1200', amount: 10000000n,
          sourceType: 'MANUAL', createdAuto: true, financialYear: fy,
        },
        // Raw material purchase
        {
          orgId: factory.id, date: daysAgo(12),
          description: 'Goods received — PO PO-2025-001', debitLedger: '1300',
          creditLedger: '2100', amount: 4250000n,
          sourceType: 'PURCHASE', createdAuto: true, financialYear: fy,
        },
        {
          orgId: factory.id, date: daysAgo(12),
          description: 'Input GST — PO PO-2025-001', debitLedger: '1400',
          creditLedger: '2100', amount: 765000n,
          sourceType: 'PURCHASE', createdAuto: true, financialYear: fy,
        },
        // Wages accrual from attendance approval
        {
          orgId: factory.id, date: daysAgo(3),
          description: 'Wages accrual — week ending ' + daysAgo(3).toISOString().slice(0, 10),
          debitLedger: '5100', creditLedger: '2200', amount: 280000n,
          sourceType: 'ATTENDANCE', createdAuto: true, financialYear: fy,
        },
      ] as never,
    });
  }

  // ================================================================
  // Transporter
  // ================================================================
  const existingTransporter = await prisma.transporter.findFirst({
    where: { orgId: factory.id },
  });
  if (!existingTransporter) {
    await prisma.transporter.create({
      data: {
        orgId: factory.id, name: 'Sri Venkateswara Transport',
        phone: '+919900400001', vehicleNumber: 'TS09EA1234', vehicleType: 'Tata 407',
      },
    });
  }

  // ================================================================
  // Chat room (Production team)
  // ================================================================
  const existingRoom = await prisma.chatRoom.findFirst({
    where: { orgId: factory.id, name: 'Production Team' },
  });
  if (!existingRoom) {
    const room = await prisma.chatRoom.create({
      data: {
        orgId: factory.id, name: 'Production Team', type: 'GROUP',
        members: {
          create: [
            { userId: owner.id },
            { userId: prodManager.id },
            { userId: qcHead.id },
          ],
        },
      },
    });
    await prisma.chatMessage.createMany({
      data: [
        { roomId: room.id, senderId: prodManager.id, content: 'ORD-2025-002 cutting is done, moving to machining today', createdAt: daysAgo(2) },
        { roomId: room.id, senderId: owner.id, content: 'Good. Mahindra is asking for delivery date on the shaft couplings — can we do it by Friday?', createdAt: daysAgo(2) },
        { roomId: room.id, senderId: qcHead.id, content: 'I need 2 days for QC after assembly. If machining finishes by Wednesday we can dispatch Friday.', createdAt: daysAgo(1) },
        { roomId: room.id, senderId: owner.id, content: 'OK lets push for Wednesday. Venkat please prioritize this.', createdAt: daysAgo(1) },
        { roomId: room.id, senderId: prodManager.id, content: 'Will do. We have enough raw material. Srinivas is on it.', createdAt: daysAgo(0) },
      ],
    });
  }

  // ================================================================
  // Organisation relationships (Factory <-> CA, Factory <-> Agency)
  // ================================================================
  const relFactoryCa = await prisma.orgRelationship.findFirst({
    where: { fromOrgId: factory.id, toOrgId: caFirm.id, type: 'FACTORY_CA' },
  });
  if (!relFactoryCa) {
    await prisma.orgRelationship.create({
      data: {
        fromOrgId: factory.id, toOrgId: caFirm.id,
        type: 'FACTORY_CA', status: 'ACTIVE',
        invitedBy: owner.id, acceptedAt: daysAgo(30),
      },
    });
  }
  const relFactoryAgency = await prisma.orgRelationship.findFirst({
    where: { fromOrgId: factory.id, toOrgId: agency.id, type: 'FACTORY_AGENCY' },
  });
  if (!relFactoryAgency) {
    await prisma.orgRelationship.create({
      data: {
        fromOrgId: factory.id, toOrgId: agency.id,
        type: 'FACTORY_AGENCY', status: 'ACTIVE',
        invitedBy: owner.id, acceptedAt: daysAgo(60),
      },
    });
  }

  // ================================================================
  // CMS — Testimonials + FAQs (managed via super admin going forward)
  // ================================================================
  const testimonials = [
    {
      author: 'Ravi Kumar', title: 'Owner, Hyderabad Precision Components',
      quote: "Before FactoryOS, I was the only one who knew what was happening in my factory. Now my production manager runs everything and I see real-time updates on my phone. My stress dropped overnight.",
      initials: 'RK', colorFrom: '#562F54', colorTo: '#80567D', sortOrder: 1,
    },
    {
      author: 'Suresh Naidu', title: 'Founder, Deccan Labour Services',
      quote: "Attendance disputes used to take 3 days every month. Now the factory owner approves in one tap and I get paid faster. My workers also trust the numbers.",
      initials: 'SN', colorFrom: '#4AC843', colorTo: '#8DF688', sortOrder: 2,
    },
    {
      author: 'Lakshmi Reddy, CA', title: 'Reddy & Associates',
      quote: "I used to chase my factory clients for Tally backups every month. With FactoryOS I already have the data. GSTR-1 drafts generate themselves. My practice scales without hiring more staff.",
      initials: 'LR', colorFrom: '#F650BD', colorTo: '#A92179', sortOrder: 3,
    },
    {
      author: 'Mahesh Rao', title: 'MD, Balanagar Components',
      quote: "The profit-per-order report showed me I was losing money on 3 of my big customers. I renegotiated with them and saved ₹4 lakhs last quarter.",
      initials: 'MR', colorFrom: '#562F54', colorTo: '#F650BD', sortOrder: 4,
    },
  ];
  for (const t of testimonials) {
    const existing = await prisma.testimonial.findFirst({ where: { author: t.author } });
    if (!existing) await prisma.testimonial.create({ data: t });
  }

  const faqs = [
    {
      question: 'Do I need to stop using Tally right away?',
      answer: "No. FactoryOS works alongside Tally. Your journal entries generate automatically — you can export them to Tally any time. Most of our customers stop using Tally within 3 months because there's nothing left to do there.",
      category: 'GENERAL', sortOrder: 1,
    },
    {
      question: 'What if my staff has low digital literacy?',
      answer: "FactoryOS is designed for that reality. Workers use big buttons on their phone — one tap to check in, one tap to mark a job card done. Floor managers don't need to type anything.",
      category: 'ONBOARDING', sortOrder: 2,
    },
    {
      question: 'How is GST handled?',
      answer: 'Every dispatched order auto-calculates GST, creates a tax invoice, and posts the output GST entry. Every received purchase posts input GST. GSTR-1 and GSTR-3B draft themselves from your transactions.',
      category: 'COMPLIANCE', sortOrder: 3,
    },
    {
      question: 'What about my CA — will they use this?',
      answer: 'Your CA gets their own portal. They see your books live, generate GST returns, and raise queries through the app. You invite them during onboarding.',
      category: 'GENERAL', sortOrder: 4,
    },
    {
      question: 'What does it cost?',
      answer: 'The Free plan supports up to 20 workers and 50 orders per month. The Pro plan at ₹2,999/month unlocks unlimited everything, advanced reports, AI assistant, and WhatsApp integration. First 50 signups get founder pricing of ₹2,999/month for life.',
      category: 'PRICING', sortOrder: 5,
    },
    {
      question: 'Will my data be safe?',
      answer: 'Every query is automatically scoped to your organisation. No other factory can ever see your data. Postgres with row-level security and JWT authentication. Financial data encrypted at rest.',
      category: 'TECHNICAL', sortOrder: 6,
    },
    {
      question: 'How long does onboarding take?',
      answer: '60 seconds to sign up. About 10 minutes to invite your team and connect your CA/agency. First order can be tracked on day 1. Most factories are fully operational within a week.',
      category: 'ONBOARDING', sortOrder: 7,
    },
    {
      question: 'What if I need help?',
      answer: 'WhatsApp support on the Pro plan. Pilot customers in Hyderabad get a dedicated onboarding call. Our engineering team is in India.',
      category: 'GENERAL', sortOrder: 8,
    },
  ];
  for (const f of faqs) {
    const existing = await prisma.fAQ.findFirst({ where: { question: f.question } });
    if (!existing) await prisma.fAQ.create({ data: { ...f, category: f.category as never } });
  }

  // Optional content blocks
  const blocks = [
    { key: 'announcement.banner', value: '', type: 'string' },
    { key: 'pricing.starter.price', value: '0', type: 'string' },
    { key: 'pricing.growth.price', value: '4999', type: 'string' },
    { key: 'pricing.growth.founder', value: '2999', type: 'string' },
  ];
  for (const b of blocks) {
    await prisma.contentBlock.upsert({
      where: { key: b.key },
      update: {},
      create: { key: b.key, value: b.value, type: b.type },
    });
  }

  console.info('Seed complete!');
  console.info('');
  console.info('Demo logins:');
  console.info('  Super Admin:      +919999999999  (Platform Admin)');
  console.info('  Factory Owner:    +919876543210  (Ravi Kumar)');
  console.info('  Prod Manager:     +919876543220  (Venkat Rao)');
  console.info('  Worker (direct):  +919876543223  (Srinivas Reddy — CNC Operator)');
  console.info('  Worker (direct):  +919876543224  (Anil Kumar — Cutting Operator)');
  console.info('  Agency Admin:     +919876543211  (Suresh Naidu)');
  console.info('  CA / Auditor:     +919876543212  (Lakshmi Reddy)');
  console.info('');
  console.info('Factory has:');
  console.info('  5 direct employees, 6 contract workers');
  console.info('  4 customers, 3 vendors, 6 inventory items');
  console.info('  4 orders (delivered, in-production, confirmed, enquiry)');
  console.info('  1 quotation draft, 2 purchase orders, 1 invoice');
  console.info('  7 days of attendance, 6 journal entries, 1 chat room');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
