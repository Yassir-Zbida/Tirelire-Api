const MessageService = require('../../../src/services/MessageService');
const Message = require('../../../src/models/Message');
const User = require('../../../src/models/User');
const Group = require('../../../src/models/Group');

// Mock dependencies
jest.mock('../../../src/models/Message');
jest.mock('../../../src/models/User');
jest.mock('../../../src/models/Group');

describe('MessageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send text message successfully', async () => {
      const messageData = {
        senderId: '507f1f77bcf86cd799439013',
        recipientId: '507f1f77bcf86cd799439014',
        content: 'Hello, how are you?',
        type: 'TEXT'
      };

      const mockMessage = {
        _id: '507f1f77bcf86cd799439015',
        ...messageData,
        status: 'SENT',
        timestamp: new Date()
      };

      const mockSender = { _id: messageData.senderId };
      const mockRecipient = { _id: messageData.recipientId };

      User.findById.mockResolvedValueOnce(mockSender);
      User.findById.mockResolvedValueOnce(mockRecipient);
      Message.create.mockResolvedValue(mockMessage);

      const result = await MessageService.sendMessage(messageData);

      expect(result.success).toBe(true);
      expect(result.data.message).toBeDefined();
      expect(Message.create).toHaveBeenCalledWith({
        ...messageData,
        status: 'SENT',
        timestamp: expect.any(Date)
      });
    });

    it('should send audio message successfully', async () => {
      const messageData = {
        senderId: '507f1f77bcf86cd799439013',
        recipientId: '507f1f77bcf86cd799439014',
        audioUrl: 'uploads/audio/message_123.mp3',
        type: 'AUDIO'
      };

      const mockMessage = {
        _id: '507f1f77bcf86cd799439015',
        ...messageData,
        status: 'SENT',
        timestamp: new Date()
      };

      const mockSender = { _id: messageData.senderId };
      const mockRecipient = { _id: messageData.recipientId };

      User.findById.mockResolvedValueOnce(mockSender);
      User.findById.mockResolvedValueOnce(mockRecipient);
      Message.create.mockResolvedValue(mockMessage);

      const result = await MessageService.sendMessage(messageData);

      expect(result.success).toBe(true);
      expect(result.data.message).toBeDefined();
    });

    it('should throw error if sender not found', async () => {
      const messageData = {
        senderId: '507f1f77bcf86cd799439013',
        recipientId: '507f1f77bcf86cd799439014',
        content: 'Hello',
        type: 'TEXT'
      };

      User.findById.mockResolvedValue(null);

      await expect(MessageService.sendMessage(messageData))
        .rejects.toThrow('Sender not found');
    });

    it('should throw error if recipient not found', async () => {
      const messageData = {
        senderId: '507f1f77bcf86cd799439013',
        recipientId: '507f1f77bcf86cd799439014',
        content: 'Hello',
        type: 'TEXT'
      };

      const mockSender = { _id: messageData.senderId };
      User.findById.mockResolvedValueOnce(mockSender);
      User.findById.mockResolvedValueOnce(null);

      await expect(MessageService.sendMessage(messageData))
        .rejects.toThrow('Recipient not found');
    });
  });

  describe('sendGroupMessage', () => {
    it('should send group message successfully', async () => {
      const messageData = {
        senderId: '507f1f77bcf86cd799439013',
        groupId: '507f1f77bcf86cd799439011',
        content: 'Group announcement',
        type: 'TEXT'
      };

      const mockMessage = {
        _id: '507f1f77bcf86cd799439015',
        ...messageData,
        status: 'SENT',
        timestamp: new Date()
      };

      const mockSender = { _id: messageData.senderId };
      const mockGroup = { 
        _id: messageData.groupId,
        isMember: jest.fn().mockReturnValue(true)
      };

      User.findById.mockResolvedValue(mockSender);
      Group.findById.mockResolvedValue(mockGroup);
      Message.create.mockResolvedValue(mockMessage);

      const result = await MessageService.sendGroupMessage(messageData);

      expect(result.success).toBe(true);
      expect(result.data.message).toBeDefined();
    });

    it('should throw error if sender is not a group member', async () => {
      const messageData = {
        senderId: '507f1f77bcf86cd799439013',
        groupId: '507f1f77bcf86cd799439011',
        content: 'Group announcement',
        type: 'TEXT'
      };

      const mockSender = { _id: messageData.senderId };
      const mockGroup = { 
        _id: messageData.groupId,
        isMember: jest.fn().mockReturnValue(false)
      };

      User.findById.mockResolvedValue(mockSender);
      Group.findById.mockResolvedValue(mockGroup);

      await expect(MessageService.sendGroupMessage(messageData))
        .rejects.toThrow('User is not a member of this group');
    });
  });

  describe('getConversation', () => {
    it('should get conversation successfully', async () => {
      const userId1 = '507f1f77bcf86cd799439013';
      const userId2 = '507f1f77bcf86cd799439014';

      const mockMessages = [
        {
          _id: '507f1f77bcf86cd799439015',
          sender: userId1,
          recipient: userId2,
          content: 'Hello',
          timestamp: new Date()
        },
        {
          _id: '507f1f77bcf86cd799439016',
          sender: userId2,
          recipient: userId1,
          content: 'Hi there',
          timestamp: new Date()
        }
      ];

      Message.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockMessages)
            })
          })
        })
      });

      Message.countDocuments.mockResolvedValue(2);

      const result = await MessageService.getConversation(userId1, userId2);

      expect(result.success).toBe(true);
      expect(result.data.messages).toBeDefined();
      expect(result.data.pagination).toBeDefined();
    });
  });

  describe('getGroupMessages', () => {
    it('should get group messages successfully', async () => {
      const groupId = '507f1f77bcf86cd799439011';
      const userId = '507f1f77bcf86cd799439013';

      const mockMessages = [
        {
          _id: '507f1f77bcf86cd799439015',
          group: groupId,
          sender: userId,
          content: 'Group message',
          timestamp: new Date()
        }
      ];

      const mockGroup = { 
        _id: groupId,
        isMember: jest.fn().mockReturnValue(true)
      };

      Group.findById.mockResolvedValue(mockGroup);
      Message.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockMessages)
            })
          })
        })
      });

      Message.countDocuments.mockResolvedValue(1);

      const result = await MessageService.getGroupMessages(groupId, userId);

      expect(result.success).toBe(true);
      expect(result.data.messages).toBeDefined();
    });

    it('should throw error if user is not a group member', async () => {
      const groupId = '507f1f77bcf86cd799439011';
      const userId = '507f1f77bcf86cd799439013';

      const mockGroup = { 
        _id: groupId,
        isMember: jest.fn().mockReturnValue(false)
      };

      Group.findById.mockResolvedValue(mockGroup);

      await expect(MessageService.getGroupMessages(groupId, userId))
        .rejects.toThrow('User is not a member of this group');
    });
  });

  describe('markAsRead', () => {
    it('should mark message as read successfully', async () => {
      const messageId = '507f1f77bcf86cd799439015';
      const userId = '507f1f77bcf86cd799439013';

      const mockMessage = {
        _id: messageId,
        recipient: userId,
        status: 'SENT',
        markAsRead: jest.fn().mockResolvedValue()
      };

      Message.findById.mockResolvedValue(mockMessage);

      const result = await MessageService.markAsRead(messageId, userId);

      expect(result.success).toBe(true);
      expect(mockMessage.markAsRead).toHaveBeenCalled();
    });

    it('should throw error if message not found', async () => {
      const messageId = '507f1f77bcf86cd799439015';
      const userId = '507f1f77bcf86cd799439013';

      Message.findById.mockResolvedValue(null);

      await expect(MessageService.markAsRead(messageId, userId))
        .rejects.toThrow('Message not found');
    });
  });

  describe('deleteMessage', () => {
    it('should delete message successfully', async () => {
      const messageId = '507f1f77bcf86cd799439015';
      const userId = '507f1f77bcf86cd799439013';

      const mockMessage = {
        _id: messageId,
        sender: userId,
        delete: jest.fn().mockResolvedValue()
      };

      Message.findById.mockResolvedValue(mockMessage);

      const result = await MessageService.deleteMessage(messageId, userId);

      expect(result.success).toBe(true);
      expect(mockMessage.delete).toHaveBeenCalled();
    });

    it('should throw error if user is not the sender', async () => {
      const messageId = '507f1f77bcf86cd799439015';
      const userId = '507f1f77bcf86cd799439013';

      const mockMessage = {
        _id: messageId,
        sender: '507f1f77bcf86cd799439014' // Different user
      };

      Message.findById.mockResolvedValue(mockMessage);

      await expect(MessageService.deleteMessage(messageId, userId))
        .rejects.toThrow('Only the sender can delete this message');
    });
  });

  describe('getUnreadCount', () => {
    it('should get unread message count successfully', async () => {
      const userId = '507f1f77bcf86cd799439013';

      Message.countDocuments.mockResolvedValue(5);

      const result = await MessageService.getUnreadCount(userId);

      expect(result.success).toBe(true);
      expect(result.data.count).toBe(5);
    });
  });

  describe('searchMessages', () => {
    it('should search messages successfully', async () => {
      const userId = '507f1f77bcf86cd799439013';
      const query = 'hello';
      const filters = { type: 'TEXT' };

      const mockMessages = [
        {
          _id: '507f1f77bcf86cd799439015',
          content: 'Hello world',
          type: 'TEXT'
        }
      ];

      Message.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockMessages)
            })
          })
        })
      });

      Message.countDocuments.mockResolvedValue(1);

      const result = await MessageService.searchMessages(userId, query, filters);

      expect(result.success).toBe(true);
      expect(result.data.messages).toBeDefined();
    });
  });
});
