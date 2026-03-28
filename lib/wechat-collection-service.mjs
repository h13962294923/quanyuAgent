import {
  getCategorySettings,
  recordCollectionRun,
  saveCategorySettings,
  upsertWechatArticles,
} from './content-monitor-db.mjs';
import { getDefaultSettings } from './default-settings.mjs';
import { collectWechatArticlesForKeyword } from './wechat-collector.mjs';

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

  let successfulKeywords = 0;
  let failedKeywords = 0;
  let insertedArticles = 0;
  let updatedArticles = 0;
  let totalFetched = 0;
  let totalCostMoney = 0;
  const keywordResults = [];

  for (const keyword of settings.keywords) {
    const result = await collectWechatArticlesForKeyword({
      categoryId,
      keyword,
      apiKey,
      fetchImpl,
    });

    keywordResults.push(result);

    if (result.status === 'success') {
      successfulKeywords += 1;
      totalFetched += result.fetchedCount;
      totalCostMoney += result.costMoney;

      const persisted = upsertWechatArticles(db, result.articles);
      insertedArticles += persisted.inserted;
      updatedArticles += persisted.updated;

      recordCollectionRun(db, {
        categoryId,
        keyword,
        status: 'success',
        fetchedCount: result.fetchedCount,
        costMoney: result.costMoney,
        message: '',
      });
    } else {
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
    successfulKeywords,
    failedKeywords,
    insertedArticles,
    updatedArticles,
    totalFetched,
    totalCostMoney,
    keywordResults,
  };
}
