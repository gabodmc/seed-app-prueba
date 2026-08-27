// Deliberately flawed multi-tenant API.
//
// Every route is annotated GROUND TRUTH: FAULT or GROUND TRUTH: SAFE. The annotations
// are the answer key for measuring defect leakage; see GROUND_TRUTH.md. Do not "fix"
// a fault without updating that file — the whole point of this app is that the faults
// are known.
import express from 'express';
import { prisma } from './db.js';
import { authenticate } from './auth.js';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

// ── Orders ────────────────────────────────────────────────────────────────────

// GROUND TRUTH: FAULT — cross_tenant_read (INV-001)
// findUnique resolves by primary key alone. The tenant of the caller is never
// consulted, so any order id is readable by any authenticated user. This is the
// single most common shape of isolation failure in agent-generated code.
app.get('/api/orders/:id', authenticate, async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).json({ error: 'no encontrado' });
  res.json(order);
});

// GROUND TRUTH: FAULT — cross_tenant_write (INV-002)
// The update is scoped by id only; a caller can mutate another tenant's order.
app.patch('/api/orders/:id', authenticate, async (req, res) => {
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: String(req.body?.status ?? 'closed') },
    });
    res.json(order);
  } catch {
    res.status(404).json({ error: 'no encontrado' });
  }
});

// GROUND TRUTH: SAFE — control for cross_tenant_list (INV-010)
app.get('/api/orders', authenticate, async (req, res) => {
  const orders = await prisma.order.findMany({ where: { tenantId: req.user.tenantId } });
  res.json(orders);
});

// GROUND TRUTH: SAFE — control for cross_tenant_write (INV-007)
// deleteMany accepts a compound filter, so the tenant scope survives.
app.delete('/api/orders/:id', authenticate, async (req, res) => {
  const result = await prisma.order.deleteMany({
    where: { id: req.params.id, tenantId: req.user.tenantId },
  });
  if (result.count === 0) return res.status(404).json({ error: 'no encontrado' });
  res.status(204).end();
});

// ── Invoices ──────────────────────────────────────────────────────────────────

// GROUND TRUTH: FAULT — cross_tenant_list (INV-003)
// The listing has no tenant filter at all: every caller sees every tenant's invoices.
app.get('/api/invoices', authenticate, async (_req, res) => {
  const invoices = await prisma.invoice.findMany();
  res.json(invoices);
});

// GROUND TRUTH: SAFE — control for cross_tenant_read (INV-008)
app.get('/api/invoices/:id', authenticate, async (req, res) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: req.params.id, tenantId: req.user.tenantId },
  });
  if (!invoice) return res.status(404).json({ error: 'no encontrado' });
  res.json(invoice);
});

// ── Reports ───────────────────────────────────────────────────────────────────

// GROUND TRUTH: FAULT — unauthenticated_access (INV-005)
// The authenticate middleware was never attached to this route.
app.get('/api/reports/:id', async (req, res) => {
  const report = await prisma.report.findUnique({ where: { id: req.params.id } });
  if (!report) return res.status(404).json({ error: 'no encontrado' });
  res.json(report);
});

// ── Admin ─────────────────────────────────────────────────────────────────────

// GROUND TRUTH: FAULT — privilege_escalation (INV-004)
// The path says admin and the handler checks authentication but never the role,
// and never the tenant either.
app.get('/api/admin/users', authenticate, async (_req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

// GROUND TRUTH: SAFE — control for privilege_escalation (INV-010)
// Checks the role first, then scopes the query by tenant. Both halves are required:
// a role check alone still leaks across tenants.
app.get('/api/admin/orders', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'requiere rol admin' });
  }
  const orders = await prisma.order.findMany({ where: { tenantId: req.user.tenantId } });
  res.json(orders);
});

// GROUND TRUTH: SAFE — control for unauthenticated_access (INV-009)
app.get('/api/me', authenticate, (req, res) => res.json(req.user));

const port = Number(process.env.PORT ?? 3000);
app.listen(port, '0.0.0.0', () => console.log(`seed-app escuchando en ${port}`));
