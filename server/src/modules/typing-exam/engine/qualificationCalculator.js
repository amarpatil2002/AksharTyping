export function calculateQualification({
  metrics,
  rules = {},
  errorAllowance = {},
}) {
  if (!metrics || typeof metrics !== "object")
    throw new Error("Qualification metrics are required");
  const checks = [];

  const add = (
    name,
    actual,
    threshold,
    operator,
    enabled = threshold != null,
  ) => {
    if (!enabled) return;
    const passed =
      actual != null &&
      Number.isFinite(actual) &&
      (operator === "GTE" ? actual >= threshold : actual <= threshold);
    checks.push({
      metric: name,
      actual: actual ?? null,
      threshold,
      operator,
      passed,
    });
  };

  add("minimumSpeed", metrics.netSpeed, rules.minimumSpeed, "GTE");
  add("minimumAccuracy", metrics.accuracy, rules.minimumAccuracy, "GTE");
  add(
    "maximumErrorPercentage",
    metrics.errorPercentage,
    rules.maximumErrorPercentage,
    "LTE",
  );
  add("minimumMarks", metrics.marksObtained, rules.minimumMarks, "GTE");

  if (errorAllowance.enabled && errorAllowance.maximumPercentage != null) {
    add(
      "errorAllowance",
      metrics.errorPercentage,
      errorAllowance.maximumPercentage,
      "LTE",
      true,
    );
  }

  const required = rules.required !== false;
  if (!required || checks.length === 0) {
    return {
      qualified: null,
      status: "NOT_APPLICABLE",
      checks,
      passedRules: 0,
      failedRules: 0,
    };
  }
  const passedRules = checks.filter((x) => x.passed).length;
  const failedRules = checks.length - passedRules;
  const qualified = failedRules === 0;
  return {
    qualified,
    status: qualified ? "PASS" : "FAIL",
    checks,
    passedRules,
    failedRules,
  };
}
