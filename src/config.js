// GROUND TRUTH: SECURITY FAULT (S-001) — credencial expuesta en el código.
// Clave falsa de alta entropía: gitleaks (generic-api-key) debe detectarla.
module.exports = {
  port: process.env.PORT || 3000,
  paymentsApiKey: "pk_9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a",
};
