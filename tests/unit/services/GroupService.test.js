const GroupService = require('../../../src/services/GroupService');
const Group = require('../../../src/models/Group');
const User = require('../../../src/models/User');
const constants = require('../../../src/config/constants');

// Mock dependencies
jest.mock('../../../src/models/Group');
jest.mock('../../../src/models/User');
jest.mock('../../../src/utils/logger');

describe('GroupService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createGroup', () => {
    it('should create a group successfully', async () => {
      const groupData = {
        name: 'Test Group',
        description: 'A test group',
        contributionAmount: 100,
        contributionFrequency: 'MONTHLY',
        startDate: '2030-02-01', // Future date
        endDate: '2030-12-31',
        maxMembers: 10,
        isPublic: false,
        requiresKyc: true,
        minReliabilityScore: 50
      };

      const creatorId = '507f1f77bcf86cd799439011';
      const mockCreator = {
        _id: creatorId,
        isActive: true
      };

      const mockGroup = {
        _id: '507f1f77bcf86cd799439012',
        name: 'Test Group',
        creator: creatorId,
        members: [{
          user: creatorId,
          role: 'ADMIN',
          status: 'ACTIVE',
          joinedAt: new Date()
        }],
        save: jest.fn().mockResolvedValue()
      };

      User.findById.mockResolvedValue(mockCreator);
      Group.mockImplementation(() => mockGroup);

      const result = await GroupService.createGroup(groupData, creatorId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Group created successfully');
      expect(mockGroup.save).toHaveBeenCalled();
    });

    it('should throw error if creator not found', async () => {
      const groupData = {
        name: 'Test Group',
        contributionAmount: 100,
        startDate: '2024-02-01',
        endDate: '2024-12-31'
      };

      const creatorId = '507f1f77bcf86cd799439011';

      User.findById.mockResolvedValue(null);

      await expect(GroupService.createGroup(groupData, creatorId)).rejects.toThrow('Creator not found');
    });

    it('should throw error if creator is inactive', async () => {
      const groupData = {
        name: 'Test Group',
        contributionAmount: 100,
        startDate: '2024-02-01',
        endDate: '2024-12-31'
      };

      const creatorId = '507f1f77bcf86cd799439011';
      const mockCreator = {
        _id: creatorId,
        isActive: false
      };

      User.findById.mockResolvedValue(mockCreator);

      await expect(GroupService.createGroup(groupData, creatorId)).rejects.toThrow('Creator account is not active');
    });

    it('should throw error if start date is in the past', async () => {
      const groupData = {
        name: 'Test Group',
        contributionAmount: 100,
        startDate: '2023-01-01', // Past date
        endDate: '2024-12-31'
      };

      const creatorId = '507f1f77bcf86cd799439011';
      const mockCreator = {
        _id: creatorId,
        isActive: true
      };

      User.findById.mockResolvedValue(mockCreator);

      await expect(GroupService.createGroup(groupData, creatorId)).rejects.toThrow('Start date must be in the future');
    });

    it('should throw error if end date is before start date', async () => {
      const groupData = {
        name: 'Test Group',
        contributionAmount: 100,
        startDate: '2030-12-31', // Future date
        endDate: '2030-01-01' // Before start date
      };

      const creatorId = '507f1f77bcf86cd799439011';
      const mockCreator = {
        _id: creatorId,
        isActive: true
      };

      User.findById.mockResolvedValue(mockCreator);

      await expect(GroupService.createGroup(groupData, creatorId)).rejects.toThrow('End date must be after start date');
    });
  });

  describe('getGroupById', () => {
    it('should get group by ID successfully', async () => {
      const groupId = '507f1f77bcf86cd799439012';
      const userId = '507f1f77bcf86cd799439011';

      const mockGroup = {
        _id: groupId,
        name: 'Test Group',
        isActive: true,
        isMember: jest.fn().mockReturnValue(true),
        creator: { toString: () => userId },
        settings: {
          isPublic: false
        }
      };

      Group.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockGroup)
        })
      });

      const result = await GroupService.getGroupById(groupId, userId);

      expect(result.success).toBe(true);
      expect(result.data).toBe(mockGroup);
    });

    it('should throw error if group not found', async () => {
      const groupId = '507f1f77bcf86cd799439012';
      const userId = '507f1f77bcf86cd799439011';

      Group.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      });

      await expect(GroupService.getGroupById(groupId, userId)).rejects.toThrow('Group not found');
    });

    it('should throw error if group is not active', async () => {
      const groupId = '507f1f77bcf86cd799439012';
      const userId = '507f1f77bcf86cd799439011';

      const mockGroup = {
        _id: groupId,
        isActive: false
      };

      Group.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockGroup)
        })
      });

      await expect(GroupService.getGroupById(groupId, userId)).rejects.toThrow('Group is not active');
    });
  });

  describe('getUserGroups', () => {
    it('should get user groups successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const filters = { status: 'ACTIVE', page: 1, limit: 20 };

      const mockGroups = [
        { _id: '1', name: 'Group 1' },
        { _id: '2', name: 'Group 2' }
      ];

      Group.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue(mockGroups)
              })
            })
          })
        })
      });

      Group.countDocuments.mockResolvedValue(2);

      const result = await GroupService.getUserGroups(userId, filters);

      expect(result.success).toBe(true);
      expect(result.data.groups).toEqual(mockGroups);
      expect(result.data.pagination.total).toBe(2);
    });
  });

  describe('getPublicGroups', () => {
    it('should get public groups successfully', async () => {
      const filters = { page: 1, limit: 20 };

      const mockGroups = [
        { _id: '1', name: 'Public Group 1' },
        { _id: '2', name: 'Public Group 2' }
      ];

      Group.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockGroups)
            })
          })
        })
      });

      Group.countDocuments.mockResolvedValue(2);

      const result = await GroupService.getPublicGroups(filters);

      expect(result.success).toBe(true);
      expect(result.data.groups).toEqual(mockGroups);
    });
  });

  describe('updateGroup', () => {
    it('should update group successfully', async () => {
      const groupId = '507f1f77bcf86cd799439012';
      const userId = '507f1f77bcf86cd799439011';
      const updateData = { name: 'Updated Group' };

      const mockGroup = {
        _id: groupId,
        isAdmin: jest.fn().mockReturnValue(true),
        settings: {
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-12-31')
        }
      };

      Group.findById.mockResolvedValue(mockGroup);
      Group.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockGroup)
        })
      });

      const result = await GroupService.updateGroup(groupId, updateData, userId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Group updated successfully');
    });

    it('should throw error if group not found', async () => {
      const groupId = '507f1f77bcf86cd799439012';
      const userId = '507f1f77bcf86cd799439011';
      const updateData = { name: 'Updated Group' };

      Group.findById.mockResolvedValue(null);

      await expect(GroupService.updateGroup(groupId, updateData, userId)).rejects.toThrow('Group not found');
    });

    it('should throw error if user is not admin', async () => {
      const groupId = '507f1f77bcf86cd799439012';
      const userId = '507f1f77bcf86cd799439011';
      const updateData = { name: 'Updated Group' };

      const mockGroup = {
        _id: groupId,
        isAdmin: jest.fn().mockReturnValue(false)
      };

      Group.findById.mockResolvedValue(mockGroup);

      await expect(GroupService.updateGroup(groupId, updateData, userId)).rejects.toThrow('Only group admins can update the group');
    });
  });

  describe('joinGroup', () => {
    it('should join group successfully', async () => {
      const groupId = '507f1f77bcf86cd799439012';
      const userId = '507f1f77bcf86cd799439011';

      const mockGroup = {
        _id: groupId,
        name: 'Test Group',
        isActive: true,
        status: 'ACTIVE',
        isMember: jest.fn().mockReturnValue(false),
        isFull: jest.fn().mockReturnValue(false),
        settings: {
          requiresKyc: false,
          minReliabilityScore: 0
        },
        addMember: jest.fn().mockResolvedValue()
      };

      const mockUser = {
        _id: userId,
        isKycVerified: true,
        reliabilityScore: 80
      };

      Group.findById.mockResolvedValue(mockGroup);
      User.findById.mockResolvedValue(mockUser);

      const result = await GroupService.joinGroup(groupId, userId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Successfully joined the group');
      expect(mockGroup.addMember).toHaveBeenCalledWith(userId);
    });

    it('should throw error if group not found', async () => {
      const groupId = '507f1f77bcf86cd799439012';
      const userId = '507f1f77bcf86cd799439011';

      Group.findById.mockResolvedValue(null);

      await expect(GroupService.joinGroup(groupId, userId)).rejects.toThrow('Group not found');
    });

    it('should throw error if user is already a member', async () => {
      const groupId = '507f1f77bcf86cd799439012';
      const userId = '507f1f77bcf86cd799439011';

      const mockGroup = {
        _id: groupId,
        isActive: true,
        status: 'ACTIVE',
        isMember: jest.fn().mockReturnValue(true)
      };

      Group.findById.mockResolvedValue(mockGroup);

      await expect(GroupService.joinGroup(groupId, userId)).rejects.toThrow('User is already a member of this group');
    });

    it('should throw error if group is full', async () => {
      const groupId = '507f1f77bcf86cd799439012';
      const userId = '507f1f77bcf86cd799439011';

      const mockGroup = {
        _id: groupId,
        isActive: true,
        status: 'ACTIVE',
        isMember: jest.fn().mockReturnValue(false),
        isFull: jest.fn().mockReturnValue(true)
      };

      Group.findById.mockResolvedValue(mockGroup);

      await expect(GroupService.joinGroup(groupId, userId)).rejects.toThrow('Group has reached maximum number of members');
    });

    it('should throw error if KYC is required but user is not verified', async () => {
      const groupId = '507f1f77bcf86cd799439012';
      const userId = '507f1f77bcf86cd799439011';

      const mockGroup = {
        _id: groupId,
        isActive: true,
        status: 'ACTIVE',
        isMember: jest.fn().mockReturnValue(false),
        isFull: jest.fn().mockReturnValue(false),
        settings: {
          requiresKyc: true
        }
      };

      const mockUser = {
        _id: userId,
        isKycVerified: false
      };

      Group.findById.mockResolvedValue(mockGroup);
      User.findById.mockResolvedValue(mockUser);

      await expect(GroupService.joinGroup(groupId, userId)).rejects.toThrow('KYC verification required to join this group');
    });

    it('should throw error if user reliability score is too low', async () => {
      const groupId = '507f1f77bcf86cd799439012';
      const userId = '507f1f77bcf86cd799439011';

      const mockGroup = {
        _id: groupId,
        isActive: true,
        status: 'ACTIVE',
        isMember: jest.fn().mockReturnValue(false),
        isFull: jest.fn().mockReturnValue(false),
        settings: {
          requiresKyc: false,
          minReliabilityScore: 80
        }
      };

      const mockUser = {
        _id: userId,
        isKycVerified: true,
        reliabilityScore: 50
      };

      Group.findById.mockResolvedValue(mockGroup);
      User.findById.mockResolvedValue(mockUser);

      await expect(GroupService.joinGroup(groupId, userId)).rejects.toThrow('Your reliability score is below the minimum required');
    });
  });

  describe('leaveGroup', () => {
    it('should leave group successfully', async () => {
      const groupId = '507f1f77bcf86cd799439012';
      const userId = '507f1f77bcf86cd799439011';

      const mockGroup = {
        _id: groupId,
        name: 'Test Group',
        creator: { toString: () => '507f1f77bcf86cd799439013' }, // Different from userId
        isMember: jest.fn().mockReturnValue(true),
        removeMember: jest.fn().mockResolvedValue()
      };

      Group.findById.mockResolvedValue(mockGroup);

      const result = await GroupService.leaveGroup(groupId, userId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Successfully left the group');
      expect(mockGroup.removeMember).toHaveBeenCalledWith(userId);
    });

    it('should throw error if user is not a member', async () => {
      const groupId = '507f1f77bcf86cd799439012';
      const userId = '507f1f77bcf86cd799439011';

      const mockGroup = {
        _id: groupId,
        isMember: jest.fn().mockReturnValue(false)
      };

      Group.findById.mockResolvedValue(mockGroup);

      await expect(GroupService.leaveGroup(groupId, userId)).rejects.toThrow('User is not a member of this group');
    });

    it('should throw error if creator tries to leave', async () => {
      const groupId = '507f1f77bcf86cd799439012';
      const userId = '507f1f77bcf86cd799439011';

      const mockGroup = {
        _id: groupId,
        creator: { toString: () => userId },
        isMember: jest.fn().mockReturnValue(true)
      };

      Group.findById.mockResolvedValue(mockGroup);

      await expect(GroupService.leaveGroup(groupId, userId)).rejects.toThrow('Group creator cannot leave the group');
    });
  });

  describe('deleteGroup', () => {
    it('should delete group successfully', async () => {
      const groupId = '507f1f77bcf86cd799439012';
      const userId = '507f1f77bcf86cd799439011';

      const mockGroup = {
        _id: groupId,
        name: 'Test Group',
        creator: { toString: () => userId },
        isActive: true,
        status: 'ACTIVE',
        save: jest.fn().mockResolvedValue()
      };

      Group.findById.mockResolvedValue(mockGroup);

      const result = await GroupService.deleteGroup(groupId, userId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Group deleted successfully');
      expect(mockGroup.isActive).toBe(false);
      expect(mockGroup.status).toBe('CANCELLED');
      expect(mockGroup.save).toHaveBeenCalled();
    });

    it('should throw error if group not found', async () => {
      const groupId = '507f1f77bcf86cd799439012';
      const userId = '507f1f77bcf86cd799439011';

      Group.findById.mockResolvedValue(null);

      await expect(GroupService.deleteGroup(groupId, userId)).rejects.toThrow('Group not found');
    });

    it('should throw error if user is not the creator', async () => {
      const groupId = '507f1f77bcf86cd799439012';
      const userId = '507f1f77bcf86cd799439011';

      const mockGroup = {
        _id: groupId,
        creator: { toString: () => '507f1f77bcf86cd799439013' } // Different from userId
      };

      Group.findById.mockResolvedValue(mockGroup);

      await expect(GroupService.deleteGroup(groupId, userId)).rejects.toThrow('Only the group creator can delete the group');
    });
  });

  describe('getGroupMembers', () => {
    it('should get group members successfully', async () => {
      const groupId = '507f1f77bcf86cd799439012';
      const userId = '507f1f77bcf86cd799439011';

      const mockGroup = {
        _id: groupId,
        members: [
          { user: '507f1f77bcf86cd799439011', role: 'ADMIN' },
          { user: '507f1f77bcf86cd799439013', role: 'MEMBER' }
        ],
        totalMembers: 2,
        isMember: jest.fn().mockReturnValue(true),
        creator: { toString: () => userId }
      };

      Group.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockGroup)
      });

      const result = await GroupService.getGroupMembers(groupId, userId);

      expect(result.success).toBe(true);
      expect(result.data.members).toEqual(mockGroup.members);
      expect(result.data.totalMembers).toBe(2);
    });

    it('should throw error if group not found', async () => {
      const groupId = '507f1f77bcf86cd799439012';
      const userId = '507f1f77bcf86cd799439011';

      Group.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await expect(GroupService.getGroupMembers(groupId, userId)).rejects.toThrow('Group not found');
    });

    it('should throw error if user has no access', async () => {
      const groupId = '507f1f77bcf86cd799439012';
      const userId = '507f1f77bcf86cd799439011';

      const mockGroup = {
        _id: groupId,
        isMember: jest.fn().mockReturnValue(false),
        creator: { toString: () => '507f1f77bcf86cd799439013' } // Different from userId
      };

      Group.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockGroup)
      });

      await expect(GroupService.getGroupMembers(groupId, userId)).rejects.toThrow('Access denied to this group');
    });
  });
});
