import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildReportDateOptions,
  pickDefaultReportDate,
} from '../lib/report-view.mjs';

test('buildReportDateOptions returns unique dates sorted descending', () => {
  const dates = buildReportDateOptions([
    { date: '2026-04-01T09:00:00.000Z' },
    { date: '2026-04-01T10:00:00.000Z' },
    { date: '2026-03-30T09:00:00.000Z' },
  ], new Date('2026-04-02T00:00:00.000Z'));

  assert.deepEqual(dates, ['2026-04-01', '2026-03-30']);
});

test('buildReportDateOptions falls back to today when there are no articles', () => {
  const dates = buildReportDateOptions([], new Date('2026-04-02T08:00:00.000Z'));

  assert.deepEqual(dates, ['2026-04-02']);
});

test('pickDefaultReportDate prefers the latest article date', () => {
  const selected = pickDefaultReportDate([
    { date: '2026-03-30T09:00:00.000Z' },
    { date: '2026-04-01T09:00:00.000Z' },
  ], new Date('2026-04-02T08:00:00.000Z'));

  assert.equal(selected, '2026-04-01');
});
