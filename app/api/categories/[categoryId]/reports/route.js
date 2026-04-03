import { NextResponse } from 'next/server.js';

import {
  getCategoryById,
  getDatabase,
  getTopicReport,
} from '../../../../../lib/content-monitor-db.mjs';
import {
  analyzeArticleWithAi,
  ARTICLE_ANALYSIS_PROMPT_VERSION,
  generateTopicReport,
  REPORT_SYNTHESIS_PROMPT_VERSION,
  synthesizeInsightsWithAi,
} from '../../../../../lib/report-analysis-service.mjs';
import {
  createOpenAiCompatibleClient,
  getOpenAiCompatibleConfig,
} from '../../../../../lib/openai-compatible-client.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KNOWN_CLIENT_ERRORS = new Set([
  '报告日期格式无效',
]);

function buildIdlePayload() {
  return {
    report: null,
    status: 'idle',
    generatedAt: null,
    usedCachedArticleAnalyses: false,
    usedCachedReport: false,
  };
}

export async function GET(request, { params }) {
  const { categoryId } = await params;
  const reportDate = String(request.nextUrl.searchParams.get('date') || '').trim();
  const db = getDatabase();

  if (!getCategoryById(db, categoryId)) {
    return NextResponse.json({ message: '分类不存在' }, { status: 404 });
  }

  if (!reportDate) {
    return NextResponse.json(buildIdlePayload());
  }

  try {
    const config = getOpenAiCompatibleConfig();
    const report = getTopicReport(db, {
      categoryId,
      reportDate,
      modelName: config.modelName,
      promptVersion: REPORT_SYNTHESIS_PROMPT_VERSION,
    });

    if (!report) {
      return NextResponse.json(buildIdlePayload());
    }

    const cachedResult = await generateTopicReport({
      db,
      categoryId,
      reportDate,
      force: false,
      modelConfig: {
        modelName: config.modelName,
        articlePromptVersion: ARTICLE_ANALYSIS_PROMPT_VERSION,
        reportPromptVersion: REPORT_SYNTHESIS_PROMPT_VERSION,
      },
      analyzeArticle: async () => {
        throw new Error('cached route should not analyze articles');
      },
      synthesizeInsights: async () => {
        throw new Error('cached route should not synthesize report');
      },
    });

    return NextResponse.json(cachedResult);
  } catch (error) {
    if (error instanceof Error && error.message === '未配置 OpenAI 兼容模型') {
      return NextResponse.json(buildIdlePayload());
    }

    return NextResponse.json({ message: '加载报告失败' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const { categoryId } = await params;
  const db = getDatabase();

  try {
    let payload = {};

    try {
      payload = await request.json();
    } catch {
      payload = {};
    }

    if (!getCategoryById(db, categoryId)) {
      return NextResponse.json({ message: '分类不存在' }, { status: 404 });
    }

    const config = getOpenAiCompatibleConfig();
    const client = createOpenAiCompatibleClient(config);

    const result = await generateTopicReport({
      db,
      categoryId,
      reportDate: String(payload?.date || '').trim(),
      force: Boolean(payload?.force),
      modelConfig: {
        modelName: config.modelName,
        articlePromptVersion: ARTICLE_ANALYSIS_PROMPT_VERSION,
        reportPromptVersion: REPORT_SYNTHESIS_PROMPT_VERSION,
      },
      analyzeArticle: (args) => analyzeArticleWithAi({
        ...args,
        client,
      }),
      synthesizeInsights: (args) => synthesizeInsightsWithAi({
        ...args,
        client,
      }),
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '生成报告失败';
    const status = message === '未配置 OpenAI 兼容模型'
      ? 500
      : KNOWN_CLIENT_ERRORS.has(message)
        ? 400
        : 500;

    return NextResponse.json({ message }, { status });
  }
}
