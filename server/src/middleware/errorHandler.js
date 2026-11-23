const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists.",
      ...(field && { field }),
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Database validation failed.",
      errors: Object.values(err.errors || {}).map(({ path, message }) => ({ field: path, message })),
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid resource identifier." });
  }

  const statusCode = Number(err.statusCode || err.status) || 500;

  // Expected client errors: do not log as server crashes.
  if (statusCode < 500) {
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Request failed.",
      ...(err.code && { code: err.code }),
      ...(err.details !== undefined && { details: err.details }),
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
