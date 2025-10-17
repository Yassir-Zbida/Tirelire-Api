const User = require('../../../src/models/User');
const bcrypt = require('bcryptjs');

// Mock bcrypt
jest.mock('bcryptjs');

describe('User Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('pre-save middleware', () => {
    it('should hash password before saving', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'plainPassword123',
        phone: '+212612345678',
        nationalId: 'CN12345678'
      };

      bcrypt.hash.mockResolvedValue('hashedPassword');

      const user = new User(userData);
      await user.save();

      expect(bcrypt.hash).toHaveBeenCalledWith('plainPassword123', 12);
      expect(user.password).toBe('hashedPassword');
    });

    it('should not hash password if not modified', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'plainPassword123',
        phone: '+212612345678',
        nationalId: 'CN12345678'
      };

      const user = new User(userData);
      user.isModified = jest.fn().mockReturnValue(false);

      await user.save();

      expect(bcrypt.hash).not.toHaveBeenCalled();
    });
  });

  describe('comparePassword method', () => {
    it('should return true for matching passwords', async () => {
      const user = new User({
        password: 'hashedPassword'
      });

      bcrypt.compare.mockResolvedValue(true);

      const result = await user.comparePassword('plainPassword');

      expect(bcrypt.compare).toHaveBeenCalledWith('plainPassword', 'hashedPassword');
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const user = new User({
        password: 'hashedPassword'
      });

      bcrypt.compare.mockResolvedValue(false);

      const result = await user.comparePassword('wrongPassword');

      expect(result).toBe(false);
    });
  });

  describe('isActive getter', () => {
    it('should return true when account is not locked', () => {
      const user = new User({
        isLocked: false,
        lockedUntil: null
      });

      expect(user.isActive).toBe(true);
    });

    it('should return false when account is locked', () => {
      const user = new User({
        isLocked: true,
        lockedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      expect(user.isActive).toBe(false);
    });

    it('should return true when lock has expired', () => {
      const user = new User({
        isLocked: true,
        lockedUntil: new Date(Date.now() - 24 * 60 * 60 * 1000) // Past date
      });

      expect(user.isActive).toBe(true);
    });
  });

  describe('incrementLoginAttempts method', () => {
    it('should increment login attempts', () => {
      const user = new User({
        loginAttempts: 0,
        lockUntil: null
      });

      user.incrementLoginAttempts();

      expect(user.loginAttempts).toBe(1);
    });

    it('should lock account after max attempts', () => {
      const user = new User({
        loginAttempts: 4, // One less than max
        lockUntil: null
      });

      user.incrementLoginAttempts();

      expect(user.loginAttempts).toBe(5);
      expect(user.isLocked).toBe(true);
      expect(user.lockUntil).toBeDefined();
    });
  });

  describe('resetLoginAttempts method', () => {
    it('should reset login attempts and unlock account', () => {
      const user = new User({
        loginAttempts: 5,
        isLocked: true,
        lockUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      user.resetLoginAttempts();

      expect(user.loginAttempts).toBe(0);
      expect(user.isLocked).toBe(false);
      expect(user.lockUntil).toBeUndefined();
    });
  });

  describe('getFullName method', () => {
    it('should return full name', () => {
      const user = new User({
        firstName: 'John',
        lastName: 'Doe'
      });

      expect(user.getFullName()).toBe('John Doe');
    });
  });

  describe('getInitials method', () => {
    it('should return initials', () => {
      const user = new User({
        firstName: 'John',
        lastName: 'Doe'
      });

      expect(user.getInitials()).toBe('JD');
    });
  });

  describe('toJSON method', () => {
    it('should exclude sensitive fields', () => {
      const user = new User({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'hashedPassword',
        nationalId: 'CN12345678',
        kyc: { status: 'PENDING' }
      });

      const json = user.toJSON();

      expect(json.password).toBeUndefined();
      expect(json.nationalId).toBeUndefined();
      expect(json.kyc).toBeUndefined();
      expect(json.firstName).toBe('John');
      expect(json.lastName).toBe('Doe');
      expect(json.email).toBe('john@example.com');
    });
  });

  describe('validation', () => {
    it('should validate required fields', async () => {
      const user = new User({});

      await expect(user.validate()).rejects.toThrow();
    });

    it('should validate email format', async () => {
      const user = new User({
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'password123',
        phone: '+212612345678',
        nationalId: 'CN12345678'
      });

      await expect(user.validate()).rejects.toThrow();
    });

    it('should validate phone format', async () => {
      const user = new User({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: 'invalid-phone',
        nationalId: 'CN12345678'
      });

      await expect(user.validate()).rejects.toThrow();
    });

    it('should validate national ID format', async () => {
      const user = new User({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '+212612345678',
        nationalId: 'invalid-id'
      });

      await expect(user.validate()).rejects.toThrow();
    });
  });

  describe('static methods', () => {
    describe('findByEmail', () => {
      it('should find user by email', async () => {
        const mockUser = {
          _id: '507f1f77bcf86cd799439013',
          email: 'john@example.com'
        };

        User.findOne.mockResolvedValue(mockUser);

        const result = await User.findByEmail('john@example.com');

        expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
        expect(result).toEqual(mockUser);
      });
    });

    describe('findByPhone', () => {
      it('should find user by phone', async () => {
        const mockUser = {
          _id: '507f1f77bcf86cd799439013',
          phone: '+212612345678'
        };

        User.findOne.mockResolvedValue(mockUser);

        const result = await User.findByPhone('+212612345678');

        expect(User.findOne).toHaveBeenCalledWith({ phone: '+212612345678' });
        expect(result).toEqual(mockUser);
      });
    });

    describe('findByNationalId', () => {
      it('should find user by national ID', async () => {
        const mockUser = {
          _id: '507f1f77bcf86cd799439013',
          nationalId: 'CN12345678'
        };

        User.findOne.mockResolvedValue(mockUser);

        const result = await User.findByNationalId('CN12345678');

        expect(User.findOne).toHaveBeenCalledWith({ nationalId: 'CN12345678' });
        expect(result).toEqual(mockUser);
      });
    });
  });
});
