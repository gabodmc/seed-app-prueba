// Fixture set referenced by the IR bindings as fixtures/tenant_isolation.
// Two tenants with structurally identical data: any value that appears in a response
// can be attributed to exactly one tenant, which is what makes leak detection precise.
import { prisma } from './db.js';

async function main() {
  await prisma.report.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  await prisma.tenant.createMany({
    data: [
      { id: 'tenant_a', name: 'Acme SA' },
      { id: 'tenant_b', name: 'Beta SRL' },
    ],
  });

  await prisma.user.createMany({
    data: [
      { id: 'user_alice', email: 'alice@acme.test', name: 'Alice', role: 'member', tenantId: 'tenant_a' },
      { id: 'user_bob', email: 'bob@beta.test', name: 'Bob', role: 'member', tenantId: 'tenant_b' },
      { id: 'user_root', email: 'root@acme.test', name: 'Root', role: 'admin', tenantId: 'tenant_a' },
    ],
  });

  await prisma.order.createMany({
    data: [
      { id: 'order_a1', reference: 'A-0001', customerEmail: 'cliente-a@acme.test', amountCents: 12000, tenantId: 'tenant_a' },
      { id: 'order_b1', reference: 'B-0001', customerEmail: 'cliente-b@beta.test', amountCents: 45000, tenantId: 'tenant_b' },
    ],
  });

  await prisma.invoice.createMany({
    data: [
      { id: 'invoice_a1', number: 'FA-0001', taxId: '30-11111111-1', totalCents: 12000, tenantId: 'tenant_a' },
      { id: 'invoice_b1', number: 'FB-0001', taxId: '30-22222222-2', totalCents: 45000, tenantId: 'tenant_b' },
    ],
  });

  await prisma.report.createMany({
    data: [
      { id: 'report_a1', title: 'Cierre A', body: 'secreto-a', tenantId: 'tenant_a' },
      { id: 'report_b1', title: 'Cierre B', body: 'secreto-b', tenantId: 'tenant_b' },
    ],
  });

  console.log('fixtures cargadas: 2 tenants, 3 usuarios, 2 pedidos, 2 facturas, 2 reportes');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
