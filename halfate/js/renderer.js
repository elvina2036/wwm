import { escHtml } from './utils.js';
import { buildTimezoneSelector } from './ui.js';
import { updateAllTimes } from './timezone.js';

const CORNER_SVG = `
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2,2 L14,2 L14,4 L4,4 L4,14 L2,14 Z" fill="#b87d3c"/>
    <path d="M6,6 L10,6 L10,8 L8,8 L8,10 L6,10 Z" fill="#b87d3c"/>
    <path d="M14,2 L14,6 L16,6 L16,2 Z" fill="rgba(184,125,60,0.45)"/>
    <path d="M2,14 L6,14 L6,16 L2,16 Z" fill="rgba(184,125,60,0.45)"/>
  </svg>`;

export function renderPoster(cfg) {
  const poster = document.getElementById('poster');
  poster.innerHTML = '';

  poster.insertAdjacentHTML('beforeend', `
    <svg class="ink-wash" viewBox="0 0 900 280" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,280 L0,200 Q50,160 100,180 Q150,200 200,150 Q250,100 300,130 Q350,160 400,110 Q450,60 500,90 Q550,120 600,80 Q650,40 700,70 Q750,100 800,60 Q850,20 900,50 L900,280 Z" fill="#1c0e06"/>
      <path d="M0,280 L0,230 Q80,210 160,240 Q240,270 320,220 Q400,170 480,200 Q560,230 640,190 Q720,150 800,180 Q860,200 900,170 L900,280 Z" fill="#1c0e06" opacity="0.5"/>
    </svg>
    <svg class="ink-splash" style="top:-20px;right:-20px;width:200px;height:200px;" viewBox="0 0 200 200">
      <circle cx="150" cy="50" r="80" fill="#1c0e06"/>
      <circle cx="100" cy="20" r="40" fill="#1c0e06"/>
    </svg>
    <svg class="ink-splash" style="bottom:30px;left:-30px;width:180px;height:180px;" viewBox="0 0 200 200">
      <ellipse cx="60" cy="140" rx="70" ry="50" fill="#1c0e06"/>
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

  content.insertAdjacentHTML('beforeend', `
    <div class="header">
      <div class="title-label">${escHtml(site.label)}</div>
      <div class="title-main">${escHtml(site.title)}</div>
      <div class="subtitle">${escHtml(site.subtitle)}</div>
      <div class="seal">${escHtml(site.seal)}</div>
    </div>
  `);

  content.insertAdjacentHTML('beforeend', buildDivider(true));

  if (cfg.timezones && cfg.timezones.length) {
    const baseTz = cfg.baseTimezone || 'Asia/Taipei';
    content.appendChild(buildTimezoneSelector(cfg, newTz => {
      updateAllTimes(baseTz, newTz);
    }));
  }

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

  const grid = document.createElement('div');
  grid.className = 'calendar-grid';
  days.forEach(day => grid.appendChild(buildDayCol(day)));
  content.appendChild(grid);

  content.insertAdjacentHTML('beforeend', buildDivider(false));

  content.insertAdjacentHTML('beforeend', `
    <div class="footer">
      <div class="footer-text">${escHtml(site.footer)}</div>
    </div>
  `);

  poster.appendChild(content);
}

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
        noteEl.setAttribute('data-note-prefix', ev.note + ' ');
        noteEl.textContent = ev.note + ' ' + ev.noteTime;
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
