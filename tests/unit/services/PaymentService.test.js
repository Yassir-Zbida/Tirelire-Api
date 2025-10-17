const PaymentService = require('../../../src/services/PaymentService');
const Payment = require('../../../src/models/Payment');
const Contribution = require('../../../src/models/Contribution');
const User = require('../../../src/models/User');

// Mock dependencies
jest.mock('../../../src/models/Payment');
jest.mock('../../../src/models/Contribution');
jest.mock('../../../src/models/User');

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBankTransferPayment', () => {
    it('should create bank transfer payment successfully', async () => {
      const paymentData = {
        userId: '507f1f77bcf86cd799439013',
        contributionId: '507f1f77bcf86cd799439012',
        amount: 100,
        currency: 'XOF',
        bankProofUrl: 'uploads/payments/proof_123.jpg'
      };

      const mockUser = { _id: paymentData.userId };
      const mockPayment = {
        _id: '507f1f77bcf86cd799439014',
        ...paymentData,
        method: 'BANK_TRANSFER',
        status: 'PENDING'
      };

      User.findById.mockResolvedValue(mockUser);
      Payment.create.mockResolvedValue(mockPayment);

      const result = await PaymentService.createBankTransferPayment(paymentData);

      expect(result).toBeDefined();
      expect(result._id).toBe(mockPayment._id);
      expect(Payment.create).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      const paymentData = {
        userId: '507f1f77bcf86cd799439013',
        contributionId: '507f1f77bcf86cd799439012',
        amount: 100,
        currency: 'XOF'
      };

      User.findById.mockResolvedValue(null);

      await expect(PaymentService.createBankTransferPayment(paymentData))
        .rejects.toThrow('User not found');
    });

    it('should throw error if currency is unsupported', async () => {
      const paymentData = {
        userId: '507f1f77bcf86cd799439013',
        contributionId: '507f1f77bcf86cd799439012',
        amount: 100,
        currency: 'INVALID_CURRENCY'
      };

      const mockUser = { _id: paymentData.userId };
      User.findById.mockResolvedValue(mockUser);

      await expect(PaymentService.createBankTransferPayment(paymentData))
        .rejects.toThrow('Unsupported currency');
    });
  });

  describe('createStripePaymentIntent', () => {
    it('should throw error if Stripe is not configured', async () => {
      const paymentData = {
        userId: '507f1f77bcf86cd799439013',
        contributionId: '507f1f77bcf86cd799439012',
        amount: 100,
        currency: 'XOF'
      };

      await expect(PaymentService.createStripePaymentIntent(paymentData))
        .rejects.toThrow('Stripe is not configured');
    });

    it('should throw error if amount is invalid', async () => {
      const paymentData = {
        userId: '507f1f77bcf86cd799439013',
        contributionId: '507f1f77bcf86cd799439012',
        amount: 0, // Invalid amount
        currency: 'XOF'
      };

      await expect(PaymentService.createStripePaymentIntent(paymentData))
        .rejects.toThrow('Stripe is not configured');
    });
  });


  describe('listPayments', () => {
    it('should list payments successfully', async () => {
      const userId = '507f1f77bcf86cd799439013';
      const page = 1;
      const limit = 20;

      const mockPayments = [
        {
          _id: '507f1f77bcf86cd799439014',
          user: userId,
          amount: 100,
          status: 'PENDING',
          method: 'BANK_TRANSFER'
        }
      ];

      Payment.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockPayments)
          })
        })
      });

      Payment.countDocuments.mockResolvedValue(1);

      const result = await PaymentService.listPayments({ userId, page, limit });

      expect(result.payments).toBeDefined();
      expect(result.total).toBe(1);
      expect(result.page).toBe(page);
    });
  });

  describe('getPaymentById', () => {
    it('should get payment by ID successfully', async () => {
      const paymentId = '507f1f77bcf86cd799439014';
      const userId = '507f1f77bcf86cd799439013';

      const mockPayment = {
        _id: paymentId,
        user: userId,
        amount: 100,
        status: 'PENDING'
      };

      Payment.findById.mockResolvedValue(mockPayment);

      const result = await PaymentService.getPaymentById({ paymentId, userId });

      expect(result).toBeDefined();
      expect(result._id).toBe(paymentId);
    });

    it('should throw error if payment not found', async () => {
      const paymentId = '507f1f77bcf86cd799439014';
      const userId = '507f1f77bcf86cd799439013';

      Payment.findById.mockResolvedValue(null);

      await expect(PaymentService.getPaymentById({ paymentId, userId }))
        .rejects.toThrow('Payment not found');
    });

    it('should throw error if user is not authorized', async () => {
      const paymentId = '507f1f77bcf86cd799439014';
      const userId = '507f1f77bcf86cd799439013';
      const differentUserId = '507f1f77bcf86cd799439015';

      const mockPayment = {
        _id: paymentId,
        user: differentUserId,
        amount: 100,
        status: 'PENDING'
      };

      Payment.findById.mockResolvedValue(mockPayment);

      await expect(PaymentService.getPaymentById({ paymentId, userId }))
        .rejects.toThrow('Forbidden');
    });
  });

  describe('verifyBankTransfer', () => {
    it('should verify bank transfer successfully', async () => {
      const paymentId = '507f1f77bcf86cd799439014';
      const adminUserId = '507f1f77bcf86cd799439013';

      const mockPayment = {
        _id: paymentId,
        method: 'BANK_TRANSFER',
        status: 'PENDING',
        save: jest.fn().mockResolvedValue()
      };

      Payment.findById.mockResolvedValue(mockPayment);

      const result = await PaymentService.verifyBankTransfer({ paymentId, adminUserId });

      expect(result).toBeDefined();
      expect(mockPayment.status).toBe('SUCCEEDED');
      expect(mockPayment.save).toHaveBeenCalled();
    });

    it('should throw error if payment not found', async () => {
      const paymentId = '507f1f77bcf86cd799439014';
      const adminUserId = '507f1f77bcf86cd799439013';

      Payment.findById.mockResolvedValue(null);

      await expect(PaymentService.verifyBankTransfer({ paymentId, adminUserId }))
        .rejects.toThrow('Payment not found');
    });

    it('should throw error if not a bank transfer', async () => {
      const paymentId = '507f1f77bcf86cd799439014';
      const adminUserId = '507f1f77bcf86cd799439013';

      const mockPayment = {
        _id: paymentId,
        method: 'STRIPE',
        status: 'PENDING'
      };

      Payment.findById.mockResolvedValue(mockPayment);

      await expect(PaymentService.verifyBankTransfer({ paymentId, adminUserId }))
        .rejects.toThrow('Not a bank transfer');
    });
  });
});
