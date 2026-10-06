const mongoose = require('mongoose');

// 404 for unknown API routes
const notFound = (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return res
      .status(404)
      .json({ success: false, message: `API route not found: ${req.method} ${req.originalUrl}` });
  }
  next();
};

// Central error handler — always responds with JSON
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong on our servers';
  let errors = err.errors;

  if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = 'Validation failed';
    errors = Object.fromEntries(
      Object.entries(err.errors).map(([k, v]) => [k, v.message])
    );
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    message = 'That value is already in use';
    const field = Object.keys(err.keyValue || {})[0];
    if (field) {
      message = `An account with this ${field} already exists`;
      errors = { [field]: message };
    }
  }

  if (status >= 500) {
    console.error('✖ Error:', err.stack || err);
  }

  res.status(status).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
};

module.exports = { notFound, errorHandler };
