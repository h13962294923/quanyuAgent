import { normalizePublishTimeValue } from '../../lib/publish-time.mjs';

export function mapWechatArticleRowToContentItem(article) {
  const publishTime = normalizePublishTimeValue(article.publish_time);

  return {
    id: `wechat-${article.id}`,
    articleId: String(article.id),
    categoryId: article.category_id || '',
    platform: 'wechat',
    author: article.wx_name || article.wx_id || '公众号',
    date: publishTime,
    title: article.title,
    url: article.url || '',
    content: article.content || '',
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
