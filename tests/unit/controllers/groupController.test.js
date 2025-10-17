const request = require('supertest');
const express = require('express');
const GroupController = require('../../../src/controllers/groupController');
const GroupService = require('../../../src/services/GroupService');
const responseHandler = require('../../../src/utils/responseHandler');

// Mock dependencies
jest.mock('../../../src/services/GroupService');
jest.mock('../../../src/utils/responseHandler');

describe('GroupController', () => {
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

  describe('createGroup', () => {
    it('should create group successfully', async () => {
      const groupData = {
        name: 'Test Group',
        description: 'A test group',
        contributionAmount: 100,
        frequency: 'MONTHLY',
        maxMembers: 10
      };
      
      mockReq.body = groupData;
      
      const mockGroup = {
        id: '507f1f77bcf86cd799439011',
        name: 'Test Group',
        description: 'A test group',
        creator: '507f1f77bcf86cd799439011'
      };
      
      GroupService.createGroup.mockResolvedValue({
        success: true,
        message: 'Group created successfully',
        data: { group: mockGroup }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await GroupController.createGroup(mockReq, mockRes, mockNext);
      
      expect(GroupService.createGroup).toHaveBeenCalledWith(groupData, mockReq.user.id);
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle create group error', async () => {
      const groupData = {
        name: 'Test Group',
        description: 'A test group',
        contributionAmount: 100,
        frequency: 'MONTHLY',
        maxMembers: 10
      };
      
      mockReq.body = groupData;
      
      const error = new Error('Group creation failed');
      GroupService.createGroup.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await GroupController.createGroup(mockReq, mockRes, mockNext);
      
      expect(GroupService.createGroup).toHaveBeenCalledWith(groupData, mockReq.user.id);
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });

  describe('getGroupById', () => {
    it('should get group by ID successfully', async () => {
      const groupId = '507f1f77bcf86cd799439011';
      mockReq.params.id = groupId;
      
      const mockGroup = {
        id: groupId,
        name: 'Test Group',
        description: 'A test group',
        creator: '507f1f77bcf86cd799439011'
      };
      
      GroupService.getGroupById.mockResolvedValue({
        success: true,
        data: { group: mockGroup }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await GroupController.getGroupById(mockReq, mockRes, mockNext);
      
      expect(GroupService.getGroupById).toHaveBeenCalledWith(groupId);
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle get group by ID error', async () => {
      const groupId = '507f1f77bcf86cd799439011';
      mockReq.params.id = groupId;
      
      const error = new Error('Group not found');
      GroupService.getGroupById.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await GroupController.getGroupById(mockReq, mockRes, mockNext);
      
      expect(GroupService.getGroupById).toHaveBeenCalledWith(groupId);
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });

  describe('getUserGroups', () => {
    it('should get user groups successfully', async () => {
      const mockGroups = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Test Group 1',
          description: 'A test group'
        },
        {
          id: '507f1f77bcf86cd799439012',
          name: 'Test Group 2',
          description: 'Another test group'
        }
      ];
      
      GroupService.getUserGroups.mockResolvedValue({
        success: true,
        data: { groups: mockGroups }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await GroupController.getUserGroups(mockReq, mockRes, mockNext);
      
      expect(GroupService.getUserGroups).toHaveBeenCalledWith(mockReq.user.id);
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle get user groups error', async () => {
      const error = new Error('Failed to get user groups');
      GroupService.getUserGroups.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await GroupController.getUserGroups(mockReq, mockRes, mockNext);
      
      expect(GroupService.getUserGroups).toHaveBeenCalledWith(mockReq.user.id);
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });

  describe('getPublicGroups', () => {
    it('should get public groups successfully', async () => {
      const mockGroups = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Public Group 1',
          description: 'A public group'
        }
      ];
      
      GroupService.getPublicGroups.mockResolvedValue({
        success: true,
        data: { groups: mockGroups }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await GroupController.getPublicGroups(mockReq, mockRes, mockNext);
      
      expect(GroupService.getPublicGroups).toHaveBeenCalled();
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle get public groups error', async () => {
      const error = new Error('Failed to get public groups');
      GroupService.getPublicGroups.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await GroupController.getPublicGroups(mockReq, mockRes, mockNext);
      
      expect(GroupService.getPublicGroups).toHaveBeenCalled();
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });

  describe('joinGroup', () => {
    it('should join group successfully', async () => {
      const groupId = '507f1f77bcf86cd799439011';
      mockReq.params.id = groupId;
      
      GroupService.joinGroup.mockResolvedValue({
        success: true,
        message: 'Successfully joined group'
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await GroupController.joinGroup(mockReq, mockRes, mockNext);
      
      expect(GroupService.joinGroup).toHaveBeenCalledWith(groupId, mockReq.user.id);
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle join group error', async () => {
      const groupId = '507f1f77bcf86cd799439011';
      mockReq.params.id = groupId;
      
      const error = new Error('Cannot join group');
      GroupService.joinGroup.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await GroupController.joinGroup(mockReq, mockRes, mockNext);
      
      expect(GroupService.joinGroup).toHaveBeenCalledWith(groupId, mockReq.user.id);
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });

  describe('leaveGroup', () => {
    it('should leave group successfully', async () => {
      const groupId = '507f1f77bcf86cd799439011';
      mockReq.params.id = groupId;
      
      GroupService.leaveGroup.mockResolvedValue({
        success: true,
        message: 'Successfully left group'
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await GroupController.leaveGroup(mockReq, mockRes, mockNext);
      
      expect(GroupService.leaveGroup).toHaveBeenCalledWith(groupId, mockReq.user.id);
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle leave group error', async () => {
      const groupId = '507f1f77bcf86cd799439011';
      mockReq.params.id = groupId;
      
      const error = new Error('Cannot leave group');
      GroupService.leaveGroup.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await GroupController.leaveGroup(mockReq, mockRes, mockNext);
      
      expect(GroupService.leaveGroup).toHaveBeenCalledWith(groupId, mockReq.user.id);
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });

  describe('updateGroup', () => {
    it('should update group successfully', async () => {
      const groupId = '507f1f77bcf86cd799439011';
      const updateData = {
        name: 'Updated Group Name',
        description: 'Updated description'
      };
      
      mockReq.params.id = groupId;
      mockReq.body = updateData;
      
      const mockGroup = {
        id: groupId,
        name: 'Updated Group Name',
        description: 'Updated description'
      };
      
      GroupService.updateGroup.mockResolvedValue({
        success: true,
        message: 'Group updated successfully',
        data: { group: mockGroup }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await GroupController.updateGroup(mockReq, mockRes, mockNext);
      
      expect(GroupService.updateGroup).toHaveBeenCalledWith(groupId, updateData, mockReq.user.id);
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle update group error', async () => {
      const groupId = '507f1f77bcf86cd799439011';
      const updateData = {
        name: 'Updated Group Name',
        description: 'Updated description'
      };
      
      mockReq.params.id = groupId;
      mockReq.body = updateData;
      
      const error = new Error('Cannot update group');
      GroupService.updateGroup.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await GroupController.updateGroup(mockReq, mockRes, mockNext);
      
      expect(GroupService.updateGroup).toHaveBeenCalledWith(groupId, updateData, mockReq.user.id);
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });

  describe('deleteGroup', () => {
    it('should delete group successfully', async () => {
      const groupId = '507f1f77bcf86cd799439011';
      mockReq.params.id = groupId;
      
      GroupService.deleteGroup.mockResolvedValue({
        success: true,
        message: 'Group deleted successfully'
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await GroupController.deleteGroup(mockReq, mockRes, mockNext);
      
      expect(GroupService.deleteGroup).toHaveBeenCalledWith(groupId, mockReq.user.id);
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle delete group error', async () => {
      const groupId = '507f1f77bcf86cd799439011';
      mockReq.params.id = groupId;
      
      const error = new Error('Cannot delete group');
      GroupService.deleteGroup.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await GroupController.deleteGroup(mockReq, mockRes, mockNext);
      
      expect(GroupService.deleteGroup).toHaveBeenCalledWith(groupId, mockReq.user.id);
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });

  describe('getGroupMembers', () => {
    it('should get group members successfully', async () => {
      const groupId = '507f1f77bcf86cd799439011';
      mockReq.params.id = groupId;
      
      const mockMembers = [
        {
          id: '507f1f77bcf86cd799439011',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        }
      ];
      
      GroupService.getGroupMembers.mockResolvedValue({
        success: true,
        data: { members: mockMembers }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await GroupController.getGroupMembers(mockReq, mockRes, mockNext);
      
      expect(GroupService.getGroupMembers).toHaveBeenCalledWith(groupId, mockReq.user.id);
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle get group members error', async () => {
      const groupId = '507f1f77bcf86cd799439011';
      mockReq.params.id = groupId;
      
      const error = new Error('Cannot get group members');
      GroupService.getGroupMembers.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await GroupController.getGroupMembers(mockReq, mockRes, mockNext);
      
      expect(GroupService.getGroupMembers).toHaveBeenCalledWith(groupId, mockReq.user.id);
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });
});