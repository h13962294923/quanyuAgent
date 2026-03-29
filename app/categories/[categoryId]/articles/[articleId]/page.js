import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  getCategoryById,
  getDatabase,
  getWechatArticleByCategoryAndId,
} from '../../../../../lib/content-monitor-db.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleString('zh-CN', { hour12: false });
  }

  return String(value);
}

function formatNumber(value) {
  const numeric = Number(value || 0);

  if (!Number.isFinite(numeric)) {
    return '0';
  }

  if (numeric >= 10000) {
    return `${(numeric / 10000).toFixed(1)}万`;
  }

  return String(numeric);
}

export default async function WechatArticleDetailPage({ params }) {
  const { categoryId, articleId } = await params;
  const db = getDatabase();
  const category = getCategoryById(db, categoryId);

  if (!category) {
    notFound();
  }

  const article = getWechatArticleByCategoryAndId(db, {
    categoryId,
    articleId,
  });

  if (!article) {
    notFound();
  }

  const bodyText = String(article.content || '').trim();
  const hasBody = Boolean(bodyText);

  return (
    <main className="article-detail-page">
      <div className="article-detail-topbar">
        <Link href="/" className="btn btn-ghost">
          ← 返回内容列表
        </Link>
        <span className="article-detail-category">{category.name}</span>
      </div>

      <article className="article-detail-card">
        <h1 className="article-detail-title">{article.title || '未命名文章'}</h1>

        <div className="article-detail-meta">
          <span>公众号：{article.wx_name || article.wx_id || '未知'}</span>
          <span>发布时间：{formatDateTime(article.publish_time)}</span>
          <span>阅读：{formatNumber(article.read_count)}</span>
          <span>点赞：{formatNumber(article.praise_count)}</span>
          <span>在看：{formatNumber(article.looking_count)}</span>
        </div>

        <div className="article-detail-actions">
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
            >
              查看原文
            </a>
          )}
        </div>

        {hasBody ? (
          <section className="article-detail-body">{bodyText}</section>
        ) : (
          <section className="article-detail-empty">暂无正文内容</section>
        )}
      </article>
    </main>
  );
}
