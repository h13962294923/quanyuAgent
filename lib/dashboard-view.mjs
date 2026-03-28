import { PLATFORM_OPTIONS } from './platform-config.mjs';

export function buildEnabledPlatformOptions(enabledPlatforms = []) {
  const enabledSet = new Set(enabledPlatforms);

  return PLATFORM_OPTIONS.filter((item) => item.id === 'all' || enabledSet.has(item.id));
}

export function buildVisibleContents(realContents = []) {
  return realContents;
}
