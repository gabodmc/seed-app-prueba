// Bearer token is simply the user id. Real applications use sessions or JWTs; the
// isolation invariants under test are indifferent to which, so this stays trivial.
import { prisma } from './db.js';

export async function authenticate(req, res, next) {
  const header = req.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'no autenticado' });
  }
  const user = await prisma.user.findUnique({ where: { id: token } });
  if (!user) {
    return res.status(401).json({ error: 'token inválido' });
  }
  req.user = user;
  next();
}
