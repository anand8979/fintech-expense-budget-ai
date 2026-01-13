import User from '../models/User.js';
import { generateToken, generateRefreshToken } from '../config/jwt.js';
import { initializeDefaultCategories } from './category.controller.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, currency } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      currency: currency || 'USD',
    });

    // Initialize default categories for new user
    await initializeDefaultCategories(user._id);

    // Get user role (default to 'user' for backward compatibility)
    const userRole = user.role || 'user';

    // Generate tokens
    const token = generateToken(user._id, userRole);
    const refreshToken = generateRefreshToken(user._id, userRole);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          currency: user.currency,
          role: userRole,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Get user role (default to 'user' for backward compatibility)
    const userRole = user.role || 'user';

    // Generate tokens
    const token = generateToken(user._id, userRole);
    const refreshToken = generateRefreshToken(user._id, userRole);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          currency: user.currency,
          role: userRole,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    const { verifyRefreshToken } = await import('../config/jwt.js');
    const decoded = verifyRefreshToken(refreshToken);

    // Get role from decoded token or fetch from user (for backward compatibility)
    let userRole = decoded.role || 'user';
    if (!decoded.role) {
      const User = (await import('../models/User.js')).default;
      const user = await User.findById(decoded.userId);
      if (user) {
        userRole = user.role || 'user';
      }
    }

    // Generate new tokens
    const token = generateToken(decoded.userId, userRole);
    const newRefreshToken = generateRefreshToken(decoded.userId, userRole);

    res.json({
      success: true,
      data: {
        token,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get user role (default to 'user' for backward compatibility)
    const userRole = user.role || 'user';

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          currency: user.currency,
          role: userRole,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
