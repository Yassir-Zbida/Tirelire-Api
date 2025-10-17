const User = require('../../../src/models/User');
const AuthService = require('../../../src/services/AuthService');
const { authMiddleware } = require('../../../src/middlewares/authMiddleware');

// Mock dependencies
jest.mock('../../../src/models/User');
jest.mock('../../../src/services/AuthService');

describe('authMiddleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
      user: null
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('when token is missing', () => {
    it('should return 401 error', async () => {
      await authMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when token is invalid', () => {
    it('should return 401 error for invalid token', async () => {
      mockReq.headers.authorization = 'Bearer invalid-token';
      AuthService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      await authMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 error for expired token', async () => {
      mockReq.headers.authorization = 'Bearer expired-token';
      AuthService.verifyAccessToken.mockImplementation(() => {
        const error = new Error('Token has expired');
        throw error;
      });
      
      await authMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when user is not found', () => {
    it('should return 401 error', async () => {
      mockReq.headers.authorization = 'Bearer valid-token';
      AuthService.verifyAccessToken.mockReturnValue({ sub: '507f1f77bcf86cd799439011' });
      User.findById.mockResolvedValue(null);
      
      await authMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when user is inactive', () => {
    it('should return 401 error', async () => {
      mockReq.headers.authorization = 'Bearer valid-token';
      AuthService.verifyAccessToken.mockReturnValue({ sub: '507f1f77bcf86cd799439011' });
      
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        isActive: false
      };
      User.findById.mockResolvedValue(mockUser);
      
      await authMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('deactivated')
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when authentication is successful', () => {
    it('should call next() with user attached to request', async () => {
      mockReq.headers.authorization = 'Bearer valid-token';
      AuthService.verifyAccessToken.mockReturnValue({ 
        sub: '507f1f77bcf86cd799439011',
        email: 'john@example.com',
        role: 'USER',
        reliability: 85,
        kyc: 'VERIFIED',
        iat: 1234567890,
        exp: 1234567890
      });
      
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+212612345678',
        role: 'USER',
        reliabilityScore: 85,
        kyc: { status: 'VERIFIED' },
        isKycVerified: true,
        nationalId: 'CN12345678',
        isActive: true
      };
      User.findById.mockResolvedValue(mockUser);
      
      await authMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.id).toBe('507f1f77bcf86cd799439011');
      expect(mockReq.user.email).toBe('john@example.com');
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('when database error occurs', () => {
    it('should return 500 error', async () => {
      mockReq.headers.authorization = 'Bearer valid-token';
      AuthService.verifyAccessToken.mockReturnValue({ sub: '507f1f77bcf86cd799439011' });
      User.findById.mockRejectedValue(new Error('Database error'));
      
      await authMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication failed',
        code: 'AUTH_FAILED'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when token format is invalid', () => {
    it('should return 401 error for malformed authorization header', async () => {
      mockReq.headers.authorization = 'InvalidFormat';
      
      await authMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid authorization header format',
        code: 'INVALID_HEADER'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 error for missing Bearer prefix', async () => {
      mockReq.headers.authorization = 'valid-token';
      
      await authMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid authorization header format',
        code: 'INVALID_HEADER'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});