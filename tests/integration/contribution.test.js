const request = require('supertest');
const { app } = require('../../src/app');
const ContributionService = require('../../src/services/ContributionService');
const { authMiddleware } = require('../../src/middlewares/authMiddleware');
const Contribution = require('../../src/models/Contribution');
const Group = require('../../src/models/Group');
const User = require('../../src/models/User');

// Mock dependencies
jest.mock('../../src/services/ContributionService', () => ({
  createContribution: jest.fn(),
  getUserContributions: jest.fn(),
  getContributionById: jest.fn(),
  markAsPaid: jest.fn()
}));
jest.mock('../../src/middlewares/authMiddleware', () => ({
  authMiddleware: jest.fn((req, res, next) => {
    req.user = { id: '507f1f77bcf86cd799439013', _id: '507f1f77bcf86cd799439013' };
    next();
  }),
  extractDeviceInfo: jest.fn((req, res, next) => {
    req.deviceInfo = { userAgent: 'test-agent', ipAddress: '127.0.0.1' };
    next();
  })
}));
jest.mock('../../src/models/Contribution');
jest.mock('../../src/models/Group');
jest.mock('../../src/models/User');

describe('Contribution Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/contributions', () => {
    it('should create a contribution successfully', async () => {
      const contributionData = {
        groupId: '507f1f77bcf86cd799439011',
        amount: 100,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        description: 'Monthly contribution'
      };

      const mockContribution = {
        _id: '507f1f77bcf86cd799439012',
        ...contributionData,
        user: '507f1f77bcf86cd799439013',
        status: 'PENDING',
        cycleNumber: 1
      };

      const mockToken = 'mock-access-token';
      authMiddleware.mockImplementation((req, res, next) => {
        req.user = { _id: '507f1f77bcf86cd799439013' };
        next();
      });

      ContributionService.createContribution.mockResolvedValue({
        success: true,
        message: 'Contribution created successfully',
        data: mockContribution
      });

      const response = await request(app)
        .post('/api/contributions')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(contributionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Contribution created successfully');
      expect(response.body.data.contribution).toBeDefined();
      expect(ContributionService.createContribution).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439013',
        contributionData
      );
    });

    it('should return 400 for missing required fields', async () => {
      const contributionData = {
        amount: 100
        // Missing groupId and dueDate
      };

      const mockToken = 'mock-access-token';
      authMiddleware.mockImplementation((req, res, next) => {
        req.user = { _id: '507f1f77bcf86cd799439013' };
        next();
      });

      const response = await request(app)
        .post('/api/contributions')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(contributionData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const contributionData = {
        groupId: '507f1f77bcf86cd799439011',
        amount: 100,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      const response = await request(app)
        .post('/api/contributions')
        .send(contributionData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/contributions', () => {
    it('should get user contributions successfully', async () => {
      const mockContributions = [
        {
          _id: '507f1f77bcf86cd799439012',
          group: { name: 'Test Group' },
          amount: 100,
          status: 'PENDING',
          dueDate: new Date()
        }
      ];

      const mockToken = 'mock-access-token';
      authMiddleware.mockImplementation((req, res, next) => {
        req.user = { _id: '507f1f77bcf86cd799439013' };
        next();
      });

      ContributionService.getUserContributions.mockResolvedValue({
        success: true,
        data: {
          contributions: mockContributions,
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            pages: 1
          }
        }
      });

      const response = await request(app)
        .get('/api/contributions')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contributions).toBeDefined();
      expect(response.body.data.contributions).toHaveLength(1);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/contributions')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/contributions/:id', () => {
    it('should get contribution by ID successfully', async () => {
      const contributionId = '507f1f77bcf86cd799439012';
      const mockContribution = {
        _id: contributionId,
        group: { name: 'Test Group' },
        amount: 100,
        status: 'PENDING',
        dueDate: new Date()
      };

      const mockToken = 'mock-access-token';
      authMiddleware.mockImplementation((req, res, next) => {
        req.user = { _id: '507f1f77bcf86cd799439013' };
        next();
      });

      ContributionService.getContributionById.mockResolvedValue({
        success: true,
        data: { contribution: mockContribution }
      });

      const response = await request(app)
        .get(`/api/contributions/${contributionId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contribution).toBeDefined();
      expect(response.body.data.contribution._id).toBe(contributionId);
    });

    it('should return 404 if contribution not found', async () => {
      const contributionId = '507f1f77bcf86cd799439012';

      const mockToken = 'mock-access-token';
      authMiddleware.mockImplementation((req, res, next) => {
        req.user = { _id: '507f1f77bcf86cd799439013' };
        next();
      });

      ContributionService.getContributionById.mockRejectedValue(new Error('Contribution not found'));

      const response = await request(app)
        .get(`/api/contributions/${contributionId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/contributions/:id/pay', () => {
    it('should mark contribution as paid successfully', async () => {
      const contributionId = '507f1f77bcf86cd799439012';
      const paymentData = {
        paymentMethod: 'BANK_TRANSFER',
        bankProofUrl: 'uploads/payments/proof_123.jpg'
      };

      const mockContribution = {
        _id: contributionId,
        status: 'PAID',
        paidDate: new Date()
      };

      const mockToken = 'mock-access-token';
      authMiddleware.mockImplementation((req, res, next) => {
        req.user = { _id: '507f1f77bcf86cd799439013' };
        next();
      });

      ContributionService.markAsPaid.mockResolvedValue({
        success: true,
        message: 'Contribution marked as paid',
        data: { contribution: mockContribution }
      });

      const response = await request(app)
        .put(`/api/contributions/${contributionId}/pay`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Contribution marked as paid');
      expect(response.body.data.contribution.status).toBe('PAID');
    });

    it('should return 400 for invalid payment data', async () => {
      const contributionId = '507f1f77bcf86cd799439012';
      const paymentData = {
        // Missing required fields
      };

      const mockToken = 'mock-access-token';
      authMiddleware.mockImplementation((req, res, next) => {
        req.user = { _id: '507f1f77bcf86cd799439013' };
        next();
      });

      const response = await request(app)
        .put(`/api/contributions/${contributionId}/pay`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
