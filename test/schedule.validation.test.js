"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { validateScheduleBody } = require("../src/lib/scheduleValidation");

test("accepts valid schedule array", () => {
  const body = [
    { id: 1, day: "Понедельник", start: "9:30", end: "11:00", type: "lec", subject: "Матан", room: "101", teacher: "Иванов", week: "both" },
  ];
  const result = validateScheduleBody(body);
  assert.equal(result.valid, true);
  assert.equal(result.error, undefined);
});

test("rejects non-array body", () => {
  const result = validateScheduleBody({});
  assert.ok(result.error);
  assert.equal(result.error.status, 400);
  assert.equal(result.error.code, "validation_error");
});

test("rejects invalid day name", () => {
  const result = validateScheduleBody([
    { id: 1, day: "Monday", start: "9:30", end: "11:00", type: "lec", subject: "X", room: "", teacher: "", week: "both" },
  ]);
  assert.ok(result.error);
  assert.equal(result.error.details.fields.length, 1);
  assert.ok(result.error.details.fields[0].includes("day"));
});

test("rejects invalid type", () => {
  const result = validateScheduleBody([
    { id: 1, day: "Понедельник", start: "9:30", end: "11:00", type: "seminar", subject: "X", room: "", teacher: "", week: "both" },
  ]);
  assert.ok(result.error);
  assert.ok(result.error.details.fields.some((f) => f.includes("type")));
});

test("rejects invalid id", () => {
  const result = validateScheduleBody([
    { id: "x", day: "Понедельник", start: "9:30", end: "11:00", type: "lec", subject: "X", room: "", teacher: "", week: "both" },
  ]);
  assert.ok(result.error);
  assert.ok(result.error.details.fields.some((f) => f.includes("id")));
});

test("rejects invalid time format", () => {
  const result = validateScheduleBody([
    { id: 1, day: "Понедельник", start: "9:30:00", end: "11:00", type: "lec", subject: "X", room: "", teacher: "", week: "both" },
  ]);
  assert.ok(result.error);
  assert.ok(result.error.details.fields.some((f) => f.includes("start")));
});

test("accepts empty array", () => {
  const result = validateScheduleBody([]);
  assert.equal(result.valid, true);
});
