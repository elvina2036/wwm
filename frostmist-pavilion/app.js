/**
 * Frostmist Pavilion — Calendar App
 * Loads config.json and renders the weekly schedule poster.
 *
 * Config can be overridden via URL query param:
 *   ?config=https://example.com/my-config.json
 */

// ── Globals ───────────────────────────────────────────────────────────────────
let currentConfig   = null;
let currentTimezone = null;

const CORNER_SVG = `
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2,2 L14,2 L14,4 L4,4 L4,14 L2,14 Z" fill="#c8963c"/>
    <path d="M6,6 L10,6 L10,8 L8,8 L8,10 L6,10 Z" fill="#c8963c"/>
    <path d="M14,2 L14,6 L16,6 L16,2 Z" fill="rgba(200,150,60,0.4)"/>
    <path d="M2,14 L6,14 L6,16 L2,16 Z" fill="rgba(200,150,60,0.4)"/>
  </svg>`;


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
 * Returns (UTC_minutes − local_minutes) for timezone `tz`.
 * Positive  → behind UTC  (e.g. UTC-5 → +300)
 * Negative  → ahead of UTC (e.g. UTC+8 → -480)
 */
function getOffsetMinutes(tz) {
  if (_tzOffsetCache[tz] !== undefined) return _tzOffsetCache[tz];
  const ref = new Date('2024-01-15T12:00:00Z');
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(ref);
  let h = parseInt(parts.find(p => p.type === 'hour').value, 10);
  const m = parseInt(parts.find(p => p.type === 'minute').value, 10);
  if (h === 24) h = 0;
  return (_tzOffsetCache[tz] = 12 * 60 - (h * 60 + m));
}

/** Convert "HH:MM" from fromTz to toTz. Non-time strings pass through. */
function convertTime(timeStr, fromTz, toTz) {
  if (fromTz === toTz || !/^\d{1,2}:\d{2}$/.test(timeStr)) {
    return { display: timeStr, dayOffset: 0 };
  }
  const [h, m] = timeStr.split(':').map(Number);
  const raw = h * 60 + m + getOffsetMinutes(fromTz) - getOffsetMinutes(toTz);
  const dayOffset  = Math.floor(raw / 1440);
  const normalized = ((raw % 1440) + 1440) % 1440;
  return {
    display: `${String(Math.floor(normalized / 60)).padStart(2,'0')}:${String(normalized % 60).padStart(2,'0')}`,
    dayOffset,
  };
}

/** Rewrite all [data-base-time] elements to the current timezone. */
function updateAllTimes() {
  const fromTz = currentConfig.baseTimezone || 'Asia/Taipei';
  document.querySelectorAll('[data-base-time]').forEach(el => {
    const { display, dayOffset } = convertTime(el.dataset.baseTime, fromTz, currentTimezone);
    const prefix = el.dataset.notePrefix || '';
    while (el.firstChild) el.removeChild(el.firstChild);
    el.appendChild(document.createTextNode(prefix + display));
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
  const tzs = cfg.timezones || [];
  currentTimezone = cfg.baseTimezone || 'Asia/Taipei';
  const initLabel = (tzs.find(t => t.id === currentTimezone) || {}).label || currentTimezone;

  const row = document.createElement('div');
  row.className = 'tz-row';
  const lbl = document.createElement('span');
  lbl.className = 'tz-row-label';
  lbl.textContent = '時　區';
  row.appendChild(lbl);

  const sel = document.createElement('div');
  sel.className = 'tz-selector';

  const btn = document.createElement('button');
  btn.className = 'tz-btn';
  btn.setAttribute('type', 'button');
  btn.setAttribute('aria-haspopup', 'listbox');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML =
    `<span class="tz-btn-glyph">◉</span>` +
    `<span class="tz-btn-label">${escHtml(initLabel)}</span>` +
    `<span class="tz-btn-arrow">▾</span>`;

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
      dd.querySelectorAll('.tz-opt').forEach(o => {
        o.classList.remove('selected');
        o.setAttribute('aria-selected', 'false');
      });
      opt.classList.add('selected');
      opt.setAttribute('aria-selected', 'true');
      btn.querySelector('.tz-btn-label').textContent = tz.label;
      sel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      currentTimezone = tz.id;
      updateAllTimes();
    });
    dd.appendChild(opt);
  });

  btn.addEventListener('click', e => {
    e.stopPropagation();
    const open = sel.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', () => {
    sel.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  });
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

  poster.insertAdjacentHTML('beforeend', `
    <div class="frame-outer"></div>
    <div class="frame-inner"></div>
    <div class="corner tl">${CORNER_SVG}</div>
    <div class="corner tr">${CORNER_SVG}</div>
    <div class="corner bl">${CORNER_SVG}</div>
    <div class="corner br">${CORNER_SVG}</div>
  `);

  const content = document.createElement('div');
  content.className = 'content';

  const { site, dailyEvent, days } = cfg;

  // Header
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

  // Timezone selector
  if (cfg.timezones && cfg.timezones.length) {
    content.appendChild(buildTimezoneSelector(cfg));
  }

  // Daily event banner — data-base-time enables dynamic conversion
  content.insertAdjacentHTML('beforeend', `
    <div class="daily-event">
      <div class="daily-label-section">
        <div class="daily-text">${escHtml(dailyEvent.label)}</div>
        <div class="daily-name">${escHtml(dailyEvent.name)}</div>
      </div>
      <div class="daily-time-section">
        <div class="daily-text daily-text-sm">${escHtml(dailyEvent.timeLabel)}</div>
        <div class="daily-time" data-base-time="${escHtml(dailyEvent.time)}">${escHtml(dailyEvent.time)}</div>
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

  // Footer
  content.insertAdjacentHTML('beforeend', `
    <div class="footer">
      <div class="footer-text">${escHtml(site.footer)}</div>
    </div>
  `);

  poster.appendChild(content);
}

/** Build a single day column element. */
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

    // Use DOM node for .event-time so data-base-time is set for updateAllTimes()
    const timeEl = document.createElement('div');
    timeEl.className = 'event-time';
    timeEl.setAttribute('data-base-time', ev.time);
    timeEl.textContent = ev.time;

    card.appendChild(timeEl);
    card.insertAdjacentHTML('beforeend', `<div class="event-name">${escHtml(ev.name)}</div>`);
    if (ev.note) {
      if (ev.noteTime) {
        const noteEl = document.createElement('div');
        noteEl.className = 'event-note';
        noteEl.setAttribute('data-base-time', ev.noteTime);
        noteEl.setAttribute('data-note-prefix', ev.note + '\u00A0');
        noteEl.textContent = ev.note + '\u00A0' + ev.noteTime;
        card.appendChild(noteEl);
      } else {
        card.insertAdjacentHTML('beforeend', `<div class="event-note">${escHtml(ev.note)}</div>`);
      }
    }

    container.appendChild(card);
  });

  col.appendChild(container);
  return col;
}

/** Divider HTML — triple diamonds (primary) or single (secondary). */
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

/** Minimal HTML escape to prevent XSS from config values. */
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
