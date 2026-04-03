import { toDateKey } from './publish-time.mjs';

export function buildReportDateOptions(contents = [], fallbackDate = new Date()) {
  const uniqueDateKeys = Array.from(new Set(
    (contents || [])
      .map((item) => {
        const parsed = new Date(item.date);
        if (Number.isNaN(parsed.getTime())) {
          return '';
        }

        return toDateKey(parsed);
      })
      .filter(Boolean),
  ));

  if (!uniqueDateKeys.length) {
    return [toDateKey(fallbackDate)];
  }

  return uniqueDateKeys.sort((left, right) => right.localeCompare(left));
}

export function pickDefaultReportDate(contents = [], fallbackDate = new Date()) {
  return buildReportDateOptions(contents, fallbackDate)[0];
}

export function getReportEmptyState({
  articleCount = 0,
  loading = false,
  hasReport = false,
}) {
  if (loading) {
    return {
      kind: 'loading',
      title: '正在加载报告',
      description: '正在查询该日期是否已有缓存报告。',
      showGenerateAction: false,
    };
  }

  if (hasReport) {
    return null;
  }

  if (articleCount <= 0) {
    return {
      kind: 'no-articles',
      title: '该日期暂无可分析文章',
      description: '先到「内容」页采集或回填该日期的公众号文章，再回来生成结构化报告。',
      showGenerateAction: false,
    };
  }

  return {
    kind: 'idle',
    title: '该日期还没有生成报告',
    description: '系统会基于当前分类当天的 top 文章，先做文章级摘录，再输出不少于 5 条结构化选题洞察。',
    showGenerateAction: true,
  };
}
