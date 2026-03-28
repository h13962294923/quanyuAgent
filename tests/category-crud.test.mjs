import test from 'node:test';
import assert from 'node:assert/strict';

import Database from 'better-sqlite3';

import {
  createCategory,
  deleteCategory,
  getCategorySettings,
  initializeDatabase,
  listCategories,
  listWechatArticlesByCategory,
  recordCollectionRun,
  renameCategory,
  saveCategorySettings,
  upsertWechatArticles,
} from '../lib/content-monitor-db.mjs';

function buildArticle(categoryId, overrides = {}) {
  const now = '2026-03-28T12:00:00.000Z';

  return {
    category_id: categoryId,
    keyword: '测试关键词',
    title: '测试文章',
    url: 'https://mp.weixin.qq.com/s/test-article',
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

test('initializeDatabase seeds the default categories only once', () => {
  const db = new Database(':memory:');

  initializeDatabase(db);
  const firstSeed = listCategories(db);

  initializeDatabase(db);
  const secondSeed = listCategories(db);

  assert.deepEqual(
    firstSeed.map((category) => category.id),
    ['claude', 'vibe', 'aigc'],
  );
  assert.equal(secondSeed.length, firstSeed.length);
  assert.deepEqual(secondSeed, firstSeed);
});

test('createCategory appends a new category with generated color and order', () => {
  const db = new Database(':memory:');
  initializeDatabase(db);

  const created = createCategory(db, { name: '中老年早安' });
  const categories = listCategories(db);

  assert.equal(created.name, '中老年早安');
  assert.match(created.id, /^cat_/);
  assert.equal(categories.at(-1).id, created.id);
  assert.equal(categories.at(-1).name, '中老年早安');
  assert.ok(categories.at(-1).color);
});

test('renameCategory updates only the category name', () => {
  const db = new Database(':memory:');
  initializeDatabase(db);
  const before = listCategories(db).find((category) => category.id === 'claude');

  const renamed = renameCategory(db, {
    categoryId: 'claude',
    name: 'Claude 监控升级版',
  });

  assert.equal(renamed.name, 'Claude 监控升级版');
  assert.equal(renamed.color, before.color);
  assert.equal(renamed.id, before.id);
});

test('deleteCategory removes the category and related settings, articles, and runs', () => {
  const db = new Database(':memory:');
  initializeDatabase(db);

  saveCategorySettings(db, {
    categoryId: 'claude',
    platforms: ['wechat'],
    keywords: ['Claude Code'],
    bloggers: [],
  });
  upsertWechatArticles(db, [buildArticle('claude')]);
  recordCollectionRun(db, {
    categoryId: 'claude',
    keyword: 'Claude Code',
    status: 'success',
    fetchedCount: 1,
    costMoney: 0.02,
    message: '',
  });

  deleteCategory(db, 'claude');

  assert.equal(listCategories(db).some((category) => category.id === 'claude'), false);
  assert.equal(getCategorySettings(db, 'claude'), null);
  assert.equal(listWechatArticlesByCategory(db, {
    categoryId: 'claude',
    platform: 'wechat',
  }).length, 0);
  assert.equal(
    db.prepare('SELECT COUNT(*) AS total FROM collection_runs WHERE category_id = ?').get('claude').total,
    0,
  );
});
