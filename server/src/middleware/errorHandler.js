export function notFound(req, res) {
  res.status(404).json({ error: { message: 'Route not found', code: 'NOT_FOUND' } });
}

// turn errors into the same json shape
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) {
    console.log('[error]', err.message);
  }
  res.status(status).json({
    error: {
      message: err.message || 'Something went wrong',
      code: err.code || 'SERVER_ERROR'
    }
  });
}
