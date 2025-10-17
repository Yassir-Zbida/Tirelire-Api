const KYCService = require('../../../src/services/KYCService');
const { requireKYC, requireAdminForKYC, validateKYCDocument } = require('../../../src/middlewares/kycMiddleware');

// Mock dependencies
jest.mock('../../../src/services/KYCService');

describe('kycMiddleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
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

  describe('requireKYC', () => {
    it('should call next() when user has verified KYC', async () => {
      KYCService.getKYCStatus.mockResolvedValue({
        success: true,
        data: {
          kyc: {
            status: 'VERIFIED',
            verifiedAt: new Date()
          }
        }
      });
      
      await requireKYC(mockReq, mockRes, mockNext);
      
      expect(KYCService.getKYCStatus).toHaveBeenCalledWith(mockReq.user.id);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 403 error when user KYC is not verified', async () => {
      KYCService.getKYCStatus.mockResolvedValue({
        success: true,
        data: {
          kyc: {
            status: 'PENDING',
            verifiedAt: null
          }
        }
      });
      
      await requireKYC(mockReq, mockRes, mockNext);
      
      expect(KYCService.getKYCStatus).toHaveBeenCalledWith(mockReq.user.id);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'KYC verification required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 error when user KYC is rejected', async () => {
      KYCService.getKYCStatus.mockResolvedValue({
        success: true,
        data: {
          kyc: {
            status: 'REJECTED',
            verifiedAt: null
          }
        }
      });
      
      await requireKYC(mockReq, mockRes, mockNext);
      
      expect(KYCService.getKYCStatus).toHaveBeenCalledWith(mockReq.user.id);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'KYC verification required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 error when KYC service fails', async () => {
      KYCService.getKYCStatus.mockRejectedValue(new Error('Service error'));
      
      await requireKYC(mockReq, mockRes, mockNext);
      
      expect(KYCService.getKYCStatus).toHaveBeenCalledWith(mockReq.user.id);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAdminForKYC', () => {
    it('should call next() when user is admin', async () => {
      mockReq.user.role = 'ADMIN';
      
      await requireAdminForKYC(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 403 error when user is not admin', async () => {
      mockReq.user.role = 'PARTICULIER';
      
      await requireAdminForKYC(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Admin access required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validateKYCDocument', () => {
    it('should call next() when valid KYC document is provided', async () => {
      const mockFile = {
        fieldname: 'idCard',
        originalname: 'id.jpg',
        mimetype: 'image/jpeg',
        size: 1024000, // 1MB
        buffer: Buffer.from('fake-image-data')
      };
      
      mockReq.files = { idCard: mockFile };
      
      await validateKYCDocument(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 400 error when no KYC document is provided', async () => {
      mockReq.files = {};
      
      await validateKYCDocument(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'KYC document (ID card) is required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 error when file type is not supported', async () => {
      const mockFile = {
        fieldname: 'idCard',
        originalname: 'id.txt',
        mimetype: 'text/plain',
        size: 1024,
        buffer: Buffer.from('fake-text-data')
      };
      
      mockReq.files = { idCard: mockFile };
      
      await validateKYCDocument(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Only image files (JPEG, PNG) are allowed'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 error when file size is too large', async () => {
      const mockFile = {
        fieldname: 'idCard',
        originalname: 'id.jpg',
        mimetype: 'image/jpeg',
        size: 10 * 1024 * 1024, // 10MB
        buffer: Buffer.from('fake-image-data')
      };
      
      mockReq.files = { idCard: mockFile };
      
      await validateKYCDocument(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'File size too large. Maximum 5MB allowed'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 error when multiple files are provided', async () => {
      const mockFile1 = {
        fieldname: 'idCard',
        originalname: 'id1.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('fake-image-data-1')
      };
      
      const mockFile2 = {
        fieldname: 'idCard',
        originalname: 'id2.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('fake-image-data-2')
      };
      
      mockReq.files = { idCard: [mockFile1, mockFile2] };
      
      await validateKYCDocument(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Only one KYC document is allowed'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
