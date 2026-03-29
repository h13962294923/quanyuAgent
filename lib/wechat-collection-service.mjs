import {
  getCategorySettings,
  hasWechatArticlesOnDate,
  recordCollectionRun,
  saveCategorySettings,
  upsertWechatArticles,
} from './content-monitor-db.mjs';
import { getDefaultSettings } from './default-settings.mjs';
import { collectWechatArticlesForKeyword } from './wechat-collector.mjs';

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizePublishDateKey(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 10);
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return toDateKey(parsed);
    }
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = new Date(value * 1000);
    if (!Number.isNaN(parsed.getTime())) {
      return toDateKey(parsed);
    }
  }

  return '';
}

function subtractDaysFromDateKey(dateKey, days) {
  const [year, month, day] = String(dateKey).split('-').map((part) => Number(part));
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - days);
  return toDateKey(date);
}

function normalizeCollectionMode(mode) {
  if (!mode || mode === 'daily') {
    return 'daily';
  }

  if (mode === 'backfill') {
    return 'backfill';
  }

  throw new Error('采集模式不支持');
}

function normalizeBackfillDays(backfillDays) {
  if (backfillDays === undefined || backfillDays === null || backfillDays === '') {
    return 7;
  }

  const days = Number(backfillDays);
  if (!Number.isInteger(days) || days < 1 || days > 30) {
    throw new Error('回填天数需在 1-30 之间');
  }

  return days;
}

export function ensureCategorySettings(db, categoryId) {
  const existing = getCategorySettings(db, categoryId);

  if (existing) {
    return existing;
  }

  const defaults = getDefaultSettings(categoryId);
  return saveCategorySettings(db, {
    categoryId,
    platforms: defaults.platforms,
    keywords: defaults.keywords,
    bloggers: defaults.bloggers,
  });
}

export async function runWechatCollection({
  db,
  categoryId,
  apiKey,
  mode = 'daily',
  backfillDays = 7,
  fetchImpl,
}) {
  if (!apiKey) {
    throw new Error('未配置极致了 Key');
  }

  const settings = ensureCategorySettings(db, categoryId);

  if (!settings.platforms.includes('wechat')) {
    throw new Error('当前分类未启用公众号采集');
  }

  if (!settings.keywords.length) {
    throw new Error('当前分类尚未配置关键词');
  }

  const collectionMode = normalizeCollectionMode(mode);
  const windowDays = collectionMode === 'backfill'
    ? normalizeBackfillDays(backfillDays)
    : 1;
  const targetDate = toDateKey(new Date());
  const windowStartDate = subtractDaysFromDateKey(targetDate, windowDays - 1);

  if (collectionMode === 'daily' && hasWechatArticlesOnDate(db, { categoryId, date: targetDate })) {
    return {
      categoryId,
      mode: collectionMode,
      collectionWindowDays: windowDays,
      successfulKeywords: 0,
      failedKeywords: 0,
      insertedArticles: 0,
      updatedArticles: 0,
      totalFetched: 0,
      totalCostMoney: 0,
      skippedKeywords: settings.keywords.length,
      skippedDate: targetDate,
      keywordResults: [],
    };
  }

  let successfulKeywords = 0;
  let failedKeywords = 0;
  let insertedArticles = 0;
  let updatedArticles = 0;
  let totalFetched = 0;
  let totalCostMoney = 0;
  let skippedKeywords = 0;
  const keywordResults = [];

  for (const keyword of settings.keywords) {
    const result = await collectWechatArticlesForKeyword({
      categoryId,
      keyword,
      apiKey,
      period: windowDays,
      fetchImpl,
    });

    if (result.status === 'success') {
      const windowArticles = (result.articles || []).filter((article) => {
        const publishDate = normalizePublishDateKey(article.publish_time);
        return publishDate && publishDate >= windowStartDate && publishDate <= targetDate;
      });
      const normalizedResult = {
        ...result,
        fetchedCount: windowArticles.length,
        articles: windowArticles,
      };

      keywordResults.push(normalizedResult);
      successfulKeywords += 1;
      totalFetched += windowArticles.length;
      totalCostMoney += result.costMoney;

      const persisted = upsertWechatArticles(db, windowArticles);
      insertedArticles += persisted.inserted;
      updatedArticles += persisted.updated;
      if (windowArticles.length === 0) {
        skippedKeywords += 1;
      }

      recordCollectionRun(db, {
        categoryId,
        keyword,
        status: 'success',
        fetchedCount: windowArticles.length,
        costMoney: result.costMoney,
        message: '',
      });
    } else {
      keywordResults.push(result);
      failedKeywords += 1;

      recordCollectionRun(db, {
        categoryId,
        keyword,
        status: 'failed',
        fetchedCount: 0,
        costMoney: 0,
        message: result.message || '采集失败',
      });
    }
  }

  return {
    categoryId,
    mode: collectionMode,
    collectionWindowDays: windowDays,
    successfulKeywords,
    failedKeywords,
    insertedArticles,
    updatedArticles,
    totalFetched,
    totalCostMoney,
    skippedKeywords,
    skippedDate: targetDate,
    keywordResults,
  };
}
