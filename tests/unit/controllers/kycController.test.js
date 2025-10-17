const request = require('supertest');
const express = require('express');
const KYCController = require('../../../src/controllers/kycController');
const KYCService = require('../../../src/services/KYCService');
const responseHandler = require('../../../src/utils/responseHandler');

// Mock dependencies
jest.mock('../../../src/services/KYCService');
jest.mock('../../../src/utils/responseHandler');

describe('KYCController', () => {
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
      user: { id: '507f1f77bcf86cd799439011' },
      files: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('submitKYCDocuments', () => {
    it('should submit KYC documents successfully', async () => {
      const kycData = {
        nationalId: '123456789',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        address: '123 Main St'
      };
      
      const mockFiles = {
        idCard: {
          fieldname: 'idCard',
          originalname: 'id.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('fake-image-data')
        }
      };
      
      mockReq.body = kycData;
      mockReq.files = mockFiles;
      
      const mockKYC = {
        id: '507f1f77bcf86cd799439011',
        userId: '507f1f77bcf86cd799439011',
        nationalId: '123456789',
        status: 'PENDING'
      };
      
      KYCService.submitKYCDocuments.mockResolvedValue({
        success: true,
        message: 'KYC documents submitted successfully',
        data: { kyc: mockKYC }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await KYCController.submitKYCDocuments(mockReq, mockRes, mockNext);
      
      expect(KYCService.submitKYCDocuments).toHaveBeenCalledWith(mockReq.user.id, kycData, mockFiles);
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle submit KYC documents error', async () => {
      const kycData = {
        nationalId: '123456789',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        address: '123 Main St'
      };
      
      mockReq.body = kycData;
      mockReq.files = {};
      
      const error = new Error('KYC submission failed');
      KYCService.submitKYCDocuments.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await KYCController.submitKYCDocuments(mockReq, mockRes, mockNext);
      
      expect(KYCService.submitKYCDocuments).toHaveBeenCalledWith(mockReq.user.id, kycData, mockReq.files);
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });

  describe('getKYCStatus', () => {
    it('should get KYC status successfully', async () => {
      const mockKYC = {
        id: '507f1f77bcf86cd799439011',
        userId: '507f1f77bcf86cd799439011',
        nationalId: '123456789',
        status: 'VERIFIED',
        verifiedAt: new Date()
      };
      
      KYCService.getKYCStatus.mockResolvedValue({
        success: true,
        data: { kyc: mockKYC }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await KYCController.getKYCStatus(mockReq, mockRes, mockNext);
      
      expect(KYCService.getKYCStatus).toHaveBeenCalledWith(mockReq.user.id);
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle get KYC status error', async () => {
      const error = new Error('KYC status not found');
      KYCService.getKYCStatus.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await KYCController.getKYCStatus(mockReq, mockRes, mockNext);
      
      expect(KYCService.getKYCStatus).toHaveBeenCalledWith(mockReq.user.id);
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });

  describe('verifyKYC', () => {
    it('should verify KYC successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const verificationData = {
        status: 'VERIFIED',
        notes: 'All documents verified'
      };
      
      mockReq.params.userId = userId;
      mockReq.body = verificationData;
      
      const mockKYC = {
        id: '507f1f77bcf86cd799439011',
        userId: userId,
        status: 'VERIFIED',
        verifiedAt: new Date()
      };
      
      KYCService.verifyKYC.mockResolvedValue({
        success: true,
        message: 'KYC verified successfully',
        data: { kyc: mockKYC }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await KYCController.verifyKYC(mockReq, mockRes, mockNext);
      
      expect(KYCService.verifyKYC).toHaveBeenCalledWith(userId, verificationData);
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle verify KYC error', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const verificationData = {
        status: 'VERIFIED',
        notes: 'All documents verified'
      };
      
      mockReq.params.userId = userId;
      mockReq.body = verificationData;
      
      const error = new Error('KYC verification failed');
      KYCService.verifyKYC.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await KYCController.verifyKYC(mockReq, mockRes, mockNext);
      
      expect(KYCService.verifyKYC).toHaveBeenCalledWith(userId, verificationData);
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });

  describe('rejectKYC', () => {
    it('should reject KYC successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const rejectionData = {
        status: 'REJECTED',
        notes: 'Documents are not clear'
      };
      
      mockReq.params.userId = userId;
      mockReq.body = rejectionData;
      
      const mockKYC = {
        id: '507f1f77bcf86cd799439011',
        userId: userId,
        status: 'REJECTED',
        rejectedAt: new Date()
      };
      
      KYCService.verifyKYC.mockResolvedValue({
        success: true,
        message: 'KYC rejected',
        data: { kyc: mockKYC }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await KYCController.rejectKYC(mockReq, mockRes, mockNext);
      
      expect(KYCService.verifyKYC).toHaveBeenCalledWith(userId, rejectionData);
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle reject KYC error', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const rejectionData = {
        status: 'REJECTED',
        notes: 'Documents are not clear'
      };
      
      mockReq.params.userId = userId;
      mockReq.body = rejectionData;
      
      const error = new Error('KYC rejection failed');
      KYCService.verifyKYC.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await KYCController.rejectKYC(mockReq, mockRes, mockNext);
      
      expect(KYCService.verifyKYC).toHaveBeenCalledWith(userId, rejectionData);
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });

  describe('getAllKYCRequests', () => {
    it('should get all KYC requests successfully', async () => {
      const mockKYCRequests = [
        {
          id: '507f1f77bcf86cd799439011',
          userId: '507f1f77bcf86cd799439011',
          nationalId: '123456789',
          status: 'PENDING'
        },
        {
          id: '507f1f77bcf86cd799439012',
          userId: '507f1f77bcf86cd799439012',
          nationalId: '987654321',
          status: 'VERIFIED'
        }
      ];
      
      KYCService.getAllKYCRequests.mockResolvedValue({
        success: true,
        data: { kycRequests: mockKYCRequests }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await KYCController.getAllKYCRequests(mockReq, mockRes, mockNext);
      
      expect(KYCService.getAllKYCRequests).toHaveBeenCalled();
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle get all KYC requests error', async () => {
      const error = new Error('Failed to get KYC requests');
      KYCService.getAllKYCRequests.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await KYCController.getAllKYCRequests(mockReq, mockRes, mockNext);
      
      expect(KYCService.getAllKYCRequests).toHaveBeenCalled();
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });
});