/**
 * Frostmist Pavilion — Calendar App
 * Loads config.json and renders the weekly schedule poster.
 *
 * Config can be overridden via URL query param:
 *   ?config=https://example.com/my-config.json
 */

const CORNER_SVG = `
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2,2 L14,2 L14,4 L4,4 L4,14 L2,14 Z" fill="#c8963c"/>
    <path d="M6,6 L10,6 L10,8 L8,8 L8,10 L6,10 Z" fill="#c8963c"/>
    <path d="M14,2 L14,6 L16,6 L16,2 Z" fill="rgba(200,150,60,0.4)"/>
    <path d="M2,14 L6,14 L6,16 L2,16 Z" fill="rgba(200,150,60,0.4)"/>
  </svg>`;

const LEGEND_COLOR_MAP = {
  gold:  'var(--gold)',
  jade:  'var(--jade)',
  red:   'var(--red)',
  steel: 'var(--steel)',
  mist:  'var(--mist)',
};

/** Resolve config URL: ?config=<url> or ./config.json */
function resolveConfigUrl() {
  const params = new URLSearchParams(window.location.search);
  const custom = params.get('config');
  if (custom) return custom;
  // Derive base path from current page so it works on GitHub Pages subdirs
  const base = window.location.pathname.replace(/\/[^/]*$/, '/');
  return base + 'config.json';
}

/** Fetch and parse config JSON */
async function loadConfig() {
  const url = resolveConfigUrl();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load config (${res.status}): ${url}`);
  return res.json();
}

/** Build the static poster skeleton and inject dynamic content */
function renderPoster(cfg) {
  const poster = document.getElementById('poster');
  poster.innerHTML = '';

  // ── Background SVGs ─────────────────────────────────────────────
  poster.insertAdjacentHTML('beforeend', `
    <svg class="ink-wash" viewBox="0 0 900 280" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,280 L0,200 Q50,160 100,180 Q150,200 200,150 Q250,100 300,130 Q350,160 400,110 Q450,60 500,90 Q550,120 600,80 Q650,40 700,70 Q750,100 800,60 Q850,20 900,50 L900,280 Z" fill="#0d0a08"/>
      <path d="M0,280 L0,230 Q80,210 160,240 Q240,270 320,220 Q400,170 480,200 Q560,230 640,190 Q720,150 800,180 Q860,200 900,170 L900,280 Z" fill="#0d0a08" opacity="0.5"/>
    </svg>
    <svg class="ink-splash" style="top:-20px;right:-20px;width:200px;height:200px;" viewBox="0 0 200 200">
      <circle cx="150" cy="50" r="80" fill="#0d0a08"/>
      <circle cx="100" cy="20" r="40" fill="#0d0a08"/>
    </svg>
    <svg class="ink-splash" style="bottom:30px;left:-30px;width:180px;height:180px;" viewBox="0 0 200 200">
      <ellipse cx="60" cy="140" rx="70" ry="50" fill="#0d0a08"/>
    </svg>
  `);

  // ── Frames ───────────────────────────────────────────────────────
  poster.insertAdjacentHTML('beforeend', `
    <div class="frame-outer"></div>
    <div class="frame-inner"></div>
    <div class="corner tl">${CORNER_SVG}</div>
    <div class="corner tr">${CORNER_SVG}</div>
    <div class="corner bl">${CORNER_SVG}</div>
    <div class="corner br">${CORNER_SVG}</div>
  `);

  // ── Content wrapper ──────────────────────────────────────────────
  const content = document.createElement('div');
  content.className = 'content';

  // Header
  const { site, dailyEvent, days, legend } = cfg;
  content.insertAdjacentHTML('beforeend', `
    <div class="header">
      <div class="title-label">${escHtml(site.label)}</div>
      <div class="title-main">${escHtml(site.title)}</div>
      <div class="subtitle">${escHtml(site.subtitle)}</div>
      <div class="seal">${escHtml(site.seal)}</div>
    </div>
  `);

  // Top divider
  content.insertAdjacentHTML('beforeend', buildDivider(true));

  // Daily event banner
  content.insertAdjacentHTML('beforeend', `
    <div class="daily-event">
      <div class="daily-label-section">
        <div class="daily-text">${escHtml(dailyEvent.label)}</div>
        <div class="daily-name">${escHtml(dailyEvent.name)}</div>
      </div>
      <div class="daily-time-section">
        <div class="daily-text daily-text-sm">${escHtml(dailyEvent.timeLabel)}</div>
        <div class="daily-time">${escHtml(dailyEvent.time)}</div>
      </div>
    </div>
  `);

  // Calendar grid
  const grid = document.createElement('div');
  grid.className = 'calendar-grid';
  days.forEach(day => grid.appendChild(buildDayCol(day)));
  content.appendChild(grid);

  // Bottom divider
  content.insertAdjacentHTML('beforeend', buildDivider(false));

  // Legend
  if (legend && legend.length) {
    const legendEl = document.createElement('div');
    legendEl.className = 'legend';
    legend.forEach(item => {
      const color = LEGEND_COLOR_MAP[item.color] || item.color;
      legendEl.insertAdjacentHTML('beforeend', `
        <div class="legend-item">
          <div class="legend-dot" style="background:${color}"></div>
          ${escHtml(item.text)}
        </div>
      `);
    });
    content.appendChild(legendEl);
  }

  // Footer
  content.insertAdjacentHTML('beforeend', `
    <div class="footer">
      <div class="footer-deco">⸺ ◆ ⸺</div>
      <div class="footer-text">${escHtml(site.footer)}</div>
    </div>
  `);

  poster.appendChild(content);
}

/** Build a single day column element */
function buildDayCol(day) {
  const col = document.createElement('div');
  col.className = 'day-col';

  const hdr = document.createElement('div');
  hdr.className = 'day-header' + (day.weekend ? ' weekend' : '');
  hdr.innerHTML = `
    <span class="day-char">${escHtml(day.char)}</span>
    <div class="day-label">${escHtml(day.label)}</div>
  `;
  col.appendChild(hdr);

  const container = document.createElement('div');
  container.className = 'events-container';

  (day.events || []).forEach(ev => {
    const card = document.createElement('div');
    card.className = `event-card ${escHtml(ev.type)}`;
    card.innerHTML = `
      <div class="event-time">${escHtml(ev.time)}</div>
      <div class="event-name">${escHtml(ev.name)}</div>
      ${ev.note ? `<div class="event-note">${escHtml(ev.note)}</div>` : ''}
    `;
    container.appendChild(card);
  });

  col.appendChild(container);
  return col;
}

/** Divider HTML — triple diamonds when primary, single when secondary */
function buildDivider(primary) {
  if (primary) {
    return `
      <div class="divider">
        <div class="divider-line"></div>
        <div class="divider-diamond"></div>
        <div class="divider-diamond" style="background:var(--red)"></div>
        <div class="divider-diamond"></div>
        <div class="divider-line"></div>
      </div>`;
  }
  return `
    <div class="divider" style="margin-top:24px;">
      <div class="divider-line"></div>
      <div class="divider-diamond" style="background:var(--red)"></div>
      <div class="divider-line"></div>
    </div>`;
}

/** Minimal HTML escape to prevent XSS from config values */
function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.getElementById('app-loading');
  const errorEl = document.getElementById('app-error');

  try {
    const cfg = await loadConfig();
    if (loading) loading.remove();
    renderPoster(cfg);
  } catch (err) {
    console.error('[frostmist-pavilion]', err);
    if (loading) loading.remove();
    if (errorEl) {
      errorEl.textContent = '無法讀取設定檔：' + err.message;
      errorEl.style.display = 'block';
    }
  }
});
