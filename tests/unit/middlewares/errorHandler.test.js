const errorHandler = require('../../../src/middlewares/errorHandler');

describe('errorHandler', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      url: '/api/test',
      ip: '127.0.0.1',
      user: { id: '507f1f77bcf86cd799439011' }
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('when error has status code', () => {
    it('should return error with status code', () => {
      const error = new Error('Validation failed');
      error.statusCode = 400;
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });
  });

  describe('when error is a validation error', () => {
    it('should return 400 error for Joi validation error', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';
      error.details = [
        { message: 'Email is required' },
        { message: 'Password must be at least 6 characters' }
      ];
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: ['Email is required', 'Password must be at least 6 characters'],
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });
  });

  describe('when error is a JWT error', () => {
    it('should return 401 error for JWT errors', () => {
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });

    it('should return 401 error for JWT expired error', () => {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token expired',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });
  });

  describe('when error is a MongoDB error', () => {
    it('should return 400 error for duplicate key error', () => {
      const error = new Error('Duplicate key error');
      error.name = 'MongoError';
      error.code = 11000;
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Duplicate field value',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });

    it('should return 400 error for cast error', () => {
      const error = new Error('Cast to ObjectId failed');
      error.name = 'CastError';
      error.kind = 'ObjectId';
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid ID format',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });
  });

  describe('when error is a multer error', () => {
    it('should return 400 error for file size limit exceeded', () => {
      const error = new Error('File too large');
      error.code = 'LIMIT_FILE_SIZE';
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'File size too large',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });

    it('should return 400 error for file count limit exceeded', () => {
      const error = new Error('Too many files');
      error.code = 'LIMIT_FILE_COUNT';
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Too many files',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });
  });

  describe('when error is a rate limit error', () => {
    it('should return 429 error for rate limit exceeded', () => {
      const error = new Error('Too many requests');
      error.statusCode = 429;
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Too many requests',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });
  });

  describe('when error is unknown', () => {
    it('should return 500 error for unknown errors', () => {
      const error = new Error('Unknown error');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });
  });

  describe('when error has no message', () => {
    it('should return default message', () => {
      const error = new Error();
      error.statusCode = 400;
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Something went wrong',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });
  });

  describe('when error is not an Error object', () => {
    it('should handle non-Error objects', () => {
      const error = 'String error';
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error'
      });
    });
  });

  describe('when error is null or undefined', () => {
    it('should handle null errors', () => {
      errorHandler(null, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error'
      });
    });

    it('should handle undefined errors', () => {
      errorHandler(undefined, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error'
      });
    });
  });
});
