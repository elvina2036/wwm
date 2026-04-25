import { escHtml } from './utils.js';
import { buildTimezoneSelector } from './ui.js';
import { updateAllTimes } from './timezone.js';

const CORNER_SVG = `
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2,2 L16,2 L16,4 L4,4 L4,16 L2,16 Z" fill="#b87d3c"/>
    <path d="M5,5 L14,5 L14,6 L6,6 L6,14 L5,14 Z" fill="rgba(184,125,60,0.40)"/>
    <line x1="7"  y1="5"  x2="5"  y2="7"  stroke="#b87d3c" stroke-width="0.7" opacity="0.60"/>
    <line x1="10" y1="5"  x2="5"  y2="10" stroke="#b87d3c" stroke-width="0.7" opacity="0.60"/>
    <line x1="13" y1="5"  x2="5"  y2="13" stroke="#b87d3c" stroke-width="0.7" opacity="0.50"/>
    <line x1="14" y1="7"  x2="7"  y2="14" stroke="#b87d3c" stroke-width="0.7" opacity="0.50"/>
    <line x1="14" y1="10" x2="10" y2="14" stroke="#b87d3c" stroke-width="0.7" opacity="0.40"/>
    <ellipse cx="17.5" cy="15" rx="2.2" ry="1.1" fill="#8b2020" opacity="0.85" transform="rotate(18 17.5 15)"/>
    <ellipse cx="17.5" cy="15" rx="2.2" ry="1.1" fill="#8b2020" opacity="0.85" transform="rotate(90 17.5 15)"/>
    <ellipse cx="17.5" cy="15" rx="2.2" ry="1.1" fill="#8b2020" opacity="0.85" transform="rotate(162 17.5 15)"/>
    <ellipse cx="17.5" cy="15" rx="2.2" ry="1.1" fill="#8b2020" opacity="0.85" transform="rotate(234 17.5 15)"/>
    <ellipse cx="17.5" cy="15" rx="2.2" ry="1.1" fill="#8b2020" opacity="0.85" transform="rotate(306 17.5 15)"/>
    <circle cx="17.5" cy="15" r="1.1" fill="#d4a050"/>
    <path d="M16,2 L16,6 L18,6 L18,2 Z" fill="rgba(184,125,60,0.40)"/>
    <path d="M2,16 L6,16 L6,18 L2,18 Z" fill="rgba(184,125,60,0.40)"/>
  </svg>`;

export function renderPoster(cfg) {
  const poster = document.getElementById('poster');
  poster.innerHTML = '';

  poster.insertAdjacentHTML('beforeend', `
    <svg class="bg-moon" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <circle cx="200" cy="150" r="130" fill="rgba(184,125,60,0.025)" stroke="rgba(184,125,60,0.055)" stroke-width="1.5"/>
      <circle cx="200" cy="150" r="112" fill="rgba(184,125,60,0.018)" stroke="rgba(184,125,60,0.04)"  stroke-width="1.0"/>
      <circle cx="200" cy="150" r="96"  fill="rgba(184,125,60,0.015)"/>
    </svg>

    <svg class="ink-wash" viewBox="0 0 900 280" xmlns="http://www.w3.org/2000/svg">
      <circle cx="720" cy="75" r="48" fill="none" stroke="#b87d3c" stroke-width="1.2" opacity="0.12"/>
      <circle cx="720" cy="75" r="44" fill="rgba(184,125,60,0.04)"/>
      <path d="M0,280 L0,228
        L18,228 L18,215 L23,215 L23,204 L28,204 L28,193 L33,188 L38,182 L43,188 L43,193 L48,204 L48,215 L53,215 L53,228
        L65,228
        L65,216 L71,210 L77,203 L83,196 L89,189 L95,183 L95,177 L101,177 L101,170 L107,170 L107,177 L113,177
        L113,183 L119,189 L125,196 L131,203 L137,210 L143,216 L143,228
        L158,228 L158,218 L163,213 L168,213 L168,218 L182,218 L182,228
        L192,228
        L192,216 L200,208 L208,200 L216,192 L224,184 L232,177 L240,170 L240,168 L248,168
        L248,170 L256,177 L264,184 L272,192 L280,200 L288,208 L296,216 L296,228
        L310,228 L310,220 L315,220 L315,212 L320,207 L325,202 L330,207 L335,212 L335,220 L340,220 L340,228
        L352,228
        L352,218 L358,218 L358,208 L364,208 L364,198 L370,192 L376,186 L382,181 L382,175 L388,175
        L394,181 L394,186 L400,192 L406,198 L406,208 L412,208 L412,218 L418,218 L418,228
        L432,228
        L432,218 L439,211 L446,204 L453,197 L460,190 L467,184 L474,178
        L481,184 L488,190 L488,197 L495,204 L502,211 L509,218 L509,228
        L522,228
        L522,216 L527,216 L527,206 L532,201 L537,196 L542,191 L547,186 L547,182 L553,182
        L559,186 L559,191 L564,196 L569,201 L574,206 L574,216 L579,216 L579,228
        L594,228 L594,213 L600,213 L600,206 L605,206 L605,213 L618,213 L618,206 L623,206 L623,213 L636,213 L636,228
        L648,228
        L648,217 L655,210 L662,203 L669,196 L676,189 L683,182 L690,175 L690,170 L697,170
        L697,175 L704,182 L711,189 L718,196 L725,203 L732,210 L739,217 L739,228
        L753,228
        L753,218 L758,218 L758,208 L763,208 L763,198 L768,193 L773,188 L773,183 L779,183
        L785,188 L785,193 L790,198 L790,208 L795,208 L795,218 L800,218 L800,228
        L814,228
        L814,218 L821,211 L828,204 L835,197 L842,191 L849,185
        L856,191 L863,197 L870,204 L877,211 L884,218 L884,228
        L895,228 L895,220 L900,220
        L900,280 Z" fill="#1c0e06"/>
      <path d="M0,280 L0,248 Q60,235 120,252 Q180,268 240,242 Q300,216 360,235 Q420,254 480,232 Q540,210 600,228 Q660,246 720,228 Q780,210 840,226 Q870,234 900,220 L900,280 Z" fill="#1c0e06" opacity="0.85"/>
      <path d="M0,60 Q80,95 118,165 Q135,205 126,245" stroke="#1c0e06" stroke-width="1.8" fill="none" opacity="0.55"/>
      <path d="M0,75 Q55,105 82,175 Q92,210 86,248"   stroke="#1c0e06" stroke-width="1.0" fill="none" opacity="0.40"/>
      <path d="M5,50  Q50,90  72,155 Q85,192 78,235"  stroke="#1c0e06" stroke-width="0.9" fill="none" opacity="0.38"/>
      <path d="M18,40 Q48,75  64,132 Q76,168 70,210"  stroke="#1c0e06" stroke-width="0.9" fill="none" opacity="0.35"/>
      <path d="M30,45 Q58,80  76,140 Q90,178 84,222"  stroke="#1c0e06" stroke-width="0.8" fill="none" opacity="0.30"/>
      <path d="M42,138 Q38,148 44,156 Q50,148 46,138" fill="#1c0e06" opacity="0.28"/>
      <path d="M66,152 Q62,162 68,170 Q74,162 70,152" fill="#1c0e06" opacity="0.25"/>
      <path d="M58,108 Q54,116 59,123 Q64,116 61,108" fill="#1c0e06" opacity="0.25"/>
      <path d="M24,100 Q20,108 25,115 Q30,108 27,100" fill="#1c0e06" opacity="0.28"/>
    </svg>

    <svg class="ink-splash" style="top:-20px;right:-20px;width:220px;height:220px;" viewBox="0 0 220 220">
      <path d="M205,8 Q165,45 135,82 Q112,112 92,142" stroke="#1c0e06" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M165,45 Q145,32 122,38" stroke="#1c0e06" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <path d="M135,82 Q112,70  90,74" stroke="#1c0e06" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <path d="M108,117 Q88,104 66,108" stroke="#1c0e06" stroke-width="1.0" fill="none" stroke-linecap="round"/>
      <g transform="translate(122,38)">
        <ellipse rx="5"   ry="2.5" fill="#8b2020" transform="rotate(0)"/>
        <ellipse rx="5"   ry="2.5" fill="#8b2020" transform="rotate(72)"/>
        <ellipse rx="5"   ry="2.5" fill="#8b2020" transform="rotate(144)"/>
        <ellipse rx="5"   ry="2.5" fill="#8b2020" transform="rotate(216)"/>
        <ellipse rx="5"   ry="2.5" fill="#8b2020" transform="rotate(288)"/>
        <circle r="1.8" fill="#d4a050"/>
      </g>
      <g transform="translate(90,74)">
        <ellipse rx="4.5" ry="2.2" fill="#8b2020" transform="rotate(20)"/>
        <ellipse rx="4.5" ry="2.2" fill="#8b2020" transform="rotate(92)"/>
        <ellipse rx="4.5" ry="2.2" fill="#8b2020" transform="rotate(164)"/>
        <ellipse rx="4.5" ry="2.2" fill="#8b2020" transform="rotate(236)"/>
        <ellipse rx="4.5" ry="2.2" fill="#8b2020" transform="rotate(308)"/>
        <circle r="1.6" fill="#d4a050"/>
      </g>
      <g transform="translate(135,82)">
        <ellipse rx="5.5" ry="2.7" fill="#8b2020" transform="rotate(10)"/>
        <ellipse rx="5.5" ry="2.7" fill="#8b2020" transform="rotate(82)"/>
        <ellipse rx="5.5" ry="2.7" fill="#8b2020" transform="rotate(154)"/>
        <ellipse rx="5.5" ry="2.7" fill="#8b2020" transform="rotate(226)"/>
        <ellipse rx="5.5" ry="2.7" fill="#8b2020" transform="rotate(298)"/>
        <circle r="2.0" fill="#d4a050"/>
      </g>
      <g transform="translate(66,108)">
        <ellipse rx="4.2" ry="2.1" fill="#8b2020" transform="rotate(35)"/>
        <ellipse rx="4.2" ry="2.1" fill="#8b2020" transform="rotate(107)"/>
        <ellipse rx="4.2" ry="2.1" fill="#8b2020" transform="rotate(179)"/>
        <ellipse rx="4.2" ry="2.1" fill="#8b2020" transform="rotate(251)"/>
        <ellipse rx="4.2" ry="2.1" fill="#8b2020" transform="rotate(323)"/>
        <circle r="1.5" fill="#d4a050"/>
      </g>
      <g transform="translate(92,142)">
        <ellipse rx="4.0" ry="2.0" fill="#702840" transform="rotate(55)"/>
        <ellipse rx="4.0" ry="2.0" fill="#702840" transform="rotate(127)"/>
        <ellipse rx="4.0" ry="2.0" fill="#702840" transform="rotate(199)"/>
        <ellipse rx="4.0" ry="2.0" fill="#702840" transform="rotate(271)"/>
        <ellipse rx="4.0" ry="2.0" fill="#702840" transform="rotate(343)"/>
        <circle r="1.4" fill="#b87d3c"/>
      </g>
      <ellipse cx="205" cy="8"   rx="2"   ry="4"   fill="#8b2020" transform="rotate(-30 205 8)"/>
      <ellipse cx="108" cy="117" rx="1.5" ry="3"   fill="#8b2020" transform="rotate(-20 108 117)"/>
    </svg>

    <svg class="ink-splash" style="bottom:30px;left:-30px;width:180px;height:180px;" viewBox="0 0 200 200">
      <circle cx="80" cy="108" r="55" fill="rgba(184,125,60,0.06)" stroke="rgba(184,125,60,0.18)" stroke-width="1.0"/>
      <circle cx="80" cy="108" r="46" fill="rgba(184,125,60,0.05)" stroke="rgba(184,125,60,0.12)" stroke-width="0.8"/>
      <circle cx="80" cy="108" r="38" fill="rgba(184,125,60,0.07)" stroke="rgba(184,125,60,0.20)" stroke-width="1.2"/>
      <circle cx="80" cy="108" r="30" fill="rgba(184,125,60,0.09)"/>
      <circle cx="80" cy="108" r="22" fill="rgba(212,160,80,0.06)"/>
      <ellipse cx="40"  cy="154" rx="5"   ry="2.5" fill="#8b2020" opacity="0.55" transform="rotate(-25 40 154)"/>
      <ellipse cx="58"  cy="164" rx="4.5" ry="2.2" fill="#8b2020" opacity="0.45" transform="rotate(15 58 164)"/>
      <ellipse cx="76"  cy="157" rx="4"   ry="2.0" fill="#702840" opacity="0.40" transform="rotate(-40 76 157)"/>
      <ellipse cx="98"  cy="162" rx="5"   ry="2.4" fill="#8b2020" opacity="0.50" transform="rotate(30 98 162)"/>
      <ellipse cx="116" cy="154" rx="4.2" ry="2.1" fill="#8b2020" opacity="0.42" transform="rotate(-10 116 154)"/>
      <ellipse cx="48"  cy="171" rx="3.8" ry="1.9" fill="#702840" opacity="0.38" transform="rotate(20 48 171)"/>
      <ellipse cx="88"  cy="173" rx="4"   ry="2.0" fill="#8b2020" opacity="0.35" transform="rotate(-50 88 173)"/>
      <ellipse cx="28"  cy="134" rx="3.5" ry="1.7" fill="#8b2020" opacity="0.28" transform="rotate(40 28 134)"/>
      <ellipse cx="130" cy="129" rx="3.5" ry="1.7" fill="#8b2020" opacity="0.25" transform="rotate(-35 130 129)"/>
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
