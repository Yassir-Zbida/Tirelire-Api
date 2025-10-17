const mongoose = require('mongoose');
const crypto = require('crypto');
const constants = require('../config/constants');

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // TTL index
  },
  isRevoked: {
    type: Boolean,
    default: false,
    index: true
  },
  deviceInfo: {
    userAgent: String,
    ipAddress: String,
    deviceType: {
      type: String,
      enum: ['mobile', 'desktop', 'tablet', 'unknown'],
      default: 'unknown'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  revokedAt: {
    type: Date
  },
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  revokedReason: {
    type: String,
    enum: ['logout', 'security', 'expired', 'manual'],
    default: 'logout'
  }
}, {
  timestamps: true
});

// Indexes for better performance
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });
refreshTokenSchema.index({ token: 1, isRevoked: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to generate a new refresh token
refreshTokenSchema.statics.generateToken = function() {
  return crypto.randomBytes(64).toString('hex');
};

// Static method to create a new refresh token for a user
refreshTokenSchema.statics.createToken = async function(userId, deviceInfo = {}) {
  const token = this.generateToken();
  const expiresAt = new Date(Date.now() + this.getTokenExpirationTime());
  
  const refreshToken = new this({
    token,
    userId,
    expiresAt,
    deviceInfo
  });
  
  return await refreshToken.save();
};

// Static method to get token expiration time
refreshTokenSchema.statics.getTokenExpirationTime = function() {
  // Parse the REFRESH_TOKEN_EXPIRES_IN from constants
  const expiresIn = constants.JWT.REFRESH_EXPIRES_IN;
  
  if (expiresIn.endsWith('d')) {
    return parseInt(expiresIn) * 24 * 60 * 60 * 1000; // days to milliseconds
  } else if (expiresIn.endsWith('h')) {
    return parseInt(expiresIn) * 60 * 60 * 1000; // hours to milliseconds
  } else if (expiresIn.endsWith('m')) {
    return parseInt(expiresIn) * 60 * 1000; // minutes to milliseconds
  } else {
    return 7 * 24 * 60 * 60 * 1000; // default 7 days
  }
};

// Static method to find a valid token
refreshTokenSchema.statics.findValidToken = function(token) {
  return this.findOne({
    token,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  }).populate('userId', 'firstName lastName email role isActive');
};

// Static method to revoke a specific token
refreshTokenSchema.statics.revokeToken = function(token, revokedBy = null, reason = 'logout') {
  return this.findOneAndUpdate(
    { token },
    {
      isRevoked: true,
      revokedAt: new Date(),
      revokedBy,
      revokedReason: reason
    },
    { new: true }
  );
};

// Static method to revoke all tokens for a user
refreshTokenSchema.statics.revokeAllUserTokens = function(userId, revokedBy = null, reason = 'security') {
  return this.updateMany(
    { userId, isRevoked: false },
    {
      isRevoked: true,
      revokedAt: new Date(),
      revokedBy,
      revokedReason: reason
    }
  );
};

// Static method to clean up expired tokens
refreshTokenSchema.statics.cleanupExpiredTokens = function() {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isRevoked: true, revokedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } // 30 days ago
    ]
  });
};

// Static method to get active tokens for a user
refreshTokenSchema.statics.getUserActiveTokens = function(userId) {
  return this.find({
    userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  }).select('token deviceInfo createdAt expiresAt');
};

// Instance method to check if token is valid
refreshTokenSchema.methods.isValid = function() {
  return !this.isRevoked && this.expiresAt > new Date();
};

// Instance method to revoke this token
refreshTokenSchema.methods.revoke = function(revokedBy = null, reason = 'logout') {
  this.isRevoked = true;
  this.revokedAt = new Date();
  this.revokedBy = revokedBy;
  this.revokedReason = reason;
  return this.save();
};

// Pre-save middleware to set device type
refreshTokenSchema.pre('save', function(next) {
  if (this.deviceInfo && this.deviceInfo.userAgent) {
    const userAgent = this.deviceInfo.userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
      this.deviceInfo.deviceType = 'mobile';
    } else if (/tablet|ipad|android(?!.*mobile)/i.test(userAgent)) {
      this.deviceInfo.deviceType = 'tablet';
    } else if (/desktop|windows|macintosh|linux/i.test(userAgent)) {
      this.deviceInfo.deviceType = 'desktop';
    } else {
      this.deviceInfo.deviceType = 'unknown';
    }
  }
  
  next();
});

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
