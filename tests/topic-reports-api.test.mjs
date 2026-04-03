import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createCategory,
  getDatabase,
  saveCategorySettings,
  upsertWechatArticles,
} from '../lib/content-monitor-db.mjs';
import {
  GET,
  POST,
} from '../app/api/categories/[categoryId]/reports/route.js';

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

async function createCategoryWithArticles() {
  const db = getDatabase();
  const category = createCategory(db, {
    name: `报告测试-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  });

  saveCategorySettings(db, {
    categoryId: category.id,
    platforms: ['wechat'],
    keywords: ['Claude Code', 'AI编程'],
    bloggers: [],
  });

  upsertWechatArticles(db, [
    buildArticle(category.id, `https://mp.weixin.qq.com/s/${category.id}-a`),
    buildArticle(category.id, `https://mp.weixin.qq.com/s/${category.id}-b`, {
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

  return category;
}

test('GET report route returns null when the report does not exist yet', async () => {
  const category = await createCategoryWithArticles();

  const response = await GET(
    {
      nextUrl: new URL('http://localhost/api/categories/test/reports?date=2026-04-01'),
    },
    { params: Promise.resolve({ categoryId: category.id }) },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    report: null,
    status: 'idle',
    generatedAt: null,
    usedCachedArticleAnalyses: false,
    usedCachedReport: false,
  });
});

test('POST report route rejects requests when OpenAI-compatible config is missing', async () => {
  const category = await createCategoryWithArticles();
  const originalBaseUrl = process.env.OPENAI_COMPAT_BASE_URL;
  const originalApiKey = process.env.OPENAI_COMPAT_API_KEY;
  const originalModel = process.env.OPENAI_COMPAT_MODEL;

  delete process.env.OPENAI_COMPAT_BASE_URL;
  delete process.env.OPENAI_COMPAT_API_KEY;
  delete process.env.OPENAI_COMPAT_MODEL;

  try {
    const response = await POST(
      {
        json: async () => ({ date: '2026-04-01' }),
      },
      { params: Promise.resolve({ categoryId: category.id }) },
    );

    assert.equal(response.status, 500);
    assert.equal((await response.json()).message, '未配置 OpenAI 兼容模型');
  } finally {
    process.env.OPENAI_COMPAT_BASE_URL = originalBaseUrl;
    process.env.OPENAI_COMPAT_API_KEY = originalApiKey;
    process.env.OPENAI_COMPAT_MODEL = originalModel;
  }
});

test('POST report route generates a report and reuses cache on the next request', async () => {
  const category = await createCategoryWithArticles();
  const originalBaseUrl = process.env.OPENAI_COMPAT_BASE_URL;
  const originalApiKey = process.env.OPENAI_COMPAT_API_KEY;
  const originalModel = process.env.OPENAI_COMPAT_MODEL;
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;

  process.env.OPENAI_COMPAT_BASE_URL = 'https://example.test/v1';
  process.env.OPENAI_COMPAT_API_KEY = 'secret';
  process.env.OPENAI_COMPAT_MODEL = 'gpt-test';

  globalThis.fetch = async () => {
    fetchCalls += 1;

    if (fetchCalls <= 2) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary: '文章摘要',
                  corePoints: ['观点1', '观点2'],
                  keywords: ['Claude Code', '教程'],
                  highlights: ['亮点1'],
                  targetAudience: ['开发者'],
                  contentAngles: ['教程', '案例'],
                  evidenceQuotes: ['原文摘录'],
                  relevanceReason: '命中分类关键词',
                  relevanceScore: 0.9,
                }),
              },
            },
          ],
        }),
      };
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                hotSummary: '热点集中在 Claude Code 教程与案例。',
                insights: Array.from({ length: 5 }, (_, index) => ({
                  title: `洞察 ${index + 1}`,
                  insight: '用户偏好实操内容',
                  whyItMatters: '可以拆成系列选题',
                  suggestedContentDirection: '做案例复盘',
                  keywords: ['教程', '案例'],
                  evidenceArticleIds: [],
                  confidence: 0.82,
                })),
              }),
            },
          },
        ],
      }),
    };
  };

  try {
    const firstResponse = await POST(
      {
        json: async () => ({ date: '2026-04-01' }),
      },
      { params: Promise.resolve({ categoryId: category.id }) },
    );

    assert.equal(firstResponse.status, 200);
    const firstPayload = await firstResponse.json();
    assert.equal(firstPayload.usedCachedArticleAnalyses, false);
    assert.equal(firstPayload.usedCachedReport, false);
    assert.equal(firstPayload.report.insights.length, 5);
    assert.equal(fetchCalls, 3);

    const secondResponse = await POST(
      {
        json: async () => ({ date: '2026-04-01' }),
      },
      { params: Promise.resolve({ categoryId: category.id }) },
    );

    assert.equal(secondResponse.status, 200);
    const secondPayload = await secondResponse.json();
    assert.equal(secondPayload.usedCachedArticleAnalyses, true);
    assert.equal(secondPayload.usedCachedReport, true);
    assert.equal(fetchCalls, 3);
  } finally {
    globalThis.fetch = originalFetch;
    process.env.OPENAI_COMPAT_BASE_URL = originalBaseUrl;
    process.env.OPENAI_COMPAT_API_KEY = originalApiKey;
    process.env.OPENAI_COMPAT_MODEL = originalModel;
  }
});
