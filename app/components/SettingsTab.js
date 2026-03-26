'use client';
import { useState } from 'react';
import { PLATFORM_STYLES } from '../data/mockData';
import { SiTiktok, SiXiaohongshu, SiBilibili, SiSinaweibo, SiWechat } from 'react-icons/si';
import { Video } from 'lucide-react';

const ALL_PLATFORMS = [
  { id: 'douyin', name: '抖音', desc: '短视频' },
  { id: 'xiaohongshu', name: '小红书', desc: '图文/视频' },
  { id: 'bilibili', name: 'B站', desc: '中长视频' },
  { id: 'weibo', name: '微博', desc: '微博文章' },
  { id: 'wechat', name: '公众号', desc: '长文章' },
  { id: 'shipin', name: '视频号', desc: '社交短视频' },
];

const PLATFORM_NAMES = { douyin: '抖音', xiaohongshu: '小红书', bilibili: 'B站', weibo: '微博', wechat: '公众号', shipin: '视频号' };
const PLATFORM_ICONS = { douyin: <SiTiktok />, xiaohongshu: <SiXiaohongshu />, bilibili: <SiBilibili />, weibo: <SiSinaweibo />, wechat: <SiWechat />, shipin: <Video size={14} /> };

export default function SettingsTab({ categoryId, initialData }) {
  const [enabledPlatforms, setEnabledPlatforms] = useState(initialData?.platforms || []);
  const [keywords, setKeywords] = useState(initialData?.keywords || []);
  const [bloggers, setBloggers] = useState(initialData?.bloggers || []);
  const [newKeyword, setNewKeyword] = useState('');
  const [newBloggerName, setNewBloggerName] = useState('');
  const [newBloggerPlatform, setNewBloggerPlatform] = useState('xiaohongshu');

  function togglePlatform(id) {
    setEnabledPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }

  function addKeyword() {
    if (!newKeyword.trim()) return;
    setKeywords(prev => [...prev, newKeyword.trim()]);
    setNewKeyword('');
  }

  function removeKeyword(kw) {
    setKeywords(prev => prev.filter(k => k !== kw));
  }

  function addBlogger() {
    if (!newBloggerName.trim()) return;
    const avatars = ['👤', '🧑', '👩', '👨', '🙂'];
    setBloggers(prev => [...prev, {
      id: Date.now(),
      name: newBloggerName.trim(),
      platform: newBloggerPlatform,
      followers: '未知',
      avatar: avatars[Math.floor(Math.random() * avatars.length)],
    }]);
    setNewBloggerName('');
  }

  function removeBlogger(id) {
    setBloggers(prev => prev.filter(b => b.id !== id));
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div className="section-title">⚙️ 监控设置</div>
        <button className="btn btn-primary">
          💾 保存设置
        </button>
      </div>

      {/* 监控平台 */}
      <div className="settings-section">
        <div className="settings-section-header">
          <div>
            <div className="settings-section-title">📡 监控平台</div>
            <div className="settings-section-desc" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              选择需要采集内容的平台，点击切换开启/关闭
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            已启用 {enabledPlatforms.length}/{ALL_PLATFORMS.length}
          </div>
        </div>
        <div className="platform-grid">
          {ALL_PLATFORMS.map(p => {
            const isEnabled = enabledPlatforms.includes(p.id);
            const style = PLATFORM_STYLES[p.id] || {};
            return (
              <div
                key={p.id}
                className={`platform-card ${isEnabled ? 'enabled' : ''}`}
                onClick={() => togglePlatform(p.id)}
                style={isEnabled ? { borderColor: style.border, background: style.bg } : {}}
              >
                <div className="platform-card-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, fontSize: 24 }}>
                  {PLATFORM_ICONS[p.id]}
                </div>
                <div className="platform-card-name" style={isEnabled ? { color: style.color } : {}}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{p.desc}</div>
                <div className="platform-toggle">
                  {isEnabled ? '✓' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="divider" />

      {/* 对标关键词 */}
      <div className="settings-section">
        <div className="settings-section-header">
          <div>
            <div className="settings-section-title">🔑 对标关键词</div>
            <div className="settings-section-desc" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              添加需要监控的关键词，系统将采集包含这些词的热门内容
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>共 {keywords.length} 个关键词</div>
        </div>
        <div className="keyword-list">
          {keywords.map(kw => (
            <div key={kw} className="keyword-item">
              <div className="keyword-text">
                <span style={{ color: 'var(--accent-light)', fontSize: 14 }}>#</span>
                {kw}
              </div>
              <div className="keyword-actions">
                <button className="icon-btn danger" onClick={() => removeKeyword(kw)} title="删除">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="add-input-row">
          <input
            className="input"
            placeholder="输入关键词后按 Enter 添加"
            value={newKeyword}
            onChange={e => setNewKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addKeyword()}
          />
          <button className="btn btn-primary" onClick={addKeyword}>添加</button>
        </div>
      </div>

      <div className="divider" />

      {/* 对标博主 */}
      <div className="settings-section">
        <div className="settings-section-header">
          <div>
            <div className="settings-section-title">👤 对标博主 / 账号</div>
            <div className="settings-section-desc" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              添加需要跟踪的博主账号，系统将优先采集其最新内容
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>共 {bloggers.length} 个账号</div>
        </div>
        <div className="blogger-grid">
          {bloggers.map(b => {
            const style = PLATFORM_STYLES[b.platform] || {};
            return (
              <div key={b.id} className="blogger-card">
                <div
                  className="blogger-avatar"
                  style={{ background: style.bg || 'var(--bg-hover)', border: `1px solid ${style.border || 'var(--border)'}` }}
                >
                  {b.avatar}
                </div>
                <div className="blogger-info">
                  <div className="blogger-name">{b.name}</div>
                  <div className="blogger-platform" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {PLATFORM_ICONS[b.platform]} {PLATFORM_NAMES[b.platform]}
                  </div>
                  <div className="blogger-followers">{b.followers} 粉丝</div>
                </div>
                <button className="icon-btn danger" onClick={() => removeBlogger(b.id)} title="移除">
                  ✕
                </button>
              </div>
            );
          })}
        </div>
        <div className="add-input-row" style={{ marginTop: 12 }}>
          <select
            className="input"
            style={{ flex: 'none', width: 110 }}
            value={newBloggerPlatform}
            onChange={e => setNewBloggerPlatform(e.target.value)}
          >
            {Object.entries(PLATFORM_NAMES).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="输入博主名称或账号 ID"
            value={newBloggerName}
            onChange={e => setNewBloggerName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addBlogger()}
          />
          <button className="btn btn-primary" onClick={addBlogger}>添加</button>
        </div>
      </div>

      <div className="divider" />

      {/* 定时任务说明 */}
      <div className="settings-section">
        <div className="settings-section-title">🕐 运行计划</div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>每天自动运行一次</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                每天 08:00 自动采集内容并生成选题分析报告
              </div>
            </div>
            <div style={{
              background: 'var(--green-bg)',
              border: '1px solid rgba(16,185,129,0.25)',
              color: 'var(--green)',
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
            }}>
              🟢 已启用
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
