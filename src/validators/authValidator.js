const Joi = require('joi');
const constants = require('../config/constants');

/**
 * User registration validation schema
 */
const registerSchema = Joi.object({
  firstName: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .required()
    .messages({
      'string.empty': 'First name is required',
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required'
    }),
  
  lastName: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .required()
    .messages({
      'string.empty': 'Last name is required',
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required'
    }),
  
  nationalId: Joi.string()
    .pattern(/^[A-Z0-9]{8,20}$/)
    .required()
    .messages({
      'string.empty': 'National ID is required',
      'string.pattern.base': 'National ID must be 8-20 alphanumeric characters',
      'any.required': 'National ID is required'
    }),
  
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .optional()
    .allow(null, '')
    .messages({
      'string.email': 'Please provide a valid email address'
    }),
  
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  
  password: Joi.string()
    .min(constants.PASSWORD.MIN_LENGTH)
    .max(constants.PASSWORD.MAX_LENGTH)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': `Password must be at least ${constants.PASSWORD.MIN_LENGTH} characters long`,
      'string.max': `Password cannot exceed ${constants.PASSWORD.MAX_LENGTH} characters`,
      'any.required': 'Password is required'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    }),
  
  dateOfBirth: Joi.date()
    .max('now')
    .optional()
    .messages({
      'date.max': 'Date of birth cannot be in the future'
    }),
  
  address: Joi.string()
    .max(200)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Address cannot exceed 200 characters'
    }),
  
  city: Joi.string()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'City cannot exceed 50 characters'
    }),
  
  country: Joi.string()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Country cannot exceed 50 characters'
    })
});

/**
 * User login validation schema
 */
const loginSchema = Joi.object({
  identifier: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Email or phone number is required',
      'any.required': 'Email or phone number is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    })
});

/**
 * Refresh token validation schema
 */
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'string.empty': 'Refresh token is required',
      'any.required': 'Refresh token is required'
    })
});

/**
 * Change password validation schema
 */
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'string.empty': 'Current password is required',
      'any.required': 'Current password is required'
    }),
  
  newPassword: Joi.string()
    .min(constants.PASSWORD.MIN_LENGTH)
    .max(constants.PASSWORD.MAX_LENGTH)
    .required()
    .messages({
      'string.empty': 'New password is required',
      'string.min': `New password must be at least ${constants.PASSWORD.MIN_LENGTH} characters long`,
      'string.max': `New password cannot exceed ${constants.PASSWORD.MAX_LENGTH} characters`,
      'any.required': 'New password is required'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    })
});

/**
 * Update profile validation schema
 */
const updateProfileSchema = Joi.object({
  firstName: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .optional()
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters'
    }),
  
  lastName: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .optional()
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters'
    }),
  
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .optional()
    .allow(null, '')
    .messages({
      'string.email': 'Please provide a valid email address'
    }),
  
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    })
});

/**
 * Forgot password validation schema
 */
const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
});

/**
 * Reset password validation schema
 */
const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Reset token is required'
    }),
  
  newPassword: Joi.string()
    .min(constants.PASSWORD.MIN_LENGTH)
    .max(constants.PASSWORD.MAX_LENGTH)
    .required()
    .messages({
      'string.empty': 'New password is required',
      'string.min': `New password must be at least ${constants.PASSWORD.MIN_LENGTH} characters long`,
      'string.max': `New password cannot exceed ${constants.PASSWORD.MAX_LENGTH} characters`,
      'any.required': 'New password is required'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    })
});

/**
 * KYC verification validation schema
 */
const kycVerificationSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(constants.KYC_STATUS))
    .required()
    .messages({
      'any.only': `Status must be one of: ${Object.values(constants.KYC_STATUS).join(', ')}`,
      'any.required': 'Status is required'
    }),
  
  faceMatchScore: Joi.number()
    .min(0)
    .max(100)
    .optional()
    .messages({
      'number.min': 'Face match score cannot be negative',
      'number.max': 'Face match score cannot exceed 100'
    }),
  
  rejectionReason: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Rejection reason cannot exceed 500 characters'
    })
});

/**
 * Validation middleware factory
 * @param {Object} schema - Joi schema
 * @param {string} property - Request property to validate (body, query, params)
 * @returns {Function} - Express middleware
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors
      });
    }

    // Replace the original property with the validated and sanitized value
    req[property] = value;
    next();
  };
};

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  kycVerificationSchema,
  validate
};
