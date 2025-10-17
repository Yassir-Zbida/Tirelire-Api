const { requireRole, requireAdmin, requireParticulier } = require('../../../src/middlewares/roleMiddleware');

describe('roleMiddleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      user: { id: '507f1f77bcf86cd799439011' }
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('requireRole', () => {
    it('should call next() when user has required role', async () => {
      mockReq.user.role = 'ADMIN';
      
      const middleware = requireRole('ADMIN');
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 403 error when user does not have required role', async () => {
      mockReq.user.role = 'PARTICULIER';
      
      const middleware = requireRole('ADMIN');
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 error when user role is undefined', async () => {
      mockReq.user.role = undefined;
      
      const middleware = requireRole('ADMIN');
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should work with multiple roles', async () => {
      mockReq.user.role = 'ADMIN';
      
      const middleware = requireRole(['ADMIN', 'MODERATOR']);
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 403 error when user role is not in allowed roles', async () => {
      mockReq.user.role = 'PARTICULIER';
      
      const middleware = requireRole(['ADMIN', 'MODERATOR']);
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should call next() when user is admin', async () => {
      mockReq.user.role = 'ADMIN';
      
      await requireAdmin(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 403 error when user is not admin', async () => {
      mockReq.user.role = 'PARTICULIER';
      
      await requireAdmin(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Admin access required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 error when user role is undefined', async () => {
      mockReq.user.role = undefined;
      
      await requireAdmin(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Admin access required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireParticulier', () => {
    it('should call next() when user is particulier', async () => {
      mockReq.user.role = 'PARTICULIER';
      
      await requireParticulier(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 403 error when user is not particulier', async () => {
      mockReq.user.role = 'ADMIN';
      
      await requireParticulier(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Particulier access required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 error when user role is undefined', async () => {
      mockReq.user.role = undefined;
      
      await requireParticulier(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Particulier access required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when user is not authenticated', () => {
    it('should return 401 error when user is not present', async () => {
      mockReq.user = null;
      
      const middleware = requireRole('ADMIN');
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 error when user is undefined', async () => {
      mockReq.user = undefined;
      
      const middleware = requireRole('ADMIN');
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
