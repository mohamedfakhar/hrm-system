const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

// Generate Access Token
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

//  Generate Refresh Token  
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

//  Save Refresh Token in DB 
const saveRefreshToken = async (userId, token) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); 

  await RefreshToken.create({
    user_id: userId,
    token: token,
    expires_at: expiresAt
  });
};

//  Set Refresh Token Cookie 
const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,   
    secure:   false,  
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000 
  });
};

// REGISTER
exports.register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check email not used before
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      role: role || 'employee'
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { id: user._id, email: user.email, role: user.role }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Generate both tokens
    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token in DB
    await saveRefreshToken(user._id, refreshToken);

    // Send refresh token in httpOnly cookie
    setRefreshCookie(res, refreshToken);

    // Send access token in response body
    res.json({
      success: true,
      message: 'Login successful',
      token: accessToken,    
      user: {
        id:    user._id,
        email: user.email,
        role:  user.role
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  HR (Admin only)

exports.addHR = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check email not used
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create HR user (role = 'hr')
    const user = await User.create({
      email,
      password: hashedPassword,
      role: 'hr'
    });

    res.status(201).json({
      success: true,
      message: 'HR account created successfully',
      data: { id: user._id, email: user.email, role: user.role }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// REFRESH TOKEN 
exports.refreshToken = async (req, res) => {
  try {
    //  Get refresh token from cookie
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token'
      });
    }

    //  Verify the token is valid 
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    //  Check token exists in DB and not revoked
    const storedToken = await RefreshToken.findOne({
      token,
      is_revoked: false
    });

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found or revoked'
      });
    }

    //  Get the user
    const user = await User.findById(decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'User not found or deactivated'
      });
    }

    //  Generate new access token
    const newAccessToken = generateAccessToken(user);

    //  Return new access token
    res.json({
      success: true,
      token: newAccessToken,
      user: {
        id: user._id,
        email: user.email,
        role:  user.role
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// LOGOUT 
exports.logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (token) {
      // Revoke the refresh token in DB
      await RefreshToken.findOneAndUpdate(
        { token },
        { is_revoked: true }
      );
    }

    // Clear the cookie
    res.clearCookie('refreshToken');

    res.json({ success: true, message: 'Logged out successfully' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// GET ME

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({ success: true, data: user });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};