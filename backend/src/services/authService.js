const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

// Helper to generate access token (15 mins)
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

// Helper to generate refresh token (7 days)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

// Helper to persist refresh token
const saveRefreshToken = async (userId, token) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({
    user_id: userId,
    token,
    expires_at: expiresAt
  });
};

class AuthService {
  /**
   * Public registration - ALWAYS creates an employee.
   * Prevents privilege escalation to admin/hr.
   */
  async register({ email, password }) {
    if (!email || !password) {
      const err = new Error('Email and password are required');
      err.statusCode = 400;
      throw err;
    }

    if (password.length < 6) {
      const err = new Error('Password must be at least 6 characters');
      err.statusCode = 400;
      throw err;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const err = new Error('User already exists with this email');
      err.statusCode = 400;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Security: Forced to 'employee' for public registration
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'employee'
    });

    return {
      id: user._id,
      email: user.email,
      role: user.role
    };
  }

  /**
   * Admin-only: Create an HR manager account
   */
  async addHR({ email, password }) {
    if (!email || !password) {
      const err = new Error('Email and password are required');
      err.statusCode = 400;
      throw err;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const err = new Error('Email already in use');
      err.statusCode = 400;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'hr'
    });

    return {
      id: user._id,
      email: user.email,
      role: user.role
    };
  }

  /**
   * User login
   */
  async login({ email, password }) {
    if (!email || !password) {
      const err = new Error('Email and password are required');
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.is_active) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    user.last_login = new Date();
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await saveRefreshToken(user._id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    };
  }

  /**
   * Rotate access token using valid refresh token
   */
  async refreshAccessToken(token) {
    if (!token) {
      const err = new Error('No refresh token provided');
      err.statusCode = 401;
      throw err;
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      const err = new Error('Invalid or expired refresh token');
      err.statusCode = 401;
      throw err;
    }

    const storedToken = await RefreshToken.findOne({
      token,
      is_revoked: false
    });

    if (!storedToken) {
      const err = new Error('Refresh token not found or revoked');
      err.statusCode = 401;
      throw err;
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.is_active) {
      const err = new Error('User not found or deactivated');
      err.statusCode = 401;
      throw err;
    }

    const newAccessToken = generateAccessToken(user);

    return {
      accessToken: newAccessToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    };
  }

  /**
   * Revoke refresh token on logout
   */
  async logout(token) {
    if (token) {
      await RefreshToken.findOneAndUpdate(
        { token },
        { is_revoked: true }
      );
    }
    return true;
  }

  /**
   * Get current authenticated user
   */
  async getMe(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    return user;
  }
}

module.exports = new AuthService();
