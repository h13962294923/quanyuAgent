import test from 'node:test';
import assert from 'node:assert/strict';

import Database from 'better-sqlite3';

import { getCategorySettings, initializeDatabase, listCategories } from '../lib/content-monitor-db.mjs';
import {
  createCategoryWithDefaults,
  deleteCategoryAndResolveFallback,
  renameStoredCategory,
} from '../lib/category-service.mjs';

test('createCategoryWithDefaults creates a category and empty default settings', () => {
  const db = new Database(':memory:');
  initializeDatabase(db);

  const category = createCategoryWithDefaults(db, { name: '中老年早安' });
  const settings = getCategorySettings(db, category.id);

  assert.equal(category.name, '中老年早安');
  assert.deepEqual(settings.platforms, []);
  assert.deepEqual(settings.keywords, []);
  assert.deepEqual(settings.bloggers, []);
});

test('renameStoredCategory updates the stored category name', () => {
  const db = new Database(':memory:');
  initializeDatabase(db);

  const category = renameStoredCategory(db, {
    categoryId: 'vibe',
    name: 'Vibe 创作热点监控',
  });

  assert.equal(category.id, 'vibe');
  assert.equal(category.name, 'Vibe 创作热点监控');
});

test('deleteCategoryAndResolveFallback returns an existing category when others remain', () => {
  const db = new Database(':memory:');
  initializeDatabase(db);

  const result = deleteCategoryAndResolveFallback(db, 'claude');

  assert.equal(result.deletedCategoryId, 'claude');
  assert.equal(result.categories.some((category) => category.id === 'claude'), false);
  assert.equal(result.nextCategoryId, 'vibe');
});

test('deleteCategoryAndResolveFallback creates an empty fallback category when deleting the last one', () => {
  const db = new Database(':memory:');
  initializeDatabase(db);

  for (const category of listCategories(db)) {
    deleteCategoryAndResolveFallback(db, category.id);
  }

  const categories = listCategories(db);
  const fallbackCategory = categories[0];
  const fallbackSettings = getCategorySettings(db, fallbackCategory.id);

  assert.equal(categories.length, 1);
  assert.equal(fallbackCategory.name, '默认分类');
  assert.deepEqual(fallbackSettings.platforms, []);
  assert.deepEqual(fallbackSettings.keywords, []);
  assert.deepEqual(fallbackSettings.bloggers, []);
});
