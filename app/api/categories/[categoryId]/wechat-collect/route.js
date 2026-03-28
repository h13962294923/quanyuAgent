import { NextResponse } from 'next/server';

import { getCategoryById, getDatabase } from '../../../../../lib/content-monitor-db.mjs';
import { runWechatCollection } from '../../../../../lib/wechat-collection-service.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KNOWN_CLIENT_ERRORS = new Set([
  '未配置极致了 Key',
  '当前分类未启用公众号采集',
  '当前分类尚未配置关键词',
]);

export async function POST(_request, { params }) {
  const { categoryId } = await params;

  try {
    const db = getDatabase();

    if (!getCategoryById(db, categoryId)) {
      return NextResponse.json({ message: '分类不存在' }, { status: 404 });
    }

    const result = await runWechatCollection({
      db,
      categoryId,
      apiKey: process.env.WECHAT_SEARCH_API_KEY || '',
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '采集失败';
    const status = KNOWN_CLIENT_ERRORS.has(message) ? 400 : 500;

    return NextResponse.json({ message }, { status });
  }
}
