/* Village Butchers, Alvechurch — small, dependency-free enhancements.
   Everything here is optional: the page reads fine without JavaScript. */
(() => {
  'use strict';

  /* ------------------------------------------------------------------
     Opening hours (UK time). Index 0 = Sunday … 6 = Saturday.
     null = closed. Times are 24-hour "HH:MM".
     Change these and the door sign, awning, status pill, hours table and
     top strip all follow. (Also update the table and footer rows written
     into index.html, and the JSON-LD, so the page is right without JS.)
     ------------------------------------------------------------------ */
  const HOURS = [
    null,               // Sunday: closed
    null,               // Monday: closed
    ['08:30', '15:30'], // Tuesday
    ['08:30', '15:30'], // Wednesday
    ['08:30', '16:00'], // Thursday
    ['08:30', '16:30'], // Friday
    ['08:30', '15:00'], // Saturday
  ];

  /* Dates that don't follow the usual week (England & Wales bank holidays
     and Christmas that fall on a normal opening day). null = closed all day,
     'check' = hours not confirmed, so the page asks people to ring or check
     Facebook. Add the shop's real holiday hours here each year, e.g.
     '2026-12-24': ['08:00', '13:00'] */
  const SPECIAL = {
    '2026-12-24': 'check',
    '2026-12-25': null,
    '2026-12-26': 'check',
    '2026-12-31': 'check',
    '2027-01-01': 'check',
    '2027-03-26': 'check', // Good Friday
  };

  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // UK weeks start on Monday

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

  const toMins = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

  /* "08:00" → "8am", "16:30" → "4:30pm", "12:00" → "12pm" */
  function fmt(hhmm) {
    let [h, m] = hhmm.split(':').map(Number);
    const suffix = h >= 12 ? 'pm' : 'am';
    h = h % 12 || 12;
    return m ? `${h}:${String(m).padStart(2, '0')}${suffix}` : `${h}${suffix}`;
  }

  /* Today's date and minutes in Europe/London, whatever the visitor's own
     device time zone is. */
  function londonNow() {
    try {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      }).formatToParts(new Date());
      const get = (t) => Number((parts.find((p) => p.type === t) || {}).value);
      const y = get('year'), mo = get('month'), d = get('day');
      const mins = get('hour') * 60 + get('minute');
      if ([y, mo, d, mins].some(Number.isNaN)) throw new Error('bad parts');
      return { y, mo, d, mins };
    } catch (e) {
      const n = new Date();
      return { y: n.getFullYear(), mo: n.getMonth() + 1, d: n.getDate(), mins: n.getHours() * 60 + n.getMinutes() };
    }
  }

  /* The calendar day `offset` days after a London date */
  function dayAfter(base, offset) {
    const t = new Date(Date.UTC(base.y, base.mo - 1, base.d + offset));
    return { iso: t.toISOString().slice(0, 10), weekday: t.getUTCDay() };
  }

  /* Hours for one date: holiday overrides first, then the usual week */
  const hoursFor = (day) => (has(SPECIAL, day.iso) ? SPECIAL[day.iso] : HOURS[day.weekday]);

  function nextOpening(now) {
    for (let i = 0; i <= 14; i++) {
      const day = dayAfter(now, i);
      const h = hoursFor(day);
      if (h === 'check') return { i, day, check: true };
      if (!h) continue;
      if (i === 0 && now.mins >= toMins(h[0])) continue;
      return { i, day, time: fmt(h[0]) };
    }
    return null;
  }

  function describeNext(next) {
    if (!next) return { text: '', sign: '' };
    const when = next.i === 0 ? 'today' : next.i === 1 ? 'tomorrow' : DAY_NAMES[next.day.weekday];
    if (next.check) return { text: `ring to check ${when}’s hours`, sign: 'Ring to check' };
    const signWhen = next.i === 0 ? '' : next.i === 1 ? 'tomorrow ' : `${DAY_SHORT[next.day.weekday]} `;
    return { text: `opens ${when} at ${next.time}`, sign: `Back ${signWhen}${next.time}` };
  }

  function status() {
    const now = londonNow();
    const today = dayAfter(now, 0);
    const h = hoursFor(today);
    const base = { weekday: today.weekday };

    if (h === 'check') {
      return { ...base, state: 'check', text: 'Holiday hours today · ring or check Facebook', sign: ['Hello', 'Ring to check'] };
    }
    if (h && now.mins >= toMins(h[0]) && now.mins < toMins(h[1])) {
      const soon = toMins(h[1]) - now.mins <= 30;
      return {
        ...base, state: soon ? 'soon' : 'open',
        text: `${soon ? 'Closing soon' : 'Open now'} · closes ${fmt(h[1])}`,
        sign: ['Open', `Until ${fmt(h[1])}`],
      };
    }
    const next = describeNext(nextOpening(now));
    const holiday = !h && HOURS[today.weekday] && has(SPECIAL, today.iso);
    const lead = holiday ? 'Closed today (bank holiday)' : 'Closed now';
    return { ...base, state: 'closed', text: next.text ? `${lead} · ${next.text}` : lead, sign: ['Closed', next.sign] };
  }

  function renderHoursTable(todayIdx) {
    const body = $('[data-hours-body]');
    if (!body) return;
    body.innerHTML = WEEK_ORDER.map((d) => {
      const h = HOURS[d];
      const isToday = d === todayIdx;
      const time = h ? `${fmt(h[0])}–${fmt(h[1])}` : 'Closed';
      const cls = [isToday ? 'is-today' : '', h ? '' : 'is-closed-day'].filter(Boolean).join(' ');
      return `<tr${cls ? ` class="${cls}"` : ''}${isToday ? ' aria-current="date"' : ''}>` +
        `<th scope="row">${DAY_NAMES[d]}${isToday ? ' <span class="hours__today">Today</span>' : ''}</th>` +
        `<td>${time}</td></tr>`;
    }).join('');
  }

  let lastText = '';
  let lastDay = -1;
  function applyStatus() {
    const s = status();

    if (s.weekday !== lastDay) { lastDay = s.weekday; renderHoursTable(s.weekday); }
    if (s.text === lastText) return;
    lastText = s.text;
    const cls = `is-${s.state}`;

    const strip = $('[data-status-text]');
    if (strip) { strip.textContent = s.text; strip.className = `topstrip__status ${cls}`; strip.hidden = false; }

    const pill = $('[data-status-pill]');
    if (pill) { $('[data-status-pill-text]', pill).textContent = s.text; pill.className = `status-pill ${cls}`; }

    const plate = $('[data-plate-status]');
    if (plate) { plate.textContent = s.text; plate.className = `plate__status ${cls}`; }

    const sign = $('[data-door-sign]');
    if (sign) {
      sign.className = `door__sign ${s.state === 'soon' ? 'is-open' : cls}`;
      $('[data-sign-word]', sign).textContent = s.sign[0];
      $('[data-sign-small]', sign).textContent = s.sign[1];
    }

    const front = $('.shopfront');
    if (front) front.classList.toggle('is-closed', s.state === 'closed');
  }

  /* Seasonal notes carry data-show-until="YYYY-MM-DD" and hide themselves after it */
  function hideExpired() {
    const today = dayAfter(londonNow(), 0).iso;
    $$('[data-show-until]').forEach((el) => { if (today > el.dataset.showUntil) el.hidden = true; });
  }

  /* ------------------------------------------------------------------
     Text size: three steps, remembered on this device
     ------------------------------------------------------------------ */
  function initTextSize() {
    const btns = $$('[data-text-size]');
    const valid = (v) => (v === 'lg' || v === 'xl' ? v : '');
    const set = (v, save) => {
      if (v) document.documentElement.dataset.text = v; else delete document.documentElement.dataset.text;
      btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.textSize === v)));
      if (!save) return;
      try { if (v) localStorage.setItem('vb-text', v); else localStorage.removeItem('vb-text'); } catch (e) { /* private mode */ }
    };
    let saved = '';
    try { saved = valid(localStorage.getItem('vb-text')); } catch (e) { /* storage blocked */ }
    set(valid(document.documentElement.dataset.text) || saved, false);
    btns.forEach((b) => b.addEventListener('click', () => set(valid(b.dataset.textSize), true)));
  }

  /* ------------------------------------------------------------------
     Mobile dock appears once the hero buttons have scrolled away
     ------------------------------------------------------------------ */
  function initDock() {
    const dock = $('[data-dock]');
    const anchor = $('.window__actions');
    if (!dock) return;
    if (!anchor || !('IntersectionObserver' in window)) { dock.classList.add('is-on'); return; }
    new IntersectionObserver(([e]) => {
      dock.classList.toggle('is-on', !e.isIntersecting && e.boundingClientRect.top < 0);
    }).observe(anchor);
  }

  /* ------------------------------------------------------------------
     Highlight the section you're reading in the header nav
     ------------------------------------------------------------------ */
  function initNav() {
    const links = $$('.mainnav a');
    if (!links.length || !('IntersectionObserver' in window)) return;
    const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.removeAttribute('aria-current'));
        const a = byId.get(e.target.id);
        if (a) a.setAttribute('aria-current', 'location');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section').forEach((el) => io.observe(el));
  }

  /* ------------------------------------------------------------------
     Map: zoom the drawing in around the shop on smaller screens so the
     labels stay readable (the SVG is drawn on a 1600 × 760 canvas).
     ------------------------------------------------------------------ */
  function initMap() {
    const svg = $('.map__svg');
    if (!svg || !window.matchMedia) return;
    const phone = window.matchMedia('(max-width: 600px)');
    const tablet = window.matchMedia('(max-width: 959px)');
    const apply = () => svg.setAttribute('viewBox', phone.matches ? '440 200 560 560' : tablet.matches ? '440 180 900 520' : '370 226 980 466');
    apply();
    [phone, tablet].forEach((mq) => { if (mq.addEventListener) mq.addEventListener('change', apply); else if (mq.addListener) mq.addListener(apply); });
  }

  function init() {
    initTextSize();
    initDock();
    initNav();
    initMap();
    hideExpired();
    applyStatus();
    setInterval(applyStatus, 30000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { applyStatus(); hideExpired(); } });
    const y = $('[data-year]'); if (y) y.textContent = String(londonNow().y);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
