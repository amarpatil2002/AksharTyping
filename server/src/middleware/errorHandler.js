export function errorHandler(error, req, res, next) {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(500).json({ message: "An unexpected server error occurred." });
}
