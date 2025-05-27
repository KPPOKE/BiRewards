// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Prefer statusCode, then status, then 500
  let status = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = err.message;
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized access';
  } else if (err.name === 'ForbiddenError') {
    status = 403;
    message = 'Forbidden access';
  } else if (err.name === 'NotFoundError') {
    status = 404;
    message = 'Resource not found';
  }

  // Ensure status is a number
  if (typeof status !== 'number' || isNaN(status)) {
    status = 500;
  }

  // Send error response
  res.status(status).json({
    success: false,
    error: {
      message,
      status,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

export default errorHandler; 