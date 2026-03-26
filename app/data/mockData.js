// 假数据：监控分类、内容、报告、设置

export const CATEGORIES = [
  { id: 'claude', name: 'Claude Code 选题监控', color: '#6366f1', emoji: '🤖' },
  { id: 'vibe', name: 'Vibe Coding 选题监控', color: '#10b981', emoji: '🎵' },
  { id: 'aigc', name: 'AIGC 创作者监控', color: '#f59e0b', emoji: '✨' },
];

export const PLATFORMS = [
  { id: 'all', name: '全部' },
  { id: 'douyin', name: '抖音', color: '#000000' },
  { id: 'xiaohongshu', name: '小红书', color: '#fe2c55' },
  { id: 'bilibili', name: 'B站', color: '#00a1d6' },
  { id: 'weibo', name: '微博', color: '#e6162d' },
  { id: 'wechat', name: '公众号', color: '#07c160' },
  { id: 'shipin', name: '视频号', color: '#ff7700' },
];

const PLATFORM_STYLES = {
  douyin: { bg: 'rgba(0,0,0,0.4)', color: '#ffffff', border: 'rgba(255,255,255,0.15)' },
  xiaohongshu: { bg: 'rgba(254,44,85,0.12)', color: '#fe2c55', border: 'rgba(254,44,85,0.2)' },
  bilibili: { bg: 'rgba(0,161,214,0.12)', color: '#00a1d6', border: 'rgba(0,161,214,0.2)' },
  weibo: { bg: 'rgba(230,22,45,0.12)', color: '#e6162d', border: 'rgba(230,22,45,0.2)' },
  wechat: { bg: 'rgba(7,193,96,0.12)', color: '#07c160', border: 'rgba(7,193,96,0.2)' },
  shipin: { bg: 'rgba(255,119,0,0.12)', color: '#ff7700', border: 'rgba(255,119,0,0.2)' },
};
export { PLATFORM_STYLES };

// 生成最近7天日期
function getRecentDates() {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d);
  }
  return dates;
}

export const RECENT_DATES = getRecentDates();

// 各分类内容假数据
export const CONTENT_DATA = {
  claude: [
    {
      id: 1, platform: 'xiaohongshu', author: '@AI效率控', date: new Date(Date.now() - 0 * 86400000),
      title: '用 Claude Code 写了整个项目，代码质量比自己手撸强 10 倍',
      snippet: '分享下最近用 Claude Code 完成的一个全栈项目，从需求分析到部署上线全程 AI 辅助，效率提升太明显了……',
      likes: 12400, comments: 876, shares: 2310, isHot: true, rank: 1,
    },
    {
      id: 2, platform: 'douyin', author: '@程序员老王', date: new Date(Date.now() - 0 * 86400000),
      title: '用 Claude Code 1小时开发了一个完整 APP，附完整流程',
      snippet: '今天给大家展示一下如何借助 Claude Code 从0到1开发一个 APP，全程无需手动写一行代码……',
      likes: 8900, comments: 543, shares: 1780, isHot: true, rank: 2,
    },
    {
      id: 3, platform: 'bilibili', author: '@代码阿杰', date: new Date(Date.now() - 0 * 86400000),
      title: 'Claude Code vs. Cursor：深度对比测评，谁更适合独立开发者？',
      snippet: '做了一周的深度对比测试，两款 AI 编程工具在代码质量、上下文理解、价格等方面的全面对比……',
      likes: 6300, comments: 921, shares: 1120, isHot: false, rank: 3,
    },
    {
      id: 4, platform: 'weibo', author: '@AI工具集', date: new Date(Date.now() - 1 * 86400000),
      title: '【爆】Claude Code 开放了 Artifacts 功能，直接在对话中预览运行代码',
      snippet: '刚刚试用了 Claude 最新 Artifacts 功能，终于可以实时预览 HTML/React 组件了，前端开发者的福音……',
      likes: 4200, comments: 389, shares: 876, isHot: true, rank: 1,
    },
    {
      id: 5, platform: 'xiaohongshu', author: '@Cici的数字笔记', date: new Date(Date.now() - 1 * 86400000),
      title: 'Claude Code 入门教程｜零基础也能用 AI 做出自己的工具',
      snippet: '作为一个非技术背景的产品经理，我是如何用 Claude Code 独立完成数据分析工具开发的……',
      likes: 9800, comments: 1203, shares: 3400, isHot: true, rank: 2,
    },
    {
      id: 6, platform: 'wechat', author: '独立开发者联盟', date: new Date(Date.now() - 1 * 86400000),
      title: '深度：从 ChatGPT 到 Claude Code，AI 编程的范式转变',
      snippet: '本文将从工程师视角分析为什么 Claude Code 代表了一种全新的人机协作编程范式，以及它对行业的影响……',
      likes: 3100, comments: 245, shares: 987, isHot: false, rank: 3,
    },
    {
      id: 7, platform: 'douyin', author: '@一休的副业笔记', date: new Date(Date.now() - 2 * 86400000),
      title: '月入一万的 Claude Code 副业路：我用 AI 帮客户做定制工具',
      snippet: '分享我如何利用 Claude Code 接单做副业，客单价从 500 到 5000 的进化历程……',
      likes: 15200, comments: 2341, shares: 4567, isHot: true, rank: 1,
    },
    {
      id: 8, platform: 'bilibili', author: '@技术兔子', date: new Date(Date.now() - 2 * 86400000),
      title: '用 Claude Code 重构了 10 年前的老项目，效果惊人',
      snippet: '最近尝试用 Claude Code 对一个遗留项目进行重构，分享全过程以及踩过的坑……',
      likes: 4800, comments: 567, shares: 890, isHot: false, rank: 2,
    },
    {
      id: 9, platform: 'xiaohongshu', author: '@创业小闪电', date: new Date(Date.now() - 3 * 86400000),
      title: '创业公司如何用 Claude Code 削减 60% 的开发成本',
      snippet: '作为一个小团队 CTO，分享我们是如何通过 AI 工具重塑开发流程，大幅降低人力成本……',
      likes: 7600, comments: 834, shares: 1560, isHot: true, rank: 1,
    },
    {
      id: 10, platform: 'douyin', author: '@前端方大厨', date: new Date(Date.now() - 3 * 86400000),
      title: 'Claude Code 写出高性能 React 组件，性能优化到底有多强',
      snippet: '实测了 Claude Code 对 React 组件的性能优化能力，从 FCP 到 bundle size 全方位测评……',
      likes: 5300, comments: 423, shares: 780, isHot: false, rank: 2,
    },
  ],
  vibe: [
    {
      id: 101, platform: 'xiaohongshu', author: '@氛围感制造局', date: new Date(Date.now() - 0 * 86400000),
      title: 'Vibe Coding 到底是什么？手把手带你感受编程新体验',
      snippet: '最近「Vibe Coding」这个词火了，到底什么是用氛围感编程？和传统编程有什么区别……',
      likes: 18700, comments: 2104, shares: 5600, isHot: true, rank: 1,
    },
    {
      id: 102, platform: 'bilibili', author: '@Dev冥想空间', date: new Date(Date.now() - 0 * 86400000),
      title: '【放松向】Vibe Coding 直播回放：边听 lofi 边写代码，超解压',
      snippet: '这次直播用了 Vibe Coding 的方式，背景音乐 + 咖啡香 + AI 辅助，4小时完成一个项目……',
      likes: 9200, comments: 1567, shares: 2300, isHot: true, rank: 2,
    },
  ],
  aigc: [
    {
      id: 201, platform: 'weibo', author: '@AI创作实验室', date: new Date(Date.now() - 0 * 86400000),
      title: '2024 AIGC 内容创作者能力图谱：你在哪个阶段？',
      snippet: '整理了目前 AIGC 创作者的不同阶段和能力要求，从工具使用者到 AI 导演的成长路径……',
      likes: 11300, comments: 987, shares: 3200, isHot: true, rank: 1,
    },
  ],
};

// 选题报告假数据
export const REPORTS_DATA = {
  claude: [
    {
      date: new Date(Date.now() - 0 * 86400000),
      hot_summary: '今日热点聚焦在 Claude Code 实战案例与副业变现，AI 编程工具竞争格局讨论持续升温。',
      analyzed_count: 10,
      topics: [
        {
          id: 1,
          title: '非技术人也能用 AI 开发产品：入门路径与实操分享',
          intro: '越来越多非技术背景用户开始尝试 AI 编程工具，这一群体的入门困惑、工具选择、成功案例是当前内容蓝海。',
          boom: '受众广，焦虑感强（怕被 AI 淘汰），操作门槛高导致强烈的内容需求。',
          growth: '搜索量环比上周增长 43%，月均互动量超同类内容 2.3 倍。',
          tags: ['入门教程', '大众向', '🔥高增长'],
        },
        {
          id: 2,
          title: 'AI 编程工具深度横评：Claude Code vs. Cursor vs. GitHub Copilot',
          intro: '开发者每天面临工具选择困惑，横评内容能直接帮助决策，是高价值高留存类内容。',
          boom: '专业感强，能建立权威形象；大量工具厂商投放预算跟进此类话题。',
          growth: '评论区互动率高于均值 186%，收藏率达 34%。',
          tags: ['测评对比', '技术向', '💰高商业价值'],
        },
        {
          id: 3,
          title: 'Claude Code 副业实战：从接单到交付完整流程',
          intro: '副业变现话题本身自带流量，结合 AI 工具形成"低门槛赚钱"叙事，市场空间巨大。',
          boom: '副业 + AI 双热词叠加，吸引创业者、在职人员、应届生多个群体。',
          growth: '变现类内容在 B站/小红书的完播率比普通内容高 67%。',
          tags: ['变现实战', '副业', '📈爆款潜力'],
        },
      ],
      insights: [
        { label: '昨日热度最高平台', value: '小红书', trend: '↑ 互动量较前日 +28%', color: 'pink' },
        { label: '最受关注关键词', value: '"AI副业"、"Claude入门"', trend: '新兴词，建议布局', color: 'purple' },
        { label: '最佳发布时间', value: '晚间 20:00-22:00', trend: '该时段互动率峰值', color: 'green' },
        { label: '内容形式趋势', value: '实操 + 结果展示', trend: '图文完读率高于视频', color: 'orange' },
      ],
    },
    {
      date: new Date(Date.now() - 1 * 86400000),
      analyzed_count: 10,
      hot_summary: '昨日热点以 Claude Code 新功能解析和学习路线为主，知识类内容互动质量高。',
      topics: [
        {
          id: 4,
          title: 'Claude Code Artifacts 功能上手体验：前端开发的新玩法',
          intro: '新功能上线带来天然流量窗口，抢先体验内容能获得大量自然搜索流量。',
          boom: '功能本身新颖，具有"哇点"，适合短视频快速演示。',
          growth: '新功能发布后 48h 是内容红利期，建议立即制作。',
          tags: ['新功能', '抢先体验', '⚡时效性强'],
        },
        {
          id: 5,
          title: '创业公司 AI 转型实录：如何用 Claude Code 重建研发流程',
          intro: '企业级 AI 应用场景正在快速增长，B端决策者是高价值受众群体。',
          boom: '真实案例数据支撑，可信度高，LinkedIn/知识星球分发效果好。',
          growth: 'B端内容转化率是 C端的 3.5 倍，单篇商业价值更高。',
          tags: ['企业应用', 'B端', '💼高转化'],
        },
      ],
      insights: [
        { label: '昨日最高互动内容', value: '教程类，平均赞 9800', trend: '教程内容持续强势', color: 'green' },
        { label: '上升关键词', value: '"Artifacts"、"前端AI"', trend: '建议本周跟进', color: 'purple' },
        { label: '评论区高频词', value: '"怎么收费"、"有没有免费的"', trend: '价格内容有需求', color: 'orange' },
        { label: '用户画像趋势', value: '学生群体占比上升至 31%', trend: '内容可向入门倾斜', color: 'pink' },
      ],
    },
  ],
};

// 监控设置假数据
export const SETTINGS_DATA = {
  claude: {
    platforms: ['xiaohongshu', 'douyin', 'bilibili', 'weibo', 'wechat', 'shipin'],
    keywords: ['Claude Code', 'AI编程', 'Claude 3.5', 'AI写代码', 'Anthropic', '代码助手'],
    bloggers: [
      { id: 1, name: '程序员老王', platform: 'douyin', followers: '48.2万', avatar: '👨‍💻' },
      { id: 2, name: 'Cici的数字笔记', platform: 'xiaohongshu', followers: '23.1万', avatar: '👩‍💼' },
      { id: 3, name: '一休的副业笔记', platform: 'xiaohongshu', followers: '61.7万', avatar: '🧑‍🎨' },
      { id: 4, name: '代码阿杰', platform: 'bilibili', followers: '15.3万', avatar: '👨‍🎓' },
      { id: 5, name: 'AI工具集', platform: 'weibo', followers: '120.5万', avatar: '🤖' },
    ],
  },
  vibe: {
    platforms: ['xiaohongshu', 'douyin', 'bilibili'],
    keywords: ['Vibe Coding', '氛围编程', 'lofi coding', 'AI创作氛围'],
    bloggers: [
      { id: 6, name: '氛围感制造局', platform: 'xiaohongshu', followers: '89.4万', avatar: '🎨' },
      { id: 7, name: 'Dev冥想空间', platform: 'bilibili', followers: '34.6万', avatar: '🧘' },
    ],
  },
  aigc: {
    platforms: ['weibo', 'xiaohongshu', 'wechat'],
    keywords: ['AIGC', 'AI创作', 'AI绘画', '文生视频', 'Sora', 'Midjourney'],
    bloggers: [
      { id: 8, name: 'AI创作实验室', platform: 'weibo', followers: '67.2万', avatar: '🔬' },
    ],
  },
};
