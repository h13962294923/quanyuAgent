import { NextResponse } from 'next/server';

import { getDatabase } from '../../../lib/content-monitor-db.mjs';
import { createCategoryWithDefaults, listStoredCategories } from '../../../lib/category-service.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDatabase();
  const categories = listStoredCategories(db);

  return NextResponse.json({ categories });
}

export async function POST(request) {
  try {
    const db = getDatabase();
    const body = await request.json();
    const category = createCategoryWithDefaults(db, {
      name: body?.name,
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '创建分类失败';
    const status = message === '分类名称不能为空' || message === '分类名称已存在' ? 400 : 500;

    return NextResponse.json({ message }, { status });
  }
}
