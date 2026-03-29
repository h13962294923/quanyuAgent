const WECHAT_SEARCH_URL = 'https://www.dajiala.com/fbmain/monitor/v3/kw_search';

function compactWhitespace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildWechatSearchPayload({ keyword, apiKey, period = 1 }) {
  return {
    kw: keyword,
    any_kw: '',
    ex_kw: '',
    period,
    page: 1,
    sort_type: 1,
    mode: 1,
    type: 1,
    verifycode: '',
    key: apiKey,
  };
}

export function normalizeWechatApiArticle({ categoryId, keyword, item }) {
  const content = compactWhitespace(item.content);
  const now = new Date().toISOString();

  return {
    category_id: categoryId,
    keyword,
    title: compactWhitespace(item.title),
    url: item.url,
    short_link: item.short_link ?? '',
    content,
    snippet: content.slice(0, 180),
    avatar: item.avatar ?? '',
    publish_time: item.publish_time,
    update_time: item.update_time ?? item.publish_time,
    wx_name: compactWhitespace(item.wx_name),
    wx_id: compactWhitespace(item.wx_id),
    ghid: compactWhitespace(item.ghid),
    read_count: toNumber(item.read),
    praise_count: toNumber(item.praise),
    looking_count: toNumber(item.looking),
    ip_wording: compactWhitespace(item.ip_wording),
    classify: compactWhitespace(item.classify),
    is_original: toNumber(item.is_original),
    created_at: now,
    updated_at: now,
  };
}

function isRetryableInternalError(payload) {
  return payload?.message === 'Internal Server Error';
}

export async function collectWechatArticlesForKeyword({
  categoryId,
  keyword,
  apiKey,
  period = 1,
  fetchImpl = fetch,
  maxAttempts = 3,
}) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetchImpl(WECHAT_SEARCH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildWechatSearchPayload({ keyword, apiKey, period })),
      });

      if (!response.ok) {
        throw new Error(`上游请求失败，状态码 ${response.status}`);
      }

      const payload = await response.json();

      if (isRetryableInternalError(payload)) {
        throw new Error(payload.message);
      }

      if (payload?.code !== 0) {
        throw new Error(payload?.msg || '上游返回失败');
      }

      return {
        keyword,
        status: 'success',
        costMoney: Number(payload.cost_money || 0),
        fetchedCount: Number(payload.data_number || 0),
        articles: (payload.data || []).map((item) => normalizeWechatApiArticle({
          categoryId,
          keyword,
          item,
        })),
      };
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) {
        break;
      }
    }
  }

  return {
    keyword,
    status: 'failed',
    costMoney: 0,
    fetchedCount: 0,
    articles: [],
    message: lastError instanceof Error ? lastError.message : '采集失败',
  };
}
