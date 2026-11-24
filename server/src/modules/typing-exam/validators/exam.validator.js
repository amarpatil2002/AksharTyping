const { getTypingRule } = require("../rules/typing.rules");

function validateCreateExam(req, res, next) {
  const { name, code, policyId } = req.body;

  if (!name || typeof name !== "string" || name.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: "Valid exam name is required.",
    });
  }

  if (
    !code ||
    typeof code !== "string" ||
    !/^[A-Za-z0-9_]+$/.test(code.trim())
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid exam code is required.",
    });
  }

  if (!policyId || typeof policyId !== "string") {
    return res.status(400).json({
      success: false,
      message: "policyId is required.",
    });
  }

  try {
    getTypingRule(policyId);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next();
}

module.exports = { validateCreateExam };
