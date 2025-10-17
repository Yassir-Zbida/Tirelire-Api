const request = require('supertest');
const express = require('express');
const TicketController = require('../../../src/controllers/ticketController');
const TicketService = require('../../../src/services/TicketService');
const responseHandler = require('../../../src/utils/responseHandler');

// Mock dependencies
jest.mock('../../../src/services/TicketService');
jest.mock('../../../src/utils/responseHandler');

describe('TicketController', () => {
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
      query: {},
      user: { id: '507f1f77bcf86cd799439011' }
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('createTicket', () => {
    it('should create ticket successfully', async () => {
      const ticketData = {
        title: 'Payment Issue',
        description: 'I am having trouble with my payment',
        category: 'PAYMENT',
        priority: 'MEDIUM'
      };
      
      mockReq.body = ticketData;
      
      const mockTicket = {
        id: '507f1f77bcf86cd799439011',
        ticketNumber: 'TKT-001',
        title: 'Payment Issue',
        description: 'I am having trouble with my payment',
        category: 'PAYMENT',
        priority: 'MEDIUM',
        creator: '507f1f77bcf86cd799439011',
        status: 'OPEN'
      };
      
      TicketService.createTicket.mockResolvedValue({
        success: true,
        message: 'Ticket created successfully',
        data: { ticket: mockTicket }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await TicketController.createTicket(mockReq, mockRes, mockNext);
      
      expect(TicketService.createTicket).toHaveBeenCalledWith(ticketData, mockReq.user.id);
      expect(responseHandler.success).toHaveBeenCalledWith(mockRes, 'Ticket created successfully', { ticket: mockTicket }, 201);
    });

    it('should handle create ticket error', async () => {
      const ticketData = {
        title: 'Payment Issue',
        description: 'I am having trouble with my payment',
        category: 'PAYMENT',
        priority: 'MEDIUM'
      };
      
      mockReq.body = ticketData;
      
      const error = new Error('Failed to create ticket');
      TicketService.createTicket.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await TicketController.createTicket(mockReq, mockRes, mockNext);
      
      expect(TicketService.createTicket).toHaveBeenCalledWith(ticketData, mockReq.user.id);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getUserTickets', () => {
    it('should get user tickets successfully', async () => {
      const mockTickets = [
        {
          id: '507f1f77bcf86cd799439011',
          ticketNumber: 'TKT-001',
          title: 'Payment Issue',
          status: 'OPEN',
          priority: 'MEDIUM'
        }
      ];
      
      TicketService.getUserTickets.mockResolvedValue({
        success: true,
        data: { tickets: mockTickets }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await TicketController.getUserTickets(mockReq, mockRes, mockNext);
      
      expect(TicketService.getUserTickets).toHaveBeenCalledWith(mockReq.user.id, {});
      expect(responseHandler.success).toHaveBeenCalledWith(mockRes, 'Tickets retrieved successfully', { tickets: mockTickets });
    });

    it('should handle get user tickets error', async () => {
      const error = new Error('Failed to get user tickets');
      TicketService.getUserTickets.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await TicketController.getUserTickets(mockReq, mockRes, mockNext);
      
      expect(TicketService.getUserTickets).toHaveBeenCalledWith(mockReq.user.id, {});
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getTicketById', () => {
    it('should get ticket by ID successfully', async () => {
      const ticketId = '507f1f77bcf86cd799439011';
      mockReq.params.id = ticketId;
      
      const mockTicket = {
        id: ticketId,
        ticketNumber: 'TKT-001',
        title: 'Payment Issue',
        description: 'I am having trouble with my payment',
        status: 'OPEN',
        priority: 'MEDIUM'
      };
      
      TicketService.getTicketById.mockResolvedValue({
        success: true,
        data: { ticket: mockTicket }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await TicketController.getTicketById(mockReq, mockRes, mockNext);
      
      expect(TicketService.getTicketById).toHaveBeenCalledWith(ticketId, mockReq.user.id);
      expect(responseHandler.success).toHaveBeenCalledWith(mockRes, 'Ticket retrieved successfully', { ticket: mockTicket });
    });

    it('should handle get ticket by ID error', async () => {
      const ticketId = '507f1f77bcf86cd799439011';
      mockReq.params.id = ticketId;
      
      const error = new Error('Ticket not found');
      TicketService.getTicketById.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await TicketController.getTicketById(mockReq, mockRes, mockNext);
      
      expect(TicketService.getTicketById).toHaveBeenCalledWith(ticketId, mockReq.user.id);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateTicket', () => {
    it('should update ticket successfully', async () => {
      const ticketId = '507f1f77bcf86cd799439011';
      const updateData = {
        title: 'Updated Payment Issue',
        description: 'Updated description',
        priority: 'HIGH'
      };
      
      mockReq.params.id = ticketId;
      mockReq.body = updateData;
      
      const mockTicket = {
        id: ticketId,
        ticketNumber: 'TKT-001',
        title: 'Updated Payment Issue',
        description: 'Updated description',
        priority: 'HIGH'
      };
      
      TicketService.updateTicket.mockResolvedValue({
        success: true,
        message: 'Ticket updated successfully',
        data: { ticket: mockTicket }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await TicketController.updateTicket(mockReq, mockRes, mockNext);
      
      expect(TicketService.updateTicket).toHaveBeenCalledWith(ticketId, updateData, mockReq.user.id);
      expect(responseHandler.success).toHaveBeenCalledWith(mockRes, 'Ticket updated successfully', { ticket: mockTicket });
    });

    it('should handle update ticket error', async () => {
      const ticketId = '507f1f77bcf86cd799439011';
      const updateData = {
        title: 'Updated Payment Issue',
        description: 'Updated description',
        priority: 'HIGH'
      };
      
      mockReq.params.id = ticketId;
      mockReq.body = updateData;
      
      const error = new Error('Failed to update ticket');
      TicketService.updateTicket.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await TicketController.updateTicket(mockReq, mockRes, mockNext);
      
      expect(TicketService.updateTicket).toHaveBeenCalledWith(ticketId, updateData, mockReq.user.id);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('assignTicket', () => {
    it('should assign ticket successfully', async () => {
      const ticketId = '507f1f77bcf86cd799439011';
      const assignData = {
        assignedTo: '507f1f77bcf86cd799439012'
      };
      
      mockReq.params.id = ticketId;
      mockReq.body = assignData;
      
      const mockTicket = {
        id: ticketId,
        ticketNumber: 'TKT-001',
        assignedTo: '507f1f77bcf86cd799439012',
        status: 'ASSIGNED'
      };
      
      TicketService.assignTicket.mockResolvedValue({
        success: true,
        message: 'Ticket assigned successfully',
        data: { ticket: mockTicket }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await TicketController.assignTicket(mockReq, mockRes, mockNext);
      
      expect(TicketService.assignTicket).toHaveBeenCalledWith(ticketId, assignData.assignedTo, mockReq.user.id);
      expect(responseHandler.success).toHaveBeenCalledWith(mockRes, 'Ticket assigned successfully', { ticket: mockTicket });
    });

    it('should handle assign ticket error', async () => {
      const ticketId = '507f1f77bcf86cd799439011';
      const assignData = {
        assignedTo: '507f1f77bcf86cd799439012'
      };
      
      mockReq.params.id = ticketId;
      mockReq.body = assignData;
      
      const error = new Error('Failed to assign ticket');
      TicketService.assignTicket.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await TicketController.assignTicket(mockReq, mockRes, mockNext);
      
      expect(TicketService.assignTicket).toHaveBeenCalledWith(ticketId, assignData.assignedTo, mockReq.user.id);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('closeTicket', () => {
    it('should close ticket successfully', async () => {
      const ticketId = '507f1f77bcf86cd799439011';
      const closeData = {
        resolution: 'Issue resolved successfully'
      };
      
      mockReq.params.id = ticketId;
      mockReq.body = closeData;
      
      const mockTicket = {
        id: ticketId,
        ticketNumber: 'TKT-001',
        status: 'CLOSED',
        resolution: 'Issue resolved successfully'
      };
      
      TicketService.closeTicket.mockResolvedValue({
        success: true,
        message: 'Ticket closed successfully',
        data: { ticket: mockTicket }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await TicketController.closeTicket(mockReq, mockRes, mockNext);
      
      expect(TicketService.closeTicket).toHaveBeenCalledWith(ticketId, mockReq.user.id, closeData.resolution);
      expect(responseHandler.success).toHaveBeenCalledWith(mockRes, 'Ticket closed successfully', { ticket: mockTicket });
    });

    it('should handle close ticket error', async () => {
      const ticketId = '507f1f77bcf86cd799439011';
      const closeData = {
        resolution: 'Issue resolved successfully'
      };
      
      mockReq.params.id = ticketId;
      mockReq.body = closeData;
      
      const error = new Error('Failed to close ticket');
      TicketService.closeTicket.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await TicketController.closeTicket(mockReq, mockRes, mockNext);
      
      expect(TicketService.closeTicket).toHaveBeenCalledWith(ticketId, mockReq.user.id, closeData.resolution);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getAllTickets', () => {
    it('should get all tickets successfully', async () => {
      const mockTickets = [
        {
          id: '507f1f77bcf86cd799439011',
          ticketNumber: 'TKT-001',
          title: 'Payment Issue',
          status: 'OPEN',
          priority: 'MEDIUM'
        }
      ];
      
      TicketService.getAllTickets.mockResolvedValue({
        success: true,
        data: { tickets: mockTickets }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await TicketController.getAllTickets(mockReq, mockRes, mockNext);
      
      expect(TicketService.getAllTickets).toHaveBeenCalledWith({});
      expect(responseHandler.success).toHaveBeenCalledWith(mockRes, 'All tickets retrieved successfully', { tickets: mockTickets });
    });

    it('should handle get all tickets error', async () => {
      const error = new Error('Failed to get all tickets');
      TicketService.getAllTickets.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await TicketController.getAllTickets(mockReq, mockRes, mockNext);
      
      expect(TicketService.getAllTickets).toHaveBeenCalledWith({});
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});