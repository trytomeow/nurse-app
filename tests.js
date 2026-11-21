(function () {
  "use strict";

  const cases = [
    { factors: ["R2", "R5"], label: "R2 and R5 ticked", expected: "high" },
    { factors: ["R4", "R7"], label: "R4 and R7 ticked", expected: "moderate" },
    { factors: ["R7"], label: "Only R7 ticked", expected: "low" },
    { factors: [], label: "Nothing ticked", expected: "none" },
    { factors: ["R1", "R6", "R7"], label: "R1, R6 and R7 ticked", expected: "high" }
  ];

  const body = document.getElementById("test-results");
  let passed = 0;

  cases.forEach((example) => {
    const actual = calculateRisk(example.factors);
    const success = actual === example.expected;
    if (success) passed += 1;

    const row = document.createElement("tr");
    const selection = document.createElement("th");
    selection.scope = "row";
    selection.textContent = example.label;
    row.append(selection);

    [example.expected, actual].forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    });

    const result = document.createElement("td");
    result.innerHTML = success
      ? '<span class="test-pass">Pass</span>'
      : '<span class="test-fail">Review</span>';
    row.append(result);
    body.append(row);
  });

  const heading = body.closest("table").querySelector("thead tr");
  const resultHeading = document.createElement("th");
  resultHeading.scope = "col";
  resultHeading.textContent = "Result";
  heading.append(resultHeading);

  const summary = document.getElementById("test-summary");
  summary.textContent = `${passed} of ${cases.length} expected answers match calc.js.`;
  summary.classList.add(passed === cases.length ? "summary-pass" : "summary-fail");
})();
