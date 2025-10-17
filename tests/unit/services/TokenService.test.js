const TokenService = require('../../../src/services/TokenService');
const RefreshToken = require('../../../src/models/RefreshToken');

// Mock dependencies
jest.mock('../../../src/models/RefreshToken');
jest.mock('../../../src/utils/logger');

describe('TokenService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRefreshToken', () => {
    it('should create a refresh token successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const deviceInfo = { userAgent: 'test-agent', ipAddress: '127.0.0.1' };
      const mockToken = {
        token: 'mock-refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        deviceInfo: { ...deviceInfo, deviceType: 'desktop' }
      };

      RefreshToken.createToken.mockResolvedValue(mockToken);

      const result = await TokenService.createRefreshToken(userId, deviceInfo);
      
      expect(result).toBeDefined();
      expect(result.token).toBe('mock-refresh-token');
      expect(RefreshToken.createToken).toHaveBeenCalledWith(userId, deviceInfo);
    });

    it('should throw error if token creation fails', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const deviceInfo = { userAgent: 'test-agent', ipAddress: '127.0.0.1' };

      RefreshToken.createToken.mockRejectedValue(new Error('Token creation failed'));

      await expect(TokenService.createRefreshToken(userId, deviceInfo)).rejects.toThrow('Failed to create refresh token');
    });
  });

  describe('validateRefreshToken', () => {
    it('should validate a valid refresh token', async () => {
      const token = 'valid.refresh.token';
      const mockTokenDoc = {
        token,
        userId: '507f1f77bcf86cd799439011',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        deviceInfo: { deviceType: 'desktop' },
        createdAt: new Date()
      };

      RefreshToken.findValidToken.mockResolvedValue(mockTokenDoc);

      const result = await TokenService.validateRefreshToken(token);
      
      expect(result).toBeDefined();
      expect(result.token).toBe(token);
      expect(result.userId).toBe('507f1f77bcf86cd799439011');
    });

    it('should throw error for invalid token', async () => {
      const token = 'invalid.refresh.token';

      RefreshToken.findValidToken.mockResolvedValue(null);

      await expect(TokenService.validateRefreshToken(token)).rejects.toThrow('Invalid or expired refresh token');
    });
  });

  describe('revokeToken', () => {
    it('should revoke a token successfully', async () => {
      const token = 'valid.refresh.token';
      const revokedBy = '507f1f77bcf86cd799439011';
      const reason = 'logout';

      const mockResult = {
        token,
        isRevoked: true,
        revokedAt: new Date()
      };

      RefreshToken.revokeToken.mockResolvedValue(mockResult);

      const result = await TokenService.revokeToken(token, revokedBy, reason);
      
      expect(result).toBe(true);
      expect(RefreshToken.revokeToken).toHaveBeenCalledWith(token, revokedBy, reason);
    });

    it('should return false if token not found', async () => {
      const token = 'nonexistent.token';
      const revokedBy = '507f1f77bcf86cd799439011';
      const reason = 'logout';

      RefreshToken.revokeToken.mockResolvedValue(null);

      const result = await TokenService.revokeToken(token, revokedBy, reason);
      
      expect(result).toBe(false);
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all user tokens successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const revokedBy = '507f1f77bcf86cd799439011';
      const reason = 'security';

      const mockResult = { modifiedCount: 3 };

      RefreshToken.revokeAllUserTokens.mockResolvedValue(mockResult);

      const result = await TokenService.revokeAllUserTokens(userId, revokedBy, reason);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.revokedCount).toBe(3);
      expect(RefreshToken.revokeAllUserTokens).toHaveBeenCalledWith(userId, revokedBy, reason);
    });

    it('should throw error if revocation fails', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const revokedBy = '507f1f77bcf86cd799439011';
      const reason = 'security';

      RefreshToken.revokeAllUserTokens.mockRejectedValue(new Error('Revocation failed'));

      await expect(TokenService.revokeAllUserTokens(userId, revokedBy, reason)).rejects.toThrow('Failed to revoke user tokens');
    });
  });

  describe('getUserActiveTokens', () => {
    it('should get user active tokens successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const mockTokens = [
        {
          _id: 'token1',
          deviceInfo: { deviceType: 'desktop' },
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        {
          _id: 'token2',
          deviceInfo: { deviceType: 'mobile' },
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      ];

      RefreshToken.getUserActiveTokens.mockResolvedValue(mockTokens);

      const result = await TokenService.getUserActiveTokens(userId);
      
      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('token1');
      expect(result[1].id).toBe('token2');
    });

    it('should throw error if retrieval fails', async () => {
      const userId = '507f1f77bcf86cd799439011';

      RefreshToken.getUserActiveTokens.mockRejectedValue(new Error('Retrieval failed'));

      await expect(TokenService.getUserActiveTokens(userId)).rejects.toThrow('Failed to get user tokens');
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should cleanup expired tokens successfully', async () => {
      const mockResult = { deletedCount: 5 };

      RefreshToken.cleanupExpiredTokens.mockResolvedValue(mockResult);

      const result = await TokenService.cleanupExpiredTokens();
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(5);
      expect(RefreshToken.cleanupExpiredTokens).toHaveBeenCalled();
    });

    it('should throw error if cleanup fails', async () => {
      RefreshToken.cleanupExpiredTokens.mockRejectedValue(new Error('Cleanup failed'));

      await expect(TokenService.cleanupExpiredTokens()).rejects.toThrow('Failed to cleanup expired tokens');
    });
  });

  describe('rotateRefreshToken', () => {
    it('should rotate refresh token successfully', async () => {
      const oldToken = 'old.refresh.token';
      const userId = '507f1f77bcf86cd799439011';
      const deviceInfo = { userAgent: 'test-agent', ipAddress: '127.0.0.1' };

      const mockOldToken = {
        _id: 'old-token-id',
        token: oldToken
      };

      const mockNewToken = {
        token: 'new.refresh.token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        deviceInfo: { ...deviceInfo, deviceType: 'desktop' }
      };

      RefreshToken.findValidToken.mockResolvedValue(mockOldToken);
      RefreshToken.createToken.mockResolvedValue(mockNewToken);
      RefreshToken.revokeToken.mockResolvedValue();

      const result = await TokenService.rotateRefreshToken(oldToken, userId, deviceInfo);
      
      expect(result).toBeDefined();
      expect(result.token).toBe('new.refresh.token');
      expect(RefreshToken.createToken).toHaveBeenCalledWith(userId, deviceInfo);
      expect(RefreshToken.revokeToken).toHaveBeenCalledWith(oldToken, userId, 'rotation');
    });

    it('should throw error for invalid old token', async () => {
      const oldToken = 'invalid.refresh.token';
      const userId = '507f1f77bcf86cd799439011';
      const deviceInfo = { userAgent: 'test-agent', ipAddress: '127.0.0.1' };

      RefreshToken.findValidToken.mockResolvedValue(null);

      await expect(TokenService.rotateRefreshToken(oldToken, userId, deviceInfo)).rejects.toThrow('Failed to rotate refresh token');
    });
  });

  describe('isTokenValid', () => {
    it('should return true for valid token', async () => {
      const token = 'valid.refresh.token';
      const mockTokenDoc = {
        token,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      RefreshToken.findValidToken.mockResolvedValue(mockTokenDoc);

      const result = await TokenService.isTokenValid(token);
      
      expect(result).toBe(true);
    });

    it('should return false for invalid token', async () => {
      const token = 'invalid.refresh.token';

      RefreshToken.findValidToken.mockResolvedValue(null);

      const result = await TokenService.isTokenValid(token);
      
      expect(result).toBe(false);
    });

    it('should return false if validation throws error', async () => {
      const token = 'error.token';

      RefreshToken.findValidToken.mockRejectedValue(new Error('Validation error'));

      const result = await TokenService.isTokenValid(token);
      
      expect(result).toBe(false);
    });
  });

  describe('getTokenStats', () => {
    it('should get token statistics successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const mockTokens = [
        {
          deviceInfo: { deviceType: 'desktop' },
          createdAt: new Date('2023-01-01')
        },
        {
          deviceInfo: { deviceType: 'mobile' },
          createdAt: new Date('2023-01-02')
        },
        {
          deviceInfo: { deviceType: 'desktop' },
          createdAt: new Date('2023-01-03')
        }
      ];

      RefreshToken.getUserActiveTokens.mockResolvedValue(mockTokens);

      const result = await TokenService.getTokenStats(userId);
      
      expect(result).toBeDefined();
      expect(result.totalActiveTokens).toBe(3);
      expect(result.deviceTypes.desktop).toBe(2);
      expect(result.deviceTypes.mobile).toBe(1);
    });

    it('should throw error if stats retrieval fails', async () => {
      const userId = '507f1f77bcf86cd799439011';

      RefreshToken.getUserActiveTokens.mockRejectedValue(new Error('Stats retrieval failed'));

      await expect(TokenService.getTokenStats(userId)).rejects.toThrow('Failed to get token statistics');
    });
  });

  describe('forceLogoutAllDevices', () => {
    it('should force logout all devices successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const adminId = '507f1f77bcf86cd799439012';

      const mockResult = { revokedCount: 3 };

      TokenService.revokeAllUserTokens = jest.fn().mockResolvedValue(mockResult);

      const result = await TokenService.forceLogoutAllDevices(userId, adminId);
      
      expect(result).toBeDefined();
      expect(result.revokedCount).toBe(3);
      expect(TokenService.revokeAllUserTokens).toHaveBeenCalledWith(userId, adminId, 'admin_force_logout');
    });

    it('should throw error if force logout fails', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const adminId = '507f1f77bcf86cd799439012';

      TokenService.revokeAllUserTokens = jest.fn().mockRejectedValue(new Error('Force logout failed'));

      await expect(TokenService.forceLogoutAllDevices(userId, adminId)).rejects.toThrow('Failed to force logout user');
    });
  });

  describe('getTokenDetails', () => {
    it('should get token details successfully', async () => {
      const token = 'valid.refresh.token';
      const mockTokenDoc = {
        _id: 'token-id',
        token,
        userId: {
          _id: '507f1f77bcf86cd799439011',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        },
        deviceInfo: { deviceType: 'desktop' },
        isRevoked: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isValid: jest.fn().mockReturnValue(true)
      };

      RefreshToken.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockTokenDoc)
      });

      const result = await TokenService.getTokenDetails(token);
      
      expect(result).toBeDefined();
      expect(result.token).toBe(token);
      expect(result.userId).toEqual({ _id: '507f1f77bcf86cd799439011', email: 'john@example.com', firstName: 'John', lastName: 'Doe' });
      expect(result.isValid).toBe(true);
    });

    it('should throw error if token not found', async () => {
      const token = 'nonexistent.token';

      RefreshToken.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await expect(TokenService.getTokenDetails(token)).rejects.toThrow('Failed to get token details');
    });

    it('should throw error if details retrieval fails', async () => {
      const token = 'error.token';

      RefreshToken.findOne.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('Details retrieval failed'))
      });

      await expect(TokenService.getTokenDetails(token)).rejects.toThrow('Failed to get token details');
    });
  });
});
