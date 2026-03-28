import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildEnabledPlatformOptions,
  buildVisibleContents,
} from '../lib/dashboard-view.mjs';

test('buildEnabledPlatformOptions only returns platforms enabled in settings', () => {
  assert.deepEqual(
    buildEnabledPlatformOptions(['wechat', 'weibo']).map((item) => item.id),
    ['all', 'weibo', 'wechat'],
  );
});

test('buildVisibleContents returns only real collected content', () => {
  const wechatArticles = [
    { id: 'wechat-1', platform: 'wechat', title: '真实文章' },
  ];

  assert.deepEqual(buildVisibleContents(wechatArticles), wechatArticles);
  assert.deepEqual(buildVisibleContents([]), []);
});
