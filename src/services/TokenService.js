const RefreshToken = require('../models/RefreshToken');
const AuthService = require('./AuthService');
const logger = require('../utils/logger');

class TokenService {
  /**
   * Create a new refresh token for a user
   * @param {string} userId - User ID
   * @param {Object} deviceInfo - Device information
   * @returns {Promise<Object>} - Token information
   */
  static async createRefreshToken(userId, deviceInfo = {}) {
    try {
      const tokenDoc = await RefreshToken.createToken(userId, deviceInfo);
      
      logger.info(`Refresh token created for user: ${userId}`, {
        tokenId: tokenDoc._id,
        deviceType: tokenDoc.deviceInfo.deviceType
      });

      return {
        token: tokenDoc.token,
        expiresAt: tokenDoc.expiresAt,
        deviceInfo: tokenDoc.deviceInfo
      };
    } catch (error) {
      logger.error('Error creating refresh token:', error);
      throw new Error('Failed to create refresh token');
    }
  }

  /**
   * Validate and get refresh token information
   * @param {string} token - Refresh token
   * @returns {Promise<Object>} - Token information
   */
  static async validateRefreshToken(token) {
    try {
      const tokenDoc = await RefreshToken.findValidToken(token);
      
      if (!tokenDoc) {
        throw new Error('Invalid or expired refresh token');
      }

      return {
        token: tokenDoc.token,
        userId: tokenDoc.userId,
        expiresAt: tokenDoc.expiresAt,
        deviceInfo: tokenDoc.deviceInfo,
        createdAt: tokenDoc.createdAt
      };
    } catch (error) {
      logger.error('Error validating refresh token:', error);
      throw error;
    }
  }

  /**
   * Revoke a specific refresh token
   * @param {string} token - Refresh token to revoke
   * @param {string} revokedBy - User ID who revoked the token
   * @param {string} reason - Reason for revocation
   * @returns {Promise<boolean>} - Success status
   */
  static async revokeToken(token, revokedBy = null, reason = 'logout') {
    try {
      const result = await RefreshToken.revokeToken(token, revokedBy, reason);
      
      if (result) {
        logger.info(`Refresh token revoked: ${token}`, {
          revokedBy,
          reason
        });
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Error revoking refresh token:', error);
      throw new Error('Failed to revoke refresh token');
    }
  }

  /**
   * Revoke all refresh tokens for a user
   * @param {string} userId - User ID
   * @param {string} revokedBy - User ID who revoked the tokens
   * @param {string} reason - Reason for revocation
   * @returns {Promise<Object>} - Revocation result
   */
  static async revokeAllUserTokens(userId, revokedBy = null, reason = 'security') {
    try {
      const result = await RefreshToken.revokeAllUserTokens(userId, revokedBy, reason);
      
      logger.info(`All refresh tokens revoked for user: ${userId}`, {
        revokedBy,
        reason,
        revokedCount: result.modifiedCount
      });

      return {
        success: true,
        revokedCount: result.modifiedCount
      };
    } catch (error) {
      logger.error('Error revoking all user tokens:', error);
      throw new Error('Failed to revoke user tokens');
    }
  }

  /**
   * Get active tokens for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Active tokens
   */
  static async getUserActiveTokens(userId) {
    try {
      const tokens = await RefreshToken.getUserActiveTokens(userId);
      
      return tokens.map(token => ({
        id: token._id,
        deviceInfo: token.deviceInfo,
        createdAt: token.createdAt,
        expiresAt: token.expiresAt
      }));
    } catch (error) {
      logger.error('Error getting user active tokens:', error);
      throw new Error('Failed to get user tokens');
    }
  }

  /**
   * Clean up expired tokens
   * @returns {Promise<Object>} - Cleanup result
   */
  static async cleanupExpiredTokens() {
    try {
      const result = await RefreshToken.cleanupExpiredTokens();
      
      logger.info(`Expired tokens cleaned up: ${result.deletedCount} tokens removed`);
      
      return {
        success: true,
        deletedCount: result.deletedCount
      };
    } catch (error) {
      logger.error('Error cleaning up expired tokens:', error);
      throw new Error('Failed to cleanup expired tokens');
    }
  }

  /**
   * Rotate refresh token (create new, revoke old)
   * @param {string} oldToken - Old refresh token
   * @param {string} userId - User ID
   * @param {Object} deviceInfo - Device information
   * @returns {Promise<Object>} - New token information
   */
  static async rotateRefreshToken(oldToken, userId, deviceInfo = {}) {
    try {
      // Verify the old token first
      const oldTokenDoc = await RefreshToken.findValidToken(oldToken);
      if (!oldTokenDoc) {
        throw new Error('Invalid or expired refresh token');
      }

      // Create new token
      const newTokenDoc = await RefreshToken.createToken(userId, deviceInfo);
      
      // Revoke old token
      await RefreshToken.revokeToken(oldToken, userId, 'rotation');

      logger.info(`Refresh token rotated for user: ${userId}`, {
        oldTokenId: oldTokenDoc._id,
        newTokenId: newTokenDoc._id
      });

      return {
        token: newTokenDoc.token,
        expiresAt: newTokenDoc.expiresAt,
        deviceInfo: newTokenDoc.deviceInfo
      };
    } catch (error) {
      logger.error('Error rotating refresh token:', error);
      throw new Error('Failed to rotate refresh token');
    }
  }

  /**
   * Check if a token is valid and not expired
   * @param {string} token - Refresh token
   * @returns {Promise<boolean>} - Token validity
   */
  static async isTokenValid(token) {
    try {
      const tokenDoc = await RefreshToken.findValidToken(token);
      return !!tokenDoc;
    } catch (error) {
      logger.error('Error checking token validity:', error);
      return false;
    }
  }

  /**
   * Get token statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Token statistics
   */
  static async getTokenStats(userId) {
    try {
      const activeTokens = await RefreshToken.getUserActiveTokens(userId);
      
      const deviceTypes = {};
      activeTokens.forEach(token => {
        const deviceType = token.deviceInfo.deviceType || 'unknown';
        deviceTypes[deviceType] = (deviceTypes[deviceType] || 0) + 1;
      });

      return {
        totalActiveTokens: activeTokens.length,
        deviceTypes,
        oldestToken: activeTokens.length > 0 ? Math.min(...activeTokens.map(t => t.createdAt)) : null,
        newestToken: activeTokens.length > 0 ? Math.max(...activeTokens.map(t => t.createdAt)) : null
      };
    } catch (error) {
      logger.error('Error getting token statistics:', error);
      throw new Error('Failed to get token statistics');
    }
  }

  /**
   * Force logout user from all devices
   * @param {string} userId - User ID
   * @param {string} adminId - Admin user ID who initiated the action
   * @returns {Promise<Object>} - Logout result
   */
  static async forceLogoutAllDevices(userId, adminId = null) {
    try {
      const result = await this.revokeAllUserTokens(userId, adminId, 'admin_force_logout');
      
      logger.warn(`Force logout initiated for user: ${userId}`, {
        adminId,
        revokedCount: result.revokedCount
      });

      return result;
    } catch (error) {
      logger.error('Error force logging out user:', error);
      throw new Error('Failed to force logout user');
    }
  }

  /**
   * Get detailed token information
   * @param {string} token - Refresh token
   * @returns {Promise<Object>} - Detailed token information
   */
  static async getTokenDetails(token) {
    try {
      const tokenDoc = await RefreshToken.findOne({ token }).populate('userId', 'firstName lastName email');
      
      if (!tokenDoc) {
        throw new Error('Token not found');
      }

      return {
        id: tokenDoc._id,
        token: tokenDoc.token,
        userId: tokenDoc.userId,
        user: tokenDoc.userId,
        deviceInfo: tokenDoc.deviceInfo,
        isRevoked: tokenDoc.isRevoked,
        createdAt: tokenDoc.createdAt,
        expiresAt: tokenDoc.expiresAt,
        revokedAt: tokenDoc.revokedAt,
        revokedBy: tokenDoc.revokedBy,
        revokedReason: tokenDoc.revokedReason,
        isValid: tokenDoc.isValid()
      };
    } catch (error) {
      logger.error('Error getting token details:', error);
      throw new Error('Failed to get token details');
    }
  }
}

module.exports = TokenService;
