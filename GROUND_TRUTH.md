# Ground truth de la app semilla

Esta app existe para **medir**, no para funcionar bien. Las fallas están plantadas a
propósito y documentadas acá. Sin este archivo no hay forma de calcular fuga de defectos:
una corrida verde podría significar "no hay fallas" o "el motor no detecta nada".

**No arreglar una falla sin actualizar esta tabla.**

## Fallas plantadas (el motor DEBE reportarlas)

| Invariante | Clase | Ruta | Falla |
|---|---|---|---|
| INV-001 | `cross_tenant_read` | `GET /api/orders/:id` | `findUnique` por PK sin filtro de tenant |
| INV-002 | `cross_tenant_write` | `PATCH /api/orders/:id` | `update` con `where: { id }` solamente |
| INV-003 | `cross_tenant_list` | `GET /api/invoices` | `findMany()` sin filtro alguno |
| INV-004 | `privilege_escalation` | `GET /api/admin/users` | Autentica pero nunca valida rol ni tenant |
| INV-005 | `unauthenticated_access` | `GET /api/reports/:id` | Falta el middleware `authenticate` |

## Controles sanos (el motor NO debe reportarlos)

| Invariante | Clase | Ruta | Por qué es correcta |
|---|---|---|---|
| INV-006 | `cross_tenant_read` | `GET /api/invoices/:id` | `findFirst` con `id` **y** `tenantId` |
| INV-007 | `cross_tenant_write` | `DELETE /api/orders/:id` | `deleteMany` con filtro compuesto |
| INV-008 | `cross_tenant_list` | `GET /api/orders` | `findMany` scopeado por `tenantId` |
| INV-009 | `unauthenticated_access` | `GET /api/me` | Middleware `authenticate` presente |
| INV-010 | `privilege_escalation` | `GET /api/admin/orders` | Valida rol admin **y** scopea por `tenantId` |

## Cómo se lee la métrica

```
fuga (falsos negativos) = fallas plantadas NO detectadas / 5
ruido (falsos positivos) = controles sanos reportados como fallas / 5
```

Una corrida perfecta es: **5 `fail` + 5 `pass`**. Cualquier otra combinación es
información sobre el motor, no sobre la app.

## Fixtures

Dos tenants con datos estructuralmente idénticos, de modo que cualquier valor que
aparezca en una respuesta se atribuye a exactamente un tenant. Esa simetría es lo que
hace precisa la detección de fugas en el plano de storage.

| Tenant | Usuario | Pedido | Factura | Reporte |
|---|---|---|---|---|
| `tenant_a` | `user_alice` (member), `user_root` (admin) | `order_a1` | `invoice_a1` | `report_a1` |
| `tenant_b` | `user_bob` (member) | `order_b1` | `invoice_b1` | `report_b1` |

El token bearer es el id del usuario.

## Calidad (fase 5 — ground truth del agente de calidad)

`src/reports-helper.js` existe para darle al agente de calidad fallas medibles:

| ID | Falla plantada | Herramienta que la mide |
|---|---|---|
| Q-001 | `buildMonthlyReport` supera el tope de líneas por función | eslint `max-lines-per-function` |
| Q-002 | `buildMonthlyReport` supera el tope de complejidad (anidamiento de ifs por estado) | eslint `complexity` / `max-depth` |
| Q-003 | `buildYearlyReport` duplica el bloque de acumulación de `buildMonthlyReport` | jscpd |
| Q-004 | El proyecto no tiene script de test | `npm test` → NOTESTS |

Esperado del agente: los cuatro aparecen como hallazgos de nivel **herramienta**
con su métrica citada. Ninguno afecta el ground truth de seguridad (el archivo
no se importa desde `server.js`).

## Seguridad medible (fase 5.2 — capa herramienta del agente de seguridad)

| ID | Falla plantada | Herramienta |
|---|---|---|
| S-001 | Clave de API genérica de alta entropía (falsa) en `src/config.js` — una tipo Stripe real dispara la push protection de GitHub, que es exactamente el punto | gitleaks |
| S-002 | `lodash@4.17.15` con CVEs HIGH conocidos (package-lock.json) | trivy |

Esperado: ambos como hallazgos nivel **herramienta**, severidad critical/high, sin
citar jamás el valor del secreto.
