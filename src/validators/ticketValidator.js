const Joi = require('joi');
const constants = require('../config/constants');

const ticketValidation = {
  /**
   * Validate ticket creation data
   */
  createTicket: (req, res, next) => {
    const schema = Joi.object({
      title: Joi.string().max(constants.TICKETS.MAX_TITLE_LENGTH).required().messages({
        'string.empty': 'Ticket title is required',
        'string.max': `Title cannot exceed ${constants.TICKETS.MAX_TITLE_LENGTH} characters`,
        'any.required': 'Ticket title is required'
      }),
      description: Joi.string().max(constants.TICKETS.MAX_DESCRIPTION_LENGTH).required().messages({
        'string.empty': 'Ticket description is required',
        'string.max': `Description cannot exceed ${constants.TICKETS.MAX_DESCRIPTION_LENGTH} characters`,
        'any.required': 'Ticket description is required'
      }),
      category: Joi.string().valid(...Object.values(constants.TICKETS.CATEGORIES)).required().messages({
        'any.only': `Category must be one of: ${Object.values(constants.TICKETS.CATEGORIES).join(', ')}`,
        'any.required': 'Ticket category is required'
      }),
      type: Joi.string().valid(...Object.values(constants.TICKETS.TYPES)).optional().messages({
        'any.only': `Type must be one of: ${Object.values(constants.TICKETS.TYPES).join(', ')}`
      }),
      priority: Joi.string().valid(...Object.values(constants.TICKETS.PRIORITIES)).optional().messages({
        'any.only': `Priority must be one of: ${Object.values(constants.TICKETS.PRIORITIES).join(', ')}`
      }),
      relatedGroup: Joi.string().optional().messages({
        'string.empty': 'Related group ID cannot be empty'
      }),
      relatedContribution: Joi.string().optional().messages({
        'string.empty': 'Related contribution ID cannot be empty'
      }),
      relatedPayment: Joi.string().optional().messages({
        'string.empty': 'Related payment ID cannot be empty'
      }),
      attachments: Joi.array().items(
        Joi.object({
          filename: Joi.string().required(),
          originalName: Joi.string().required(),
          mimeType: Joi.string().valid(...constants.TICKETS.ALLOWED_ATTACHMENT_TYPES).required().messages({
            'any.only': `File type must be one of: ${constants.TICKETS.ALLOWED_ATTACHMENT_TYPES.join(', ')}`
          }),
          size: Joi.number().max(constants.TICKETS.MAX_ATTACHMENT_SIZE).required().messages({
            'number.max': 'File size cannot exceed 10MB'
          }),
          url: Joi.string().uri().required()
        })
      ).optional(),
      tags: Joi.array().items(Joi.string().max(50)).optional().messages({
        'string.max': 'Tag cannot exceed 50 characters'
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
   * Validate ticket update data
   */
  updateTicket: (req, res, next) => {
    const schema = Joi.object({
      title: Joi.string().max(constants.TICKETS.MAX_TITLE_LENGTH).optional().messages({
        'string.max': `Title cannot exceed ${constants.TICKETS.MAX_TITLE_LENGTH} characters`
      }),
      description: Joi.string().max(constants.TICKETS.MAX_DESCRIPTION_LENGTH).optional().messages({
        'string.max': `Description cannot exceed ${constants.TICKETS.MAX_DESCRIPTION_LENGTH} characters`
      }),
      tags: Joi.array().items(Joi.string().max(50)).optional().messages({
        'string.max': 'Tag cannot exceed 50 characters'
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
   * Validate comment data
   */
  addComment: (req, res, next) => {
    const schema = Joi.object({
      content: Joi.string().max(2000).required().messages({
        'string.empty': 'Comment content is required',
        'string.max': 'Comment cannot exceed 2000 characters',
        'any.required': 'Comment content is required'
      }),
      isInternal: Joi.boolean().optional().messages({
        'boolean.base': 'isInternal must be a boolean'
      }),
      attachments: Joi.array().items(
        Joi.object({
          filename: Joi.string().required(),
          originalName: Joi.string().required(),
          mimeType: Joi.string().valid(...constants.TICKETS.ALLOWED_ATTACHMENT_TYPES).required().messages({
            'any.only': `File type must be one of: ${constants.TICKETS.ALLOWED_ATTACHMENT_TYPES.join(', ')}`
          }),
          size: Joi.number().max(constants.TICKETS.MAX_ATTACHMENT_SIZE).required().messages({
            'number.max': 'File size cannot exceed 10MB'
          }),
          url: Joi.string().uri().required()
        })
      ).optional()
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
   * Validate status update data
   */
  updateStatus: (req, res, next) => {
    const schema = Joi.object({
      status: Joi.string().valid(...Object.values(constants.TICKETS.STATUS)).required().messages({
        'any.only': `Status must be one of: ${Object.values(constants.TICKETS.STATUS).join(', ')}`,
        'any.required': 'Status is required'
      }),
      reason: Joi.string().max(500).optional().messages({
        'string.max': 'Reason cannot exceed 500 characters'
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
   * Validate ticket assignment data
   */
  assignTicket: (req, res, next) => {
    const schema = Joi.object({
      assignedTo: Joi.string().required().messages({
        'string.empty': 'Assigned user ID is required',
        'any.required': 'Assigned user ID is required'
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
   * Validate escalation data
   */
  escalateTicket: (req, res, next) => {
    const schema = Joi.object({
      reason: Joi.string().max(500).optional().messages({
        'string.max': 'Escalation reason cannot exceed 500 characters'
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
   * Validate ticket closure data
   */
  closeTicket: (req, res, next) => {
    const schema = Joi.object({
      resolution: Joi.string().max(2000).optional().messages({
        'string.max': 'Resolution cannot exceed 2000 characters'
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
   * Validate satisfaction rating data
   */
  addSatisfaction: (req, res, next) => {
    const schema = Joi.object({
      rating: Joi.number().integer().min(1).max(5).required().messages({
        'number.min': 'Rating must be at least 1',
        'number.max': 'Rating cannot exceed 5',
        'any.required': 'Rating is required'
      }),
      feedback: Joi.string().max(1000).optional().messages({
        'string.max': 'Feedback cannot exceed 1000 characters'
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
   * Validate query parameters for listing tickets
   */
  listTickets: (req, res, next) => {
    const schema = Joi.object({
      status: Joi.string().valid(...Object.values(constants.TICKETS.STATUS)).optional().messages({
        'any.only': `Status must be one of: ${Object.values(constants.TICKETS.STATUS).join(', ')}`
      }),
      category: Joi.string().valid(...Object.values(constants.TICKETS.CATEGORIES)).optional().messages({
        'any.only': `Category must be one of: ${Object.values(constants.TICKETS.CATEGORIES).join(', ')}`
      }),
      priority: Joi.string().valid(...Object.values(constants.TICKETS.PRIORITIES)).optional().messages({
        'any.only': `Priority must be one of: ${Object.values(constants.TICKETS.PRIORITIES).join(', ')}`
      }),
      assignedTo: Joi.string().optional(),
      createdBy: Joi.string().optional(),
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
  },

  /**
   * Validate statistics query parameters
   */
  getStatistics: (req, res, next) => {
    const schema = Joi.object({
      assignedTo: Joi.string().optional(),
      createdBy: Joi.string().optional(),
      category: Joi.string().valid(...Object.values(constants.TICKETS.CATEGORIES)).optional().messages({
        'any.only': `Category must be one of: ${Object.values(constants.TICKETS.CATEGORIES).join(', ')}`
      }),
      startDate: Joi.date().optional().messages({
        'date.base': 'Start date must be a valid date'
      }),
      endDate: Joi.date().min(Joi.ref('startDate')).optional().messages({
        'date.base': 'End date must be a valid date',
        'date.min': 'End date must be after start date'
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

module.exports = ticketValidation;
