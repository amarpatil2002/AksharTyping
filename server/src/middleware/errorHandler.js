const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || err.status || 500;

  // Expected client errors: do not log as server crashes.
  if (statusCode < 500) {
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Request failed.",
    });
  }

  // Genuine server errors.
  console.error("SERVER ERROR:", err);

  return res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
};

export default errorHandler;
