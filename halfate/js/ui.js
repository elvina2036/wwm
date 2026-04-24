import { escHtml } from './utils.js';

export function buildTimezoneSelector(cfg, onTimezoneChange) {
  const tzs = cfg.timezones || [];
  let currentTz = cfg.baseTimezone || 'Asia/Taipei';
  const initLabel = (tzs.find(t => t.id === currentTz) || {}).label || currentTz;

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
    opt.className = 'tz-opt' + (tz.id === currentTz ? ' selected' : '');
    opt.setAttribute('role', 'option');
    opt.setAttribute('data-tz', tz.id);
    opt.setAttribute('aria-selected', String(tz.id === currentTz));
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
      currentTz = tz.id;
      onTimezoneChange(tz.id);
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
