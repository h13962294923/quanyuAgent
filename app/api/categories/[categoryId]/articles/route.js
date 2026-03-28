import { NextResponse } from 'next/server';

import { getCategoryById, getDatabase, listWechatArticlesByCategory } from '../../../../../lib/content-monitor-db.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { categoryId } = await params;
  const platform = request.nextUrl.searchParams.get('platform');
  const date = request.nextUrl.searchParams.get('date');

  if (platform && platform !== 'wechat') {
    return NextResponse.json({ articles: [] });
  }

  const db = getDatabase();

  if (!getCategoryById(db, categoryId)) {
    return NextResponse.json({ message: '分类不存在' }, { status: 404 });
  }

  const articles = listWechatArticlesByCategory(db, {
    categoryId,
    platform: 'wechat',
    date,
  });

  return NextResponse.json({ articles });
}
