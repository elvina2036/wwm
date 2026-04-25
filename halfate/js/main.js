import { loadConfig } from './config.js';
import { renderPoster } from './renderer.js';

document.addEventListener('DOMContentLoaded', async () => {
  const loadingEl = document.getElementById('app-loading');
  const errorEl   = document.getElementById('app-error');

  try {
    const cfg = await loadConfig();
    loadingEl?.remove();
    renderPoster(cfg);
  } catch (err) {
    console.error('[halfate]', err);
    loadingEl?.remove();
    if (errorEl) {
      errorEl.textContent = '無法讀取設定檔：' + err.message;
      errorEl.style.display = 'block';
    }
  }
});
