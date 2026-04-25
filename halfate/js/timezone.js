const _tzOffsetCache = {};

export function getOffsetMinutes(tz) {
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

export function convertTime(timeStr, fromTz, toTz) {
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

export function updateAllTimes(baseTimezone, currentTimezone) {
  document.querySelectorAll('[data-base-time]').forEach(el => {
    const { display, dayOffset } = convertTime(el.dataset.baseTime, baseTimezone, currentTimezone);
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
