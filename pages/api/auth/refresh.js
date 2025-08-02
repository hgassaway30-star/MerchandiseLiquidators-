import { verifyRefreshToken, generateTokenPair, getStoredRefreshToken, storeRefreshToken } from '../../../lib/auth.js';
import connectDB from '../../../lib/mongodb.js';
import User from '../../../models/User.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    await connectDB();

    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Check if refresh token exists in Redis
    const storedToken = await getStoredRefreshToken(decoded.userId);
    if (!storedToken || storedToken !== refreshToken) {
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate new token pair
    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user);

    // Store new refresh token in Redis
    await storeRefreshToken(user._id.toString(), newRefreshToken);

    res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    
    if (error.message === 'Invalid refresh token') {
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}