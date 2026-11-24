const {
  MAX_TYPED_TEXT_LENGTH,
} = require("../config/typing.constants");

function validateStartExam(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      message: "Authenticated user is required.",
    });
  }

  if (!req.params.examCode) {
    return res.status(400).json({
      success: false,
      message: "examCode is required.",
    });
  }

  next();
}

function validateSubmitAttempt(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      message: "Authenticated user is required.",
    });
  }

  if (!req.params.attemptId) {
    return res.status(400).json({
      success: false,
      message: "attemptId is required.",
    });
  }

  const { typedText, submissionId } = req.body;

  if (typeof typedText !== "string") {
    return res.status(400).json({
      success: false,
      message: "typedText must be a string.",
    });
  }

  if (typedText.length > MAX_TYPED_TEXT_LENGTH) {
    return res.status(400).json({
      success: false,
      message: "typedText is too large.",
    });
  }

  if (
    !submissionId ||
    typeof submissionId !== "string" ||
    submissionId.length < 8 ||
    submissionId.length > 200
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid submissionId is required.",
    });
  }

  next();
}

module.exports = {
  validateStartExam,
  validateSubmitAttempt,
};
