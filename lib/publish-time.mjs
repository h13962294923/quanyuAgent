export function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizePublishTimeValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value * 1000).toISOString();
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    const numeric = Number(trimmed);

    if (trimmed && Number.isFinite(numeric) && /^\d+(\.\d+)?$/.test(trimmed)) {
      return new Date(numeric * 1000).toISOString();
    }

    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
      return trimmed.replace(' ', 'T');
    }

    return trimmed;
  }

  return value;
}

export function publishTimeToDateKey(value) {
  const normalized = normalizePublishTimeValue(value);

  if (typeof normalized === 'string' && /^\d{4}-\d{2}-\d{2}/.test(normalized)) {
    return normalized.slice(0, 10);
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return toDateKey(parsed);
}

export function publishTimeToTimestamp(value) {
  const normalized = normalizePublishTimeValue(value);
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return 0;
  }

  return parsed.getTime();
}
