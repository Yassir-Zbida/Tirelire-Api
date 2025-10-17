const authValidator = require('../../../src/validators/authValidator');

describe('Auth Validator', () => {
  describe('registerSchema', () => {
    it('should validate valid registration data', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        phone: '+212612345678',
        nationalId: 'CN12345678',
        dateOfBirth: '1990-01-01',
        address: '123 Main St',
        city: 'Casablanca',
        country: 'Morocco'
      };

      const { error } = authValidator.registerSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        firstName: 'John'
        // Missing other required fields
      };

      const { error } = authValidator.registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('required');
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        phone: '+212612345678',
        nationalId: 'CN12345678'
      };

      const { error } = authValidator.registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('email');
    });

    it('should reject weak password', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: '123', // Too weak
        confirmPassword: '123',
        phone: '+212612345678',
        nationalId: 'CN12345678'
      };

      const { error } = authValidator.registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Password must be at least');
    });

    it('should reject mismatched passwords', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!',
        phone: '+212612345678',
        nationalId: 'CN12345678'
      };

      const { error } = authValidator.registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Passwords do not match');
    });

    it('should reject invalid phone format', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        phone: 'invalid-phone',
        nationalId: 'CN12345678'
      };

      const { error } = authValidator.registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('phone');
    });

    it('should reject invalid national ID format', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        phone: '+212612345678',
        nationalId: 'invalid-id'
      };

      const { error } = authValidator.registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('National ID must be 8-20 alphanumeric characters');
    });
  });

  describe('login', () => {
    it('should validate valid login data', () => {
      const validData = {
        identifier: 'john@example.com',
        password: 'Password123!'
      };

      const { error } = authValidator.loginSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject missing identifier', () => {
      const invalidData = {
        password: 'Password123!'
      };

      const { error } = authValidator.loginSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Email or phone number is required');
    });

    it('should reject missing password', () => {
      const invalidData = {
        identifier: 'john@example.com'
      };

      const { error } = authValidator.loginSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Password is required');
    });

    it('should accept any identifier format', () => {
      const validData = {
        identifier: 'any-identifier',
        password: 'Password123!'
      };

      const { error } = authValidator.loginSchema.validate(validData);
      expect(error).toBeUndefined();
    });
  });

  describe('refreshToken', () => {
    it('should validate valid refresh token data', () => {
      const validData = {
        refreshToken: 'valid-refresh-token'
      };

      const { error } = authValidator.refreshTokenSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject missing refresh token', () => {
      const invalidData = {};

      const { error } = authValidator.refreshTokenSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Refresh token is required');
    });
  });

  describe('updateProfile', () => {
    it('should validate valid profile update data', () => {
      const validData = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+212612345679'
      };

      const { error } = authValidator.updateProfileSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid phone format', () => {
      const invalidData = {
        phone: 'invalid-phone'
      };

      const { error } = authValidator.updateProfileSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('phone');
    });
  });

  describe('changePassword', () => {
    it('should validate valid password change data', () => {
      const validData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };

      const { error } = authValidator.changePasswordSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject missing current password', () => {
      const invalidData = {
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };

      const { error } = authValidator.changePasswordSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Current password is required');
    });

    it('should reject missing new password', () => {
      const invalidData = {
        currentPassword: 'OldPassword123!',
        confirmPassword: 'NewPassword123!'
      };

      const { error } = authValidator.changePasswordSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('New password is required');
    });

    it('should reject weak new password', () => {
      const invalidData = {
        currentPassword: 'OldPassword123!',
        newPassword: '123', // Too weak
        confirmPassword: '123'
      };

      const { error } = authValidator.changePasswordSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('New password must be at least');
    });

    it('should reject mismatched new passwords', () => {
      const invalidData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'DifferentPassword123!'
      };

      const { error } = authValidator.changePasswordSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Passwords do not match');
    });
  });

  describe('forgotPassword', () => {
    it('should validate valid forgot password data', () => {
      const validData = {
        email: 'john@example.com'
      };

      const { error } = authValidator.forgotPasswordSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject missing email', () => {
      const invalidData = {};

      const { error } = authValidator.forgotPasswordSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Email is required');
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email'
      };

      const { error } = authValidator.forgotPasswordSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('email');
    });
  });

  describe('resetPassword', () => {
    it('should validate valid reset password data', () => {
      const validData = {
        token: 'reset-token',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };

      const { error } = authValidator.resetPasswordSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject missing token', () => {
      const invalidData = {
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };

      const { error } = authValidator.resetPasswordSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('token');
    });

    it('should reject missing new password', () => {
      const invalidData = {
        token: 'reset-token',
        confirmPassword: 'NewPassword123!'
      };

      const { error } = authValidator.resetPasswordSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('New password is required');
    });

    it('should reject weak new password', () => {
      const invalidData = {
        token: 'reset-token',
        newPassword: '123', // Too weak
        confirmPassword: '123'
      };

      const { error } = authValidator.resetPasswordSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('New password must be at least');
    });

    it('should reject mismatched new passwords', () => {
      const invalidData = {
        token: 'reset-token',
        newPassword: 'NewPassword123!',
        confirmPassword: 'DifferentPassword123!'
      };

      const { error } = authValidator.resetPasswordSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Passwords do not match');
    });
  });
});
