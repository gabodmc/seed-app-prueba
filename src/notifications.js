// GROUND TRUTH: ARCHITECTURE FAULT (A-001) — ciclo de dependencias plantado:
// notifications ↔ reports-helper. Ningún módulo del ciclo se importa desde
// server.js, así que el runtime no se ve afectado.
const { buildMonthlyReport } = require('./reports-helper');

function notifyMonthlyReport(tenantId) {
  return buildMonthlyReport(tenantId, 0, {});
}

module.exports = { notifyMonthlyReport };
