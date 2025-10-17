const request = require('supertest');
const express = require('express');
const AuthController = require('../../../src/controllers/authController');
const AuthService = require('../../../src/services/AuthService');
const responseHandler = require('../../../src/utils/responseHandler');

// Mock dependencies
jest.mock('../../../src/services/AuthService');
jest.mock('../../../src/utils/responseHandler');

describe('AuthController', () => {
  let app;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    mockReq = {
      body: {},
      params: {},
      user: { id: '507f1f77bcf86cd799439011' }
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123'
      };
      
      mockReq.body = userData;
      
      const mockUser = {
        id: '507f1f77bcf86cd799439011',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      };
      
      AuthService.register.mockResolvedValue({
        success: true,
        message: 'User registered successfully',
        data: { user: mockUser }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await AuthController.register(mockReq, mockRes, mockNext);
      
      expect(AuthService.register).toHaveBeenCalledWith(userData);
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle registration error', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123'
      };
      
      mockReq.body = userData;
      
      const error = new Error('User already exists');
      AuthService.register.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await AuthController.register(mockReq, mockRes, mockNext);
      
      expect(AuthService.register).toHaveBeenCalledWith(userData);
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'password123'
      };
      
      mockReq.body = loginData;
      
      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      };
      
      AuthService.login.mockResolvedValue({
        success: true,
        message: 'Login successful',
        data: { tokens: mockTokens }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await AuthController.login(mockReq, mockRes, mockNext);
      
      expect(AuthService.login).toHaveBeenCalledWith(loginData);
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle login error', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'wrongpassword'
      };
      
      mockReq.body = loginData;
      
      const error = new Error('Invalid credentials');
      AuthService.login.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await AuthController.login(mockReq, mockRes, mockNext);
      
      expect(AuthService.login).toHaveBeenCalledWith(loginData);
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshData = {
        refreshToken: 'refresh-token'
      };
      
      mockReq.body = refreshData;
      
      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };
      
      AuthService.refreshAccessToken.mockResolvedValue({
        success: true,
        message: 'Token refreshed successfully',
        data: { tokens: mockTokens }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await AuthController.refreshToken(mockReq, mockRes, mockNext);
      
      expect(AuthService.refreshAccessToken).toHaveBeenCalledWith(refreshData);
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle refresh token error', async () => {
      const refreshData = {
        refreshToken: 'invalid-token'
      };
      
      mockReq.body = refreshData;
      
      const error = new Error('Invalid refresh token');
      AuthService.refreshAccessToken.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await AuthController.refreshToken(mockReq, mockRes, mockNext);
      
      expect(AuthService.refreshAccessToken).toHaveBeenCalledWith(refreshData);
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const logoutData = {
        refreshToken: 'refresh-token'
      };
      
      mockReq.body = logoutData;
      
      AuthService.logout.mockResolvedValue({
        success: true,
        message: 'Logout successful'
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await AuthController.logout(mockReq, mockRes, mockNext);
      
      expect(AuthService.logout).toHaveBeenCalledWith(logoutData);
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle logout error', async () => {
      const logoutData = {
        refreshToken: 'invalid-token'
      };
      
      mockReq.body = logoutData;
      
      const error = new Error('Invalid refresh token');
      AuthService.logout.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await AuthController.logout(mockReq, mockRes, mockNext);
      
      expect(AuthService.logout).toHaveBeenCalledWith(logoutData);
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      const mockUser = {
        id: '507f1f77bcf86cd799439011',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      };
      
      AuthService.getUserProfile.mockResolvedValue({
        success: true,
        data: { user: mockUser }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await AuthController.getProfile(mockReq, mockRes, mockNext);
      
      expect(AuthService.getUserProfile).toHaveBeenCalledWith(mockReq.user.id);
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle get profile error', async () => {
      const error = new Error('User not found');
      AuthService.getUserProfile.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await AuthController.getProfile(mockReq, mockRes, mockNext);
      
      expect(AuthService.getUserProfile).toHaveBeenCalledWith(mockReq.user.id);
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith'
      };
      
      mockReq.body = updateData;
      
      const mockUser = {
        id: '507f1f77bcf86cd799439011',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'john@example.com'
      };
      
      AuthService.updateUserProfile.mockResolvedValue({
        success: true,
        message: 'Profile updated successfully',
        data: { user: mockUser }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await AuthController.updateProfile(mockReq, mockRes, mockNext);
      
      expect(AuthService.updateUserProfile).toHaveBeenCalledWith(mockReq.user.id, updateData);
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle update profile error', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith'
      };
      
      mockReq.body = updateData;
      
      const error = new Error('User not found');
      AuthService.updateUserProfile.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await AuthController.updateProfile(mockReq, mockRes, mockNext);
      
      expect(AuthService.updateUserProfile).toHaveBeenCalledWith(mockReq.user.id, updateData);
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123'
      };
      
      mockReq.body = passwordData;
      
      AuthService.changePassword.mockResolvedValue({
        success: true,
        message: 'Password changed successfully'
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await AuthController.changePassword(mockReq, mockRes, mockNext);
      
      expect(AuthService.changePassword).toHaveBeenCalledWith(mockReq.user.id, passwordData);
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle change password error', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      };
      
      mockReq.body = passwordData;
      
      const error = new Error('Current password is incorrect');
      AuthService.changePassword.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await AuthController.changePassword(mockReq, mockRes, mockNext);
      
      expect(AuthService.changePassword).toHaveBeenCalledWith(mockReq.user.id, passwordData);
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });
});