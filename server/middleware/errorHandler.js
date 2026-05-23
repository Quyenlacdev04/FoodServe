// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      message: 'Dữ liệu không hợp lệ',
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      message: `${field} đã tồn tại trong hệ thống`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Token không hợp lệ'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token đã hết hạn'
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    message: err.message || 'Lỗi server',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 404 handler
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    message: `Route ${req.originalUrl} không tồn tại`
  });
};
