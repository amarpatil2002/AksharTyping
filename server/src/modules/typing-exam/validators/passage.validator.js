const { MAX_TYPED_TEXT_LENGTH } = require("../config/typing.constants");

function validateCreatePassage(req, res, next) {
  const { examId, title, text } = req.body;

  if (!examId) {
    return res.status(400).json({
      success: false,
      message: "examId is required.",
    });
  }

  if (!title || typeof title !== "string" || title.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: "Valid passage title is required.",
    });
  }

  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({
      success: false,
      message: "Passage text is required.",
    });
  }

  if (text.length > MAX_TYPED_TEXT_LENGTH) {
    return res.status(400).json({
      success: false,
      message: "Passage is too large.",
    });
  }

  next();
}

module.exports = { validateCreatePassage };
