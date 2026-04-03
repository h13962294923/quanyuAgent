import path from 'node:path';

import Database from 'better-sqlite3';

import { CATEGORY_COLOR_PALETTE, DEFAULT_CATEGORIES } from './category-config.mjs';
import { publishTimeToDateKey } from './publish-time.mjs';

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

    CREATE TABLE IF NOT EXISTS article_ai_analysis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      category_id TEXT NOT NULL,
      analysis_date TEXT NOT NULL,
      model_name TEXT NOT NULL,
      prompt_version TEXT NOT NULL,
      summary_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(article_id, model_name, prompt_version)
    );

    CREATE TABLE IF NOT EXISTS topic_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id TEXT NOT NULL,
      report_date TEXT NOT NULL,
      model_name TEXT NOT NULL,
      prompt_version TEXT NOT NULL,
      hot_summary TEXT NOT NULL DEFAULT '',
      analyzed_count INTEGER NOT NULL DEFAULT 0,
      top_article_ids_json TEXT NOT NULL,
      insights_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(category_id, report_date, model_name, prompt_version)
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
  const rows = db.prepare(`
    SELECT *
    FROM wechat_articles
    WHERE category_id = ? AND platform = ?
    ORDER BY publish_time DESC, id DESC
  `).all(categoryId, platform);

  if (!date) {
    return rows;
  }

  return rows.filter((row) => publishTimeToDateKey(row.publish_time) === date);
}

export function hasWechatArticlesOnDate(db, {
  categoryId,
  date,
  platform = 'wechat',
}) {
  if (!date) {
    return false;
  }

  const row = db.prepare(`
    SELECT 1
    FROM wechat_articles
    WHERE category_id = ? AND platform = ?
      AND (
        (
          trim(publish_time) != ''
          AND trim(publish_time) NOT GLOB '*[^0-9.]*'
          AND trim(publish_time) GLOB '*[0-9]*'
          AND date(datetime(CAST(trim(publish_time) AS INTEGER), 'unixepoch', 'localtime')) = ?
        )
        OR substr(publish_time, 1, 10) = ?
      )
    LIMIT 1
  `).get(categoryId, platform, date, date);

  return Boolean(row);
}

export function getWechatArticleByCategoryAndId(db, {
  categoryId,
  articleId,
  platform = 'wechat',
}) {
  const normalizedArticleId = Number(articleId);

  if (!Number.isInteger(normalizedArticleId) || normalizedArticleId <= 0) {
    return null;
  }

  return db.prepare(`
    SELECT *
    FROM wechat_articles
    WHERE category_id = ? AND platform = ? AND id = ?
    LIMIT 1
  `).get(categoryId, platform, normalizedArticleId) || null;
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

export function getArticleAiAnalysis(db, {
  articleId,
  modelName,
  promptVersion,
}) {
  const row = db.prepare(`
    SELECT *
    FROM article_ai_analysis
    WHERE article_id = ? AND model_name = ? AND prompt_version = ?
    LIMIT 1
  `).get(articleId, modelName, promptVersion);

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    articleId: row.article_id,
    categoryId: row.category_id,
    analysisDate: row.analysis_date,
    modelName: row.model_name,
    promptVersion: row.prompt_version,
    summary: JSON.parse(row.summary_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function saveArticleAiAnalysis(db, {
  articleId,
  categoryId,
  analysisDate,
  modelName,
  promptVersion,
  summary,
}) {
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO article_ai_analysis (
      article_id,
      category_id,
      analysis_date,
      model_name,
      prompt_version,
      summary_json,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(article_id, model_name, prompt_version) DO UPDATE SET
      category_id = excluded.category_id,
      analysis_date = excluded.analysis_date,
      summary_json = excluded.summary_json,
      updated_at = excluded.updated_at
  `).run(
    articleId,
    categoryId,
    analysisDate,
    modelName,
    promptVersion,
    JSON.stringify(summary),
    now,
    now,
  );

  return getArticleAiAnalysis(db, {
    articleId,
    modelName,
    promptVersion,
  });
}

export function getTopicReport(db, {
  categoryId,
  reportDate,
  modelName,
  promptVersion,
}) {
  const row = db.prepare(`
    SELECT *
    FROM topic_reports
    WHERE category_id = ? AND report_date = ? AND model_name = ? AND prompt_version = ?
    LIMIT 1
  `).get(categoryId, reportDate, modelName, promptVersion);

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    categoryId: row.category_id,
    reportDate: row.report_date,
    modelName: row.model_name,
    promptVersion: row.prompt_version,
    hotSummary: row.hot_summary,
    analyzedCount: row.analyzed_count,
    topArticleIds: JSON.parse(row.top_article_ids_json),
    insights: JSON.parse(row.insights_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function saveTopicReport(db, {
  categoryId,
  reportDate,
  modelName,
  promptVersion,
  hotSummary,
  analyzedCount,
  topArticleIds,
  insights,
}) {
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO topic_reports (
      category_id,
      report_date,
      model_name,
      prompt_version,
      hot_summary,
      analyzed_count,
      top_article_ids_json,
      insights_json,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(category_id, report_date, model_name, prompt_version) DO UPDATE SET
      hot_summary = excluded.hot_summary,
      analyzed_count = excluded.analyzed_count,
      top_article_ids_json = excluded.top_article_ids_json,
      insights_json = excluded.insights_json,
      updated_at = excluded.updated_at
  `).run(
    categoryId,
    reportDate,
    modelName,
    promptVersion,
    hotSummary,
    analyzedCount,
    JSON.stringify(topArticleIds),
    JSON.stringify(insights),
    now,
    now,
  );

  return getTopicReport(db, {
    categoryId,
    reportDate,
    modelName,
    promptVersion,
  });
}
