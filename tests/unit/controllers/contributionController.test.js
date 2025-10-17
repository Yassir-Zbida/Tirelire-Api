const ContributionController = require('../../../src/controllers/contributionController');
const ContributionService = require('../../../src/services/ContributionService');
const responseHandler = require('../../../src/utils/responseHandler');

// Mock dependencies
jest.mock('../../../src/services/ContributionService');
jest.mock('../../../src/utils/responseHandler');

describe('ContributionController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: '507f1f77bcf86cd799439013' }
    };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createContribution', () => {
    it('should create contribution successfully', async () => {
      const contributionData = {
        groupId: '507f1f77bcf86cd799439011',
        amount: 100,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      req.body = contributionData;

      const mockResult = {
        success: true,
        message: 'Contribution created successfully',
        data: { contribution: { _id: '507f1f77bcf86cd799439012' } }
      };

      ContributionService.createContribution.mockResolvedValue(mockResult);
      responseHandler.success.mockReturnValue();

      await ContributionController.createContribution(req, res, next);

      expect(ContributionService.createContribution).toHaveBeenCalledWith(
        contributionData,
        req.user.id
      );
      expect(responseHandler.success).toHaveBeenCalledWith(
        res,
        mockResult.message,
        mockResult.data,
        201
      );
    });

    it('should handle error', async () => {
      const error = new Error('Service error');
      ContributionService.createContribution.mockRejectedValue(error);

      await ContributionController.createContribution(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getUserContributions', () => {
    it('should get user contributions successfully', async () => {
      const filters = { groupId: '507f1f77bcf86cd799439011', status: 'PENDING' };
      req.query = filters;

      const mockResult = {
        success: true,
        data: {
          contributions: [{ _id: '507f1f77bcf86cd799439012' }],
          pagination: { page: 1, limit: 20, total: 1 }
        }
      };

      ContributionService.getUserContributions.mockResolvedValue(mockResult);
      responseHandler.success.mockReturnValue();

      await ContributionController.getUserContributions(req, res, next);

      expect(ContributionService.getUserContributions).toHaveBeenCalledWith(
        req.user.id,
        { groupId: filters.groupId, status: filters.status, page: NaN, limit: NaN }
      );
      expect(responseHandler.success).toHaveBeenCalledWith(
        res,
        'Contributions retrieved successfully',
        mockResult.data
      );
    });
  });

  describe('getGroupContributions', () => {
    it('should get group contributions successfully', async () => {
      const groupId = '507f1f77bcf86cd799439011';
      req.params = { groupId };
      req.query = { status: 'PENDING' };

      const mockResult = {
        success: true,
        data: {
          contributions: [{ _id: '507f1f77bcf86cd799439012' }],
          pagination: { page: 1, limit: 20, total: 1 }
        }
      };

      ContributionService.getGroupContributions.mockResolvedValue(mockResult);
      responseHandler.success.mockReturnValue();

      await ContributionController.getGroupContributions(req, res, next);

      expect(ContributionService.getGroupContributions).toHaveBeenCalledWith(
        groupId,
        { status: 'PENDING', userId: undefined, page: NaN, limit: NaN }
      );
    });
  });

  describe('getContributionById', () => {
    it('should get contribution by ID successfully', async () => {
      const contributionId = '507f1f77bcf86cd799439012';
      req.params = { id: contributionId };

      const mockResult = {
        success: true,
        data: { contribution: { _id: contributionId } }
      };

      ContributionService.getContributionById.mockResolvedValue(mockResult);
      responseHandler.success.mockReturnValue();

      await ContributionController.getContributionById(req, res, next);

      expect(ContributionService.getContributionById).toHaveBeenCalledWith(
        contributionId,
        req.user.id
      );
    });
  });

  describe('updateContribution', () => {
    it('should update contribution successfully', async () => {
      const contributionId = '507f1f77bcf86cd799439012';
      const updateData = { description: 'Updated description' };
      req.params = { id: contributionId };
      req.body = updateData;

      const mockResult = {
        success: true,
        message: 'Contribution updated successfully',
        data: { contribution: { _id: contributionId } }
      };

      ContributionService.updateContribution.mockResolvedValue(mockResult);
      responseHandler.success.mockReturnValue();

      await ContributionController.updateContribution(req, res, next);

      expect(ContributionService.updateContribution).toHaveBeenCalledWith(
        contributionId,
        updateData,
        req.user.id
      );
    });
  });

  describe('markAsPaid', () => {
    it('should mark contribution as paid successfully', async () => {
      const contributionId = '507f1f77bcf86cd799439012';
      const paymentData = { paymentId: '507f1f77bcf86cd799439014' };
      req.params = { id: contributionId };
      req.body = paymentData;

      const mockResult = {
        success: true,
        message: 'Contribution marked as paid',
        data: { contribution: { _id: contributionId, status: 'PAID' } }
      };

      ContributionService.markAsPaid.mockResolvedValue(mockResult);
      responseHandler.success.mockReturnValue();

      await ContributionController.markAsPaid(req, res, next);

      expect(ContributionService.markAsPaid).toHaveBeenCalledWith(
        contributionId,
        paymentData.paymentId,
        req.user.id
      );
    });
  });

  describe('addPenalty', () => {
    it('should add penalty to contribution successfully', async () => {
      const contributionId = '507f1f77bcf86cd799439012';
      const penaltyData = { penaltyAmount: 10, penaltyReason: 'Late payment' };
      req.params = { id: contributionId };
      req.body = penaltyData;

      const mockResult = {
        success: true,
        message: 'Penalty added successfully',
        data: { contribution: { _id: contributionId } }
      };

      ContributionService.addPenalty.mockResolvedValue(mockResult);
      responseHandler.success.mockReturnValue();

      await ContributionController.addPenalty(req, res, next);

      expect(ContributionService.addPenalty).toHaveBeenCalledWith(
        contributionId,
        penaltyData.penaltyAmount,
        penaltyData.penaltyReason,
        req.user.id
      );
    });
  });

  describe('cancelContribution', () => {
    it('should cancel contribution successfully', async () => {
      const contributionId = '507f1f77bcf86cd799439012';
      const cancelData = { reason: 'User request' };
      req.params = { id: contributionId };
      req.body = cancelData;

      const mockResult = {
        success: true,
        message: 'Contribution cancelled successfully',
        data: { contribution: { _id: contributionId, status: 'CANCELLED' } }
      };

      ContributionService.cancelContribution.mockResolvedValue(mockResult);
      responseHandler.success.mockReturnValue();

      await ContributionController.cancelContribution(req, res, next);

      expect(ContributionService.cancelContribution).toHaveBeenCalledWith(
        contributionId,
        cancelData.reason,
        req.user.id
      );
    });
  });

  describe('getOverdueContributions', () => {
    it('should get overdue contributions successfully', async () => {
      req.query = { groupId: '507f1f77bcf86cd799439011' };

      const mockResult = {
        success: true,
        data: {
          contributions: [{ _id: '507f1f77bcf86cd799439012', status: 'OVERDUE' }]
        }
      };

      ContributionService.getOverdueContributions.mockResolvedValue(mockResult);
      responseHandler.success.mockReturnValue();

      await ContributionController.getOverdueContributions(req, res, next);

      expect(ContributionService.getOverdueContributions).toHaveBeenCalledWith(
        req.query.groupId
      );
    });
  });

  describe('getContributionStatistics', () => {
    it('should get contribution statistics successfully', async () => {
      const groupId = '507f1f77bcf86cd799439011';
      req.params = { groupId };

      const mockResult = {
        success: true,
        data: {
          statistics: {
            total: 10,
            paid: 8,
            pending: 2
          }
        }
      };

      ContributionService.getContributionStatistics.mockResolvedValue(mockResult);
      responseHandler.success.mockReturnValue();

      await ContributionController.getContributionStatistics(req, res, next);

      expect(ContributionService.getContributionStatistics).toHaveBeenCalledWith(groupId);
    });
  });

  describe('generateContributions', () => {
    it('should generate contributions successfully', async () => {
      const groupId = '507f1f77bcf86cd799439011';
      const generateData = {
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };
      req.params = { groupId };
      req.body = generateData;

      const mockResult = {
        success: true,
        message: 'Contributions generated successfully',
        data: {
          contributions: [{ _id: '507f1f77bcf86cd799439012' }]
        }
      };

      ContributionService.generateContributions.mockResolvedValue(mockResult);
      responseHandler.success.mockReturnValue();

      await ContributionController.generateContributions(req, res, next);

      expect(ContributionService.generateContributions).toHaveBeenCalledWith(
        groupId,
        generateData.startDate,
        generateData.endDate,
        req.user.id
      );
    });
  });
});
