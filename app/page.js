'use client';
import { useState, useEffect } from 'react';
import { mapWechatArticleRowToContentItem } from './data/contentAdapters';
import ContentTab from './components/ContentTab';
import ReportTab from './components/ReportTab';
import SettingsTab from './components/SettingsTab';
import { buildEnabledPlatformOptions, buildVisibleContents } from '../lib/dashboard-view.mjs';
import { getDefaultSettings } from '../lib/default-settings.mjs';

const TABS = [
  { id: 'content', label: '📋 内容' },
  { id: 'report', label: '🧠 选题分析与报告' },
  { id: 'settings', label: '⚙️ 监控设置' },
];

const EMPTY_SETTINGS = {
  platforms: [],
  keywords: [],
  bloggers: [],
};

function resolveActiveCategoryId(categories, preferredCategoryId, currentCategoryId) {
  if (preferredCategoryId && categories.some((category) => category.id === preferredCategoryId)) {
    return preferredCategoryId;
  }

  if (currentCategoryId && categories.some((category) => category.id === currentCategoryId)) {
    return currentCategoryId;
  }

  return categories[0]?.id || '';
}

export default function Home() {
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [activeTab, setActiveTab] = useState('content');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [settingsByCategory, setSettingsByCategory] = useState({});
  const [wechatArticlesByCategory, setWechatArticlesByCategory] = useState({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (!activeCategoryId) {
      return;
    }

    loadCategorySettings(activeCategoryId);
    loadWechatArticles(activeCategoryId);
  }, [activeCategoryId]);

  function toggleTheme() {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  }

  const activeCategory = categories.find(c => c.id === activeCategoryId);
  const activeSettings = activeCategoryId
    ? settingsByCategory[activeCategoryId] || getDefaultSettings(activeCategoryId)
    : EMPTY_SETTINGS;
  const wechatArticles = wechatArticlesByCategory[activeCategoryId] || [];
  const visibleContents = buildVisibleContents(wechatArticles);
  const visiblePlatforms = buildEnabledPlatformOptions(activeSettings.platforms || []);
  const activeCategoryColor = activeCategory?.color || '#6366f1';

  async function loadCategories(preferredCategoryId = '') {
    try {
      setCategoriesLoading(true);

      const response = await fetch('/api/categories', {
        cache: 'no-store',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '加载分类失败');
      }

      const nextCategories = data.categories || [];

      setCategories(nextCategories);
      setActiveCategoryId((currentCategoryId) => resolveActiveCategoryId(
        nextCategories,
        preferredCategoryId,
        currentCategoryId,
      ));
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '加载分类失败',
      });
    } finally {
      setCategoriesLoading(false);
    }
  }

  async function loadCategorySettings(categoryId) {
    try {
      const response = await fetch(`/api/categories/${encodeURIComponent(categoryId)}/settings`, {
        cache: 'no-store',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '加载设置失败');
      }

      setSettingsByCategory((prev) => ({
        ...prev,
        [categoryId]: data.settings,
      }));
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '加载设置失败',
      });
    }
  }

  async function loadWechatArticles(categoryId) {
    try {
      const response = await fetch(`/api/categories/${encodeURIComponent(categoryId)}/articles?platform=wechat`, {
        cache: 'no-store',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '加载公众号内容失败');
      }

      setWechatArticlesByCategory((prev) => ({
        ...prev,
        [categoryId]: (data.articles || []).map(mapWechatArticleRowToContentItem),
      }));
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '加载公众号内容失败',
      });
    }
  }

  async function handleAddCategory() {
    const normalizedName = newCategoryName.trim();

    if (!normalizedName) {
      setStatusMessage({
        type: 'error',
        text: '分类名称不能为空',
      });
      return;
    }

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: normalizedName }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '创建分类失败');
      }

      setCategories((prev) => [...prev, data.category]);
      setActiveCategoryId(data.category.id);
      setNewCategoryName('');
      setShowAddModal(false);
      setActiveTab('content');
      setStatusMessage({
        type: 'success',
        text: `已创建分类「${data.category.name}」`,
      });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '创建分类失败',
      });
    }
  }

  async function handleRenameCategory(category) {
    const nextName = window.prompt('请输入新的分类名称', category.name);

    if (nextName === null) {
      return;
    }

    const normalizedName = nextName.trim();

    if (!normalizedName || normalizedName === category.name) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${encodeURIComponent(category.id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: normalizedName }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '更新分类失败');
      }

      setCategories((prev) => prev.map((item) => (
        item.id === category.id ? data.category : item
      )));
      setStatusMessage({
        type: 'success',
        text: `已重命名为「${data.category.name}」`,
      });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '更新分类失败',
      });
    }
  }

  async function handleDeleteCategory(category) {
    const confirmed = window.confirm(`删除分类「${category.name}」后，会同时删除该分类的监控设置和采集内容。确定继续吗？`);

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${encodeURIComponent(category.id)}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '删除分类失败');
      }

      setCategories(data.categories || []);
      setSettingsByCategory((prev) => {
        const next = { ...prev };
        delete next[category.id];
        return next;
      });
      setWechatArticlesByCategory((prev) => {
        const next = { ...prev };
        delete next[category.id];
        return next;
      });
      setActiveCategoryId((currentCategoryId) => (
        currentCategoryId === category.id
          ? data.nextCategoryId || ''
          : resolveActiveCategoryId(data.categories || [], '', currentCategoryId)
      ));
      setStatusMessage({
        type: 'success',
        text: `已删除分类「${category.name}」`,
      });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '删除分类失败',
      });
    }
  }

  async function handleSaveSettings(payload) {
    setSavingSettings(true);

    try {
      const response = await fetch(`/api/categories/${encodeURIComponent(activeCategoryId)}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '保存设置失败');
      }

      setSettingsByCategory((prev) => ({
        ...prev,
        [activeCategoryId]: data.settings,
      }));
      setStatusMessage({
        type: 'success',
        text: '设置已保存',
      });

      return data.settings;
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '保存设置失败',
      });
      throw error;
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleCollectWechat() {
    if (!activeCategoryId) {
      return;
    }

    setCollecting(true);
    setStatusMessage({
      type: 'info',
      text: '正在采集公众号内容...',
    });

    try {
      const response = await fetch(`/api/categories/${encodeURIComponent(activeCategoryId)}/wechat-collect`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '采集失败');
      }

      const skipSuffix = data.skippedKeywords > 0
        ? `，跳过 ${data.skippedKeywords} 个关键词（${data.skippedDate || '今日'}已有数据）`
        : '';
      await loadWechatArticles(activeCategoryId);
      setStatusMessage({
        type: 'success',
        text: `采集完成：成功 ${data.successfulKeywords} 个关键词，失败 ${data.failedKeywords} 个，新增 ${data.insertedArticles} 条，更新 ${data.updatedArticles} 条${skipSuffix}。`,
      });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '采集失败',
      });
    } finally {
      setCollecting(false);
    }
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
          {categoriesLoading && (
            <div className="sidebar-empty-state">正在加载分类...</div>
          )}
          {!categoriesLoading && !categories.length && (
            <div className="sidebar-empty-state">暂无分类</div>
          )}
          {!categoriesLoading && categories.map(cat => (
            <div
              key={cat.id}
              className={`category-item ${activeCategoryId === cat.id ? 'active' : ''}`}
              onClick={() => { setActiveCategoryId(cat.id); setActiveTab('content'); }}
            >
              <div className="category-dot" style={{ background: cat.color }} />
              <span className="category-name">{cat.name}</span>
              <div className="category-actions">
                <button
                  className="category-action-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRenameCategory(cat);
                  }}
                  title="重命名"
                >
                  改
                </button>
                <button
                  className="category-action-btn danger"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDeleteCategory(cat);
                  }}
                  title="删除"
                >
                  删
                </button>
              </div>
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
              <span className="page-title">{activeCategory?.name || '内容雷达'}</span>
              <span
                className="category-badge"
                style={{
                  background: `${activeCategoryColor}20`,
                  border: `1px solid ${activeCategoryColor}40`,
                  color: activeCategoryColor,
                }}
              >
                监控中
              </span>
            </div>
            <div className="header-actions">
              <button className="btn btn-ghost" onClick={handleCollectWechat} disabled={collecting || !activeCategoryId}>
                <span>{collecting ? '⏳' : '▶'}</span> {collecting ? '采集中...' : '立即运行'}
              </button>
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
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

        {statusMessage && (
          <div style={{
            marginBottom: 16,
            padding: '12px 16px',
            borderRadius: 12,
            border: statusMessage.type === 'success'
              ? '1px solid rgba(16,185,129,0.25)'
              : statusMessage.type === 'error'
                ? '1px solid rgba(239,68,68,0.25)'
                : '1px solid rgba(99,102,241,0.25)',
            background: statusMessage.type === 'success'
              ? 'rgba(16,185,129,0.1)'
              : statusMessage.type === 'error'
                ? 'rgba(239,68,68,0.1)'
                : 'rgba(99,102,241,0.1)',
            color: statusMessage.type === 'success'
              ? 'var(--green)'
              : statusMessage.type === 'error'
                ? '#ef4444'
                : 'var(--accent-light)',
            fontSize: 13,
            fontWeight: 600,
          }}>
            {statusMessage.text}
          </div>
        )}

        {/* Tab 内容 */}
        <div className="tab-content">
          {!activeCategoryId && !categoriesLoading && (
            <div className="empty-state">
              <div className="empty-icon">📂</div>
              <div className="empty-title">暂无可用分类</div>
              <div className="empty-desc">新建一个监控分类后，就可以继续配置关键词和采集公众号内容。</div>
            </div>
          )}
          {activeTab === 'content' && activeCategoryId && (
            <ContentTab contents={visibleContents} platformOptions={visiblePlatforms} />
          )}
          {activeTab === 'report' && activeCategoryId && (
            <ReportTab />
          )}
          {activeTab === 'settings' && activeCategoryId && (
            <SettingsTab
              key={`${activeCategoryId}-${activeSettings.updatedAt || 'default'}`}
              categoryId={activeCategoryId}
              initialData={activeSettings}
              onSaveSettings={handleSaveSettings}
              saving={savingSettings}
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
