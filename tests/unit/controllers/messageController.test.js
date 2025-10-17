const request = require('supertest');
const express = require('express');
const MessageController = require('../../../src/controllers/messageController');
const MessageService = require('../../../src/services/MessageService');
const responseHandler = require('../../../src/utils/responseHandler');

// Mock dependencies
jest.mock('../../../src/services/MessageService');
jest.mock('../../../src/utils/responseHandler');

describe('MessageController', () => {
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

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const messageData = {
        recipientId: '507f1f77bcf86cd799439012',
        content: 'Hello, how are you?',
        type: 'TEXT'
      };
      
      mockReq.body = messageData;
      
      const mockMessage = {
        id: '507f1f77bcf86cd799439011',
        sender: '507f1f77bcf86cd799439011',
        recipient: '507f1f77bcf86cd799439012',
        content: 'Hello, how are you?',
        type: 'TEXT'
      };
      
      MessageService.sendMessage.mockResolvedValue({
        success: true,
        message: 'Message sent successfully',
        data: { message: mockMessage }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await MessageController.sendMessage(mockReq, mockRes, mockNext);
      
      expect(MessageService.sendMessage).toHaveBeenCalledWith({
        ...messageData,
        senderId: mockReq.user.id
      });
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle send message error', async () => {
      const messageData = {
        recipientId: '507f1f77bcf86cd799439012',
        content: 'Hello, how are you?',
        type: 'TEXT'
      };
      
      mockReq.body = messageData;
      
      const error = new Error('Failed to send message');
      MessageService.sendMessage.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await MessageController.sendMessage(mockReq, mockRes, mockNext);
      
      expect(MessageService.sendMessage).toHaveBeenCalledWith({
        ...messageData,
        senderId: mockReq.user.id
      });
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });

  describe('sendGroupMessage', () => {
    it('should send group message successfully', async () => {
      const groupId = '507f1f77bcf86cd799439011';
      const messageData = {
        content: 'Hello group!',
        type: 'TEXT'
      };
      
      mockReq.params.groupId = groupId;
      mockReq.body = messageData;
      
      const mockMessage = {
        id: '507f1f77bcf86cd799439011',
        sender: '507f1f77bcf86cd799439011',
        group: groupId,
        content: 'Hello group!',
        type: 'TEXT'
      };
      
      MessageService.sendGroupMessage.mockResolvedValue({
        success: true,
        message: 'Group message sent successfully',
        data: { message: mockMessage }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await MessageController.sendGroupMessage(mockReq, mockRes, mockNext);
      
      expect(MessageService.sendGroupMessage).toHaveBeenCalledWith({
        ...messageData,
        groupId,
        senderId: mockReq.user.id
      });
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle send group message error', async () => {
      const groupId = '507f1f77bcf86cd799439011';
      const messageData = {
        content: 'Hello group!',
        type: 'TEXT'
      };
      
      mockReq.params.groupId = groupId;
      mockReq.body = messageData;
      
      const error = new Error('Failed to send group message');
      MessageService.sendGroupMessage.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await MessageController.sendGroupMessage(mockReq, mockRes, mockNext);
      
      expect(MessageService.sendGroupMessage).toHaveBeenCalledWith({
        ...messageData,
        groupId,
        senderId: mockReq.user.id
      });
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });

  describe('getConversation', () => {
    it('should get conversation successfully', async () => {
      const userId = '507f1f77bcf86cd799439012';
      mockReq.params.userId = userId;
      
      const mockMessages = [
        {
          id: '507f1f77bcf86cd799439011',
          sender: '507f1f77bcf86cd799439011',
          recipient: '507f1f77bcf86cd799439012',
          content: 'Hello!',
          type: 'TEXT'
        }
      ];
      
      MessageService.getConversation.mockResolvedValue({
        success: true,
        data: { messages: mockMessages }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await MessageController.getConversation(mockReq, mockRes, mockNext);
      
      expect(MessageService.getConversation).toHaveBeenCalledWith(mockReq.user.id, userId);
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle get conversation error', async () => {
      const userId = '507f1f77bcf86cd799439012';
      mockReq.params.userId = userId;
      
      const error = new Error('Failed to get conversation');
      MessageService.getConversation.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await MessageController.getConversation(mockReq, mockRes, mockNext);
      
      expect(MessageService.getConversation).toHaveBeenCalledWith(mockReq.user.id, userId);
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });

  describe('getGroupMessages', () => {
    it('should get group messages successfully', async () => {
      const groupId = '507f1f77bcf86cd799439011';
      mockReq.params.groupId = groupId;
      
      const mockMessages = [
        {
          id: '507f1f77bcf86cd799439011',
          sender: '507f1f77bcf86cd799439011',
          group: groupId,
          content: 'Hello group!',
          type: 'TEXT'
        }
      ];
      
      MessageService.getGroupMessages.mockResolvedValue({
        success: true,
        data: { messages: mockMessages }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await MessageController.getGroupMessages(mockReq, mockRes, mockNext);
      
      expect(MessageService.getGroupMessages).toHaveBeenCalledWith(groupId, mockReq.user.id);
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle get group messages error', async () => {
      const groupId = '507f1f77bcf86cd799439011';
      mockReq.params.groupId = groupId;
      
      const error = new Error('Failed to get group messages');
      MessageService.getGroupMessages.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await MessageController.getGroupMessages(mockReq, mockRes, mockNext);
      
      expect(MessageService.getGroupMessages).toHaveBeenCalledWith(groupId, mockReq.user.id);
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    it('should mark message as read successfully', async () => {
      const messageId = '507f1f77bcf86cd799439011';
      mockReq.params.messageId = messageId;
      
      MessageService.markAsRead.mockResolvedValue({
        success: true,
        message: 'Message marked as read'
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await MessageController.markAsRead(mockReq, mockRes, mockNext);
      
      expect(MessageService.markAsRead).toHaveBeenCalledWith(messageId, mockReq.user.id);
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle mark as read error', async () => {
      const messageId = '507f1f77bcf86cd799439011';
      mockReq.params.messageId = messageId;
      
      const error = new Error('Failed to mark message as read');
      MessageService.markAsRead.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await MessageController.markAsRead(mockReq, mockRes, mockNext);
      
      expect(MessageService.markAsRead).toHaveBeenCalledWith(messageId, mockReq.user.id);
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });

  describe('deleteMessage', () => {
    it('should delete message successfully', async () => {
      const messageId = '507f1f77bcf86cd799439011';
      mockReq.params.messageId = messageId;
      
      MessageService.deleteMessage.mockResolvedValue({
        success: true,
        message: 'Message deleted successfully'
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await MessageController.deleteMessage(mockReq, mockRes, mockNext);
      
      expect(MessageService.deleteMessage).toHaveBeenCalledWith(messageId, mockReq.user.id);
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle delete message error', async () => {
      const messageId = '507f1f77bcf86cd799439011';
      mockReq.params.messageId = messageId;
      
      const error = new Error('Failed to delete message');
      MessageService.deleteMessage.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await MessageController.deleteMessage(mockReq, mockRes, mockNext);
      
      expect(MessageService.deleteMessage).toHaveBeenCalledWith(messageId, mockReq.user.id);
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });
});