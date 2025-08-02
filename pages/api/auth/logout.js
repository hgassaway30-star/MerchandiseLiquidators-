import { verifyAccessToken, removeRefreshToken } from '../../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
      });
    }

    // Verify access token to get user ID
    const decoded = verifyAccessToken(token);

    // Remove refresh token from Redis
    await removeRefreshToken(decoded.userId);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    
    if (error.message === 'Invalid access token') {
      return res.status(403).json({
        success: false,
        message: 'Invalid access token',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}