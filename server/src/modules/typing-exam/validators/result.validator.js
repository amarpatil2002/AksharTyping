function validateResultId(req, res, next) {
  if (!req.params.resultId) {
    return res.status(400).json({
      success: false,
      message: "resultId is required.",
    });
  }

  next();
}

module.exports = { validateResultId };
