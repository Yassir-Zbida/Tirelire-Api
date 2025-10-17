const request = require('supertest');
const { app } = require('../../src/app');
const KYCService = require('../../src/services/KYCService');
const { authMiddleware } = require('../../src/middlewares/authMiddleware');
const User = require('../../src/models/User');

// Mock dependencies
jest.mock('../../src/services/KYCService');
jest.mock('../../src/middlewares/authMiddleware', () => ({
  authMiddleware: jest.fn((req, res, next) => {
    req.user = { _id: '507f1f77bcf86cd799439013', sub: '507f1f77bcf86cd799439013' };
    next();
  }),
  extractDeviceInfo: jest.fn((req, res, next) => {
    req.deviceInfo = { userAgent: 'test-agent', ipAddress: '127.0.0.1' };
    next();
  })
}));
jest.mock('../../src/models/User');

describe('KYC Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/kyc/submit', () => {
    it('should submit KYC documents successfully', async () => {
      const kycData = {
        idImagePath: 'uploads/kyc/id_123.jpg',
        selfieImagePath: 'uploads/kyc/selfie_123.jpg'
      };

      const mockKYCResult = {
        _id: '507f1f77bcf86cd799439011',
        kyc: {
          status: 'PENDING',
          idImagePath: kycData.idImagePath,
          selfieImagePath: kycData.selfieImagePath,
          submittedAt: new Date()
        }
      };

      const mockToken = 'mock-access-token';
      authMiddleware.mockImplementation((req, res, next) => {
        req.user = { _id: '507f1f77bcf86cd799439011' };
        next();
      });

      KYCService.submitKYCDocuments.mockResolvedValue(mockKYCResult);

      const response = await request(app)
        .post('/api/kyc/submit')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(kycData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('KYC documents submitted successfully');
      expect(response.body.data.kyc).toBeDefined();
      expect(KYCService.submitKYCDocuments).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        kycData
      );
    });

    it('should return 400 for missing required fields', async () => {
      const kycData = {
        idImagePath: 'uploads/kyc/id_123.jpg'
        // Missing selfieImagePath
      };

      const mockToken = 'mock-access-token';
      authMiddleware.mockImplementation((req, res, next) => {
        req.user = { _id: '507f1f77bcf86cd799439011' };
        next();
      });

      const response = await request(app)
        .post('/api/kyc/submit')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(kycData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const kycData = {
        idImagePath: 'uploads/kyc/id_123.jpg',
        selfieImagePath: 'uploads/kyc/selfie_123.jpg'
      };

      const response = await request(app)
        .post('/api/kyc/submit')
        .send(kycData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/kyc/status', () => {
    it('should get KYC status successfully', async () => {
      const mockKYCStatus = {
        status: 'VERIFIED',
        submittedAt: new Date(),
        verifiedAt: new Date(),
        faceMatchScore: 95
      };

      const mockToken = 'mock-access-token';
      authMiddleware.mockImplementation((req, res, next) => {
        req.user = { _id: '507f1f77bcf86cd799439011' };
        next();
      });

      KYCService.getKYCStatus.mockResolvedValue(mockKYCStatus);

      const response = await request(app)
        .get('/api/kyc/status')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.kyc).toBeDefined();
      expect(response.body.data.kyc.status).toBe('VERIFIED');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/kyc/status')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/kyc/verify', () => {
    it('should verify KYC successfully', async () => {
      const verificationData = {
        userId: '507f1f77bcf86cd799439011',
        status: 'VERIFIED',
        faceMatchScore: 95,
        verifiedBy: '507f1f77bcf86cd799439012'
      };

      const mockVerificationResult = {
        _id: '507f1f77bcf86cd799439011',
        kyc: {
          status: 'VERIFIED',
          faceMatchScore: 95,
          verifiedBy: '507f1f77bcf86cd799439012',
          verifiedAt: new Date()
        }
      };

      const mockToken = 'mock-access-token';
      authMiddleware.mockImplementation((req, res, next) => {
        req.user = { _id: '507f1f77bcf86cd799439012', role: 'ADMIN' };
        next();
      });

      KYCService.verifyKYC.mockResolvedValue(mockVerificationResult);

      const response = await request(app)
        .post('/api/kyc/verify')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(verificationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('KYC verification completed');
      expect(response.body.data.user.kyc.status).toBe('VERIFIED');
    });

    it('should reject KYC successfully', async () => {
      const verificationData = {
        userId: '507f1f77bcf86cd799439011',
        status: 'REJECTED',
        rejectionReason: 'Poor image quality'
      };

      const mockVerificationResult = {
        _id: '507f1f77bcf86cd799439011',
        kyc: {
          status: 'REJECTED',
          rejectionReason: 'Poor image quality',
          verifiedBy: '507f1f77bcf86cd799439012',
          verifiedAt: new Date()
        }
      };

      const mockToken = 'mock-access-token';
      authMiddleware.mockImplementation((req, res, next) => {
        req.user = { _id: '507f1f77bcf86cd799439012', role: 'ADMIN' };
        next();
      });

      KYCService.verifyKYC.mockResolvedValue(mockVerificationResult);

      const response = await request(app)
        .post('/api/kyc/verify')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(verificationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('KYC verification completed');
      expect(response.body.data.user.kyc.status).toBe('REJECTED');
    });

    it('should return 403 for non-admin users', async () => {
      const verificationData = {
        userId: '507f1f77bcf86cd799439011',
        status: 'VERIFIED'
      };

      const mockToken = 'mock-access-token';
      authMiddleware.mockImplementation((req, res, next) => {
        req.user = { _id: '507f1f77bcf86cd799439011', role: 'PARTICULIER' };
        next();
      });

      const response = await request(app)
        .post('/api/kyc/verify')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(verificationData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/kyc/pending', () => {
    it('should get pending KYC requests successfully', async () => {
      const mockPendingKYC = [
        {
          _id: '507f1f77bcf86cd799439011',
          firstName: 'John',
          lastName: 'Doe',
          kyc: {
            status: 'PENDING',
            submittedAt: new Date()
          }
        }
      ];

      const mockToken = 'mock-access-token';
      authMiddleware.mockImplementation((req, res, next) => {
        req.user = { _id: '507f1f77bcf86cd799439012', role: 'ADMIN' };
        next();
      });

      KYCService.getPendingKYC.mockResolvedValue(mockPendingKYC);

      const response = await request(app)
        .get('/api/kyc/pending')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pendingKYC).toBeDefined();
      expect(response.body.data.pendingKYC).toHaveLength(1);
    });

    it('should return 403 for non-admin users', async () => {
      const mockToken = 'mock-access-token';
      authMiddleware.mockImplementation((req, res, next) => {
        req.user = { _id: '507f1f77bcf86cd799439011', role: 'PARTICULIER' };
        next();
      });

      const response = await request(app)
        .get('/api/kyc/pending')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
