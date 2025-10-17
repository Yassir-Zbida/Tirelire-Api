const request = require('supertest');
const { app } = require('../../src/app');
const GroupService = require('../../src/services/GroupService');
const { authMiddleware } = require('../../src/middlewares/authMiddleware');
const User = require('../../src/models/User');

// Mock dependencies
jest.mock('../../src/services/GroupService');
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

describe('Group Integration Tests', () => {
  let mockUser;
  let mockToken;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUser = {
      id: '507f1f77bcf86cd799439011',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'PARTICULIER',
      kyc: { status: 'VERIFIED' },
      reliabilityScore: 80,
      isKycVerified: true
    };

    mockToken = 'mock-jwt-token';
  });

  describe('POST /api/groups', () => {
    it('should create a group successfully', async () => {
      const groupData = {
        name: 'Test Group',
        description: 'A test group for tontine',
        contributionAmount: 100,
        contributionFrequency: 'MONTHLY',
        startDate: '2024-02-01T00:00:00.000Z',
        endDate: '2024-12-31T23:59:59.000Z',
        maxMembers: 10,
        isPublic: false,
        requiresKyc: true,
        minReliabilityScore: 50
      };

      const mockGroup = {
        _id: '507f1f77bcf86cd799439012',
        ...groupData,
        creator: mockUser.id,
        members: [{
          user: mockUser.id,
          role: 'ADMIN',
          status: 'ACTIVE',
          joinedAt: new Date()
        }],
        status: 'ACTIVE',
        isActive: true,
        totalMembers: 1
      };

      authMiddleware.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });
      GroupService.createGroup.mockResolvedValue({
        success: true,
        message: 'Group created successfully',
        data: mockGroup
      });

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(groupData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Group created successfully');
      expect(response.body.data.name).toBe('Test Group');
      expect(GroupService.createGroup).toHaveBeenCalledWith(groupData, mockUser.id);
    });

    it('should return 400 for missing required fields', async () => {
      const groupData = {
        name: 'Test Group',
        // Missing required fields: contributionAmount, startDate, endDate
        description: 'A test group'
      };

      authMiddleware.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(groupData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Missing required fields');
      expect(response.body.required).toContain('contributionAmount');
      expect(response.body.required).toContain('startDate');
      expect(response.body.required).toContain('endDate');
    });

    it('should return 401 for unauthorized request', async () => {
      const groupData = {
        name: 'Test Group',
        contributionAmount: 100,
        startDate: '2024-02-01',
        endDate: '2024-12-31'
      };

      const response = await request(app)
        .post('/api/groups')
        .send(groupData)
        .expect(401);
    });

    it('should return 400 for invalid start date', async () => {
      const groupData = {
        name: 'Test Group',
        contributionAmount: 100,
        startDate: '2023-01-01', // Past date
        endDate: '2024-12-31'
      };

      authMiddleware.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });
      GroupService.createGroup.mockRejectedValue(new Error('Start date must be in the future'));

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(groupData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Start date must be in the future');
      expect(response.body.code).toBe('INVALID_START_DATE');
    });
  });

  describe('GET /api/groups', () => {
    it('should get user groups successfully', async () => {
      const mockGroups = [
        {
          _id: '507f1f77bcf86cd799439012',
          name: 'Group 1',
          creator: mockUser.id,
          status: 'ACTIVE'
        },
        {
          _id: '507f1f77bcf86cd799439013',
          name: 'Group 2',
          creator: mockUser.id,
          status: 'ACTIVE'
        }
      ];

      authMiddleware.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });
      GroupService.getUserGroups.mockResolvedValue({
        success: true,
        data: {
          groups: mockGroups,
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            pages: 1
          }
        }
      });

      const response = await request(app)
        .get('/api/groups')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.groups).toHaveLength(2);
      expect(GroupService.getUserGroups).toHaveBeenCalledWith(mockUser.id, {});
    });

    it('should get user groups with filters', async () => {
      const filters = { status: 'ACTIVE', page: 1, limit: 10 };

      authMiddleware.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });
      GroupService.getUserGroups.mockResolvedValue({
        success: true,
        data: { groups: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }
      });

      const response = await request(app)
        .get('/api/groups')
        .query(filters)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(GroupService.getUserGroups).toHaveBeenCalledWith(mockUser.id, filters);
    });
  });

  describe('GET /api/groups/public', () => {
    it('should get public groups successfully', async () => {
      const mockPublicGroups = [
        {
          _id: '507f1f77bcf86cd799439012',
          name: 'Public Group 1',
          settings: { isPublic: true }
        },
        {
          _id: '507f1f77bcf86cd799439013',
          name: 'Public Group 2',
          settings: { isPublic: true }
        }
      ];

      GroupService.getPublicGroups.mockResolvedValue({
        success: true,
        data: {
          groups: mockPublicGroups,
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            pages: 1
          }
        }
      });

      const response = await request(app)
        .get('/api/groups/public')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.groups).toHaveLength(2);
      expect(GroupService.getPublicGroups).toHaveBeenCalledWith({});
    });

    it('should get public groups with filters', async () => {
      const filters = { minReliabilityScore: 50, maxContributionAmount: 200 };

      GroupService.getPublicGroups.mockResolvedValue({
        success: true,
        data: { groups: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } }
      });

      const response = await request(app)
        .get('/api/groups/public')
        .query(filters)
        .expect(200);

      expect(GroupService.getPublicGroups).toHaveBeenCalledWith(filters);
    });
  });

  describe('GET /api/groups/:id', () => {
    it('should get group by ID successfully', async () => {
      const groupId = '507f1f77bcf86cd799439012';
      const mockGroup = {
        _id: groupId,
        name: 'Test Group',
        creator: mockUser.id,
        status: 'ACTIVE',
        isActive: true
      };

      authMiddleware.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });
      GroupService.getGroupById.mockResolvedValue({
        success: true,
        data: mockGroup
      });

      const response = await request(app)
        .get(`/api/groups/${groupId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(groupId);
      expect(GroupService.getGroupById).toHaveBeenCalledWith(groupId, mockUser.id);
    });

    it('should return 404 if group not found', async () => {
      const groupId = '507f1f77bcf86cd799439012';

      authMiddleware.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });
      GroupService.getGroupById.mockRejectedValue(new Error('Group not found'));

      const response = await request(app)
        .get(`/api/groups/${groupId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Group not found');
      expect(response.body.code).toBe('GROUP_NOT_FOUND');
    });

    it('should return 403 if access denied', async () => {
      const groupId = '507f1f77bcf86cd799439012';

      authMiddleware.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });
      GroupService.getGroupById.mockRejectedValue(new Error('Access denied to this group'));

      const response = await request(app)
        .get(`/api/groups/${groupId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied to this group');
      expect(response.body.code).toBe('ACCESS_DENIED');
    });
  });

  describe('PUT /api/groups/:id', () => {
    it('should update group successfully', async () => {
      const groupId = '507f1f77bcf86cd799439012';
      const updateData = {
        name: 'Updated Group Name',
        description: 'Updated description'
      };

      const mockUpdatedGroup = {
        _id: groupId,
        ...updateData,
        creator: mockUser.id
      };

      authMiddleware.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });
      GroupService.updateGroup.mockResolvedValue({
        success: true,
        message: 'Group updated successfully',
        data: mockUpdatedGroup
      });

      const response = await request(app)
        .put(`/api/groups/${groupId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Group updated successfully');
      expect(GroupService.updateGroup).toHaveBeenCalledWith(groupId, updateData, mockUser.id);
    });

    it('should return 403 if user is not admin', async () => {
      const groupId = '507f1f77bcf86cd799439012';
      const updateData = { name: 'Updated Group Name' };

      authMiddleware.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });
      GroupService.updateGroup.mockRejectedValue(new Error('Only group admins can update the group'));

      const response = await request(app)
        .put(`/api/groups/${groupId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Only group admins can update the group');
      expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('POST /api/groups/:id/join', () => {
    it('should join group successfully', async () => {
      const groupId = '507f1f77bcf86cd799439012';
      const mockGroup = {
        _id: groupId,
        name: 'Test Group',
        members: [{ user: mockUser.id, role: 'MEMBER' }]
      };

      authMiddleware.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });
      GroupService.joinGroup.mockResolvedValue({
        success: true,
        message: 'Successfully joined the group',
        data: mockGroup
      });

      const response = await request(app)
        .post(`/api/groups/${groupId}/join`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Successfully joined the group');
      expect(GroupService.joinGroup).toHaveBeenCalledWith(groupId, mockUser.id);
    });

    it('should return 400 if user is already a member', async () => {
      const groupId = '507f1f77bcf86cd799439012';

      authMiddleware.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });
      GroupService.joinGroup.mockRejectedValue(new Error('User is already a member of this group'));

      const response = await request(app)
        .post(`/api/groups/${groupId}/join`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User is already a member of this group');
      expect(response.body.code).toBe('ALREADY_MEMBER');
    });

    it('should return 400 if KYC is required', async () => {
      const groupId = '507f1f77bcf86cd799439012';

      authMiddleware.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });
      GroupService.joinGroup.mockRejectedValue(new Error('KYC verification required to join this group'));

      const response = await request(app)
        .post(`/api/groups/${groupId}/join`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('KYC verification required to join this group');
      expect(response.body.code).toBe('KYC_REQUIRED');
    });

    it('should return 400 if group is full', async () => {
      const groupId = '507f1f77bcf86cd799439012';

      authMiddleware.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });
      GroupService.joinGroup.mockRejectedValue(new Error('Group has reached maximum number of members'));

      const response = await request(app)
        .post(`/api/groups/${groupId}/join`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Group has reached maximum number of members');
      expect(response.body.code).toBe('GROUP_FULL');
    });
  });

  describe('POST /api/groups/:id/leave', () => {
    it('should leave group successfully', async () => {
      const groupId = '507f1f77bcf86cd799439012';
      const mockGroup = {
        _id: groupId,
        name: 'Test Group',
        members: []
      };

      authMiddleware.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });
      GroupService.leaveGroup.mockResolvedValue({
        success: true,
        message: 'Successfully left the group',
        data: mockGroup
      });

      const response = await request(app)
        .post(`/api/groups/${groupId}/leave`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Successfully left the group');
      expect(GroupService.leaveGroup).toHaveBeenCalledWith(groupId, mockUser.id);
    });

    it('should return 400 if user is not a member', async () => {
      const groupId = '507f1f77bcf86cd799439012';

      authMiddleware.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });
      GroupService.leaveGroup.mockRejectedValue(new Error('User is not a member of this group'));

      const response = await request(app)
        .post(`/api/groups/${groupId}/leave`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User is not a member of this group');
      expect(response.body.code).toBe('NOT_MEMBER');
    });

    it('should return 400 if creator tries to leave', async () => {
      const groupId = '507f1f77bcf86cd799439012';

      authMiddleware.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });
      GroupService.leaveGroup.mockRejectedValue(new Error('Group creator cannot leave the group'));

      const response = await request(app)
        .post(`/api/groups/${groupId}/leave`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Group creator cannot leave the group');
      expect(response.body.code).toBe('CREATOR_CANNOT_LEAVE');
    });
  });

  describe('GET /api/groups/:id/members', () => {
    it('should get group members successfully', async () => {
      const groupId = '507f1f77bcf86cd799439012';
      const mockMembers = [
        { user: mockUser.id, role: 'ADMIN', status: 'ACTIVE' },
        { user: '507f1f77bcf86cd799439013', role: 'MEMBER', status: 'ACTIVE' }
      ];

      authMiddleware.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });
      GroupService.getGroupMembers.mockResolvedValue({
        success: true,
        data: {
          members: mockMembers,
          totalMembers: 2
        }
      });

      const response = await request(app)
        .get(`/api/groups/${groupId}/members`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.members).toHaveLength(2);
      expect(response.body.data.totalMembers).toBe(2);
      expect(GroupService.getGroupMembers).toHaveBeenCalledWith(groupId, mockUser.id);
    });

    it('should return 403 if access denied', async () => {
      const groupId = '507f1f77bcf86cd799439012';

      authMiddleware.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });
      GroupService.getGroupMembers.mockRejectedValue(new Error('Access denied to this group'));

      const response = await request(app)
        .get(`/api/groups/${groupId}/members`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied to this group');
      expect(response.body.code).toBe('ACCESS_DENIED');
    });
  });

  describe('DELETE /api/groups/:id', () => {
    it('should delete group successfully', async () => {
      const groupId = '507f1f77bcf86cd799439012';

      authMiddleware.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });
      GroupService.deleteGroup.mockResolvedValue({
        success: true,
        message: 'Group deleted successfully'
      });

      const response = await request(app)
        .delete(`/api/groups/${groupId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Group deleted successfully');
      expect(GroupService.deleteGroup).toHaveBeenCalledWith(groupId, mockUser.id);
    });

    it('should return 403 if user is not the creator', async () => {
      const groupId = '507f1f77bcf86cd799439012';

      authMiddleware.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });
      GroupService.deleteGroup.mockRejectedValue(new Error('Only the group creator can delete the group'));

      const response = await request(app)
        .delete(`/api/groups/${groupId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Only the group creator can delete the group');
      expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });
});
