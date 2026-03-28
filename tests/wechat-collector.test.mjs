import test from 'node:test';
import assert from 'node:assert/strict';

import Database from 'better-sqlite3';

import {
  buildWechatSearchPayload,
  collectWechatArticlesForKeyword,
  normalizeWechatApiArticle,
} from '../lib/wechat-collector.mjs';
import {
  initializeDatabase,
  getCategorySettings,
  listWechatArticlesByCategory,
  saveCategorySettings,
  upsertWechatArticles,
} from '../lib/content-monitor-db.mjs';
import { runWechatCollection } from '../lib/wechat-collection-service.mjs';

test('buildWechatSearchPayload creates the fixed upstream request body', () => {
  assert.deepEqual(buildWechatSearchPayload({
    keyword: 'AI 编程',
    apiKey: 'secret-key',
  }), {
    kw: 'AI 编程',
    any_kw: '',
    ex_kw: '',
    period: 7,
    page: 1,
    sort_type: 1,
    mode: 1,
    type: 1,
    verifycode: '',
    key: 'secret-key',
  });
});

test('normalizeWechatApiArticle maps upstream data into local article shape', () => {
  const article = normalizeWechatApiArticle({
    categoryId: 'claude',
    keyword: 'Claude Code',
    item: {
      title: '  一篇深度文章  ',
      url: 'https://mp.weixin.qq.com/s/example',
      short_link: 'https://mp.weixin.qq.com/s/short',
      content: '第一段\n\n第二段  ',
      avatar: 'https://example.com/avatar.png',
      publish_time: '2026-03-28 08:00:00',
      update_time: '2026-03-28 08:30:00',
      wx_name: '极客公众号',
      wx_id: 'geek-id',
      ghid: 'gh_123',
      read: 1001,
      praise: 88,
      looking: 9,
      ip_wording: '上海',
      classify: '科技',
      is_original: 1,
    },
  });

  assert.equal(article.category_id, 'claude');
  assert.equal(article.keyword, 'Claude Code');
  assert.equal(article.title, '一篇深度文章');
  assert.equal(article.url, 'https://mp.weixin.qq.com/s/example');
  assert.equal(article.content, '第一段 第二段');
  assert.equal(article.snippet, '第一段 第二段');
  assert.equal(article.wx_name, '极客公众号');
  assert.equal(article.read_count, 1001);
  assert.equal(article.praise_count, 88);
  assert.equal(article.looking_count, 9);
  assert.equal(article.is_original, 1);
});

test('collectWechatArticlesForKeyword retries upstream internal errors up to success', async () => {
  let calls = 0;

  const fetchImpl = async (_url, options) => {
    calls += 1;
    assert.equal(options.method, 'POST');

    if (calls < 3) {
      return {
        ok: true,
        async json() {
          return { message: 'Internal Server Error' };
        },
      };
    }

    return {
      ok: true,
      async json() {
        return {
          code: 0,
          cost_money: 0.02,
          data_number: 1,
          data: [{
            title: '结果文章',
            url: 'https://mp.weixin.qq.com/s/final',
            short_link: 'https://mp.weixin.qq.com/s/final-short',
            content: '采集成功',
            avatar: '',
            publish_time: '2026-03-28 08:00:00',
            update_time: '2026-03-28 08:00:00',
            wx_name: '采集号',
            wx_id: 'wxid',
            ghid: 'ghid',
            read: 20,
            praise: 5,
            looking: 1,
            ip_wording: '',
            classify: '',
            is_original: 0,
          }],
        };
      },
    };
  };

  const result = await collectWechatArticlesForKeyword({
    categoryId: 'claude',
    keyword: 'Claude Code',
    apiKey: 'secret',
    fetchImpl,
  });

  assert.equal(calls, 3);
  assert.equal(result.keyword, 'Claude Code');
  assert.equal(result.status, 'success');
  assert.equal(result.costMoney, 0.02);
  assert.equal(result.articles.length, 1);
  assert.equal(result.articles[0].title, '结果文章');
});

test('upsertWechatArticles deduplicates by category and url', () => {
  const db = new Database(':memory:');
  initializeDatabase(db);

  const article = normalizeWechatApiArticle({
    categoryId: 'claude',
    keyword: 'AI 编程',
    item: {
      title: '初始标题',
      url: 'https://mp.weixin.qq.com/s/dedupe',
      short_link: '',
      content: '第一次内容',
      avatar: '',
      publish_time: '2026-03-27 10:00:00',
      update_time: '2026-03-27 10:00:00',
      wx_name: '测试号',
      wx_id: 'wxid-1',
      ghid: 'ghid-1',
      read: 1,
      praise: 1,
      looking: 1,
      ip_wording: '',
      classify: '',
      is_original: 0,
    },
  });

  const updatedArticle = {
    ...article,
    title: '更新后的标题',
    content: '更新后的内容',
    snippet: '更新后的内容',
    read_count: 99,
  };

  const first = upsertWechatArticles(db, [article]);
  const second = upsertWechatArticles(db, [updatedArticle]);
  const stored = listWechatArticlesByCategory(db, {
    categoryId: 'claude',
    platform: 'wechat',
  });

  assert.deepEqual(first, { inserted: 1, updated: 0 });
  assert.deepEqual(second, { inserted: 0, updated: 1 });
  assert.equal(stored.length, 1);
  assert.equal(stored[0].title, '更新后的标题');
  assert.equal(stored[0].read_count, 99);
});

test('saveCategorySettings persists settings that can be loaded again', () => {
  const db = new Database(':memory:');
  initializeDatabase(db);

  saveCategorySettings(db, {
    categoryId: 'claude',
    platforms: ['wechat'],
    keywords: ['Claude Code'],
    bloggers: [{ id: 1, name: '示例号', platform: 'wechat' }],
  });

  const stored = getCategorySettings(db, 'claude');

  assert.deepEqual(stored.platforms, ['wechat']);
  assert.deepEqual(stored.keywords, ['Claude Code']);
  assert.equal(stored.bloggers[0].name, '示例号');
});

test('runWechatCollection continues after one keyword fails', async () => {
  const db = new Database(':memory:');
  initializeDatabase(db);
  saveCategorySettings(db, {
    categoryId: 'claude',
    platforms: ['wechat'],
    keywords: ['成功词', '失败词'],
    bloggers: [],
  });

  const payloadByKeyword = {
    成功词: {
      code: 0,
      cost_money: 0.02,
      data_number: 1,
      data: [{
        title: '成功文章',
        url: 'https://mp.weixin.qq.com/s/success',
        short_link: '',
        content: '成功内容',
        avatar: '',
        publish_time: '2026-03-28 08:00:00',
        update_time: '2026-03-28 08:00:00',
        wx_name: '成功号',
        wx_id: 'wx-success',
        ghid: 'gh-success',
        read: 10,
        praise: 2,
        looking: 1,
        ip_wording: '',
        classify: '',
        is_original: 0,
      }],
    },
    失败词: {
      message: 'Internal Server Error',
    },
  };

  const fetchImpl = async (_url, options) => {
    const body = JSON.parse(options.body);
    return {
      ok: true,
      async json() {
        return payloadByKeyword[body.kw];
      },
    };
  };

  const result = await runWechatCollection({
    db,
    categoryId: 'claude',
    apiKey: 'secret',
    fetchImpl,
  });

  assert.equal(result.successfulKeywords, 1);
  assert.equal(result.failedKeywords, 1);
  assert.equal(result.insertedArticles, 1);
  assert.equal(result.totalCostMoney, 0.02);
  assert.equal(result.keywordResults.length, 2);
  assert.equal(listWechatArticlesByCategory(db, {
    categoryId: 'claude',
    platform: 'wechat',
  }).length, 1);
});

test('runWechatCollection throws when the local key is missing', async () => {
  const db = new Database(':memory:');
  initializeDatabase(db);
  saveCategorySettings(db, {
    categoryId: 'claude',
    platforms: ['wechat'],
    keywords: ['Claude Code'],
    bloggers: [],
  });

  await assert.rejects(
    runWechatCollection({
      db,
      categoryId: 'claude',
      apiKey: '',
      fetchImpl: async () => {
        throw new Error('should not call fetch');
      },
    }),
    /未配置极致了 Key/,
  );
});
