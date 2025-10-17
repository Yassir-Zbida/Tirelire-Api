const Joi = require('joi');
const constants = require('../config/constants');

const messageValidation = {
  /**
   * Validate message creation data
   */
  sendMessage: (req, res, next) => {
    const schema = Joi.object({
      recipientId: Joi.string().optional().messages({
        'string.empty': 'Recipient ID cannot be empty'
      }),
      groupId: Joi.string().optional().messages({
        'string.empty': 'Group ID cannot be empty'
      }),
      content: Joi.string().max(constants.MESSAGING.MAX_MESSAGE_LENGTH).required().messages({
        'string.empty': 'Message content is required',
        'string.max': `Message cannot exceed ${constants.MESSAGING.MAX_MESSAGE_LENGTH} characters`,
        'any.required': 'Message content is required'
      }),
      type: Joi.string().valid(...Object.values(constants.MESSAGING.TYPES)).optional().messages({
        'any.only': `Type must be one of: ${Object.values(constants.MESSAGING.TYPES).join(', ')}`
      }),
      priority: Joi.string().valid(...Object.values(constants.MESSAGING.PRIORITIES)).optional().messages({
        'any.only': `Priority must be one of: ${Object.values(constants.MESSAGING.PRIORITIES).join(', ')}`
      }),
      attachments: Joi.array().items(
        Joi.object({
          filename: Joi.string().required(),
          originalName: Joi.string().required(),
          mimeType: Joi.string().valid(...constants.MESSAGING.ALLOWED_FILE_TYPES).required().messages({
            'any.only': `File type must be one of: ${constants.MESSAGING.ALLOWED_FILE_TYPES.join(', ')}`
          }),
          size: Joi.number().max(constants.MESSAGING.MAX_FILE_SIZE).required().messages({
            'number.max': 'File size cannot exceed 10MB'
          }),
          url: Joi.string().uri().required()
        })
      ).optional(),
      parentMessageId: Joi.string().optional().messages({
        'string.empty': 'Parent message ID cannot be empty'
      }),
      mentions: Joi.array().items(Joi.string()).optional()
    }).custom((value, helpers) => {
      // Either recipientId or groupId must be provided
      if (!value.recipientId && !value.groupId) {
        return helpers.error('custom.eitherRecipientOrGroup');
      }
      if (value.recipientId && value.groupId) {
        return helpers.error('custom.bothRecipientAndGroup');
      }
      return value;
    }).messages({
      'custom.eitherRecipientOrGroup': 'Either recipientId or groupId must be provided',
      'custom.bothRecipientAndGroup': 'Cannot specify both recipientId and groupId'
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    next();
  },

  /**
   * Validate message editing data
   */
  editMessage: (req, res, next) => {
    const schema = Joi.object({
      content: Joi.string().max(constants.MESSAGING.MAX_MESSAGE_LENGTH).required().messages({
        'string.empty': 'Message content is required',
        'string.max': `Message cannot exceed ${constants.MESSAGING.MAX_MESSAGE_LENGTH} characters`,
        'any.required': 'Message content is required'
      })
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    next();
  },

  /**
   * Validate reaction data
   */
  addReaction: (req, res, next) => {
    const schema = Joi.object({
      emoji: Joi.string().max(10).required().messages({
        'string.empty': 'Emoji is required',
        'string.max': 'Emoji cannot exceed 10 characters',
        'any.required': 'Emoji is required'
      })
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    next();
  },

  /**
   * Validate system message data
   */
  sendSystemMessage: (req, res, next) => {
    const schema = Joi.object({
      groupId: Joi.string().required().messages({
        'string.empty': 'Group ID is required',
        'any.required': 'Group ID is required'
      }),
      action: Joi.string().required().messages({
        'string.empty': 'System action is required',
        'any.required': 'System action is required'
      }),
      data: Joi.object().optional(),
      content: Joi.string().max(constants.MESSAGING.MAX_MESSAGE_LENGTH).required().messages({
        'string.empty': 'Message content is required',
        'string.max': `Message cannot exceed ${constants.MESSAGING.MAX_MESSAGE_LENGTH} characters`,
        'any.required': 'Message content is required'
      })
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    next();
  },

  /**
   * Validate announcement data
   */
  sendAnnouncement: (req, res, next) => {
    const schema = Joi.object({
      groupId: Joi.string().required().messages({
        'string.empty': 'Group ID is required',
        'any.required': 'Group ID is required'
      }),
      content: Joi.string().max(constants.MESSAGING.MAX_MESSAGE_LENGTH).required().messages({
        'string.empty': 'Announcement content is required',
        'string.max': `Announcement cannot exceed ${constants.MESSAGING.MAX_MESSAGE_LENGTH} characters`,
        'any.required': 'Announcement content is required'
      }),
      priority: Joi.string().valid(...Object.values(constants.MESSAGING.PRIORITIES)).optional().messages({
        'any.only': `Priority must be one of: ${Object.values(constants.MESSAGING.PRIORITIES).join(', ')}`
      })
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    next();
  },

  /**
   * Validate query parameters for listing messages
   */
  listMessages: (req, res, next) => {
    const schema = Joi.object({
      page: Joi.number().integer().min(1).optional().messages({
        'number.min': 'Page must be at least 1'
      }),
      limit: Joi.number().integer().min(1).max(100).optional().messages({
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      }),
      type: Joi.string().valid(...Object.values(constants.MESSAGING.TYPES)).optional().messages({
        'any.only': `Type must be one of: ${Object.values(constants.MESSAGING.TYPES).join(', ')}`
      }),
      status: Joi.string().valid(...Object.values(constants.MESSAGING.STATUS)).optional().messages({
        'any.only': `Status must be one of: ${Object.values(constants.MESSAGING.STATUS).join(', ')}`
      }),
      groupId: Joi.string().optional(),
      query: Joi.string().optional()
    });

    const { error } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    next();
  },

  /**
   * Validate search parameters
   */
  searchMessages: (req, res, next) => {
    const schema = Joi.object({
      query: Joi.string().min(1).required().messages({
        'string.empty': 'Search query is required',
        'string.min': 'Search query must be at least 1 character',
        'any.required': 'Search query is required'
      }),
      groupId: Joi.string().optional(),
      type: Joi.string().valid(...Object.values(constants.MESSAGING.TYPES)).optional().messages({
        'any.only': `Type must be one of: ${Object.values(constants.MESSAGING.TYPES).join(', ')}`
      }),
      page: Joi.number().integer().min(1).optional().messages({
        'number.min': 'Page must be at least 1'
      }),
      limit: Joi.number().integer().min(1).max(100).optional().messages({
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      })
    });

    const { error } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    next();
  }
};

module.exports = messageValidation;
