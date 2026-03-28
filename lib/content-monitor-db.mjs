import path from 'node:path';

import Database from 'better-sqlite3';

import { CATEGORY_COLOR_PALETTE, DEFAULT_CATEGORIES } from './category-config.mjs';

const DATABASE_FILE = path.join(process.cwd(), 'content-monitor.sqlite');

let dbInstance;

function normalizeCategoryName(name) {
  return typeof name === 'string' ? name.trim() : '';
}

function getCategoryNameConflict(db, name, excludedCategoryId = null) {
  if (!name) {
    return null;
  }

  if (excludedCategoryId) {
    return db.prepare(`
      SELECT id
      FROM categories
      WHERE lower(name) = lower(?)
        AND id != ?
    `).get(name, excludedCategoryId);
  }

  return db.prepare(`
    SELECT id
    FROM categories
    WHERE lower(name) = lower(?)
  `).get(name);
}

function validateCategoryName(db, name, excludedCategoryId = null) {
  const normalizedName = normalizeCategoryName(name);

  if (!normalizedName) {
    throw new Error('分类名称不能为空');
  }

  if (getCategoryNameConflict(db, normalizedName, excludedCategoryId)) {
    throw new Error('分类名称已存在');
  }

  return normalizedName;
}

function buildCategoryId() {
  return `cat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function pickCategoryColor(index) {
  return CATEGORY_COLOR_PALETTE[index % CATEGORY_COLOR_PALETTE.length];
}

export function seedDefaultCategories(db) {
  const categoryCount = db.prepare('SELECT COUNT(*) AS total FROM categories').get().total;

  if (categoryCount > 0) {
    return;
  }

  const insertCategory = db.prepare(`
    INSERT INTO categories (
      id,
      name,
      color,
      sort_order,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  const transaction = db.transaction(() => {
    for (const category of DEFAULT_CATEGORIES) {
      insertCategory.run(
        category.id,
        category.name,
        category.color,
        category.sortOrder,
        now,
        now,
      );
    }
  });

  transaction();
}

export function initializeDatabase(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL COLLATE NOCASE UNIQUE,
      color TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS category_settings (
      category_id TEXT PRIMARY KEY,
      platforms_json TEXT NOT NULL,
      keywords_json TEXT NOT NULL,
      bloggers_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wechat_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id TEXT NOT NULL,
      keyword TEXT NOT NULL,
      platform TEXT NOT NULL DEFAULT 'wechat',
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      short_link TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      snippet TEXT NOT NULL DEFAULT '',
      avatar TEXT NOT NULL DEFAULT '',
      publish_time TEXT NOT NULL,
      update_time TEXT NOT NULL DEFAULT '',
      wx_name TEXT NOT NULL DEFAULT '',
      wx_id TEXT NOT NULL DEFAULT '',
      ghid TEXT NOT NULL DEFAULT '',
      read_count INTEGER NOT NULL DEFAULT 0,
      praise_count INTEGER NOT NULL DEFAULT 0,
      looking_count INTEGER NOT NULL DEFAULT 0,
      ip_wording TEXT NOT NULL DEFAULT '',
      classify TEXT NOT NULL DEFAULT '',
      is_original INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(category_id, url)
    );

    CREATE TABLE IF NOT EXISTS collection_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id TEXT NOT NULL,
      keyword TEXT NOT NULL,
      status TEXT NOT NULL,
      fetched_count INTEGER NOT NULL DEFAULT 0,
      cost_money REAL NOT NULL DEFAULT 0,
      message TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
  `);

  seedDefaultCategories(db);
}

export function getDatabase() {
  if (!dbInstance) {
    dbInstance = new Database(DATABASE_FILE);
    initializeDatabase(dbInstance);
  }

  return dbInstance;
}

export function listCategories(db) {
  return db.prepare(`
    SELECT id, name, color, sort_order, created_at, updated_at
    FROM categories
    ORDER BY sort_order ASC, created_at ASC, id ASC
  `).all().map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export function getCategoryById(db, categoryId) {
  const row = db.prepare(`
    SELECT id, name, color, sort_order, created_at, updated_at
    FROM categories
    WHERE id = ?
  `).get(categoryId);

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    color: row.color,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createCategory(db, { name }) {
  const normalizedName = validateCategoryName(db, name);
  const nextOrderRow = db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM categories').get();
  const currentCount = db.prepare('SELECT COUNT(*) AS total FROM categories').get().total;
  const now = new Date().toISOString();
  const category = {
    id: buildCategoryId(),
    name: normalizedName,
    color: pickCategoryColor(currentCount),
    sortOrder: nextOrderRow.next_order,
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(`
    INSERT INTO categories (
      id,
      name,
      color,
      sort_order,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    category.id,
    category.name,
    category.color,
    category.sortOrder,
    category.createdAt,
    category.updatedAt,
  );

  return category;
}

export function renameCategory(db, { categoryId, name }) {
  const category = getCategoryById(db, categoryId);

  if (!category) {
    throw new Error('分类不存在');
  }

  const normalizedName = validateCategoryName(db, name, categoryId);
  const updatedAt = new Date().toISOString();

  db.prepare(`
    UPDATE categories
    SET name = ?, updated_at = ?
    WHERE id = ?
  `).run(normalizedName, updatedAt, categoryId);

  return getCategoryById(db, categoryId);
}

export function deleteCategory(db, categoryId) {
  const category = getCategoryById(db, categoryId);

  if (!category) {
    throw new Error('分类不存在');
  }

  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM category_settings WHERE category_id = ?').run(categoryId);
    db.prepare('DELETE FROM wechat_articles WHERE category_id = ?').run(categoryId);
    db.prepare('DELETE FROM collection_runs WHERE category_id = ?').run(categoryId);
    db.prepare('DELETE FROM categories WHERE id = ?').run(categoryId);
  });

  transaction();

  return category;
}

export function getCategorySettings(db, categoryId) {
  const row = db.prepare(`
    SELECT category_id, platforms_json, keywords_json, bloggers_json, updated_at
    FROM category_settings
    WHERE category_id = ?
  `).get(categoryId);

  if (!row) {
    return null;
  }

  return {
    categoryId: row.category_id,
    platforms: JSON.parse(row.platforms_json),
    keywords: JSON.parse(row.keywords_json),
    bloggers: JSON.parse(row.bloggers_json),
    updatedAt: row.updated_at,
  };
}

export function saveCategorySettings(db, { categoryId, platforms, keywords, bloggers }) {
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO category_settings (
      category_id,
      platforms_json,
      keywords_json,
      bloggers_json,
      updated_at
    ) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(category_id) DO UPDATE SET
      platforms_json = excluded.platforms_json,
      keywords_json = excluded.keywords_json,
      bloggers_json = excluded.bloggers_json,
      updated_at = excluded.updated_at
  `).run(
    categoryId,
    JSON.stringify(platforms),
    JSON.stringify(keywords),
    JSON.stringify(bloggers),
    now,
  );

  return getCategorySettings(db, categoryId);
}

export function upsertWechatArticles(db, articles) {
  const existingStatement = db.prepare(`
    SELECT id
    FROM wechat_articles
    WHERE category_id = ? AND url = ?
  `);
  const insertStatement = db.prepare(`
    INSERT INTO wechat_articles (
      category_id,
      keyword,
      platform,
      title,
      url,
      short_link,
      content,
      snippet,
      avatar,
      publish_time,
      update_time,
      wx_name,
      wx_id,
      ghid,
      read_count,
      praise_count,
      looking_count,
      ip_wording,
      classify,
      is_original,
      created_at,
      updated_at
    ) VALUES (
      @category_id,
      @keyword,
      'wechat',
      @title,
      @url,
      @short_link,
      @content,
      @snippet,
      @avatar,
      @publish_time,
      @update_time,
      @wx_name,
      @wx_id,
      @ghid,
      @read_count,
      @praise_count,
      @looking_count,
      @ip_wording,
      @classify,
      @is_original,
      @created_at,
      @updated_at
    )
  `);
  const updateStatement = db.prepare(`
    UPDATE wechat_articles
    SET
      keyword = @keyword,
      title = @title,
      short_link = @short_link,
      content = @content,
      snippet = @snippet,
      avatar = @avatar,
      publish_time = @publish_time,
      update_time = @update_time,
      wx_name = @wx_name,
      wx_id = @wx_id,
      ghid = @ghid,
      read_count = @read_count,
      praise_count = @praise_count,
      looking_count = @looking_count,
      ip_wording = @ip_wording,
      classify = @classify,
      is_original = @is_original,
      updated_at = @updated_at
    WHERE category_id = @category_id AND url = @url
  `);

  let inserted = 0;
  let updated = 0;

  const transaction = db.transaction((items) => {
    for (const item of items) {
      const exists = existingStatement.get(item.category_id, item.url);

      if (exists) {
        updateStatement.run(item);
        updated += 1;
      } else {
        insertStatement.run(item);
        inserted += 1;
      }
    }
  });

  transaction(articles);

  return { inserted, updated };
}

export function listWechatArticlesByCategory(db, { categoryId, platform = 'wechat', date = null }) {
  const params = [categoryId, platform];
  let sql = `
    SELECT *
    FROM wechat_articles
    WHERE category_id = ? AND platform = ?
  `;

  if (date) {
    sql += ' AND substr(publish_time, 1, 10) = ?';
    params.push(date);
  }

  sql += ' ORDER BY publish_time DESC, id DESC';

  return db.prepare(sql).all(...params);
}

export function recordCollectionRun(db, {
  categoryId,
  keyword,
  status,
  fetchedCount,
  costMoney,
  message,
}) {
  db.prepare(`
    INSERT INTO collection_runs (
      category_id,
      keyword,
      status,
      fetched_count,
      cost_money,
      message,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    categoryId,
    keyword,
    status,
    fetchedCount,
    costMoney,
    message,
    new Date().toISOString(),
  );
}
