import {
  getArticleAiAnalysis,
  getCategoryById,
  getCategorySettings,
  getTopicReport,
  listWechatArticlesByCategory,
  saveArticleAiAnalysis,
  saveTopicReport,
} from './content-monitor-db.mjs';
import { publishTimeToDateKey, publishTimeToTimestamp } from './publish-time.mjs';

const DEFAULT_TOP_N = 12;
export const ARTICLE_ANALYSIS_PROMPT_VERSION = 'article-v1';
export const REPORT_SYNTHESIS_PROMPT_VERSION = 'report-v1';

function normalizeKeyword(value) {
  return String(value || '').trim().toLowerCase();
}

function countKeywordMatches(text, keywords) {
  const normalizedText = String(text || '').toLowerCase();

  return keywords.filter((keyword) => keyword && normalizedText.includes(keyword)).length;
}

function buildEngagementScore(article) {
  return (
    Math.log10(Number(article.read_count || 0) + 1) * 0.6 +
    Math.log10(Number(article.praise_count || 0) + 1) * 0.25 +
    Math.log10(Number(article.looking_count || 0) + 1) * 0.15
  );
}

function isValidDateKey(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim());
}

function buildTopArticlePayload(article, analysisRecord) {
  const summary = analysisRecord.summary || {};

  return {
    categoryId: article.category_id || '',
    articleId: article.id,
    title: article.title || '未命名文章',
    url: article.url || '',
    author: article.wx_name || article.wx_id || '公众号',
    publishTime: article.publish_time,
    keyword: article.keyword || '',
    summary: summary.summary || '',
    keywords: summary.keywords || [],
    highlights: summary.highlights || [],
    contentAngles: summary.contentAngles || [],
    targetAudience: summary.targetAudience || [],
    relevanceReason: summary.relevanceReason || '',
    relevanceScore: summary.relevanceScore || 0,
  };
}

export async function analyzeArticleWithAi({
  article,
  category,
  reportDate,
  categoryKeywords,
  client,
}) {
  return client.generateJson({
    systemPrompt: '你是一个中文内容分析助手。你必须只返回 JSON，不要输出解释文字。',
    userPrompt: JSON.stringify({
      task: 'analyze_article',
      categoryName: category.name,
      reportDate,
      categoryKeywords,
      article: {
        title: article.title,
        content: article.content,
        wxName: article.wx_name || article.wx_id || '',
        publishTime: article.publish_time,
        keyword: article.keyword,
        readCount: Number(article.read_count || 0),
        praiseCount: Number(article.praise_count || 0),
        lookingCount: Number(article.looking_count || 0),
      },
      outputSchema: {
        summary: 'string, 120字内',
        corePoints: 'string[] 3-5条',
        keywords: 'string[] 5-8个',
        highlights: 'string[] 2-4条',
        targetAudience: 'string[] 1-3类',
        contentAngles: 'string[] 2-4条',
        evidenceQuotes: 'string[] 2-3条',
        relevanceReason: 'string',
        relevanceScore: 'number 0-1',
      },
    }),
  });
}

export async function synthesizeInsightsWithAi({
  category,
  reportDate,
  articleAnalyses,
  client,
}) {
  return client.generateJson({
    systemPrompt: '你是一个中文选题洞察分析助手。你必须只返回 JSON，不要输出解释文字。',
    userPrompt: JSON.stringify({
      task: 'synthesize_topic_report',
      categoryName: category.name,
      reportDate,
      minimumInsights: 5,
      articleAnalyses,
      outputSchema: {
        hotSummary: 'string',
        insights: [
          {
            title: 'string',
            insight: 'string',
            whyItMatters: 'string',
            suggestedContentDirection: 'string',
            keywords: ['string'],
            evidenceArticleIds: ['number'],
            confidence: 'number 0-1',
          },
        ],
      },
    }),
  });
}

export function rankTopArticlesForReport({
  articles,
  categoryKeywords,
  topN = DEFAULT_TOP_N,
}) {
  const normalizedKeywords = (categoryKeywords || []).map(normalizeKeyword).filter(Boolean);

  return (articles || [])
    .map((article) => {
      const titleMatches = countKeywordMatches(article.title, normalizedKeywords);
      const contentMatches = countKeywordMatches(article.content, normalizedKeywords);
      const keywordMatch = normalizedKeywords.includes(normalizeKeyword(article.keyword)) ? 1 : 0;
      const relevanceScoreRaw = titleMatches * 3 + contentMatches * 1 + keywordMatch * 2;
      const engagementScore = buildEngagementScore(article);

      return {
        ...article,
        titleMatches,
        contentMatches,
        keywordMatch,
        relevanceScoreRaw,
        engagementScore,
        publishTimestamp: publishTimeToTimestamp(article.publish_time),
      };
    })
    .sort((left, right) => {
      if (right.relevanceScoreRaw !== left.relevanceScoreRaw) {
        return right.relevanceScoreRaw - left.relevanceScoreRaw;
      }

      if (right.engagementScore !== left.engagementScore) {
        return right.engagementScore - left.engagementScore;
      }

      if (right.publishTimestamp !== left.publishTimestamp) {
        return right.publishTimestamp - left.publishTimestamp;
      }

      return Number(right.id || 0) - Number(left.id || 0);
    })
    .slice(0, topN);
}

export async function generateTopicReport({
  db,
  categoryId,
  reportDate,
  force = false,
  modelConfig,
  analyzeArticle,
  synthesizeInsights,
}) {
  if (!isValidDateKey(reportDate)) {
    throw new Error('报告日期格式无效');
  }

  const category = getCategoryById(db, categoryId);
  if (!category) {
    throw new Error('分类不存在');
  }

  const settings = getCategorySettings(db, categoryId);
  const keywords = settings?.keywords || [];
  const articlePromptVersion = modelConfig?.articlePromptVersion || ARTICLE_ANALYSIS_PROMPT_VERSION;
  const reportPromptVersion = modelConfig?.reportPromptVersion || REPORT_SYNTHESIS_PROMPT_VERSION;
  const modelName = modelConfig?.modelName || 'unknown';

  const cachedReport = !force
    ? getTopicReport(db, {
      categoryId,
      reportDate,
      modelName,
      promptVersion: reportPromptVersion,
    })
    : null;

  const dayArticles = listWechatArticlesByCategory(db, {
    categoryId,
    platform: 'wechat',
  }).filter((article) => publishTimeToDateKey(article.publish_time) === reportDate);

  const rankedArticles = rankTopArticlesForReport({
    articles: dayArticles,
    categoryKeywords: keywords,
    topN: DEFAULT_TOP_N,
  });

  const articleById = new Map(rankedArticles.map((article) => [article.id, article]));

  if (cachedReport) {
    const cachedTopArticles = cachedReport.topArticleIds
      .map((articleId) => {
        const article = articleById.get(articleId);
        const analysis = getArticleAiAnalysis(db, {
          articleId,
          modelName,
          promptVersion: articlePromptVersion,
        });

        if (!article || !analysis) {
          return null;
        }

        return buildTopArticlePayload(article, analysis);
      })
      .filter(Boolean);

    return {
      report: {
        ...cachedReport,
        topArticles: cachedTopArticles,
        failures: [],
      },
      status: 'ready',
      generatedAt: cachedReport.updatedAt,
      usedCachedArticleAnalyses: true,
      usedCachedReport: true,
    };
  }

  const successfulAnalyses = [];
  const failures = [];
  let usedCachedArticleAnalyses = true;

  for (const article of rankedArticles) {
    const cachedAnalysis = !force
      ? getArticleAiAnalysis(db, {
        articleId: article.id,
        modelName,
        promptVersion: articlePromptVersion,
      })
      : null;

    if (cachedAnalysis) {
      successfulAnalyses.push({
        article,
        analysis: cachedAnalysis,
      });
      continue;
    }

    usedCachedArticleAnalyses = false;

    try {
      const summary = await analyzeArticle({
        article,
        category,
        reportDate,
        categoryKeywords: keywords,
      });

      const saved = saveArticleAiAnalysis(db, {
        articleId: article.id,
        categoryId,
        analysisDate: reportDate,
        modelName,
        promptVersion: articlePromptVersion,
        summary,
      });

      successfulAnalyses.push({
        article,
        analysis: saved,
      });
    } catch (error) {
      failures.push({
        articleId: article.id,
        title: article.title || '未命名文章',
        message: error instanceof Error ? error.message : '文章分析失败',
      });
    }
  }

  const articleAnalyses = successfulAnalyses.map(({ article, analysis }) => ({
    articleId: article.id,
    title: article.title,
    summary: analysis.summary.summary,
    corePoints: analysis.summary.corePoints,
    keywords: analysis.summary.keywords,
    highlights: analysis.summary.highlights,
    targetAudience: analysis.summary.targetAudience,
    contentAngles: analysis.summary.contentAngles,
    evidenceQuotes: analysis.summary.evidenceQuotes,
    relevanceReason: analysis.summary.relevanceReason,
    relevanceScore: analysis.summary.relevanceScore,
    stats: {
      readCount: Number(article.read_count || 0),
      praiseCount: Number(article.praise_count || 0),
      lookingCount: Number(article.looking_count || 0),
    },
  }));

  let synthesized = {
    hotSummary: '',
    insights: [],
  };

  if (articleAnalyses.length > 0) {
    synthesized = await synthesizeInsights({
      category,
      reportDate,
      articleAnalyses,
    });
  }

  const reportRecord = saveTopicReport(db, {
    categoryId,
    reportDate,
    modelName,
    promptVersion: reportPromptVersion,
    hotSummary: synthesized.hotSummary || '',
    analyzedCount: successfulAnalyses.length,
    topArticleIds: successfulAnalyses.map(({ article }) => article.id),
    insights: synthesized.insights || [],
  });

  return {
    report: {
      ...reportRecord,
      topArticles: successfulAnalyses.map(({ article, analysis }) => buildTopArticlePayload(article, analysis)),
      failures,
    },
    status: 'ready',
    generatedAt: reportRecord.updatedAt,
    usedCachedArticleAnalyses,
    usedCachedReport: false,
  };
}
