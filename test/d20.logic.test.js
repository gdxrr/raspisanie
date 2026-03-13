"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  clampModifierValue,
  computeModifierTotal,
  evaluateD20Outcome,
} = require("../src/lib/d20");

test("computeModifierTotal sums enabled buffs and debuffs", () => {
  const total = computeModifierTotal([
    { value: 2, enabled: true },
    { value: -3, enabled: true },
    { value: 5, enabled: false },
    { value: 1, enabled: true },
  ]);
  assert.equal(total, 0);
});

test("natural 20 and natural 1 have priority over DC and modifiers", () => {
  const critSuccess = evaluateD20Outcome(20, -20, 30);
  assert.equal(critSuccess.code, "critical_success");
  assert.equal(critSuccess.isSuccess, true);
  assert.equal(critSuccess.isCritical, true);

  const critFail = evaluateD20Outcome(1, 20, 5);
  assert.equal(critFail.code, "critical_fail");
  assert.equal(critFail.isSuccess, false);
  assert.equal(critFail.isCritical, true);
});

test("outcome classification uses DC thresholds", () => {
  assert.equal(evaluateD20Outcome(12, 8, 15).code, "strong_success");
  assert.equal(evaluateD20Outcome(10, 5, 15).code, "success");
  assert.equal(evaluateD20Outcome(8, 3, 15).code, "near_miss");
  assert.equal(evaluateD20Outcome(3, 1, 15).code, "fail");
});

test("modifier clamping handles boundaries and out-of-range values", () => {
  assert.equal(clampModifierValue(-20), -20);
  assert.equal(clampModifierValue(20), 20);
  assert.equal(clampModifierValue(-21), -20);
  assert.equal(clampModifierValue(21), 20);
});
