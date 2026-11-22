import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { signAccess, signRefresh, hashToken, readCookie } from '../utils/tokens.js';

const COOKIE = 'refreshToken';
const cookieOpts = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Issues a new access token + rotates the refresh token (httpOnly cookie).
async function startSession(res, user) {
  const accessToken = signAccess(user);
  const refreshToken = signRefresh(user);
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();
  res.cookie(COOKIE, refreshToken, cookieOpts());
  return { accessToken, user: publicUser(user) };
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) throw httpError(400, 'Name, email and password are required');
  if (!EMAIL_RE.test(email)) throw httpError(400, 'Enter a valid email address');
  if (password.length < 8) throw httpError(400, 'Password must be at least 8 characters');

  if (await User.findOne({ email: email.toLowerCase() })) {
    throw httpError(409, 'An account with this email already exists');
  }
  const passwordHash = await bcrypt.hash(password, 10);
  // Role is never taken from the request body: everyone registers as a user.
  const user = await User.create({ name, email, passwordHash, role: 'user' });
  res.status(201).json(await startSession(res, user));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw httpError(400, 'Email and password are required');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) throw httpError(401, 'Incorrect email or password');

  res.json(await startSession(res, user));
});

export const refresh = asyncHandler(async (req, res) => {
  const token = readCookie(req, COOKIE);
  if (!token) throw httpError(401, 'No session');

  let payload;
  try {
    payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    throw httpError(401, 'Session expired');
  }
  const user = await User.findById(payload.sub).select('+refreshTokenHash');
  if (!user || user.refreshTokenHash !== hashToken(token)) {
    throw httpError(401, 'Session no longer valid');
  }
  res.json(await startSession(res, user));
});

export const logout = asyncHandler(async (req, res) => {
  const token = readCookie(req, COOKIE);
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
      await User.findByIdAndUpdate(payload.sub, { $unset: { refreshTokenHash: 1 } });
    } catch { /* already expired: nothing to revoke */ }
  }
  res.clearCookie(COOKIE, { path: '/api/auth' });
  res.json({ message: 'Logged out' });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw httpError(404, 'User not found');
  res.json({ user: publicUser(user) });
});
