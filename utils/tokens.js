import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const signAccess = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_TTL || '15m',
  });

export const signRefresh = (user) =>
  jwt.sign({ sub: String(user._id) }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_TTL || '7d',
  });

// Refresh tokens are stored hashed so a DB leak does not expose live sessions.
export const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

export function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}
