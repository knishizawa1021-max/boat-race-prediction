const VENUE_GRID_ORDER = [
  "kiryu","toda","edogawa","heiwajima",
  "tamagawa","hamanako","gamagori","tsuru",
  "mikuni","biwako","suminoe","amagasaki",
  "naruto","marugame","kojima","miyajima",
  "tokuyama","shimonoseki","wakamatsu","ashiya",
  "karatsu","fukuoka","omura","saga"
];

const GRADE_COLORS = {
  "SG": "#e63946",
  "G1": "#f4a261",
  "G2": "#2a9d8f",
  "G3": "#457b9d",
  "一般": "#4a4e69"
};

async function buildVenueGrid() {
  const container = document.getElementById('venue-grid');
  if (!container) return;

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth()+1).padStart(2,'0');
  const d = String(now.getDate()).padStart(2,'0');
  const today = `${y}${m}${d}`;

  let activeVenues = [];
  try {
    const res = await fetch(`https://boatrace-api.onrender.com/api/schedule/${today}`, { signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      const data = await res.json();
      activeVenues = data.venues || [];
    }
  } catch(e) {
    console.warn('schedule fetch failed:', e);
  }

  const activeIds = activeVenues.map(v => v.venue_id);

  container.innerHTML = '';
  VENUE_GRID_ORDER.forEach(id => {
    const venue = VENUES ? VENUES.find(v => v.id === id) : null;
    if (!venue) return;

    const isActive = activeIds.includes(id);
    const cell = document.createElement('div');
    cell.className = 'vg-cell' + (isActive ? ' vg-active' : ' vg-inactive');

    if (isActive) {
      const gradeColor = GRADE_COLORS[venue.grade] || GRADE_COLORS['一般'];
      cell.innerHTML = `
        <div class="vg-grade" style="background:${gradeColor}">${venue.grade}</div>
        <div class="vg-name">${venue.name}</div>
        <div class="vg-pref">${venue.pref}</div>
        <div class="vg-status">\u958B\u50AC\u4E2D</div>`;
      cell.onclick = () => {
        selectVenue(id);
        document.getElementById('venue-grid-section').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
      };
    } else {
      cell.innerHTML = `
        <div class="vg-name vg-name-inactive">${venue.name}</div>
        <div class="vg-pref">${venue.pref}</div>
        <div class="vg-status vg-no-race">\u975E\u958B\u50AC</div>`;
    }
    container.appendChild(cell);
  });
}

function showVenueGrid() {
  document.getElementById('venue-grid-section').style.display = 'block';
  document.getElementById('main-content').style.display = 'none';
  buildVenueGrid();
}

function hideVenueGrid() {
  document.getElementById('venue-grid-section').style.display = 'none';
  document.getElementById('main-content').style.display = 'block';
}
