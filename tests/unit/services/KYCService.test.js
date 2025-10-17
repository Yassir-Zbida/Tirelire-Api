const KYCService = require('../../../src/services/KYCService');
const User = require('../../../src/models/User');
const constants = require('../../../src/config/constants');

// Mock dependencies
jest.mock('../../../src/models/User');
jest.mock('../../../src/utils/logger');

describe('KYCService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('submitKYCDocuments', () => {
    it('should submit KYC documents successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const kycData = {
        idImagePath: 'uploads/kyc/id_123.jpg',
        selfieImagePath: 'uploads/kyc/selfie_123.jpg'
      };

      const mockUser = {
        _id: userId,
        kyc: {
          status: constants.KYC_STATUS.PENDING,
          idImagePath: kycData.idImagePath,
          selfieImagePath: kycData.selfieImagePath,
          submittedAt: new Date()
        },
        save: jest.fn().mockResolvedValue()
      };

      User.findById.mockResolvedValue(mockUser);

      const result = await KYCService.submitKYCDocuments(userId, kycData);
      
      expect(result).toBeDefined();
      expect(result.kyc.status).toBe(constants.KYC_STATUS.PENDING);
      expect(User.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw error if user not found', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const kycData = {
        idImagePath: 'uploads/kyc/id_123.jpg',
        selfieImagePath: 'uploads/kyc/selfie_123.jpg'
      };

      User.findById.mockResolvedValue(null);

      await expect(KYCService.submitKYCDocuments(userId, kycData)).rejects.toThrow('User not found');
    });
  });

  describe('verifyKYC', () => {
    it('should verify KYC successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const verificationData = {
        status: constants.KYC_STATUS.VERIFIED,
        faceMatchScore: 95,
        verifiedBy: '507f1f77bcf86cd799439012'
      };

      const mockUser = {
        _id: userId,
        kyc: {
          status: constants.KYC_STATUS.PENDING,
          faceMatchScore: verificationData.faceMatchScore,
          verifiedBy: verificationData.verifiedBy,
          verifiedAt: new Date()
        },
        save: jest.fn().mockResolvedValue()
      };

      User.findById.mockResolvedValue(mockUser);

      const result = await KYCService.verifyKYC(userId, verificationData);
      
      expect(result).toBeDefined();
      expect(result.kyc.status).toBe(constants.KYC_STATUS.VERIFIED);
    });

    it('should reject KYC successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const verificationData = {
        status: constants.KYC_STATUS.REJECTED,
        rejectionReason: 'Poor image quality'
      };

      const mockUser = {
        _id: userId,
        kyc: {
          status: constants.KYC_STATUS.REJECTED,
          rejectionReason: verificationData.rejectionReason
        },
        save: jest.fn().mockResolvedValue()
      };

      User.findById.mockResolvedValue(mockUser);

      const result = await KYCService.verifyKYC(userId, verificationData);
      
      expect(result).toBeDefined();
      expect(result.kyc.status).toBe(constants.KYC_STATUS.REJECTED);
    });
  });

  describe('getKYCStatus', () => {
    it('should get KYC status successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const mockUser = {
        _id: userId,
        kyc: {
          status: constants.KYC_STATUS.VERIFIED,
          submittedAt: new Date(),
          verifiedAt: new Date()
        }
      };

      const mockUserWithSelect = {
        ...mockUser,
        select: jest.fn().mockResolvedValue(mockUser)
      };
      User.findById.mockReturnValue(mockUserWithSelect);

      const result = await KYCService.getKYCStatus(userId);
      
      expect(result).toBeDefined();
      expect(result.status).toBe(constants.KYC_STATUS.VERIFIED);
    });

    it('should throw error if user not found', async () => {
      const userId = '507f1f77bcf86cd799439011';

      const mockUserWithSelect = {
        select: jest.fn().mockResolvedValue(null)
      };
      User.findById.mockReturnValue(mockUserWithSelect);

      await expect(KYCService.getKYCStatus(userId)).rejects.toThrow('User not found');
    });
  });
});
