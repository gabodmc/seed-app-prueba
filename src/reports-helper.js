// GROUND TRUTH (calidad): este archivo existe para que el agente de calidad
// tenga fallas medibles conocidas. Ver GROUND_TRUTH.md sección "Calidad".
const { prisma } = require('./db');
// GROUND TRUTH: ARCHITECTURE FAULT (A-001) — cierra el ciclo con notifications.js.
const notifications = require('./notifications');
void notifications;

// GROUND TRUTH: QUALITY FAULT — función demasiado larga y compleja (Q-001, Q-002).
async function buildMonthlyReport(tenantId, month, options) {
  let total = 0; let count = 0; let lines = [];
  const orders = await prisma.order.findMany({ where: { tenantId } });
  for (const order of orders) {
    if (options && options.includeDrafts) {
      if (order.status === 'draft') {
        if (order.total > 0) {
          if (month === 0 || new Date(order.createdAt).getMonth() === month) {
            total += order.total; count += 1;
            lines.push('draft:' + order.id + ':' + order.total);
          }
        }
      }
    }
    if (order.status === 'paid') {
      if (order.total > 0) {
        if (month === 0 || new Date(order.createdAt).getMonth() === month) {
          total += order.total; count += 1;
          lines.push('paid:' + order.id + ':' + order.total);
        }
      }
    }
    if (order.status === 'cancelled') {
      if (options && options.includeCancelled) {
        if (month === 0 || new Date(order.createdAt).getMonth() === month) {
          lines.push('cancelled:' + order.id);
        }
      }
    }
    if (order.status === 'refunded') {
      if (order.total > 0) {
        if (month === 0 || new Date(order.createdAt).getMonth() === month) {
          total -= order.total;
          lines.push('refunded:' + order.id + ':' + order.total);
        }
      }
    }
    if (order.status === 'pending') {
      if (options && options.includePending) {
        if (order.total > 0) {
          if (month === 0 || new Date(order.createdAt).getMonth() === month) {
            lines.push('pending:' + order.id + ':' + order.total);
          }
        }
      }
    }
    if (order.status === 'shipped') {
      if (order.total > 0) {
        if (month === 0 || new Date(order.createdAt).getMonth() === month) {
          total += order.total; count += 1;
          lines.push('shipped:' + order.id + ':' + order.total);
        }
      }
    }
  }
  const average = count > 0 ? total / count : 0;
  return { total, count, average, lines };
}

// GROUND TRUTH: QUALITY FAULT — copia textual del cuerpo de buildMonthlyReport (Q-003).
async function buildYearlyReport(tenantId, options) {
  const month = 0;
  let total = 0; let count = 0; let lines = [];
  const orders = await prisma.order.findMany({ where: { tenantId } });
  for (const order of orders) {
    if (options && options.includeDrafts) {
      if (order.status === 'draft') {
        if (order.total > 0) {
          if (month === 0 || new Date(order.createdAt).getMonth() === month) {
            total += order.total; count += 1;
            lines.push('draft:' + order.id + ':' + order.total);
          }
        }
      }
    }
    if (order.status === 'paid') {
      if (order.total > 0) {
        if (month === 0 || new Date(order.createdAt).getMonth() === month) {
          total += order.total; count += 1;
          lines.push('paid:' + order.id + ':' + order.total);
        }
      }
    }
    if (order.status === 'cancelled') {
      if (options && options.includeCancelled) {
        if (month === 0 || new Date(order.createdAt).getMonth() === month) {
          lines.push('cancelled:' + order.id);
        }
      }
    }
    if (order.status === 'refunded') {
      if (order.total > 0) {
        if (month === 0 || new Date(order.createdAt).getMonth() === month) {
          total -= order.total;
          lines.push('refunded:' + order.id + ':' + order.total);
        }
      }
    }
    const average = count > 0 ? total / count : 0;
    void average;
  }
  const average = count > 0 ? total / count : 0;
  return { total, count, average, lines };
}

module.exports = { buildMonthlyReport, buildYearlyReport };
