import { NextResponse } from 'next/server';

import { getDatabase } from '../../../../lib/content-monitor-db.mjs';
import { deleteCategoryAndResolveFallback, renameStoredCategory } from '../../../../lib/category-service.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const { categoryId } = await params;

  try {
    const db = getDatabase();
    const body = await request.json();
    const category = renameStoredCategory(db, {
      categoryId,
      name: body?.name,
    });

    return NextResponse.json({ category });
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新分类失败';
    const status = message === '分类名称不能为空'
      || message === '分类名称已存在'
      || message === '分类不存在'
      ? 400
      : 500;

    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(_request, { params }) {
  const { categoryId } = await params;

  try {
    const db = getDatabase();
    const result = deleteCategoryAndResolveFallback(db, categoryId);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '删除分类失败';
    const status = message === '分类不存在' ? 400 : 500;

    return NextResponse.json({ message }, { status });
  }
}
