/**
 * Frostmist Pavilion — Calendar App
 * Loads config.json and renders the weekly schedule poster.
 *
 * Config can be overridden via URL query param:
 *   ?config=https://example.com/my-config.json
 */

// ── Globals ───────────────────────────────────────────────────────────────────
let currentConfig   = null;   // full parsed config
let currentTimezone = null;   // IANA tz string currently selected

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

// ── Config loading ────────────────────────────────────────────────────────────
function resolveConfigUrl() {
  const params = new URLSearchParams(window.location.search);
  const custom = params.get('config');
  if (custom) return custom;
  const base = window.location.pathname.replace(/\/[^/]*$/, '/');
  return base + 'config.json';
}

async function loadConfig() {
  const url = resolveConfigUrl();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load config (${res.status}): ${url}`);
  return res.json();
}

// ── Time conversion ───────────────────────────────────────────────────────────
const _tzOffsetCache = {};

/**
 * Returns (UTC_minutes − local_minutes) for timezone `tz` at a fixed reference.
 * Positive  → timezone is behind UTC  (e.g. UTC-5 → +300)
 * Negative  → timezone is ahead of UTC (e.g. UTC+8 → -480)
 */
function getOffsetMinutes(tz) {
  if (_tzOffsetCache[tz] !== undefined) return _tzOffsetCache[tz];

  // Reference: 2024-01-15 12:00:00 UTC (mid-day, avoids midnight edge cases)
  const ref = new Date('2024-01-15T12:00:00Z');
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(ref);

  let h = parseInt(parts.find(p => p.type === 'hour').value, 10);
  const m = parseInt(parts.find(p => p.type === 'minute').value, 10);
  if (h === 24) h = 0; // some implementations return 24 for midnight

  return (_tzOffsetCache[tz] = 12 * 60 - (h * 60 + m));
}

/**
 * Convert a "HH:MM" string from `fromTz` to `toTz`.
 * Non-time strings (e.g. "時間待定") are returned unchanged.
 * Returns { display: string, dayOffset: number }
 */
function convertTime(timeStr, fromTz, toTz) {
  if (fromTz === toTz || !/^\d{1,2}:\d{2}$/.test(timeStr)) {
    return { display: timeStr, dayOffset: 0 };
  }

  const [h, m] = timeStr.split(':').map(Number);

  // local_to = local_from + offset_from − offset_to
  //   where offset = UTC − local  (hence +offset moves toward UTC)
  const raw = h * 60 + m + getOffsetMinutes(fromTz) - getOffsetMinutes(toTz);

  const dayOffset  = Math.floor(raw / 1440);
  const normalized = ((raw % 1440) + 1440) % 1440;
  const nh = Math.floor(normalized / 60);
  const nm = normalized % 60;

  return {
    display:   `${String(nh).padStart(2,'0')}:${String(nm).padStart(2,'0')}`,
    dayOffset,
  };
}

/**
 * Walk every [data-base-time] element and rewrite its text to the
 * currently selected timezone.
 */
function updateAllTimes() {
  const fromTz = currentConfig.baseTimezone || 'Asia/Taipei';

  document.querySelectorAll('[data-base-time]').forEach(el => {
    const base = el.getAttribute('data-base-time');
    const { display, dayOffset } = convertTime(base, fromTz, currentTimezone);

    // Clear existing children
    while (el.firstChild) el.removeChild(el.firstChild);

    el.appendChild(document.createTextNode(display));

    if (dayOffset !== 0) {
      const badge = document.createElement('span');
      badge.className = 'day-offset';
      badge.textContent = dayOffset > 0 ? '+1' : '-1';
      el.appendChild(badge);
    }
  });
}

// ── Timezone selector ─────────────────────────────────────────────────────────
function buildTimezoneSelector(cfg) {
  const tzs    = cfg.timezones || [];
  currentTimezone = cfg.baseTimezone || 'Asia/Taipei';

  const initLabel = (tzs.find(t => t.id === currentTimezone) || {}).label
                    || currentTimezone;

  // Outer row
  const row = document.createElement('div');
  row.className = 'tz-row';

  const lbl = document.createElement('span');
  lbl.className = 'tz-row-label';
  lbl.textContent = '時　區';
  row.appendChild(lbl);

  // Selector wrapper
  const sel = document.createElement('div');
  sel.className = 'tz-selector';

  // Trigger button
  const btn = document.createElement('button');
  btn.className = 'tz-btn';
  btn.setAttribute('type', 'button');
  btn.setAttribute('aria-haspopup', 'listbox');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML =
    `<span class="tz-btn-glyph">◉</span>` +
    `<span class="tz-btn-label">${escHtml(initLabel)}</span>` +
    `<span class="tz-btn-arrow">▾</span>`;

  // Dropdown panel
  const dd = document.createElement('div');
  dd.className = 'tz-dropdown';
  dd.setAttribute('role', 'listbox');

  tzs.forEach(tz => {
    const opt = document.createElement('div');
    opt.className = 'tz-opt' + (tz.id === currentTimezone ? ' selected' : '');
    opt.setAttribute('role', 'option');
    opt.setAttribute('data-tz', tz.id);
    opt.setAttribute('aria-selected', String(tz.id === currentTimezone));
    opt.innerHTML =
      `<span class="tz-opt-label">${escHtml(tz.label)}</span>` +
      `<span class="tz-opt-check">✦</span>`;

    opt.addEventListener('click', () => {
      // Deselect all
      dd.querySelectorAll('.tz-opt').forEach(o => {
        o.classList.remove('selected');
        o.setAttribute('aria-selected', 'false');
      });
      // Select this
      opt.classList.add('selected');
      opt.setAttribute('aria-selected', 'true');
      // Update button label
      btn.querySelector('.tz-btn-label').textContent = tz.label;
      // Close
      sel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      // Convert times
      currentTimezone = tz.id;
      updateAllTimes();
    });

    dd.appendChild(opt);
  });

  // Toggle open/close
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const open = sel.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });

  // Close on any outside click
  document.addEventListener('click', () => {
    sel.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  });

  // Keyboard: close on Escape
  sel.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      sel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      btn.focus();
    }
  });

  sel.appendChild(btn);
  sel.appendChild(dd);
  row.appendChild(sel);
  return row;
}

// ── Rendering ─────────────────────────────────────────────────────────────────
function renderPoster(cfg) {
  currentConfig = cfg;

  const poster = document.getElementById('poster');
  poster.innerHTML = '';

  // Background SVGs
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

  // Borders & corners
  poster.insertAdjacentHTML('beforeend', `
    <div class="frame-outer"></div>
    <div class="frame-inner"></div>
    <div class="corner tl">${CORNER_SVG}</div>
    <div class="corner tr">${CORNER_SVG}</div>
    <div class="corner bl">${CORNER_SVG}</div>
    <div class="corner br">${CORNER_SVG}</div>
  `);

  // Content wrapper
  const content = document.createElement('div');
  content.className = 'content';

  const { site, dailyEvent, days, legend } = cfg;

  // ── Header ──
  content.insertAdjacentHTML('beforeend', `
    <div class="header">
      <div class="title-label">${escHtml(site.label)}</div>
      <div class="title-main">${escHtml(site.title)}</div>
      <div class="subtitle">${escHtml(site.subtitle)}</div>
      <div class="seal">${escHtml(site.seal)}</div>
    </div>
  `);

  // ── Top divider ──
  content.insertAdjacentHTML('beforeend', buildDividerHtml(true));

  // ── Timezone selector (injected between divider and banner) ──
  if (cfg.timezones && cfg.timezones.length) {
    content.appendChild(buildTimezoneSelector(cfg));
  }

  // ── Daily event banner ──
  // data-base-time on .daily-time enables dynamic conversion
  content.insertAdjacentHTML('beforeend', `
    <div class="daily-event">
      <span class="daily-icon">${escHtml(dailyEvent.icon)}</span>
      <div style="text-align:center;">
        <div class="daily-text">${escHtml(dailyEvent.label)}</div>
        <div class="daily-name">${escHtml(dailyEvent.name)}</div>
      </div>
      <div style="text-align:center;border-left:1px solid rgba(200,150,60,0.3);padding-left:20px;">
        <div class="daily-text" style="font-size:11px;">${escHtml(dailyEvent.timeLabel)}</div>
        <div class="daily-time" data-base-time="${escHtml(dailyEvent.time)}">${escHtml(dailyEvent.time)}</div>
      </div>
      <span class="daily-icon">${escHtml(dailyEvent.icon)}</span>
    </div>
  `);

  // ── Calendar grid ──
  const grid = document.createElement('div');
  grid.className = 'calendar-grid';
  days.forEach(day => grid.appendChild(buildDayCol(day)));
  content.appendChild(grid);

  // ── Bottom divider ──
  content.insertAdjacentHTML('beforeend', buildDividerHtml(false));

  // ── Legend ──
  if (legend && legend.length) {
    const legendEl = document.createElement('div');
    legendEl.className = 'legend';
    legend.forEach(item => {
      const color = LEGEND_COLOR_MAP[item.color] || item.color;
      legendEl.insertAdjacentHTML('beforeend', `
        <div class="legend-item">
          <div class="legend-dot" style="background:${color}"></div>
          ${escHtml(item.icon)} ${escHtml(item.text)}
        </div>
      `);
    });
    content.appendChild(legendEl);
  }

  // ── Footer ──
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

    // .event-time carries data-base-time so updateAllTimes() can reach it
    const timeEl = document.createElement('div');
    timeEl.className = 'event-time';
    timeEl.setAttribute('data-base-time', ev.time);
    timeEl.textContent = ev.time;

    card.insertAdjacentHTML('beforeend',
      `<div class="event-icon">${escHtml(ev.icon)}</div>`);
    card.appendChild(timeEl);
    card.insertAdjacentHTML('beforeend',
      `<div class="event-name">${escHtml(ev.name)}</div>` +
      (ev.note ? `<div class="event-note">${escHtml(ev.note)}</div>` : ''));

    container.appendChild(card);
  });

  col.appendChild(container);
  return col;
}

/** Divider HTML: triple diamonds (primary) or single (secondary) */
function buildDividerHtml(primary) {
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

// ── Bootstrap ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const loadingEl = document.getElementById('app-loading');
  const errorEl   = document.getElementById('app-error');

  try {
    const cfg = await loadConfig();
    if (loadingEl) loadingEl.remove();
    renderPoster(cfg);
  } catch (err) {
    console.error('[frostmist-pavilion]', err);
    if (loadingEl) loadingEl.remove();
    if (errorEl) {
      errorEl.textContent = '無法讀取設定檔：' + err.message;
      errorEl.style.display = 'block';
    }
  }
});
