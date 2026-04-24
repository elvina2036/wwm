export function resolveConfigUrl() {
  const params = new URLSearchParams(window.location.search);
  const custom = params.get('config');
  if (custom) return custom;
  const base = window.location.pathname.replace(/\/[^/]*$/, '/');
  return base + 'config.json';
}

export async function loadConfig() {
  const url = resolveConfigUrl();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load config (${res.status}): ${url}`);
  return res.json();
}
