'use client';
import { useState, useMemo } from 'react';
import { REPORTS_DATA, RECENT_DATES } from '../data/mockData';

function formatDateFull(date) {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}月${day}日`;
}

function formatDateMonth(date) {
  const d = new Date(date);
  return (d.getMonth() + 1) + '月';
}

function isSameDay(d1, d2) {
  const a = new Date(d1); const b = new Date(d2);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const INSIGHT_COLORS = {
  green: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', color: '#10b981' },
  purple: { bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.2)', color: '#a855f7' },
  orange: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', color: '#f59e0b' },
  pink: { bg: 'rgba(236,72,153,0.1)', border: 'rgba(236,72,153,0.2)', color: '#ec4899' },
};

const TAG_COLORS = [
  { bg: 'var(--accent-bg)', color: 'var(--accent-light)', border: 'rgba(99,102,241,0.25)' },
  { bg: 'var(--green-bg)', color: 'var(--green)', border: 'rgba(16,185,129,0.25)' },
  { bg: 'var(--orange-bg)', color: 'var(--orange)', border: 'rgba(245,158,11,0.25)' },
  { bg: 'var(--purple-bg)', color: 'var(--purple)', border: 'rgba(168,85,247,0.25)' },
];

export default function ReportTab({ categoryId }) {
  const reports = REPORTS_DATA[categoryId] || REPORTS_DATA['claude'];
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'topics'
  const [activeReportDate, setActiveReportDate] = useState(reports[0]?.date ?? null);

  const activeReport = useMemo(() =>
    reports.find(r => activeReportDate && isSameDay(r.date, activeReportDate)),
    [reports, activeReportDate]
  );

  // 所有选题汇总（跨日期）
  const allTopics = useMemo(() => {
    return reports.flatMap(r =>
      r.topics.map(t => ({ ...t, reportDate: r.date }))
    );
  }, [reports]);

  return (
    <div>
      {/* 视图切换 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="section-title">📊 选题分析与报告</div>
        <div className="view-toggle">
          <button
            className={`view-toggle-btn ${viewMode === 'timeline' ? 'active' : ''}`}
            onClick={() => setViewMode('timeline')}
          >
            📅 按日期
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'topics' ? 'active' : ''}`}
            onClick={() => setViewMode('topics')}
          >
            💡 所有选题
          </button>
        </div>
      </div>

      {/* 时间线模式 */}
      {viewMode === 'timeline' && (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
          {/* 左侧日期列表 */}
          <div>
            <div className="timeline-label" style={{ marginBottom: 10 }}>📅 选择日期</div>
            <div className="report-date-list">
              {reports.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>
                  暂无报告，请先运行监控
                </div>
              ) : (
                reports.map(r => {
                  const isActive = activeReportDate && isSameDay(r.date, activeReportDate);
                  const isToday = isSameDay(r.date, new Date());
                  return (
                    <div
                      key={r.date.toString()}
                      className={`report-date-item ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveReportDate(r.date)}
                    >
                      <div className="report-date-badge">
                        <div className="report-date-month">{formatDateMonth(r.date)}</div>
                        <div className="report-date-num">{new Date(r.date).getDate()}</div>
                      </div>
                      <div className="report-date-info">
                        <div className="report-date-title">
                          {isToday ? '今日报告 🆕' : formatDateFull(r.date) + ' 报告'}
                        </div>
                        <div className="report-date-preview">{r.hot_summary?.slice(0, 28)}...</div>
                      </div>
                      <div className="report-topic-count">{r.topics.length} 选题</div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 未来日期提示 */}
            <div style={{ padding: '12px', background: 'var(--bg-card)', border: '1px dashed var(--border-light)', borderRadius: 10, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              <div style={{ marginBottom: 4 }}>🕐 下次运行</div>
              <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>明天 08:00</div>
            </div>
          </div>

          {/* 右侧报告内容 */}
          <div>
            {!activeReport ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <div className="empty-text">请选择左侧日期查看报告</div>
              </div>
            ) : (
              <div className="report-content">
                <div className="report-header">
                  <div className="report-title">
                    {formatDateFull(activeReport.date)} · AI 选题分析报告
                  </div>
                  <div className="report-summary">{activeReport.hot_summary}</div>
                  <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                    📊 分析了 {activeReport.analyzed_count} 条热门内容 · 由 ChatGPT 生成
                  </div>
                </div>
                <div className="report-body">
                  {/* 选题建议 */}
                  <div className="report-section">
                    <div className="report-section-title">
                      <span>💡</span> 选题建议
                    </div>
                    <div className="topic-list">
                      {activeReport.topics.map((topic, idx) => (
                        <div key={topic.id} className="topic-card">
                          <div className="topic-header">
                            <div className="topic-title">{topic.title}</div>
                            <div className="topic-num">{idx + 1}</div>
                          </div>
                          <div className="topic-desc">
                            <span style={{ color: 'var(--text-muted)', marginRight: 4 }}>📌 选题简介：</span>
                            {topic.intro}
                          </div>
                          <div className="topic-desc" style={{ marginTop: 6 }}>
                            <span style={{ color: 'var(--orange)', marginRight: 4 }}>🔥 爆点：</span>
                            {topic.boom}
                          </div>
                          <div className="topic-desc" style={{ marginTop: 6 }}>
                            <span style={{ color: 'var(--green)', marginRight: 4 }}>📈 增长空间：</span>
                            {topic.growth}
                          </div>
                          <div className="topic-tags">
                            {topic.tags.map((tag, i) => {
                              const tc = TAG_COLORS[i % TAG_COLORS.length];
                              return (
                                <span key={tag} className="topic-tag" style={{ background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
                                  {tag}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="divider" />

                  {/* 洞察数据 */}
                  <div className="report-section">
                    <div className="report-section-title">
                      <span>🎯</span> 数据洞察
                    </div>
                    <div className="insight-grid">
                      {activeReport.insights.map(ins => {
                        const style = INSIGHT_COLORS[ins.color] || INSIGHT_COLORS.green;
                        return (
                          <div key={ins.label} className="insight-card" style={{ borderColor: style.border, background: style.bg }}>
                            <div className="insight-label">{ins.label}</div>
                            <div className="insight-value" style={{ color: style.color }}>{ins.value}</div>
                            <div className="insight-trend" style={{ color: 'var(--text-muted)' }}>{ins.trend}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 所有选题模式 */}
      {viewMode === 'topics' && (
        <div>
          <div className="section-header" style={{ marginBottom: 16 }}>
            <div className="section-title">近期全部选题汇总</div>
            <div className="section-meta">共 {allTopics.length} 个选题</div>
          </div>
          <div className="topics-all-grid">
            {allTopics.map((topic, idx) => (
              <div key={`${topic.id}-${idx}`} className="topic-all-card">
                <div className="topic-all-date">📅 {formatDateFull(topic.reportDate)}</div>
                <div className="topic-all-title">{topic.title}</div>
                <div className="topic-all-desc">{topic.intro}</div>
                <div className="topic-tags" style={{ marginTop: 8 }}>
                  {topic.tags.slice(0, 2).map((tag, i) => {
                    const tc = TAG_COLORS[i % TAG_COLORS.length];
                    return (
                      <span key={tag} className="topic-tag" style={{ background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
                        {tag}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
