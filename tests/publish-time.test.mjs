import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizePublishTimeValue,
  publishTimeToDateKey,
} from '../lib/publish-time.mjs';

test('publishTimeToDateKey supports standard datetime strings', () => {
  assert.equal(publishTimeToDateKey('2026-04-01 08:30:00'), '2026-04-01');
});

test('publishTimeToDateKey supports unix timestamp strings', () => {
  assert.equal(publishTimeToDateKey('1774990200.0'), '2026-03-31');
});

test('normalizePublishTimeValue converts unix timestamp strings to ISO strings', () => {
  const normalized = normalizePublishTimeValue('1774689652.0');
  const parsed = new Date(normalized);

  assert.equal(Number.isNaN(parsed.getTime()), false);
  assert.equal(parsed.getUTCFullYear(), 2026);
  assert.equal(parsed.getUTCMonth(), 2);
});
