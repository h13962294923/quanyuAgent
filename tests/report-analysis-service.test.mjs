import test from 'node:test';
import assert from 'node:assert/strict';

import Database from 'better-sqlite3';

import {
  getArticleAiAnalysis,
  getTopicReport,
  initializeDatabase,
  saveCategorySettings,
  upsertWechatArticles,
} from '../lib/content-monitor-db.mjs';
import {
  generateTopicReport,
  rankTopArticlesForReport,
} from '../lib/report-analysis-service.mjs';

function createDb() {
  const db = new Database(':memory:');
  initializeDatabase(db);
  return db;
}

function buildArticle(categoryId, url, overrides = {}) {
  return {
    category_id: categoryId,
    keyword: 'Claude Code',
    title: 'Claude Code 实战案例拆解',
    url,
    short_link: '',
    content: 'Claude Code 实战案例，包含教程和提示词模板。',
    snippet: 'Claude Code 实战案例，包含教程和提示词模板。',
    avatar: '',
    publish_time: '2026-04-01 08:00:00',
    update_time: '2026-04-01 08:30:00',
    wx_name: '测试公众号',
    wx_id: 'wx-test',
    ghid: 'gh-test',
    read_count: 2000,
    praise_count: 300,
    looking_count: 80,
    ip_wording: '',
    classify: '',
    is_original: 1,
    created_at: '2026-04-01T00:00:00.000Z',
    updated_at: '2026-04-01T00:00:00.000Z',
    ...overrides,
  };
}

test('rankTopArticlesForReport prioritizes relevance before engagement', () => {
  const ranked = rankTopArticlesForReport({
    articles: [
      {
        id: 1,
        keyword: 'Claude Code',
        title: 'Claude Code 入门教程',
        content: 'Claude Code 实战教程',
        publish_time: '2026-04-01 10:00:00',
        read_count: 300,
        praise_count: 20,
        looking_count: 5,
      },
      {
        id: 2,
        keyword: '早安',
        title: '早安问候图片合集',
        content: '今日早安海报',
        publish_time: '2026-04-01 11:00:00',
        read_count: 30000,
        praise_count: 500,
        looking_count: 100,
      },
    ],
    categoryKeywords: ['Claude Code', 'AI编程'],
    topN: 2,
  });

  assert.equal(ranked[0].id, 1);
  assert.equal(ranked[1].id, 2);
  assert.equal(ranked[0].relevanceScoreRaw > ranked[1].relevanceScoreRaw, true);
});

test('generateTopicReport stores article analyses and report payloads for reuse', async () => {
  const db = createDb();
  saveCategorySettings(db, {
    categoryId: 'claude',
    platforms: ['wechat'],
    keywords: ['Claude Code', 'AI编程'],
    bloggers: [],
  });

  upsertWechatArticles(db, [
    buildArticle('claude', 'https://mp.weixin.qq.com/s/a', { created_at: '2026-04-01T01:00:00.000Z', updated_at: '2026-04-01T01:00:00.000Z' }),
    buildArticle('claude', 'https://mp.weixin.qq.com/s/b', {
      title: 'AI编程工作流拆解',
      content: 'AI编程工作流，包含步骤和案例。',
      keyword: 'AI编程',
      read_count: 1500,
      praise_count: 260,
      looking_count: 70,
      created_at: '2026-04-01T01:10:00.000Z',
      updated_at: '2026-04-01T01:10:00.000Z',
    }),
  ]);

  let articleCalls = 0;
  let synthesisCalls = 0;

  const first = await generateTopicReport({
    db,
    categoryId: 'claude',
    reportDate: '2026-04-01',
    force: false,
    modelConfig: {
      modelName: 'gpt-test',
      articlePromptVersion: 'article-v1',
      reportPromptVersion: 'report-v1',
    },
    analyzeArticle: async ({ article }) => {
      articleCalls += 1;
      return {
        summary: `${article.title} 摘要`,
        corePoints: ['观点1', '观点2'],
        keywords: ['Claude Code', '教程'],
        highlights: ['亮点1'],
        targetAudience: ['开发者'],
        contentAngles: ['教程', '案例'],
        evidenceQuotes: ['原文摘录'],
        relevanceReason: '命中分类关键词',
        relevanceScore: 0.91,
      };
    },
    synthesizeInsights: async ({ articleAnalyses }) => {
      synthesisCalls += 1;
      assert.equal(Array.isArray(articleAnalyses), true);
      return {
        hotSummary: '热点集中在 Claude Code 教程与案例。',
        insights: Array.from({ length: 5 }, (_, index) => ({
          title: `洞察 ${index + 1}`,
          insight: '用户偏好强实操内容',
          whyItMatters: '适合延展成系列选题',
          suggestedContentDirection: '做案例拆解',
          keywords: ['教程', '案例'],
          evidenceArticleIds: articleAnalyses.map((item) => item.articleId),
          confidence: 0.8,
        })),
      };
    },
  });

  assert.equal(articleCalls, 2);
  assert.equal(synthesisCalls, 1);
  assert.equal(first.report.analyzedCount, 2);
  assert.equal(first.usedCachedArticleAnalyses, false);
  assert.equal(first.usedCachedReport, false);
  assert.equal(first.report.insights.length, 5);

  const savedAnalysis = getArticleAiAnalysis(db, {
    articleId: first.report.topArticles[0].articleId,
    modelName: 'gpt-test',
    promptVersion: 'article-v1',
  });
  assert.equal(savedAnalysis.summary.summary.endsWith('摘要'), true);

  const savedReport = getTopicReport(db, {
    categoryId: 'claude',
    reportDate: '2026-04-01',
    modelName: 'gpt-test',
    promptVersion: 'report-v1',
  });
  assert.equal(savedReport.insights.length, 5);

  const second = await generateTopicReport({
    db,
    categoryId: 'claude',
    reportDate: '2026-04-01',
    force: false,
    modelConfig: {
      modelName: 'gpt-test',
      articlePromptVersion: 'article-v1',
      reportPromptVersion: 'report-v1',
    },
    analyzeArticle: async () => {
      articleCalls += 1;
      throw new Error('should not rerun article analysis');
    },
    synthesizeInsights: async () => {
      synthesisCalls += 1;
      throw new Error('should not rerun report synthesis');
    },
  });

  assert.equal(second.usedCachedArticleAnalyses, true);
  assert.equal(second.usedCachedReport, true);
  assert.equal(articleCalls, 2);
  assert.equal(synthesisCalls, 1);
});

test('generateTopicReport continues when one article analysis fails', async () => {
  const db = createDb();
  saveCategorySettings(db, {
    categoryId: 'claude',
    platforms: ['wechat'],
    keywords: ['Claude Code'],
    bloggers: [],
  });

  upsertWechatArticles(db, [
    buildArticle('claude', 'https://mp.weixin.qq.com/s/a'),
    buildArticle('claude', 'https://mp.weixin.qq.com/s/b', {
      title: 'Claude Code 失败文章',
      content: 'Claude Code 失败文章正文',
      read_count: 1200,
      created_at: '2026-04-01T01:10:00.000Z',
      updated_at: '2026-04-01T01:10:00.000Z',
    }),
  ]);

  const result = await generateTopicReport({
    db,
    categoryId: 'claude',
    reportDate: '2026-04-01',
    force: false,
    modelConfig: {
      modelName: 'gpt-test',
      articlePromptVersion: 'article-v1',
      reportPromptVersion: 'report-v1',
    },
    analyzeArticle: async ({ article }) => {
      if (article.title.includes('失败')) {
        throw new Error('json parse error');
      }

      return {
        summary: `${article.title} 摘要`,
        corePoints: ['观点1'],
        keywords: ['Claude Code'],
        highlights: ['亮点1'],
        targetAudience: ['开发者'],
        contentAngles: ['教程'],
        evidenceQuotes: ['证据'],
        relevanceReason: '命中分类关键词',
        relevanceScore: 0.88,
      };
    },
    synthesizeInsights: async ({ articleAnalyses }) => ({
      hotSummary: '热点聚焦在 Claude Code。',
      insights: Array.from({ length: 5 }, (_, index) => ({
        title: `洞察 ${index + 1}`,
        insight: '保留成功文章继续分析',
        whyItMatters: '单篇失败不应阻断整份报告',
        suggestedContentDirection: '继续做实操选题',
        keywords: ['Claude Code'],
        evidenceArticleIds: articleAnalyses.map((item) => item.articleId),
        confidence: 0.76,
      })),
    }),
  });

  assert.equal(result.report.analyzedCount, 1);
  assert.equal(result.report.topArticles.length, 1);
  assert.equal(result.report.failures.length, 1);
  assert.equal(result.report.failures[0].message, 'json parse error');
});

test('generateTopicReport does not synthesize generic insights when no article analysis succeeds', async () => {
  const db = createDb();
  saveCategorySettings(db, {
    categoryId: 'claude',
    platforms: ['wechat'],
    keywords: ['Claude Code'],
    bloggers: [],
  });

  upsertWechatArticles(db, [
    buildArticle('claude', 'https://mp.weixin.qq.com/s/a'),
  ]);

  let synthesisCalls = 0;

  const result = await generateTopicReport({
    db,
    categoryId: 'claude',
    reportDate: '2026-04-01',
    force: true,
    modelConfig: {
      modelName: 'gpt-test',
      articlePromptVersion: 'article-v1',
      reportPromptVersion: 'report-v1',
    },
    analyzeArticle: async () => {
      throw new Error('json parse error');
    },
    synthesizeInsights: async () => {
      synthesisCalls += 1;
      return {
        hotSummary: '不应生成',
        insights: [],
      };
    },
  });

  assert.equal(synthesisCalls, 0);
  assert.equal(result.report.analyzedCount, 0);
  assert.equal(result.report.hotSummary, '');
  assert.deepEqual(result.report.insights, []);
  assert.equal(result.report.topArticles.length, 0);
  assert.equal(result.report.failures.length, 1);
});
