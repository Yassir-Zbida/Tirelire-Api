const TicketService = require('../../../src/services/TicketService');
const Ticket = require('../../../src/models/Ticket');
const User = require('../../../src/models/User');

// Mock dependencies
jest.mock('../../../src/models/Ticket');
jest.mock('../../../src/models/User');

describe('TicketService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTicket', () => {
    it('should create ticket successfully', async () => {
      const ticketData = {
        title: 'Payment Issue',
        description: 'I cannot make a payment',
        category: 'PAYMENT',
        priority: 'MEDIUM',
        type: 'SUPPORT',
        creatorId: '507f1f77bcf86cd799439013'
      };

      const mockTicket = {
        _id: '507f1f77bcf86cd799439015',
        ticketNumber: 'TKT-001',
        ...ticketData,
        status: 'OPEN',
        createdAt: new Date()
      };

      const mockUser = { _id: ticketData.creatorId };
      User.findById.mockResolvedValue(mockUser);
      Ticket.create.mockResolvedValue(mockTicket);

      const result = await TicketService.createTicket(ticketData);

      expect(result.success).toBe(true);
      expect(result.data.ticket).toBeDefined();
      expect(Ticket.create).toHaveBeenCalledWith({
        ...ticketData,
        status: 'OPEN',
        createdAt: expect.any(Date)
      });
    });

    it('should throw error if creator not found', async () => {
      const ticketData = {
        title: 'Payment Issue',
        description: 'I cannot make a payment',
        category: 'PAYMENT',
        priority: 'MEDIUM',
        type: 'SUPPORT',
        creatorId: '507f1f77bcf86cd799439013'
      };

      User.findById.mockResolvedValue(null);

      await expect(TicketService.createTicket(ticketData))
        .rejects.toThrow('Creator not found');
    });
  });

  describe('getTicketById', () => {
    it('should get ticket by ID successfully', async () => {
      const ticketId = '507f1f77bcf86cd799439015';
      const userId = '507f1f77bcf86cd799439013';

      const mockTicket = {
        _id: ticketId,
        creator: userId,
        title: 'Payment Issue',
        status: 'OPEN'
      };

      Ticket.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockTicket)
        })
      });

      const result = await TicketService.getTicketById(ticketId, userId);

      expect(result.success).toBe(true);
      expect(result.data.ticket).toBeDefined();
    });

    it('should throw error if ticket not found', async () => {
      const ticketId = '507f1f77bcf86cd799439015';
      const userId = '507f1f77bcf86cd799439013';

      Ticket.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      });

      await expect(TicketService.getTicketById(ticketId, userId))
        .rejects.toThrow('Ticket not found');
    });
  });

  describe('getUserTickets', () => {
    it('should get user tickets successfully', async () => {
      const userId = '507f1f77bcf86cd799439013';
      const filters = { status: 'OPEN', category: 'PAYMENT' };

      const mockTickets = [
        {
          _id: '507f1f77bcf86cd799439015',
          creator: userId,
          title: 'Payment Issue',
          status: 'OPEN',
          category: 'PAYMENT'
        }
      ];

      Ticket.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockTickets)
            })
          })
        })
      });

      Ticket.countDocuments.mockResolvedValue(1);

      const result = await TicketService.getUserTickets(userId, filters);

      expect(result.success).toBe(true);
      expect(result.data.tickets).toBeDefined();
      expect(result.data.pagination).toBeDefined();
    });
  });

  describe('getAllTickets', () => {
    it('should get all tickets successfully', async () => {
      const filters = { status: 'OPEN', priority: 'HIGH' };

      const mockTickets = [
        {
          _id: '507f1f77bcf86cd799439015',
          title: 'Payment Issue',
          status: 'OPEN',
          priority: 'HIGH'
        }
      ];

      Ticket.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockTickets)
            })
          })
        })
      });

      Ticket.countDocuments.mockResolvedValue(1);

      const result = await TicketService.getAllTickets(filters);

      expect(result.success).toBe(true);
      expect(result.data.tickets).toBeDefined();
    });
  });

  describe('updateTicket', () => {
    it('should update ticket successfully', async () => {
      const ticketId = '507f1f77bcf86cd799439015';
      const updateData = { status: 'IN_PROGRESS', priority: 'HIGH' };
      const userId = '507f1f77bcf86cd799439013';

      const mockTicket = {
        _id: ticketId,
        creator: userId,
        status: 'OPEN',
        save: jest.fn().mockResolvedValue()
      };

      Ticket.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockTicket)
      });

      const result = await TicketService.updateTicket(ticketId, updateData, userId);

      expect(result.success).toBe(true);
      expect(mockTicket.status).toBe(updateData.status);
      expect(mockTicket.priority).toBe(updateData.priority);
      expect(mockTicket.save).toHaveBeenCalled();
    });

    it('should throw error if ticket not found', async () => {
      const ticketId = '507f1f77bcf86cd799439015';
      const updateData = { status: 'IN_PROGRESS' };
      const userId = '507f1f77bcf86cd799439013';

      Ticket.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await expect(TicketService.updateTicket(ticketId, updateData, userId))
        .rejects.toThrow('Ticket not found');
    });
  });

  describe('assignTicket', () => {
    it('should assign ticket successfully', async () => {
      const ticketId = '507f1f77bcf86cd799439015';
      const adminId = '507f1f77bcf86cd799439014';
      const assignedById = '507f1f77bcf86cd799439013';

      const mockTicket = {
        _id: ticketId,
        status: 'OPEN',
        assignedTo: null,
        save: jest.fn().mockResolvedValue()
      };

      const mockAdmin = { 
        _id: adminId,
        role: 'ADMIN'
      };

      Ticket.findById.mockResolvedValue(mockTicket);
      User.findById.mockResolvedValue(mockAdmin);

      const result = await TicketService.assignTicket(ticketId, adminId, assignedById);

      expect(result.success).toBe(true);
      expect(mockTicket.assignedTo).toBe(adminId);
      expect(mockTicket.status).toBe('IN_PROGRESS');
      expect(mockTicket.save).toHaveBeenCalled();
    });

    it('should throw error if admin not found', async () => {
      const ticketId = '507f1f77bcf86cd799439015';
      const adminId = '507f1f77bcf86cd799439014';
      const assignedById = '507f1f77bcf86cd799439013';

      const mockTicket = {
        _id: ticketId,
        status: 'OPEN'
      };

      Ticket.findById.mockResolvedValue(mockTicket);
      User.findById.mockResolvedValue(null);

      await expect(TicketService.assignTicket(ticketId, adminId, assignedById))
        .rejects.toThrow('Admin not found');
    });

    it('should throw error if user is not admin', async () => {
      const ticketId = '507f1f77bcf86cd799439015';
      const adminId = '507f1f77bcf86cd799439014';
      const assignedById = '507f1f77bcf86cd799439013';

      const mockTicket = {
        _id: ticketId,
        status: 'OPEN'
      };

      const mockUser = { 
        _id: adminId,
        role: 'PARTICULIER' // Not admin
      };

      Ticket.findById.mockResolvedValue(mockTicket);
      User.findById.mockResolvedValue(mockUser);

      await expect(TicketService.assignTicket(ticketId, adminId, assignedById))
        .rejects.toThrow('User is not an admin');
    });
  });

  describe('addResponse', () => {
    it('should add response to ticket successfully', async () => {
      const ticketId = '507f1f77bcf86cd799439015';
      const responseData = {
        content: 'Thank you for your response',
        responderId: '507f1f77bcf86cd799439013',
        isInternal: false
      };

      const mockTicket = {
        _id: ticketId,
        responses: [],
        addResponse: jest.fn().mockResolvedValue()
      };

      Ticket.findById.mockResolvedValue(mockTicket);

      const result = await TicketService.addResponse(ticketId, responseData);

      expect(result.success).toBe(true);
      expect(mockTicket.addResponse).toHaveBeenCalledWith(responseData);
    });

    it('should throw error if ticket not found', async () => {
      const ticketId = '507f1f77bcf86cd799439015';
      const responseData = {
        content: 'Thank you for your response',
        responderId: '507f1f77bcf86cd799439013'
      };

      Ticket.findById.mockResolvedValue(null);

      await expect(TicketService.addResponse(ticketId, responseData))
        .rejects.toThrow('Ticket not found');
    });
  });

  describe('closeTicket', () => {
    it('should close ticket successfully', async () => {
      const ticketId = '507f1f77bcf86cd799439015';
      const userId = '507f1f77bcf86cd799439013';
      const reason = 'Issue resolved';

      const mockTicket = {
        _id: ticketId,
        status: 'IN_PROGRESS',
        close: jest.fn().mockResolvedValue()
      };

      Ticket.findById.mockResolvedValue(mockTicket);

      const result = await TicketService.closeTicket(ticketId, userId, reason);

      expect(result.success).toBe(true);
      expect(mockTicket.close).toHaveBeenCalledWith(reason);
    });
  });

  describe('getTicketStatistics', () => {
    it('should get ticket statistics successfully', async () => {
      const mockStats = {
        total: 10,
        open: 3,
        inProgress: 4,
        closed: 3,
        averageResolutionTime: 24
      };

      Ticket.aggregate.mockResolvedValue([mockStats]);

      const result = await TicketService.getTicketStatistics();

      expect(result.success).toBe(true);
      expect(result.data.statistics).toBeDefined();
    });
  });

  describe('getOverdueTickets', () => {
    it('should get overdue tickets successfully', async () => {
      const mockTickets = [
        {
          _id: '507f1f77bcf86cd799439015',
          title: 'Overdue ticket',
          status: 'IN_PROGRESS',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        }
      ];

      Ticket.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockTickets)
        })
      });

      const result = await TicketService.getOverdueTickets();

      expect(result.success).toBe(true);
      expect(result.data.tickets).toBeDefined();
    });
  });

  describe('searchTickets', () => {
    it('should search tickets successfully', async () => {
      const query = 'payment';
      const filters = { status: 'OPEN', category: 'PAYMENT' };

      const mockTickets = [
        {
          _id: '507f1f77bcf86cd799439015',
          title: 'Payment Issue',
          content: 'Cannot make payment',
          status: 'OPEN',
          category: 'PAYMENT'
        }
      ];

      Ticket.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockTickets)
            })
          })
        })
      });

      Ticket.countDocuments.mockResolvedValue(1);

      const result = await TicketService.searchTickets(query, filters);

      expect(result.success).toBe(true);
      expect(result.data.tickets).toBeDefined();
    });
  });
});
