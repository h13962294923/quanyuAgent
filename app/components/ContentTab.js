'use client';
import { useState, useMemo } from 'react';
import { RECENT_DATES } from '../data/mockData';
import { SiTiktok, SiXiaohongshu, SiBilibili, SiSinaweibo, SiWechat } from 'react-icons/si';
import { Video } from 'lucide-react';
import { PLATFORM_STYLES } from '../../lib/platform-config.mjs';

function formatDate(date) {
  const d = new Date(date);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function getWeekday(date) {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return '周' + days[new Date(date).getDay()];
}

function formatNumber(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return String(n);
}

const PLATFORM_ICONS = {
  douyin: <SiTiktok />, xiaohongshu: <SiXiaohongshu />, bilibili: <SiBilibili />, weibo: <SiSinaweibo />, wechat: <SiWechat />, shipin: <Video size={14} />
};

const PLATFORM_NAMES = {
  douyin: '抖音', xiaohongshu: '小红书', bilibili: 'B站', weibo: '微博', wechat: '公众号', shipin: '视频号'
};

function isSameDay(d1, d2) {
  const a = new Date(d1), b = new Date(d2);
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export default function ContentTab({ contents, platformOptions }) {
  const [activePlatform, setActivePlatform] = useState('all');
  const [activeDate, setActiveDate] = useState(RECENT_DATES[RECENT_DATES.length - 1]);

  const allContents = useMemo(() => contents || [], [contents]);
  const effectivePlatform = platformOptions.some((item) => item.id === activePlatform) ? activePlatform : 'all';

  // 统计每天的内容数量（用于日期卡片展示）
  const dateCountMap = useMemo(() => {
    const map = {};
    allContents.forEach(item => {
      const key = new Date(item.date).toDateString();
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [allContents]);

  // 根据选中日期+平台进行过滤
  const filteredContents = useMemo(() => {
    return allContents.filter(item => {
      const dateMatch = isSameDay(item.date, activeDate);
      const platformMatch = effectivePlatform === 'all' || item.platform === effectivePlatform;
      return dateMatch && platformMatch;
    });
  }, [allContents, activeDate, effectivePlatform]);

  function getStatLabels(item) {
    return item.statLabels || {
      likes: '点赞',
      comments: '评论',
      shares: '转发',
    };
  }

  return (
    <div>
      {/* 平台筛选 */}
      <div className="platform-filter">
        <span className="platform-label">平台</span>
        {platformOptions.map(p => (
          <button
            key={p.id}
            className={`platform-tag ${effectivePlatform === p.id ? 'active' : ''}`}
            onClick={() => setActivePlatform(p.id)}
          >
            {p.id !== 'all' && <span className="platform-icon" style={{ display: 'flex', alignItems: 'center' }}>{PLATFORM_ICONS[p.id]}</span>}
            {p.name}
          </button>
        ))}
      </div>

      {/* 时间轴日期卡片 */}
      <div className="timeline-section">
        <div className="timeline-label">📅 选择日期 — 点击查看当天采集内容</div>
        <div className="date-scroller">
          {RECENT_DATES.map(date => {
            const key = date.toDateString();
            const count = dateCountMap[key] || 0;
            const isToday = isSameDay(date, new Date());
            const isActive = isSameDay(date, activeDate);
            return (
              <div
                key={key}
                className={`date-card ${isActive ? 'active' : ''} ${count > 0 ? 'has-data' : ''}`}
                onClick={() => setActiveDate(date)}
              >
                <div className="date-card-weekday">{isToday ? '今天' : getWeekday(date)}</div>
                <div className="date-card-day">{new Date(date).getDate()}</div>
                <div className="date-card-count">
                  {count > 0 ? `${count}条` : '无数据'}
                </div>
                <div className="date-card-dot" />
              </div>
            );
          })}
        </div>
      </div>

      {/* 内容列表 */}
      <div className="section-header">
        <div className="section-title">
          {formatDate(activeDate)} 的采集内容
        </div>
        <div className="section-meta">共 {filteredContents.length} 条</div>
      </div>

      {filteredContents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-text">该日期暂无采集内容</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>试试切换其他日期或平台</div>
        </div>
      ) : (
        <div className="content-grid">
          {filteredContents.map(item => {
            const style = PLATFORM_STYLES[item.platform] || {};
            const statLabels = getStatLabels(item);
            return (
              <div key={item.id} className="content-card">
                <div className="content-card-header">
                  <div className="content-card-meta">
                    <span
                      className="content-platform-badge"
                      style={{
                        background: style.bg,
                        color: style.color,
                        border: `1px solid ${style.border}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {PLATFORM_ICONS[item.platform]} {PLATFORM_NAMES[item.platform]}
                    </span>
                    <span className="content-author">{item.author}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {item.isHot && (
                      <span className="content-hot-badge">
                        🔥 热榜 No.{item.rank}
                      </span>
                    )}
                  </div>
                </div>
                <div className="content-title">{item.title}</div>
                <div className="content-snippet">{item.snippet}</div>
                <div className="content-stats">
                  <span className="stat-item">
                    {statLabels.likes} <span className="stat-value">{formatNumber(item.likes)}</span>
                  </span>
                  <span className="stat-item">
                    {statLabels.comments} <span className="stat-value">{formatNumber(item.comments)}</span>
                  </span>
                  <span className="stat-item">
                    {statLabels.shares} <span className="stat-value">{formatNumber(item.shares)}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
