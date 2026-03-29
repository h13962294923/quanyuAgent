import test from 'node:test';
import assert from 'node:assert/strict';

import Database from 'better-sqlite3';

import {
  getWechatArticleByCategoryAndId,
  initializeDatabase,
  upsertWechatArticles,
} from '../lib/content-monitor-db.mjs';

function buildArticle(categoryId, url, overrides = {}) {
  const now = '2026-03-28T12:00:00.000Z';

  return {
    category_id: categoryId,
    keyword: '测试关键词',
    title: '测试文章',
    url,
    short_link: '',
    content: '测试内容',
    snippet: '测试内容',
    avatar: '',
    publish_time: '2026-03-28 08:00:00',
    update_time: '2026-03-28 08:30:00',
    wx_name: '测试公众号',
    wx_id: 'wx-test',
    ghid: 'gh-test',
    read_count: 10,
    praise_count: 2,
    looking_count: 1,
    ip_wording: '',
    classify: '',
    is_original: 0,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

test('getWechatArticleByCategoryAndId returns the article in the matching category', () => {
  const db = new Database(':memory:');
  initializeDatabase(db);

  upsertWechatArticles(db, [buildArticle('claude', 'https://mp.weixin.qq.com/s/detail-a')]);
  const inserted = db
    .prepare('SELECT id FROM wechat_articles WHERE category_id = ? AND url = ?')
    .get('claude', 'https://mp.weixin.qq.com/s/detail-a');

  const article = getWechatArticleByCategoryAndId(db, {
    categoryId: 'claude',
    articleId: inserted.id,
  });

  assert.equal(article.id, inserted.id);
  assert.equal(article.category_id, 'claude');
});

test('getWechatArticleByCategoryAndId does not leak article across categories', () => {
  const db = new Database(':memory:');
  initializeDatabase(db);

  upsertWechatArticles(db, [
    buildArticle('claude', 'https://mp.weixin.qq.com/s/detail-a'),
    buildArticle('vibe', 'https://mp.weixin.qq.com/s/detail-b'),
  ]);
  const vibeArticle = db
    .prepare('SELECT id FROM wechat_articles WHERE category_id = ? AND url = ?')
    .get('vibe', 'https://mp.weixin.qq.com/s/detail-b');

  const article = getWechatArticleByCategoryAndId(db, {
    categoryId: 'claude',
    articleId: vibeArticle.id,
  });

  assert.equal(article, null);
});

test('getWechatArticleByCategoryAndId returns null for missing article id', () => {
  const db = new Database(':memory:');
  initializeDatabase(db);

  const article = getWechatArticleByCategoryAndId(db, {
    categoryId: 'claude',
    articleId: 99999,
  });

  assert.equal(article, null);
});
