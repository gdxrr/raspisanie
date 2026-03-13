"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getHolidayThemeForDate,
  getMaslenitsaDate,
  isHolidayThemeDismissed,
  toIsoDay,
} = require("../src/lib/holidayThemes");

test("returns exact fixed holiday on its date", () => {
  const theme = getHolidayThemeForDate(new Date(2025, 1, 14));
  assert.equal(theme && theme.id, "valentines-day");
});

test("returns holiday inside pre and post windows", () => {
  assert.equal(getHolidayThemeForDate(new Date(2026, 2, 7)).id, "womens-day");
  assert.equal(getHolidayThemeForDate(new Date(2026, 2, 9)).id, "womens-day");
});

test("returns null outside any holiday window", () => {
  assert.equal(getHolidayThemeForDate(new Date(2026, 6, 17)), null);
});

test("uses priority when holiday windows overlap", () => {
  const theme = getHolidayThemeForDate(new Date(2027, 0, 1));
  assert.equal(theme && theme.id, "new-years-eve");
});

test("calculates maslenitsa for several years", () => {
  assert.equal(toIsoDay(getMaslenitsaDate(2026)), "2026-02-16");
  assert.equal(toIsoDay(getMaslenitsaDate(2027)), "2027-03-08");
  assert.equal(toIsoDay(getMaslenitsaDate(2028)), "2028-02-21");
});

test("recognizes dismiss payload only for same holiday and day", () => {
  const payload = JSON.stringify({ holidayId: "womens-day", date: "2026-03-08" });
  assert.equal(isHolidayThemeDismissed("womens-day", new Date(2026, 2, 8), payload), true);
  assert.equal(isHolidayThemeDismissed("womens-day", new Date(2026, 2, 9), payload), false);
  assert.equal(isHolidayThemeDismissed("maslenitsa", new Date(2026, 2, 8), payload), false);
});
