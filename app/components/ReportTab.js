'use client';
export default function ReportTab() {
  return (
    <div>
      <div className="section-title" style={{ marginBottom: 20 }}>📊 选题分析与报告</div>
      <div className="empty-state" style={{ minHeight: 320 }}>
        <div className="empty-icon">📝</div>
        <div className="empty-text">报告功能暂未接入真实数据</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 420 }}>
          当前页面只展示真实采集内容。报告模块会在后续版本接入基于真实内容的分析结果。
        </div>
      </div>
    </div>
  );
}
