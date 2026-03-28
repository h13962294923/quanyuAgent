export const DEFAULT_SETTINGS_BY_CATEGORY = {
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

export function getDefaultSettings(categoryId) {
  return DEFAULT_SETTINGS_BY_CATEGORY[categoryId] || {
    platforms: [],
    keywords: [],
    bloggers: [],
  };
}
