import test from 'node:test';
import assert from 'node:assert/strict';

import { getReportEmptyState } from '../lib/report-view.mjs';

test('getReportEmptyState returns no-articles when the selected date has no source articles', () => {
  const state = getReportEmptyState({
    articleCount: 0,
    loading: false,
    hasReport: false,
  });

  assert.equal(state.kind, 'no-articles');
  assert.match(state.title, /暂无可分析文章/);
  assert.match(state.description, /先到「内容」页采集或回填/);
  assert.equal(state.showGenerateAction, false);
});

test('getReportEmptyState returns idle when there are source articles but no report yet', () => {
  const state = getReportEmptyState({
    articleCount: 3,
    loading: false,
    hasReport: false,
  });

  assert.equal(state.kind, 'idle');
  assert.match(state.title, /还没有生成报告/);
  assert.equal(state.showGenerateAction, true);
});
