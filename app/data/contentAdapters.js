function normalizePublishTime(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value * 1000).toISOString();
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    const numeric = Number(trimmed);

    if (trimmed && Number.isFinite(numeric) && /^\d+(\.\d+)?$/.test(trimmed)) {
      return new Date(numeric * 1000).toISOString();
    }

    if (trimmed.includes(' ')) {
      return trimmed.replace(' ', 'T');
    }
  }

  return value;
}

export function mapWechatArticleRowToContentItem(article) {
  const publishTime = normalizePublishTime(article.publish_time);

  return {
    id: `wechat-${article.id}`,
    platform: 'wechat',
    author: article.wx_name || article.wx_id || '公众号',
    date: publishTime,
    title: article.title,
    snippet: article.snippet || article.content || '',
    likes: Number(article.read_count || 0),
    comments: Number(article.praise_count || 0),
    shares: Number(article.looking_count || 0),
    statLabels: {
      likes: '阅读',
      comments: '点赞',
      shares: '在看',
    },
    isHot: false,
    rank: null,
  };
}
