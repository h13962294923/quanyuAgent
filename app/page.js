'use client';
import { useState, useEffect } from 'react';
import { CATEGORIES, SETTINGS_DATA } from './data/mockData';
import ContentTab from './components/ContentTab';
import ReportTab from './components/ReportTab';
import SettingsTab from './components/SettingsTab';

const TABS = [
  { id: 'content', label: '📋 内容' },
  { id: 'report', label: '🧠 选题分析与报告' },
  { id: 'settings', label: '⚙️ 监控设置' },
];

export default function Home() {
  const [activeCategoryId, setActiveCategoryId] = useState(CATEGORIES[0].id);
  const [activeTab, setActiveTab] = useState('content');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categories, setCategories] = useState(CATEGORIES);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  function toggleTheme() {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  }

  const activeCategory = categories.find(c => c.id === activeCategoryId);

  function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    const colors = ['#a855f7', '#06b6d4', '#ec4899'];
    const emojis = ['📡', '🔍', '🚀'];
    const idx = categories.length % 3;
    const newCat = {
      id: `cat_${Date.now()}`,
      name: newCategoryName.trim(),
      color: colors[idx],
      emoji: emojis[idx],
    };
    setCategories([...categories, newCat]);
    setActiveCategoryId(newCat.id);
    setNewCategoryName('');
    setShowAddModal(false);
  }

  return (
    <div className="app-layout">
      {/* 侧边栏 */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">📡</div>
            <span className="logo-title">内容雷达</span>
          </div>
          <div className="sidebar-subtitle">全域内容监控平台</div>
        </div>

        <div className="sidebar-section-title">监控分类</div>

        <nav className="sidebar-nav">
          {categories.map(cat => (
            <div
              key={cat.id}
              className={`category-item ${activeCategoryId === cat.id ? 'active' : ''}`}
              onClick={() => { setActiveCategoryId(cat.id); setActiveTab('content'); }}
            >
              <div className="category-dot" style={{ background: cat.color }} />
              <span className="category-name">{cat.name}</span>
            </div>
          ))}
          <button className="add-category-btn" onClick={() => setShowAddModal(true)}>
            <span>＋</span> 新增分类
          </button>
        </nav>

        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="schedule-badge">
            <span>🕐</span>
            <span>每天 08:00 自动运行</span>
          </div>
          <button 
            className="btn btn-ghost" 
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? '☀️ 切换至浅色模式' : '🌙 切换至深色模式'}
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="main-content">
        {/* 顶部 Header */}
        <header className="main-header">
          <div className="header-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="page-title">{activeCategory?.name}</span>
              <span
                className="category-badge"
                style={{
                  background: `${activeCategory?.color}20`,
                  border: `1px solid ${activeCategory?.color}40`,
                  color: activeCategory?.color,
                }}
              >
                {activeCategory?.emoji} 监控中
              </span>
            </div>
            <div className="header-actions">
              <button className="btn btn-ghost">
                <span>▶</span> 立即运行
              </button>
              <button className="btn btn-primary">
                <span>+</span> 新增分类
              </button>
            </div>
          </div>

          {/* Tab 切换 */}
          <div className="tab-bar">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {/* Tab 内容 */}
        <div className="tab-content">
          {activeTab === 'content' && (
            <ContentTab categoryId={activeCategoryId} />
          )}
          {activeTab === 'report' && (
            <ReportTab categoryId={activeCategoryId} />
          )}
          {activeTab === 'settings' && (
            <SettingsTab
              categoryId={activeCategoryId}
              initialData={SETTINGS_DATA[activeCategoryId] || SETTINGS_DATA['claude']}
            />
          )}
        </div>
      </main>

      {/* 新增分类弹窗 */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">新增监控分类</div>
            <input
              className="input"
              placeholder="请输入分类名称，如：AI视频选题监控"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleAddCategory}>创建分类</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
