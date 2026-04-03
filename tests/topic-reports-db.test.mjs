import test from 'node:test';
import assert from 'node:assert/strict';

import Database from 'better-sqlite3';

import {
  getArticleAiAnalysis,
  getTopicReport,
  initializeDatabase,
  saveArticleAiAnalysis,
  saveTopicReport,
} from '../lib/content-monitor-db.mjs';

function createDb() {
  const db = new Database(':memory:');
  initializeDatabase(db);
  return db;
}

test('initializeDatabase creates ai analysis and topic report tables', () => {
  const db = createDb();

  const tableNames = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
    ORDER BY name ASC
  `).all().map((row) => row.name);

  assert.equal(tableNames.includes('article_ai_analysis'), true);
  assert.equal(tableNames.includes('topic_reports'), true);
});

test('saveArticleAiAnalysis persists and reloads structured article analysis', () => {
  const db = createDb();
  const summary = {
    summary: '文章摘要',
    corePoints: ['观点1', '观点2'],
    keywords: ['关键词A', '关键词B'],
    highlights: ['亮点1'],
    targetAudience: ['创作者'],
    contentAngles: ['教程'],
    evidenceQuotes: ['原文证据'],
    relevanceReason: '标题命中分类关键词',
    relevanceScore: 0.92,
  };

  saveArticleAiAnalysis(db, {
    articleId: 101,
    categoryId: 'claude',
    analysisDate: '2026-04-01',
    modelName: 'gpt-test',
    promptVersion: 'article-v1',
    summary,
  });

  const saved = getArticleAiAnalysis(db, {
    articleId: 101,
    modelName: 'gpt-test',
    promptVersion: 'article-v1',
  });

  assert.equal(saved.articleId, 101);
  assert.equal(saved.categoryId, 'claude');
  assert.equal(saved.analysisDate, '2026-04-01');
  assert.deepEqual(saved.summary, summary);
});

test('saveTopicReport persists and reloads structured report payload', () => {
  const db = createDb();
  const insights = [
    {
      title: '洞察 1',
      insight: '用户更偏爱模板型内容',
      whyItMatters: '可快速转成选题',
      suggestedContentDirection: '做现成模板拆解',
      keywords: ['模板', '实操'],
      evidenceArticleIds: [1, 2],
      confidence: 0.87,
    },
  ];

  saveTopicReport(db, {
    categoryId: 'claude',
    reportDate: '2026-04-01',
    modelName: 'gpt-test',
    promptVersion: 'report-v1',
    hotSummary: '热点聚焦在模板和教程。',
    analyzedCount: 6,
    topArticleIds: [1, 2, 3],
    insights,
  });

  const report = getTopicReport(db, {
    categoryId: 'claude',
    reportDate: '2026-04-01',
    modelName: 'gpt-test',
    promptVersion: 'report-v1',
  });

  assert.equal(report.categoryId, 'claude');
  assert.equal(report.reportDate, '2026-04-01');
  assert.equal(report.hotSummary, '热点聚焦在模板和教程。');
  assert.equal(report.analyzedCount, 6);
  assert.deepEqual(report.topArticleIds, [1, 2, 3]);
  assert.deepEqual(report.insights, insights);
});
