import jwt from 'jsonwebtoken';
import { httpError } from '../utils/httpError.js';

export function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(httpError(401, 'Not authenticated'));
  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(httpError(401, 'Access token invalid or expired'));
  }
}

// RBAC: requireRole('admin')
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(httpError(403, 'You do not have permission to do this'));
  }
  next();
};
