import { NextResponse } from 'next/server';

import { getCategoryById, getDatabase, saveCategorySettings } from '../../../../../lib/content-monitor-db.mjs';
import { ensureCategorySettings } from '../../../../../lib/wechat-collection-service.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizeSettingsPayload(payload) {
  return {
    platforms: Array.isArray(payload?.platforms)
      ? payload.platforms.filter((value) => typeof value === 'string' && value.trim())
      : [],
    keywords: Array.isArray(payload?.keywords)
      ? payload.keywords
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean)
      : [],
    bloggers: Array.isArray(payload?.bloggers)
      ? payload.bloggers.map((blogger) => ({
        id: blogger?.id ?? Date.now(),
        name: typeof blogger?.name === 'string' ? blogger.name.trim() : '',
        platform: typeof blogger?.platform === 'string' ? blogger.platform : '',
        followers: typeof blogger?.followers === 'string' ? blogger.followers : '未知',
        avatar: typeof blogger?.avatar === 'string' ? blogger.avatar : '👤',
      })).filter((blogger) => blogger.name)
      : [],
  };
}

export async function GET(_request, { params }) {
  const { categoryId } = await params;
  const db = getDatabase();

  if (!getCategoryById(db, categoryId)) {
    return NextResponse.json({ message: '分类不存在' }, { status: 404 });
  }

  const settings = ensureCategorySettings(db, categoryId);

  return NextResponse.json({ settings });
}

export async function PUT(request, { params }) {
  const { categoryId } = await params;
  const db = getDatabase();

  if (!getCategoryById(db, categoryId)) {
    return NextResponse.json({ message: '分类不存在' }, { status: 404 });
  }

  const body = await request.json();
  const payload = normalizeSettingsPayload(body);
  const settings = saveCategorySettings(db, {
    categoryId,
    ...payload,
  });

  return NextResponse.json({ settings });
}
