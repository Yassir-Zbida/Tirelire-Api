const request = require('supertest');
const express = require('express');
const PaymentController = require('../../../src/controllers/paymentController');
const PaymentService = require('../../../src/services/PaymentService');
const responseHandler = require('../../../src/utils/responseHandler');

// Mock dependencies
jest.mock('../../../src/services/PaymentService');
jest.mock('../../../src/utils/responseHandler');

describe('PaymentController', () => {
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

  describe('createBankTransferPayment', () => {
    it('should create bank transfer payment successfully', async () => {
      const paymentData = {
        contributionId: '507f1f77bcf86cd799439011',
        amount: 100,
        currency: 'USD',
        bankDetails: {
          bankName: 'Test Bank',
          accountNumber: '123456789'
        }
      };
      
      mockReq.body = paymentData;
      
      const mockPayment = {
        id: '507f1f77bcf86cd799439011',
        user: '507f1f77bcf86cd799439011',
        contribution: '507f1f77bcf86cd799439011',
        amount: 100,
        currency: 'USD',
        method: 'BANK_TRANSFER',
        status: 'PENDING'
      };
      
      PaymentService.createBankTransferPayment.mockResolvedValue({
        success: true,
        message: 'Bank transfer payment created successfully',
        data: { payment: mockPayment }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await PaymentController.createBankTransferPayment(mockReq, mockRes, mockNext);
      
      expect(PaymentService.createBankTransferPayment).toHaveBeenCalledWith({
        ...paymentData,
        userId: mockReq.user.id
      });
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle create bank transfer payment error', async () => {
      const paymentData = {
        contributionId: '507f1f77bcf86cd799439011',
        amount: 100,
        currency: 'USD',
        bankDetails: {
          bankName: 'Test Bank',
          accountNumber: '123456789'
        }
      };
      
      mockReq.body = paymentData;
      
      const error = new Error('Failed to create bank transfer payment');
      PaymentService.createBankTransferPayment.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await PaymentController.createBankTransferPayment(mockReq, mockRes, mockNext);
      
      expect(PaymentService.createBankTransferPayment).toHaveBeenCalledWith({
        ...paymentData,
        userId: mockReq.user.id
      });
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });

  describe('createStripePaymentIntent', () => {
    it('should create Stripe payment intent successfully', async () => {
      const paymentData = {
        contributionId: '507f1f77bcf86cd799439011',
        amount: 100,
        currency: 'USD'
      };
      
      mockReq.body = paymentData;
      
      const mockPaymentIntent = {
        id: 'pi_123456789',
        client_secret: 'pi_123456789_secret_abc123',
        amount: 10000,
        currency: 'usd',
        status: 'requires_payment_method'
      };
      
      PaymentService.createStripePaymentIntent.mockResolvedValue({
        success: true,
        message: 'Stripe payment intent created successfully',
        data: { paymentIntent: mockPaymentIntent }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await PaymentController.createStripePaymentIntent(mockReq, mockRes, mockNext);
      
      expect(PaymentService.createStripePaymentIntent).toHaveBeenCalledWith({
        ...paymentData,
        userId: mockReq.user.id
      });
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle create Stripe payment intent error', async () => {
      const paymentData = {
        contributionId: '507f1f77bcf86cd799439011',
        amount: 100,
        currency: 'USD'
      };
      
      mockReq.body = paymentData;
      
      const error = new Error('Failed to create Stripe payment intent');
      PaymentService.createStripePaymentIntent.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await PaymentController.createStripePaymentIntent(mockReq, mockRes, mockNext);
      
      expect(PaymentService.createStripePaymentIntent).toHaveBeenCalledWith({
        ...paymentData,
        userId: mockReq.user.id
      });
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });

  describe('getUserPayments', () => {
    it('should get user payments successfully', async () => {
      const mockPayments = [
        {
          id: '507f1f77bcf86cd799439011',
          user: '507f1f77bcf86cd799439011',
          amount: 100,
          currency: 'USD',
          method: 'BANK_TRANSFER',
          status: 'SUCCEEDED'
        }
      ];
      
      PaymentService.getUserPayments.mockResolvedValue({
        success: true,
        data: { payments: mockPayments }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await PaymentController.getUserPayments(mockReq, mockRes, mockNext);
      
      expect(PaymentService.getUserPayments).toHaveBeenCalledWith(mockReq.user.id);
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle get user payments error', async () => {
      const error = new Error('Failed to get user payments');
      PaymentService.getUserPayments.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await PaymentController.getUserPayments(mockReq, mockRes, mockNext);
      
      expect(PaymentService.getUserPayments).toHaveBeenCalledWith(mockReq.user.id);
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });

  describe('getPaymentById', () => {
    it('should get payment by ID successfully', async () => {
      const paymentId = '507f1f77bcf86cd799439011';
      mockReq.params.id = paymentId;
      
      const mockPayment = {
        id: paymentId,
        user: '507f1f77bcf86cd799439011',
        amount: 100,
        currency: 'USD',
        method: 'BANK_TRANSFER',
        status: 'SUCCEEDED'
      };
      
      PaymentService.getPaymentById.mockResolvedValue({
        success: true,
        data: { payment: mockPayment }
      });
      
      responseHandler.success.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await PaymentController.getPaymentById(mockReq, mockRes, mockNext);
      
      expect(PaymentService.getPaymentById).toHaveBeenCalledWith(paymentId);
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should handle get payment by ID error', async () => {
      const paymentId = '507f1f77bcf86cd799439011';
      mockReq.params.id = paymentId;
      
      const error = new Error('Payment not found');
      PaymentService.getPaymentById.mockRejectedValue(error);
      
      responseHandler.error.mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      });
      
      await PaymentController.getPaymentById(mockReq, mockRes, mockNext);
      
      expect(PaymentService.getPaymentById).toHaveBeenCalledWith(paymentId);
      expect(responseHandler.error).toHaveBeenCalled();
    });
  });

});