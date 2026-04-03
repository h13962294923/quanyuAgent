'use client';
import { getReportEmptyState } from '../../lib/report-view.mjs';

function formatDateLabel(dateKey) {
  const [year, month, day] = String(dateKey || '').split('-').map(Number);

  if (!year || !month || !day) {
    return dateKey;
  }

  return `${year}年${month}月${day}日`;
}

function getBadgeParts(dateKey) {
  const [year, month, day] = String(dateKey || '').split('-').map(Number);

  if (!year || !month || !day) {
    return { month: '--', day: '--' };
  }

  return {
    month: `${month}月`,
    day: String(day),
  };
}

function renderTags(items = [], tone = 'default') {
  return items.map((item) => (
    <span
      key={`${tone}-${item}`}
      className="topic-tag"
      style={{
        background: tone === 'warm' ? 'rgba(251,191,36,0.14)' : 'var(--accent-bg)',
        color: tone === 'warm' ? '#fbbf24' : 'var(--accent-light)',
        border: tone === 'warm' ? '1px solid rgba(251,191,36,0.22)' : '1px solid rgba(99,102,241,0.22)',
      }}
    >
      {item}
    </span>
  ));
}

export default function ReportTab({
  categoryId,
  availableDates,
  selectedDate,
  reportResult,
  loading,
  generating,
  onSelectDate,
  onGenerate,
  onRegenerate,
  articleCountByDate,
}) {
  const report = reportResult?.report || null;
  const topArticles = report?.topArticles || [];
  const insights = report?.insights || [];
  const failures = report?.failures || [];
  const articleCount = articleCountByDate?.[selectedDate] || 0;
  const emptyState = getReportEmptyState({
    articleCount,
    loading,
    hasReport: Boolean(report),
  });

  return (
    <div>
      <div className="section-title" style={{ marginBottom: 20 }}>📊 选题分析与报告</div>

      <div className="report-layout">
        <div className="report-date-list">
          {availableDates.map((dateKey) => {
            const badge = getBadgeParts(dateKey);
            const count = articleCountByDate?.[dateKey] || 0;

            return (
              <button
                key={dateKey}
                type="button"
                className={`report-date-item ${selectedDate === dateKey ? 'active' : ''}`}
                onClick={() => onSelectDate(dateKey)}
              >
                <div className="report-date-badge">
                  <div className="report-date-month">{badge.month}</div>
                  <div className="report-date-num">{badge.day}</div>
                </div>
                <div className="report-date-info">
                  <div className="report-date-title">{formatDateLabel(dateKey)}</div>
                  <div className="report-date-preview">
                    {selectedDate === dateKey ? '查看该日 top 文章摘要与洞察' : '切换到该日期报告'}
                  </div>
                </div>
                <div className="report-topic-count">{count} 篇文章</div>
              </button>
            );
          })}
        </div>

        <div className="report-main">
          <div className="report-toolbar">
            <div>
              <div className="report-toolbar-title">{formatDateLabel(selectedDate)} 选题日报</div>
              <div className="report-toolbar-desc">
                基于当天 top 文章先做结构化摘录，再聚合生成选题洞察。
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-ghost" onClick={onGenerate} disabled={loading || generating}>
                {generating ? '⏳ 生成中...' : '生成报告'}
              </button>
              <button className="btn btn-primary" onClick={onRegenerate} disabled={loading || generating}>
                {generating ? '请稍候' : '重新生成'}
              </button>
            </div>
          </div>

          {emptyState?.kind === 'loading' ? (
            <div className="empty-state" style={{ minHeight: 320 }}>
              <div className="empty-icon">⏳</div>
              <div className="empty-text">{emptyState.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 420 }}>
                {emptyState.description}
              </div>
            </div>
          ) : null}

          {emptyState && emptyState.kind !== 'loading' ? (
            <div className="empty-state" style={{ minHeight: 320 }}>
              <div className="empty-icon">{emptyState.kind === 'no-articles' ? '📭' : '📝'}</div>
              <div className="empty-text">{emptyState.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 460 }}>
                {emptyState.description}
              </div>
              {emptyState.showGenerateAction ? (
                <div style={{ marginTop: 16 }}>
                  <button className="btn btn-primary" onClick={onGenerate} disabled={generating}>
                    {generating ? '⏳ 生成中...' : '立即生成报告'}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {report ? (
            <div className="report-content">
              <div className="report-header">
                <div className="report-title">{formatDateLabel(selectedDate)} 选题分析与报告</div>
                <div className="report-summary">{report.hotSummary || '已生成报告，等待进一步查看热点摘要。'}</div>
              </div>

              <div className="report-body">
                <section className="report-section">
                  <div className="report-section-title">概览</div>
                  <div className="insight-grid">
                    <div className="insight-card">
                      <div className="insight-label">文章级分析</div>
                      <div className="insight-value">{report.analyzedCount || 0} 篇</div>
                      <div className="insight-trend">已完成结构化摘要的 top 文章数量</div>
                    </div>
                    <div className="insight-card">
                      <div className="insight-label">选题洞察</div>
                      <div className="insight-value">{insights.length} 条</div>
                      <div className="insight-trend">默认至少产出 5 条结构化洞察</div>
                    </div>
                    <div className="insight-card">
                      <div className="insight-label">原文范围</div>
                      <div className="insight-value">{topArticles.length} 篇</div>
                      <div className="insight-trend">参与聚合分析的 top 文章数量</div>
                    </div>
                  </div>
                </section>

                <section className="report-section">
                  <div className="report-section-title">文章级结构化摘要</div>
                  <div className="topic-list">
                    {topArticles.map((article, index) => (
                      <article key={`${article.articleId}-${index}`} className="topic-card">
                        <div className="topic-header">
                          <div className="topic-title">{article.title}</div>
                          <div className="topic-num">{index + 1}</div>
                        </div>
                        <div className="topic-desc">{article.summary}</div>
                        {article.highlights?.length ? (
                          <div className="topic-desc" style={{ marginTop: 8 }}>
                            亮点：{article.highlights.join('；')}
                          </div>
                        ) : null}
                        {article.contentAngles?.length ? (
                          <div className="topic-desc" style={{ marginTop: 8 }}>
                            可切入角度：{article.contentAngles.join(' / ')}
                          </div>
                        ) : null}
                        <div className="topic-tags">
                          {renderTags(article.keywords || [])}
                          {renderTags(article.targetAudience?.map((item) => `人群:${item}`) || [], 'warm')}
                        </div>
                        <div className="report-article-actions">
                          {article.url ? (
                            <a href={article.url} target="_blank" rel="noreferrer" className="btn btn-ghost">
                              查看原文
                            </a>
                          ) : null}
                          <a
                            href={`/categories/${encodeURIComponent(categoryId || article.categoryId || '')}/articles/${encodeURIComponent(article.articleId)}`}
                            className="btn btn-ghost"
                          >
                            查看详情
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                {failures.length ? (
                  <section className="report-section">
                    <div className="report-section-title">分析失败</div>
                    <div className="topic-list">
                      {failures.map((failure) => (
                        <article key={failure.articleId} className="topic-card">
                          <div className="topic-title">{failure.title}</div>
                          <div className="topic-desc" style={{ marginTop: 8 }}>{failure.message}</div>
                        </article>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="report-section">
                  <div className="report-section-title">结构化选题洞察</div>
                  <div className="topic-list">
                    {insights.map((insight, index) => (
                      <article key={`${insight.title}-${index}`} className="topic-card">
                        <div className="topic-header">
                          <div className="topic-title">{insight.title}</div>
                          <div className="topic-num">{index + 1}</div>
                        </div>
                        <div className="topic-desc">{insight.insight}</div>
                        <div className="topic-desc" style={{ marginTop: 8 }}>
                          为什么重要：{insight.whyItMatters}
                        </div>
                        <div className="topic-desc" style={{ marginTop: 8 }}>
                          建议方向：{insight.suggestedContentDirection}
                        </div>
                        <div className="topic-tags">
                          {renderTags(insight.keywords || [])}
                          {renderTags([
                            `支撑 ${insight.evidenceArticleIds?.length || 0} 篇`,
                            `置信度 ${Math.round(Number(insight.confidence || 0) * 100)}%`,
                          ], 'warm')}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
