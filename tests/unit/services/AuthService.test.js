const AuthService = require('../../../src/services/AuthService');
const User = require('../../../src/models/User');
const RefreshToken = require('../../../src/models/RefreshToken');
const constants = require('../../../src/config/constants');

// Mock dependencies
jest.mock('../../../src/models/User');
jest.mock('../../../src/models/RefreshToken');
jest.mock('../../../src/utils/logger');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'testpassword123';
      const hashedPassword = await AuthService.hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('should throw error for invalid input', async () => {
      await expect(AuthService.hashPassword(null)).rejects.toThrow();
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      const password = 'testpassword123';
      const hashedPassword = await AuthService.hashPassword(password);
      
      const result = await AuthService.comparePassword(password, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const password = 'testpassword123';
      const hashedPassword = await AuthService.hashPassword(password);
      
      const result = await AuthService.comparePassword('wrongpassword', hashedPassword);
      expect(result).toBe(false);
    });
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', () => {
      const user = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        role: constants.ROLES.PARTICULIER,
        reliabilityScore: 50,
        kyc: { status: constants.KYC_STATUS.PENDING }
      };

      const token = AuthService.generateAccessToken(user);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const user = {
        _id: '507f1f77bcf86cd799439011'
      };

      const token = AuthService.generateRefreshToken(user);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid token', () => {
      const user = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        role: constants.ROLES.PARTICULIER,
        reliabilityScore: 50,
        kyc: { status: constants.KYC_STATUS.PENDING }
      };

      const token = AuthService.generateAccessToken(user);
      const decoded = AuthService.verifyAccessToken(token);
      
      expect(decoded.sub).toBe(user._id);
      expect(decoded.email).toBe(user.email);
      expect(decoded.role).toBe(user.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        AuthService.verifyAccessToken('invalid.token.here');
      }).toThrow();
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        nationalId: 'CN12345678',
        email: 'john@example.com',
        phone: '+1234567890',
        password: 'password123'
      };

      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        ...userData,
        role: constants.ROLES.PARTICULIER,
        kyc: { status: constants.KYC_STATUS.PENDING },
        reliabilityScore: 0,
        toObject: jest.fn().mockReturnThis()
      };

      User.findOne.mockResolvedValue(null);
      User.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(mockUser),
        toObject: jest.fn().mockReturnValue(mockUser)
      }));

      const result = await AuthService.register(userData);
      
      expect(result).toBeDefined();
      expect(User.findOne).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        nationalId: 'CN12345678',
        email: 'john@example.com',
        password: 'password123'
      };

      const existingUser = {
        email: 'john@example.com'
      };

      User.findOne.mockResolvedValue(existingUser);

      await expect(AuthService.register(userData)).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const identifier = 'john@example.com';
      const password = 'password123';
      const deviceInfo = { userAgent: 'test-agent', ipAddress: '127.0.0.1' };

      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'john@example.com',
        role: constants.ROLES.PARTICULIER,
        reliabilityScore: 50,
        kyc: { status: constants.KYC_STATUS.PENDING },
        isActive: true,
        isLocked: jest.fn().mockReturnValue(false),
        comparePassword: jest.fn().mockResolvedValue(true),
        resetLoginAttempts: jest.fn().mockResolvedValue(),
        updateOne: jest.fn().mockResolvedValue()
      };

      User.findByEmailOrPhone.mockResolvedValue(mockUser);
      RefreshToken.createToken.mockResolvedValue();

      const result = await AuthService.login(identifier, password, deviceInfo);
      
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error for invalid credentials', async () => {
      const identifier = 'john@example.com';
      const password = 'wrongpassword';
      const deviceInfo = { userAgent: 'test-agent', ipAddress: '127.0.0.1' };

      User.findByEmailOrPhone.mockResolvedValue(null);

      await expect(AuthService.login(identifier, password, deviceInfo)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for locked account', async () => {
      const identifier = 'john@example.com';
      const password = 'password123';
      const deviceInfo = { userAgent: 'test-agent', ipAddress: '127.0.0.1' };

      const mockUser = {
        isLocked: jest.fn().mockReturnValue(true)
      };

      User.findByEmailOrPhone.mockResolvedValue(mockUser);

      await expect(AuthService.login(identifier, password, deviceInfo)).rejects.toThrow('Account is temporarily locked');
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      const refreshToken = 'valid.refresh.token';
      const deviceInfo = { userAgent: 'test-agent', ipAddress: '127.0.0.1' };

      const decoded = { sub: '507f1f77bcf86cd799439011' };
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'john@example.com',
        role: constants.ROLES.PARTICULIER,
        reliabilityScore: 50,
        kyc: { status: constants.KYC_STATUS.PENDING },
        isActive: true
      };

      jest.spyOn(AuthService, 'verifyRefreshToken').mockReturnValue(decoded);
      RefreshToken.findValidToken.mockResolvedValue({ token: refreshToken });
      User.findById.mockResolvedValue(mockUser);

      const result = await AuthService.refreshAccessToken(refreshToken, deviceInfo);
      
      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
    });

    it('should throw error for invalid refresh token', async () => {
      const refreshToken = 'invalid.refresh.token';
      const deviceInfo = { userAgent: 'test-agent', ipAddress: '127.0.0.1' };

      RefreshToken.findValidToken.mockResolvedValue(null);

      await expect(AuthService.refreshAccessToken(refreshToken, deviceInfo)).rejects.toThrow('Invalid or expired refresh token');
    });
  });

  describe('logout', () => {
    it('should logout user successfully with refresh token', async () => {
      const refreshToken = 'valid.refresh.token';
      const userId = '507f1f77bcf86cd799439011';

      RefreshToken.revokeToken.mockResolvedValue();

      const result = await AuthService.logout(refreshToken, userId);
      
      expect(result).toBe(true);
      expect(RefreshToken.revokeToken).toHaveBeenCalledWith(refreshToken, userId, 'logout');
    });

    it('should logout user successfully without refresh token', async () => {
      const userId = '507f1f77bcf86cd799439011';

      RefreshToken.revokeAllUserTokens.mockResolvedValue();

      const result = await AuthService.logout(null, userId);
      
      expect(result).toBe(true);
      expect(RefreshToken.revokeAllUserTokens).toHaveBeenCalledWith(userId, userId, 'logout');
    });
  });

  describe('getUserProfile', () => {
    it('should get user profile successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const mockUser = {
        _id: userId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      };

      const mockUserWithSelect = {
        ...mockUser,
        select: jest.fn().mockResolvedValue(mockUser)
      };
      User.findById.mockReturnValue(mockUserWithSelect);

      const result = await AuthService.getUserProfile(userId);
      
      expect(result).toBeDefined();
      expect(result._id).toBe(userId);
    });

    it('should throw error if user not found', async () => {
      const userId = '507f1f77bcf86cd799439011';

      const mockUserWithSelect = {
        select: jest.fn().mockResolvedValue(null)
      };
      User.findById.mockReturnValue(mockUserWithSelect);

      await expect(AuthService.getUserProfile(userId)).rejects.toThrow('User not found');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith'
      };

      const mockUser = {
        _id: userId,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'john@example.com'
      };

      const mockUserWithSelect = {
        ...mockUser,
        select: jest.fn().mockResolvedValue(mockUser)
      };
      User.findByIdAndUpdate.mockReturnValue(mockUserWithSelect);

      const result = await AuthService.updateUserProfile(userId, updateData);
      
      expect(result).toBeDefined();
      expect(result.firstName).toBe('Jane');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const currentPassword = 'oldpassword';
      const newPassword = 'newpassword123';

      const mockUser = {
        _id: userId,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue()
      };

      User.findById.mockResolvedValue(mockUser);
      RefreshToken.revokeAllUserTokens.mockResolvedValue();

      const result = await AuthService.changePassword(userId, currentPassword, newPassword);
      
      expect(result).toBe(true);
      expect(mockUser.comparePassword).toHaveBeenCalledWith(currentPassword);
    });

    it('should throw error for incorrect current password', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const currentPassword = 'wrongpassword';
      const newPassword = 'newpassword123';

      const mockUser = {
        _id: userId,
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      User.findById.mockResolvedValue(mockUser);

      await expect(AuthService.changePassword(userId, currentPassword, newPassword)).rejects.toThrow('Current password is incorrect');
    });
  });
});
