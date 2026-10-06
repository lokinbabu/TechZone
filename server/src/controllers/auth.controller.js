const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { asyncHandler } = require('../utils/asyncHandler');
const { validateRegister, validateLogin } = require('../utils/validation');

// Normalize JWT_EXPIRES_IN: a bare number is treated as days ("7" → "7d"),
// avoiding jsonwebtoken's millisecond interpretation of numeric strings.
const resolveExpiresIn = () => {
  const raw = process.env.JWT_EXPIRES_IN;
  if (!raw) return '7d';
  return /^\d+$/.test(raw.trim()) ? `${raw.trim()}d` : raw.trim();
};

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: resolveExpiresIn(),
  });

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const error = validateRegister(req.body || {});
  if (error) return res.status(400).json({ success: false, message: error });

  const { name, email, password } = req.body;
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res
      .status(409)
      .json({ success: false, message: 'An account with this email already exists' });
  }

  const user = await User.create({ name: name.trim(), email, password });
  res.status(201).json({
    success: true,
    user: user.toSafeJSON(),
    token: generateToken(user._id),
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const error = validateLogin(req.body || {});
  if (error) return res.status(400).json({ success: false, message: error });

  const { email, password } = req.body;
  // password has select:false, so request it explicitly
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  res.json({
    success: true,
    user: user.toSafeJSON(),
    token: generateToken(user._id),
  });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeJSON() });
});

module.exports = { register, login, getMe };
