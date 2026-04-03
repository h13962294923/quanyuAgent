function extractMessageContent(payload) {
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if (item?.type === 'text') {
          return item.text || '';
        }

        return '';
      })
      .join('');
  }

  return '';
}

export function getOpenAiCompatibleConfig() {
  const baseUrl = String(process.env.OPENAI_COMPAT_BASE_URL || '').trim();
  const apiKey = String(process.env.OPENAI_COMPAT_API_KEY || '').trim();
  const modelName = String(process.env.OPENAI_COMPAT_MODEL || '').trim();

  if (!baseUrl || !apiKey || !modelName) {
    throw new Error('未配置 OpenAI 兼容模型');
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    apiKey,
    modelName,
  };
}

export function createOpenAiCompatibleClient({
  baseUrl,
  apiKey,
  modelName,
  fetchImpl = fetch,
}) {
  return {
    async generateJson({ systemPrompt, userPrompt }) {
      const response = await fetchImpl(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          temperature: 0.2,
          response_format: {
            type: 'json_object',
          },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`AI 请求失败，状态码 ${response.status}`);
      }

      const payload = await response.json();
      const content = extractMessageContent(payload);

      if (!content) {
        throw new Error('AI 未返回有效内容');
      }

      try {
        return JSON.parse(content);
      } catch {
        throw new Error('AI 返回的 JSON 无法解析');
      }
    },
  };
}
