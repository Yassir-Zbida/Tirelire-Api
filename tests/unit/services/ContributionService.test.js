const ContributionService = require('../../../src/services/ContributionService');
const Contribution = require('../../../src/models/Contribution');
const Group = require('../../../src/models/Group');
const User = require('../../../src/models/User');
const Payment = require('../../../src/models/Payment');

// Mock dependencies
jest.mock('../../../src/models/Contribution');
jest.mock('../../../src/models/Group');
jest.mock('../../../src/models/User');
jest.mock('../../../src/models/Payment');

describe('ContributionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createContribution', () => {
    it('should create a contribution successfully', async () => {
      const contributionData = {
        groupId: '507f1f77bcf86cd799439011',
        amount: 100,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        description: 'Monthly contribution'
      };
      const userId = '507f1f77bcf86cd799439013';

      const mockGroup = {
        _id: contributionData.groupId,
        isMember: jest.fn().mockReturnValue(true)
      };

      const mockContribution = {
        _id: '507f1f77bcf86cd799439012',
        ...contributionData,
        user: userId,
        status: 'PENDING',
        save: jest.fn().mockResolvedValue()
      };

      Group.findById.mockResolvedValue(mockGroup);
      Contribution.findOne.mockResolvedValue(null); // No existing contribution
      Contribution.mockImplementation(() => mockContribution);

      const result = await ContributionService.createContribution(contributionData, userId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Group.findById).toHaveBeenCalledWith(contributionData.groupId);
      expect(mockContribution.save).toHaveBeenCalled();
    });

    it('should throw error if group not found', async () => {
      const contributionData = {
        groupId: '507f1f77bcf86cd799439011',
        amount: 100,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };
      const userId = '507f1f77bcf86cd799439013';

      Group.findById.mockResolvedValue(null);

      await expect(ContributionService.createContribution(contributionData, userId))
        .rejects.toThrow('Group not found');
    });

    it('should throw error if user is not a member', async () => {
      const contributionData = {
        groupId: '507f1f77bcf86cd799439011',
        amount: 100,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };
      const userId = '507f1f77bcf86cd799439013';

      const mockGroup = {
        _id: contributionData.groupId,
        isMember: jest.fn().mockReturnValue(false)
      };

      Group.findById.mockResolvedValue(mockGroup);

      await expect(ContributionService.createContribution(contributionData, userId))
        .rejects.toThrow('User is not a member of this group');
    });

    it('should throw error if due date is in the past', async () => {
      const contributionData = {
        groupId: '507f1f77bcf86cd799439011',
        amount: 100,
        dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Past date
      };
      const userId = '507f1f77bcf86cd799439013';

      const mockGroup = {
        _id: contributionData.groupId,
        isMember: jest.fn().mockReturnValue(true)
      };

      Group.findById.mockResolvedValue(mockGroup);

      await expect(ContributionService.createContribution(contributionData, userId))
        .rejects.toThrow('Due date must be in the future');
    });
  });

  describe('getUserContributions', () => {
    it('should get user contributions successfully', async () => {
      const userId = '507f1f77bcf86cd799439013';
      const filters = { groupId: '507f1f77bcf86cd799439011', status: 'PENDING' };

      const mockContributions = [
        {
          _id: '507f1f77bcf86cd799439012',
          user: userId,
          group: '507f1f77bcf86cd799439011',
          amount: 100,
          status: 'PENDING'
        }
      ];

      Contribution.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue(mockContributions)
              })
            })
          })
        })
      });

      Contribution.countDocuments.mockResolvedValue(1);

      const result = await ContributionService.getUserContributions(userId, filters);

      expect(result.success).toBe(true);
      expect(result.data.contributions).toBeDefined();
      expect(result.data.pagination).toBeDefined();
    });
  });

  describe('getContributionById', () => {
    it('should get contribution by ID successfully', async () => {
      const contributionId = '507f1f77bcf86cd799439012';
      const userId = '507f1f77bcf86cd799439013';

      const mockContribution = {
        _id: contributionId,
        user: { _id: userId, toString: () => userId },
        group: { _id: '507f1f77bcf86cd799439011' },
        amount: 100,
        status: 'PENDING'
      };

      Contribution.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockContribution)
          })
        })
      });

      const result = await ContributionService.getContributionById(contributionId, userId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should throw error if contribution not found', async () => {
      const contributionId = '507f1f77bcf86cd799439012';
      const userId = '507f1f77bcf86cd799439013';

      Contribution.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(null)
          })
        })
      });

      await expect(ContributionService.getContributionById(contributionId, userId))
        .rejects.toThrow('Contribution not found');
    });
  });

  describe('markAsPaid', () => {
    it('should mark contribution as paid successfully', async () => {
      const contributionId = '507f1f77bcf86cd799439012';
      const paymentId = '507f1f77bcf86cd799439014';
      const userId = '507f1f77bcf86cd799439013';

      const mockContribution = {
        _id: contributionId,
        user: userId,
        group: '507f1f77bcf86cd799439011',
        status: 'PENDING',
        markAsPaid: jest.fn().mockResolvedValue()
      };

      const mockPayment = {
        _id: paymentId,
        user: userId,
        status: 'SUCCEEDED'
      };

      Contribution.findById.mockResolvedValue(mockContribution);
      Payment.findById.mockResolvedValue(mockPayment);

      const result = await ContributionService.markAsPaid(contributionId, paymentId, userId);

      expect(result.success).toBe(true);
      expect(mockContribution.markAsPaid).toHaveBeenCalledWith(paymentId);
    });

    it('should throw error if contribution not found', async () => {
      const contributionId = '507f1f77bcf86cd799439012';
      const paymentId = '507f1f77bcf86cd799439014';
      const userId = '507f1f77bcf86cd799439013';

      Contribution.findById.mockResolvedValue(null);

      await expect(ContributionService.markAsPaid(contributionId, paymentId, userId))
        .rejects.toThrow('Contribution not found');
    });
  });

  describe('getGroupContributions', () => {
    it('should get group contributions successfully', async () => {
      const groupId = '507f1f77bcf86cd799439011';
      const filters = { status: 'PENDING', userId: '507f1f77bcf86cd799439013' };

      const mockContributions = [
        {
          _id: '507f1f77bcf86cd799439012',
          group: groupId,
          amount: 100,
          status: 'PENDING'
        }
      ];

      Contribution.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue(mockContributions)
              })
            })
          })
        })
      });

      Contribution.countDocuments.mockResolvedValue(1);

      const result = await ContributionService.getGroupContributions(groupId, filters);

      expect(result.success).toBe(true);
      expect(result.data.contributions).toBeDefined();
    });
  });

  describe('updateContribution', () => {
    it('should update contribution successfully', async () => {
      const contributionId = '507f1f77bcf86cd799439012';
      const updateData = { description: 'Updated description' };
      const userId = '507f1f77bcf86cd799439013';

      const mockContribution = {
        _id: contributionId,
        user: userId,
        group: '507f1f77bcf86cd799439011',
        save: jest.fn().mockResolvedValue()
      };

      const mockUpdatedContribution = {
        _id: contributionId,
        user: { _id: userId },
        group: { _id: '507f1f77bcf86cd799439011' },
        description: 'Updated description'
      };

      Contribution.findById.mockResolvedValue(mockContribution);
      Contribution.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockUpdatedContribution)
          })
        })
      });

      const result = await ContributionService.updateContribution(contributionId, updateData, userId);

      expect(result.success).toBe(true);
      expect(Contribution.findByIdAndUpdate).toHaveBeenCalled();
    });
  });

  describe('addPenalty', () => {
    it('should add penalty to contribution successfully', async () => {
      const contributionId = '507f1f77bcf86cd799439012';
      const penaltyAmount = 10;
      const penaltyReason = 'Late payment';
      const userId = '507f1f77bcf86cd799439013';

      const mockContribution = {
        _id: contributionId,
        user: userId,
        group: '507f1f77bcf86cd799439011',
        addPenalty: jest.fn().mockResolvedValue()
      };

      const mockGroup = {
        _id: '507f1f77bcf86cd799439011',
        isAdmin: jest.fn().mockReturnValue(true)
      };

      Contribution.findById.mockResolvedValue(mockContribution);
      Group.findById.mockResolvedValue(mockGroup);

      const result = await ContributionService.addPenalty(contributionId, penaltyAmount, penaltyReason, userId);

      expect(result.success).toBe(true);
      expect(mockContribution.addPenalty).toHaveBeenCalledWith(penaltyAmount, penaltyReason);
    });
  });

  describe('cancelContribution', () => {
    it('should cancel contribution successfully', async () => {
      const contributionId = '507f1f77bcf86cd799439012';
      const reason = 'User request';
      const userId = '507f1f77bcf86cd799439013';

      const mockContribution = {
        _id: contributionId,
        user: userId,
        group: '507f1f77bcf86cd799439011',
        cancel: jest.fn().mockResolvedValue()
      };

      const mockGroup = {
        _id: '507f1f77bcf86cd799439011',
        isAdmin: jest.fn().mockReturnValue(true)
      };

      Contribution.findById.mockResolvedValue(mockContribution);
      Group.findById.mockResolvedValue(mockGroup);

      const result = await ContributionService.cancelContribution(contributionId, reason, userId);

      expect(result.success).toBe(true);
      expect(mockContribution.cancel).toHaveBeenCalledWith(reason);
    });
  });

  describe('getOverdueContributions', () => {
    it('should get overdue contributions successfully', async () => {
      const groupId = '507f1f77bcf86cd799439011';

      const mockContributions = [
        {
          _id: '507f1f77bcf86cd799439012',
          group: groupId,
          status: 'OVERDUE',
          dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      ];

      Contribution.findOverdue = jest.fn().mockResolvedValue(mockContributions);

      const result = await ContributionService.getOverdueContributions(groupId);

      expect(result.success).toBe(true);
      expect(result.data.contributions).toBeDefined();
      expect(result.data.contributions).toEqual(mockContributions);
      expect(result.data.total).toBe(mockContributions.length);
    });
  });

  describe('getContributionStatistics', () => {
    it('should get contribution statistics successfully', async () => {
      const groupId = '507f1f77bcf86cd799439011';

      const mockStats = {
        total: 10,
        paid: 8,
        pending: 2,
        overdue: 0,
        totalAmount: 1000
      };

      Contribution.getStatistics = jest.fn().mockResolvedValue(mockStats);
      Contribution.countDocuments.mockResolvedValue(10);
      Contribution.aggregate.mockResolvedValue([{ _id: null, total: 1000 }]);

      const result = await ContributionService.getContributionStatistics(groupId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.statistics).toBeDefined();
    });
  });

  describe('generateContributions', () => {
    it('should generate contributions successfully', async () => {
      const groupId = '507f1f77bcf86cd799439011';
      const startDate = new Date();
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const userId = '507f1f77bcf86cd799439013';

      const mockGroup = {
        _id: groupId,
        members: ['507f1f77bcf86cd799439013', '507f1f77bcf86cd799439014'],
        settings: {
          contributionAmount: 100,
          contributionFrequency: 'MONTHLY'
        },
        isAdmin: jest.fn().mockReturnValue(true)
      };

      const mockContributions = [
        {
          _id: '507f1f77bcf86cd799439012',
          group: groupId,
          user: '507f1f77bcf86cd799439013',
          amount: 100
        }
      ];

      Group.findById.mockResolvedValue(mockGroup);
      Contribution.insertMany.mockResolvedValue(mockContributions);

      const result = await ContributionService.generateContributions(groupId, startDate, endDate, userId);

      expect(result.success).toBe(true);
      expect(result.data.contributions).toBeDefined();
    });
  });
});
