const authService = require('../services/authService');

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const data = await authService.register(req.body);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { accessToken, refreshToken, user } = await authService.login(req.body);

    setRefreshCookie(res, refreshToken);

    res.json({
      success: true,
      message: 'Login successful',
      token: accessToken,
      accessToken,
      refreshToken,
      user
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/add-hr (Admin only)
exports.addHR = async (req, res, next) => {
  try {
    const data = await authService.addHR(req.body);
    res.status(201).json({
      success: true,
      message: 'HR account created successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh
exports.refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const { accessToken, user } = await authService.refreshAccessToken(token);

    res.json({
      success: true,
      token: accessToken,
      accessToken,
      user
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
exports.logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    await authService.logout(token);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};