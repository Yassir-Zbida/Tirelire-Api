const ReliabilityScoreService = require('../../../src/services/ReliabilityScoreService');
const User = require('../../../src/models/User');
const ReliabilityScore = require('../../../src/models/ReliabilityScore');

// Mock dependencies
jest.mock('../../../src/models/User');
jest.mock('../../../src/models/ReliabilityScore');
jest.mock('../../../src/utils/logger');

describe('ReliabilityScoreService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateReliabilityScore', () => {
    it('should calculate reliability score successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const mockUser = {
        _id: userId,
        reliabilityScore: 0
      };

      const mockReliabilityData = {
        onTimePayments: 8,
        totalPayments: 10,
        groupParticipation: 2,
        accountAge: 365
      };

      User.findById.mockResolvedValue(mockUser);
      ReliabilityScore.calculateScore.mockResolvedValue(85);

      const result = await ReliabilityScoreService.calculateReliabilityScore(userId, mockReliabilityData);
      
      expect(result).toBeDefined();
      expect(result.score).toBe(85);
    });

    it('should throw error if user not found', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const mockReliabilityData = {
        onTimePayments: 8,
        totalPayments: 10,
        groupParticipation: 2,
        accountAge: 365
      };

      User.findById.mockResolvedValue(null);

      await expect(ReliabilityScoreService.calculateReliabilityScore(userId, mockReliabilityData)).rejects.toThrow('User not found');
    });
  });

  describe('updateReliabilityScore', () => {
    it('should update reliability score successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const newScore = 90;
      const reason = 'Excellent payment history';

      const mockUser = {
        _id: userId,
        reliabilityScore: 75,
        save: jest.fn().mockResolvedValue()
      };

      User.findById.mockResolvedValue(mockUser);

      const result = await ReliabilityScoreService.updateReliabilityScore(userId, newScore, reason);
      
      expect(result).toBeDefined();
      expect(result.reliabilityScore).toBe(newScore);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const newScore = 90;
      const reason = 'Excellent payment history';

      User.findById.mockResolvedValue(null);

      await expect(ReliabilityScoreService.updateReliabilityScore(userId, newScore, reason)).rejects.toThrow('User not found');
    });
  });

  describe('getReliabilityHistory', () => {
    it('should get reliability history successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const mockHistory = [
        {
          _id: '507f1f77bcf86cd799439011',
          score: 85,
          reason: 'Good payment history',
          createdAt: new Date()
        }
      ];

      ReliabilityScore.findByUser.mockResolvedValue(mockHistory);

      const result = await ReliabilityScoreService.getReliabilityHistory(userId);
      
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(85);
    });

    it('should return empty array if no history found', async () => {
      const userId = '507f1f77bcf86cd799439011';

      ReliabilityScore.findByUser.mockResolvedValue([]);

      const result = await ReliabilityScoreService.getReliabilityHistory(userId);
      
      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
    });
  });

  describe('getReliabilityStats', () => {
    it('should get reliability statistics successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const mockStats = {
        currentScore: 85,
        averageScore: 80,
        scoreTrend: 'increasing',
        totalUpdates: 5
      };

      ReliabilityScore.getUserStats.mockResolvedValue(mockStats);

      const result = await ReliabilityScoreService.getReliabilityStats(userId);
      
      expect(result).toBeDefined();
      expect(result.currentScore).toBe(85);
      expect(result.averageScore).toBe(80);
    });

    it('should throw error if stats retrieval fails', async () => {
      const userId = '507f1f77bcf86cd799439011';

      ReliabilityScore.getUserStats.mockRejectedValue(new Error('Stats retrieval failed'));

      await expect(ReliabilityScoreService.getReliabilityStats(userId)).rejects.toThrow('Failed to get reliability statistics');
    });
  });
});
