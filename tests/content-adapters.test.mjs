import test from 'node:test';
import assert from 'node:assert/strict';

import { mapWechatArticleRowToContentItem } from '../app/data/contentAdapters.js';

test('mapWechatArticleRowToContentItem converts unix timestamp strings into valid dates', () => {
  const item = mapWechatArticleRowToContentItem({
    id: 1,
    category_id: 'claude',
    title: '测试文章',
    url: 'https://mp.weixin.qq.com/s/test',
    content: '正文',
    wx_name: '测试号',
    publish_time: '1774689652.0',
    read_count: 12,
    praise_count: 3,
    looking_count: 1,
  });

  assert.equal(Number.isNaN(new Date(item.date).getTime()), false);
  assert.equal(new Date(item.date).getUTCFullYear(), 2026);
  assert.equal(new Date(item.date).getUTCMonth(), 2);
  assert.equal(item.articleId, '1');
  assert.equal(item.categoryId, 'claude');
  assert.equal(item.url, 'https://mp.weixin.qq.com/s/test');
  assert.equal(item.content, '正文');
  assert.equal(item.id, 'wechat-1');
  assert.equal(item.title, '测试文章');
});
