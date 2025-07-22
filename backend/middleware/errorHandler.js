// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Handle path-to-regexp errors
  if (err.message && err.message.includes('Missing parameter name')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid route parameter',
      details: err.message
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};