(function (root) {
  "use strict";

  // The single source of truth for the paper form's highest-risk-factor rule.
  function calculateRisk(selectedFactors) {
    const factors = new Set(Array.isArray(selectedFactors) ? selectedFactors : []);

    if (["R1", "R2", "R3"].some((factor) => factors.has(factor))) return "high";
    if (["R4", "R5", "R6"].some((factor) => factors.has(factor))) return "moderate";
    if (factors.has("R7")) return "low";
    return "none";
  }

  root.calculateRisk = calculateRisk;
  if (typeof module !== "undefined" && module.exports) module.exports = { calculateRisk };
})(typeof globalThis !== "undefined" ? globalThis : window);
