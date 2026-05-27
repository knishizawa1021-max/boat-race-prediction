
setTimeout(showVenueGrid, 100);

async function fetchTomorrowSchedule() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const y = tomorrow.getFullYear();
    const m = String(tomorrow.getMonth()+1).padStart(2,'0');
    const d = String(tomorrow.getDate()).padStart(2,'0');
    const yyyymmdd = `${y}${m}${d}`;
    const res = await fetch(`https://boatrace-api.onrender.com/api/schedule/${yyyymmdd}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return;
    const data = await res.json();
    if (!data.venues || data.venues.length === 0) return;
    showTomorrowBanner(data.venues, tomorrow);
  } catch(e) {
    console.warn('tomorrow schedule fetch failed:', e);
  }
}

function showTomorrowBanner(venues, date) {
  const existing = document.getElementById('tomorrow-banner');
  if (existing) existing.remove();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const banner = document.createElement('div');
  banner.id = 'tomorrow-banner';
  banner.style.cssText = 'background:#1a2a3a;border:1px solid #00d4ff;border-radius:8px;padding:10px 12px;margin:8px 4px;font-size:0.78rem;';
  const title = document.createElement('div');
  title.style.cssText = 'color:#00d4ff;font-weight:bold;margin-bottom:6px';
  title.textContent = '\uD83D\uDCC5 \u660E\u65E5(' + m + '/' + d + ')\u306E\u958B\u50AC\u5834';
  banner.appendChild(title);
  const btnWrap = document.createElement('div');
  btnWrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;';
  venues.forEach(v => {
    const venue = VENUES ? VENUES.find(vn => vn.id === v.venue_id) : null;
    const name = venue ? venue.name : v.venue_id;
    const btn = document.createElement('button');
    btn.style.cssText = 'background:#0d3a5c;color:#fff;border:1px solid #00d4ff;border-radius:4px;padding:4px 8px;font-size:0.75rem;cursor:pointer;';
    btn.textContent = name;
    btn.onclick = () => selectVenue(v.venue_id);
    btnWrap.appendChild(btn);
  });
  banner.appendChild(btnWrap);
  const raceSection = document.querySelector('.race-section');
  if (raceSection) raceSection.insertAdjacentElement('afterend', banner);
}

async function highlightTodayVenues() {
  try {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth()+1).padStart(2,'0');
    const d = String(now.getDate()).padStart(2,'0');
    const yyyymmdd = `${y}${m}${d}`;
    const res = await fetch(`https://boatrace-api.onrender.com/api/schedule/${yyyymmdd}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return;
    const data = await res.json();
    if (!data.venues || data.venues.length === 0) return;
    const activeIds = data.venues.map(v => v.venue_id);
    document.querySelectorAll('.venue-tab').forEach(btn => {
      const id = btn.dataset.id;
      if (activeIds.includes(id)) {
        btn.style.opacity = '1';
        btn.style.border = '2px solid #00d4ff';
      } else {
        btn.style.opacity = '0.3';
        btn.style.filter = 'grayscale(100%)';
      }
    });
  } catch(e) {
    console.warn('today venues fetch failed:', e);
  }
}

setTimeout(highlightTodayVenues, 5000);



