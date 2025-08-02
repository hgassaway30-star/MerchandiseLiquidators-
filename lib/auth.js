import jwt from 'jsonwebtoken';
import { redis } from './redis';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets must be defined in environment variables');
}

// Generate access token
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

// Generate refresh token
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
};

// Verify access token
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

// Verify refresh token
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// Generate token pair
export const generateTokenPair = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return { accessToken, refreshToken };
};

// Store refresh token in Redis
export const storeRefreshToken = async (userId, refreshToken) => {
  const key = `refresh_token:${userId}`;
  // Store for 7 days (same as token expiry)
  await redis.set(key, refreshToken, 7 * 24 * 60 * 60);
};

// Get refresh token from Redis
export const getStoredRefreshToken = async (userId) => {
  const key = `refresh_token:${userId}`;
  return await redis.get(key);
};

// Remove refresh token from Redis
export const removeRefreshToken = async (userId) => {
  const key = `refresh_token:${userId}`;
  await redis.del(key);
};

// Middleware to authenticate requests (Next.js compatible)
export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
      });
      return next(new Error('No token provided'));
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
    });
    next(error);
  }
};

// Middleware to check admin role (Next.js compatible)
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
    return next(new Error('Admin access required'));
  }
  next();
};

// Middleware to check if user owns resource or is admin
export const requireOwnershipOrAdmin = (req, res, next) => {
  const resourceUserId = req.params.userId || req.body.userId;
  
  if (req.user.role === 'admin' || req.user.userId === resourceUserId) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied',
    });
    next(new Error('Access denied'));
  }
};

// Extract user from token (for optional auth)
export const extractUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
    }
  } catch (error) {
    // Token is invalid but we don't throw error for optional auth
    req.user = null;
  }
  next();
};

// Utility functions for direct use in API routes
export const authenticateRequest = async (req) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new Error('Access token required');
  }

  const decoded = verifyAccessToken(token);
  return decoded;
};

export const requireAdminAccess = (user) => {
  if (!user || user.role !== 'admin') {
    throw new Error('Admin access required');
  }
};

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
  storeRefreshToken,
  getStoredRefreshToken,
  removeRefreshToken,
  authenticateToken,
  requireAdmin,
  requireOwnershipOrAdmin,
  extractUser,
  authenticateRequest,
  requireAdminAccess,
};