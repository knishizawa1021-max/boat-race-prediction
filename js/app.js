let currentVenueId = 'kiryu';
let currentRaceNo = 1;
let allRaces = {};
let activeTab = 'race-card';
let countdownTimer = null;
let chartInstances = {};
let currentCourseStatsCategory = 'all';

function getCurrentRace() {
  return (allRaces[currentVenueId] || []).find(r => r.no === currentRaceNo) || null;
}

function init() {
  fetchTomorrowSchedule();
  buildVenueTabs();
  loadVenueRaces(currentVenueId);
  setupTabs();

  onRealtimeUpdate(({ race, updatedFields, timestamp }) => {
    if (race.venueId !== currentVenueId || race.no !== currentRaceNo) return;
    renderRaceCard(race);
    renderExhibitionTable(race);
    const pred = runAIPrediction(race.racers);
    renderAIPrediction(pred);
    flashUpdatedCells(updatedFields);
    document.getElementById('last-update').textContent = formatUpdateTime(timestamp);
    showUpdateBadge();
  });

  window.addEventListener('resize', debounce(() => {
    const race = getCurrentRace();
    if (race) renderCharts(race);
  }, 300));

  renderWaterPage();
  initOddsCalculator();
}

function buildVenueTabs() {
  const container = document.getElementById('venue-tabs');
  container.innerHTML = '';
  VENUES.forEach(v => {
    const btn = document.createElement('button');
    btn.className = 'venue-tab' + (v.id === currentVenueId ? ' active' : '');
    btn.dataset.id = v.id;
    const gradeClass = v.grade === 'SG' ? 'vgrade-sg' : v.grade === 'G1' ? 'vgrade-g1' : 'vgrade-ippan';
    const gradeBadge = v.grade !== '一般'
      ? `<span class="venue-grade-badge ${gradeClass}">${v.grade}</span>`
      : '';
    btn.innerHTML = `${gradeBadge}<span class="vname">${v.name}</span><span class="vpref">${v.pref}</span>`;
    btn.addEventListener('click', () => selectVenue(v.id));
    container.appendChild(btn);
  });
}

function selectVenue(id) {
  currentVenueId = id;
  currentRaceNo = 1;
  loadVenueRaces(id);
  document.querySelectorAll('.venue-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.id === id);
  });
}

function loadVenueRaces(venueId) {
  allRaces[venueId] = generateRaces(venueId);
  buildRaceButtons();
  const targetRace = allRaces[venueId].find(r => r.status === 'exhibition' || r.status === 'upcoming')
    || allRaces[venueId][0];
  selectRace(targetRace.no);
}

function buildRaceButtons() {
  const container = document.getElementById('race-buttons');
  container.innerHTML = '';
  (allRaces[currentVenueId] || []).forEach(race => {
    const btn = document.createElement('button');
    btn.className = `race-btn status-${race.status}` + (race.no === currentRaceNo ? ' active' : '');
    btn.dataset.no = race.no;
    btn.innerHTML = `<span class="rno">${race.no}R</span><span class="rtime">${race.startTime}</span>`;
    btn.addEventListener('click', () => selectRace(race.no));
    container.appendChild(btn);
  });
}

function selectRace(no) {
  currentRaceNo = no;
  stopRealtimeUpdates();
  if (countdownTimer) clearInterval(countdownTimer);

  document.querySelectorAll('.race-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.no) === no);
  });

  const race = getCurrentRace();
  if (!race) return;

  renderRaceHeader(race);
  renderRaceCard(race);
  renderExhibitionTable(race);
  renderCourseStats(race, currentCourseStatsCategory);
  renderRacerProfiles(race);
  const pred = runAIPrediction(race.racers);
  renderAIPrediction(pred);
  renderCharts(race);
  renderVenueFeatures(race.venueId);
  renderOddsList(race);

  if (race.status === 'exhibition' || race.status === 'racing') {
    startRealtimeUpdates(getCurrentRace);
    startUpdateIndicator();
  }

  const raceTime = parseRaceTime(race.startTime);
  const cdEl = document.getElementById('countdown');
  if (cdEl && raceTime) {
    countdownTimer = startCountdown(() => raceTime.getTime(), cdEl);
  }
}

function parseRaceTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function renderRaceHeader(race) {
  const venue = getVenueById(race.venueId);
  document.getElementById('race-title').textContent = `${venue.name} ${race.no}R`;
  document.getElementById('race-info').innerHTML =
    `<span class="tag grade-tag">${race.grade}</span>` +
    `<span class="tag">${race.startTime} 発走</span>` +
    `<span class="tag status-tag-${race.status}">${statusLabel(race.status)}</span>` +
    `<span class="tag">${venue.water}</span>`;
}

function statusLabel(s) {
  return { upcoming: '発走前', exhibition: '展示中', racing: 'レース中', finished: '終了' }[s] || s;
}

function renderRaceCard(race) {
  const tbody = document.getElementById('race-card-body');
  tbody.innerHTML = '';
  race.racers.forEach(racer => {
    const cc = COURSE_COLORS[racer.course];
    const cs = racer.courseStats[racer.course];
    const nigeLabel = racer.course === 1 && cs
      ? `<span class="stat-chip nige">逃 ${cs.nigeRate}%</span>` : '';
    const nigashiLabel = racer.course === 2 && cs
      ? `<span class="stat-chip nigashi">逃し ${cs.nigashiRate}%</span>` : '';

    const tr = document.createElement('tr');
    tr.className = 'racer-row';
    tr.innerHTML = `
      <td class="course-cell" style="background:${cc.bg};color:${cc.text}">
        <strong>${racer.course}</strong>
      </td>
      <td class="racer-name-cell">
        <div class="racer-main">
          <span class="racer-name">${racer.name}</span>
          <span class="racer-class class-${racer.class.toLowerCase()}">${racer.class}</span>
        </div>
        <div class="racer-sub">
          <span>${racer.pref}</span>
          <span>登録${racer.id}</span>
          ${nigeLabel}${nigashiLabel}
          ${racer.flyingCount > 0 ? `<span class="fl-badge f-badge">F${racer.flyingCount}</span>` : ''}
          ${racer.lateStartCount > 0 ? `<span class="fl-badge l-badge">L${racer.lateStartCount}</span>` : ''}
          ${racer.flPeriod ? `<span class="fl-badge fp-badge">事故休</span>` : ''}
        </div>
        <div class="racer-data-grid">
          <div class="rdg-row">
            <span class="rdg-label">全国</span>
            <span>勝${racer.winRate}</span>
            <span>2連${racer.doubleWinRate}%</span>
            <span>3連${racer.tripleWinRate}%</span>
          </div>
          <div class="rdg-row">
            <span class="rdg-label tochi-lbl">当地</span>
            <span>勝${racer.tochiData ? racer.tochiData.winRate : '-'}</span>
            <span>2連${racer.tochiData ? racer.tochiData.doubleWinRate : '-'}%</span>
            <span>3連${racer.tochiData ? racer.tochiData.tripleWinRate : '-'}%</span>
            <span class="tochi-starts">${racer.tochiData ? racer.tochiData.starts + '走' : ''}</span>
          </div>
        </div>
        ${racer.flHistory && racer.flHistory.length > 0 ? `
        <div class="fl-history">
          ${racer.flHistory.slice(0, 3).map(fl => `<span class="fl-hist-item ${fl.type === 'F' ? 'fl-hist-f' : 'fl-hist-l'}">${fl.type} ${fl.venue}${fl.course}コ ${fl.date.replace(/^\d{4}-/, '')}</span>`).join('')}
        </div>` : ''}
        ${racer.motorEval ? `
        <div class="motor-eval-row">
          <span class="mev-pro-tag">PRO</span>
          <span class="mev-item"><span class="mev-lbl">出足</span>${dotRating(racer.motorEval.dashiashi)}</span>
          <span class="mev-item"><span class="mev-lbl">行足</span>${dotRating(racer.motorEval.yukiashi)}</span>
          <span class="mev-item"><span class="mev-lbl">伸び</span>${dotRating(racer.motorEval.nobi)}</span>
          <span class="mev-overall mev-${racer.motorEval.sogo.toLowerCase()}">${racer.motorEval.sogo}</span>
        </div>` : ''}
      </td>
      <td class="data-cell">
        <div class="motor-info">M${racer.motor.no}</div>
        <div class="motor-rate ${motorClass(racer.motor.winRate)}">${racer.motor.winRate}%</div>
      </td>
      <td class="data-cell tilt-cell ${tiltClass(racer.tilt)}">
        ${racer.tilt > 0 ? '+' : ''}${racer.tilt}°
      </td>
      <td class="data-cell">
        <span class="original-time">${racer.originalTime}</span>
      </td>
      <td class="data-cell et-cell" id="et-${race.venueId}-${race.no}-${racer.course}">
        ${racer.exhibitionTime !== null
          ? `<span class="et-val rank-${racer.exhibitionRank}">${racer.exhibitionTime}</span>${racer.exhibitionRank != null && racer.exhibitionRank <= 2 ? `<span class="et-rank">▲${racer.exhibitionRank}位</span>` : ''}`
          : '<span class="no-data">---</span>'}
      </td>
      <td class="data-cell st-cell" id="st-${race.venueId}-${race.no}-${racer.course}">
        ${racer.startTiming !== null
          ? `<span class="st-val ${stClass(racer.startTiming)}">${racer.startTiming}</span>`
          : '<span class="no-data">---</span>'}
      </td>
      <td class="data-cell recent-cell">
        ${racer.recentResults.slice(0, 5).map(r => `<span class="result r${r}">${r}</span>`).join('')}
      </td>`;
    tbody.appendChild(tr);
  });
}

function renderExhibitionTable(race) {
  const tbody = document.getElementById('exhibition-body');
  tbody.innerHTML = '';
  const sorted = [...race.racers].sort((a, b) => {
    if (a.exhibitionTime === null && b.exhibitionTime === null) return a.course - b.course;
    if (a.exhibitionTime === null) return 1;
    if (b.exhibitionTime === null) return -1;
    return parseFloat(a.exhibitionTime) - parseFloat(b.exhibitionTime);
  });

  sorted.forEach((racer, idx) => {
    const cc = COURSE_COLORS[racer.course];
    const cs = racer.courseStats[racer.course];
    const tr = document.createElement('tr');
    tr.className = 'ex-row';
    tr.innerHTML = `
      <td class="ex-rank">${racer.exhibitionTime !== null ? idx + 1 : '-'}</td>
      <td class="course-cell" style="background:${cc.bg};color:${cc.text}">${racer.course}</td>
      <td>${racer.name}</td>
      <td class="${tiltClass(racer.tilt)}">${racer.tilt > 0 ? '+' : ''}${racer.tilt}°</td>
      <td class="et-highlight" id="exh-et-${racer.course}">
        ${racer.exhibitionTime !== null
          ? `<strong class="${idx < 2 ? 'top-time' : ''}">${racer.exhibitionTime}</strong>`
          : '<span class="no-data loading">更新待ち</span>'}
      </td>
      <td id="exh-st-${racer.course}">
        ${racer.startTiming !== null
          ? `<span class="${stClass(racer.startTiming)}">${racer.startTiming}</span>`
          : '<span class="no-data">---</span>'}
      </td>
      <td>${cs ? cs.winRate + '%' : '---'}</td>
      <td>${racer.course === 1 && cs ? `<span class="nige-badge">${cs.nigeRate}%</span>` :
            racer.course === 2 && cs ? `<span class="nigashi-badge">${cs.nigashiRate}%</span>` : '---'}</td>`;
    tbody.appendChild(tr);
  });

  renderOriginalTimeSection(race);
}

function renderOriginalTimeSection(race) {
  const container = document.getElementById('ot-section');
  if (!container) return;

  const sorted = [...race.racers].sort((a, b) => a.originalTime - b.originalTime);
  const fastest = sorted[0].originalTime;

  container.innerHTML = `
    <div class="ot-title">
      <span>原時計ランキング</span>
      <span class="ot-note">モーター基本出力指標（低いほど高出力）</span>
    </div>
    <div class="ot-list">
      ${sorted.map((racer, idx) => {
        const cc = COURSE_COLORS[racer.course];
        const diff = (racer.originalTime - fastest).toFixed(3);
        return `
          <div class="ot-row ${idx === 0 ? 'ot-best' : ''}">
            <span class="ot-rank">${idx + 1}</span>
            <span class="ot-course-badge" style="background:${cc.bg};color:${cc.text}">${racer.course}</span>
            <span class="ot-name">${racer.name}</span>
            <span class="ot-motor">M${racer.motor.no} <span class="${motorClass(racer.motor.winRate)}">${racer.motor.winRate}%</span></span>
            <span class="ot-time ${idx === 0 ? 'ot-time-best' : ''}">${racer.originalTime}</span>
            <span class="ot-diff">${idx === 0 ? 'BEST' : '+' + diff}</span>
          </div>`;
      }).join('')}
    </div>`;
}

function renderCourseStats(race, category) {
  category = category || 'all';
  currentCourseStatsCategory = category;

  const filterEl = document.getElementById('cs-filter');
  if (filterEl) {
    filterEl.querySelectorAll('.csf-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.cat === category);
    });
  }

  const container = document.getElementById('course-stats-grid');
  container.innerHTML = '';
  race.racers.forEach(racer => {
    const statsToUse = category === 'all'
      ? racer.courseStats
      : generateCategoryStats(racer, category);
    const cc = COURSE_COLORS[racer.course];
    const card = document.createElement('div');
    card.className = 'cs-card';
    card.innerHTML = `
      <div class="cs-header" style="background:${cc.bg};color:${cc.text}">
        ${racer.course}コース　${racer.name}
        <span class="cs-class class-${racer.class.toLowerCase()}">${racer.class}</span>
      </div>
      <div class="cs-body">
        <div class="cs-scroll">
        <table class="cs-table">
          <thead>
            <tr>
              <th>枠</th><th>出走</th><th>勝率</th>
              <th title="1コース:逃げ率 / 2-6コース:逃し率">逃/逃し</th>
              <th title="1コース:差され率" class="new-col">差され</th>
              <th title="差し率">差し</th>
              <th title="捲り率">捲り</th>
              <th title="捲り差し率" class="new-col">捲差し</th>
              <th title="1コース:捲り刺され率 / 2-6コース:逃げ時2着率" class="new-col">捲刺/逃2</th>
              <th title="インコース逃げ時3着率" class="new-col">逃3着</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(statsToUse).map(([c, s]) => {
              const isCourse1 = c === '1';
              return `
              <tr class="${parseInt(c) === racer.course ? 'current-course' : ''}">
                <td><span style="background:${COURSE_COLORS[c].bg};color:${COURSE_COLORS[c].text}" class="cs-badge">${c}</span></td>
                <td>${s.starts}</td>
                <td><span class="wr-bar" style="--pct:${Math.min(s.winRate, 60)}%">${s.winRate}%</span></td>
                <td>${isCourse1
                  ? (s.nigeRate != null ? `<span class="nige-badge">${s.nigeRate}%</span>` : '-')
                  : (s.nigashiRate != null ? `<span class="nigashi-badge">${s.nigashiRate}%</span>` : '-')}</td>
                <td>${isCourse1 && s.sashirareRate != null ? `<span class="sashirare-badge">${s.sashirareRate}%</span>` : '-'}</td>
                <td>${!isCourse1 && s.sashiRate != null ? `<span class="sashi-badge">${s.sashiRate}%</span>` : '-'}</td>
                <td>${!isCourse1 && s.makuriRate != null ? `<span class="makuri-badge">${s.makuriRate}%</span>` : '-'}</td>
                <td>${!isCourse1 && s.makurisashiRate != null ? `<span class="makurisashi-badge">${s.makurisashiRate}%</span>` : '-'}</td>
                <td>${isCourse1 && s.makurisashiraRate != null
                  ? `<span class="makurisashira-badge">${s.makurisashiraRate}%</span>`
                  : (!isCourse1 && s.nigeNiRate != null ? `<span class="nige-ni-badge">${s.nigeNiRate}%</span>` : '-')}</td>
                <td>${!isCourse1 && s.nigeSanRate != null ? `<span class="nige-san-badge">${s.nigeSanRate}%</span>` : '-'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        </div>
        <div class="cs-legend">
          <span class="nige-badge">逃</span>逃げ率
          <span class="nigashi-badge">逃し</span>逃し率
          <span class="sashirare-badge">差され</span>差され率
          <span class="sashi-badge">差</span>差し率
          <span class="makuri-badge">捲</span>捲り率
          <span class="makurisashi-badge">捲差</span>捲差し率
          <span class="makurisashira-badge">捲刺</span>捲刺され率
          <span class="nige-ni-badge">逃2</span>逃時2着
          <span class="nige-san-badge">逃3</span>逃時3着
        </div>
      </div>`;
    container.appendChild(card);
  });
}

function setupCourseStatsFilter() {
  const filterEl = document.getElementById('cs-filter');
  if (!filterEl) return;
  filterEl.querySelectorAll('.csf-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const race = getCurrentRace();
      if (race) renderCourseStats(race, btn.dataset.cat);
    });
  });
}

function renderVenueFeatures(venueId) {
  const venue  = getVenueById(venueId);
  const feat   = VENUE_FEATURES[venueId];
  const water  = WATER_FEATURES[venue.water];
  const el     = document.getElementById('venue-features-content');
  if (!el) return;

  const inRatingLabel = { very_high:'◎ 非常に有利', high:'○ 有利', medium:'△ 普通', low:'▲ 不利' };
  const roughLabel    = { very_low:'波：ほぼなし', low:'波：穏やか', low_medium:'波：やや穏やか', medium:'波：普通', medium_high:'波：やや荒れ', high:'波：荒れやすい', very_high:'波：非常に荒れやすい' };

  if (!feat) { el.innerHTML = '<p style="color:#666;padding:16px">データなし</p>'; return; }

  el.innerHTML = `
    <div class="vf-header">
      <div class="vf-title">${venue.name} <span class="vf-pref">${venue.pref}</span></div>
      <div class="vf-tags">
        <span class="vf-tag" style="background:${water?.color || '#333'}">${venue.water}</span>
        <span class="vf-tag">${inRatingLabel[feat.inRating] || feat.inRating}</span>
        <span class="vf-tag">${roughLabel[feat.roughness] || feat.roughness}</span>
      </div>
    </div>

    <div class="vf-tips">
      ${feat.tips.map(t => `<span class="vf-tip">💡 ${t}</span>`).join('')}
    </div>

    <div class="vf-characteristics">
      ${feat.characteristics.map(c => `
        <div class="vf-char">
          <span class="vf-char-label">${c.label}</span>
          <span class="vf-char-desc">${c.desc}</span>
        </div>`).join('')}
    </div>

    <div class="vf-section-title">コース別勝率傾向</div>
    <div class="vf-course-rates">
      ${feat.courseWinRates.map((rate, i) => {
        const cc = COURSE_COLORS[i+1];
        return `<div class="vf-cr-item">
          <span class="vf-cr-badge" style="background:${cc.bg};color:${cc.text}">${i+1}</span>
          <div class="vf-cr-bar-wrap">
            <div class="vf-cr-bar" style="width:${Math.min(rate,70)}%"></div>
          </div>
          <span class="vf-cr-pct">${rate}%</span>
        </div>`;
      }).join('')}
    </div>

    <div class="vf-section-title">水質特性：${venue.water}</div>
    <div class="vf-water">
      <div class="vf-water-desc">${water?.description || ''}</div>
      <div class="vf-water-grid">
        <div class="vf-water-item"><span class="vf-wi-label">艇への影響</span>${water?.boatEffect || ''}</div>
        <div class="vf-water-item"><span class="vf-wi-label">モーターへの影響</span>${water?.motorEffect || ''}</div>
        <div class="vf-water-item"><span class="vf-wi-label">スタートへの影響</span>${water?.startEffect || ''}</div>
      </div>
      <div class="vf-water-tips">
        ${(water?.tips || []).map(t => `<span class="vf-tip">📌 ${t}</span>`).join('')}
      </div>
    </div>`;
}

function renderWaterPage() {
  const el = document.getElementById('water-page-content');
  if (!el) return;
  el.innerHTML = Object.entries(WATER_FEATURES).map(([type, w]) => `
    <div class="wp-card" style="border-color:${w.color}">
      <div class="wp-header" style="background:${w.color}20;border-bottom:2px solid ${w.color}">
        <span class="wp-icon">${w.icon}</span>
        <span class="wp-type">${type}</span>
        <span class="wp-desc">${w.description}</span>
      </div>
      <div class="wp-body">
        <div class="wp-venues">
          <span class="wp-vlabel">該当会場</span>
          ${w.venues.map(v => `<span class="wp-venue">${v}</span>`).join('')}
        </div>
        <div class="wp-effects">
          <div class="wp-eff"><span class="wp-eff-label">🚤 艇への影響</span><p>${w.boatEffect}</p></div>
          <div class="wp-eff"><span class="wp-eff-label">⚙️ モーターへの影響</span><p>${w.motorEffect}</p></div>
          <div class="wp-eff"><span class="wp-eff-label">🏁 スタートへの影響</span><p>${w.startEffect}</p></div>
        </div>
        <div class="wp-pros-cons">
          <div class="wp-pros">
            <div class="wp-pc-label">メリット</div>
            ${w.advantages.map(a => `<div class="wp-pc-item">✓ ${a}</div>`).join('')}
          </div>
          <div class="wp-cons">
            <div class="wp-pc-label">デメリット</div>
            ${w.disadvantages.map(d => `<div class="wp-pc-item">✗ ${d}</div>`).join('')}
          </div>
        </div>
        <div class="wp-tips">${w.tips.map(t => `<span class="vf-tip">💡 ${t}</span>`).join('')}</div>
      </div>
    </div>`).join('');
}

/* ── 3連単オッズ生成（決定論的シードRNG） ── */
function generateMockOdds(racers) {
  const seed = racers.reduce((a, r) => a + r.id, 0);
  const rng  = seededRng(seed);
  const W    = [38, 25, 16, 10, 7, 4];   // コース別基本確率(%)
  const total = W.reduce((a, b) => a + b, 0);
  const P = W.map(w => w / total);

  const odds3 = {};
  for (let i = 1; i <= 6; i++) {
    for (let j = 1; j <= 6; j++) {
      if (i === j) continue;
      const remW = W.filter((_, idx) => idx !== i - 1 && idx !== j - 1);
      const remT = remW.reduce((a, b) => a + b, 0);
      for (let k = 1; k <= 6; k++) {
        if (k === i || k === j) continue;
        const pCombo = P[i-1] * P[j-1] * (W[k-1] / remT);
        const base   = Math.max(5, 0.75 / pCombo);
        const o      = parseFloat((base * (0.78 + rng() * 0.44)).toFixed(1));
        odds3[`${i}-${j}-${k}`] = o;
      }
    }
  }
  return odds3;
}

/* ── 3連単グリッド描画 ── */
function renderOddsList(race) {
  const container = document.getElementById('odds-grid-container');
  if (!container) return;

  const oddsData = generateMockOdds(race.racers);

  // ヘッダー行
  let html = '<div class="og-wrap"><table class="og-table"><thead><tr>';
  html += '<th class="og-corner">1着↓<br><span class="og-sub">2着→</span></th>';
  for (let j = 1; j <= 6; j++) {
    const cc = COURSE_COLORS[j];
    html += `<th><span class="og-badge" style="background:${cc.bg};color:${cc.text}">${j}</span></th>`;
  }
  html += '</tr></thead><tbody>';

  for (let i = 1; i <= 6; i++) {
    const cc1 = COURSE_COLORS[i];
    html += `<tr><th class="og-row-th"><span class="og-badge" style="background:${cc1.bg};color:${cc1.text}">${i}</span></th>`;
    for (let j = 1; j <= 6; j++) {
      if (i === j) { html += '<td class="og-diag">×</td>'; continue; }
      let minOdds = Infinity;
      for (let k = 1; k <= 6; k++) {
        if (k === i || k === j) continue;
        const o = oddsData[`${i}-${j}-${k}`];
        if (o !== undefined && o < minOdds) minOdds = o;
      }
      const cls = minOdds < 20 ? 'og-s' : minOdds < 50 ? 'og-a' : minOdds < 150 ? 'og-b' : 'og-c';
      html += `<td class="og-cell ${cls}" data-i="${i}" data-j="${j}"
        onclick="window.showOddsDetail(${i},${j},this)">${minOdds.toFixed(1)}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table></div>';
  html += '<div id="odds-detail-panel" class="og-detail-panel"></div>';
  container.innerHTML = html;
}

/* ── 3着選択パネル ── */
window.showOddsDetail = function(i, j, cell) {
  const race = getCurrentRace();
  if (!race) return;
  const oddsData = generateMockOdds(race.racers);

  // セル選択ハイライト
  document.querySelectorAll('.og-cell').forEach(c => c.classList.remove('og-selected'));
  if (cell) cell.classList.add('og-selected');

  const details = [];
  for (let k = 1; k <= 6; k++) {
    if (k === i || k === j) continue;
    details.push({ k, odds: oddsData[`${i}-${j}-${k}`] || 0 });
  }
  details.sort((a, b) => a.odds - b.odds);

  const cc1 = COURSE_COLORS[i], cc2 = COURSE_COLORS[j];
  const panel = document.getElementById('odds-detail-panel');
  if (!panel) return;
  panel.innerHTML = `
    <div class="og-detail-header">
      <span class="og-badge md" style="background:${cc1.bg};color:${cc1.text}">${i}</span>
      <span class="og-arrow">→</span>
      <span class="og-badge md" style="background:${cc2.bg};color:${cc2.text}">${j}</span>
      <span class="og-arrow">→ 3着を選択</span>
      <span class="og-hint">＋で合成オッズに追加</span>
    </div>
    <div class="og-bets">
      ${details.map(d => {
        const cc3 = COURSE_COLORS[d.k];
        const cls = d.odds < 20 ? 'og-s' : d.odds < 50 ? 'og-a' : d.odds < 150 ? 'og-b' : 'og-c';
        return `<div class="og-bet-row ${cls}">
          <div class="og-bet-combo">
            <span class="og-badge sm" style="background:${cc1.bg};color:${cc1.text}">${i}</span>
            <span class="og-arr">→</span>
            <span class="og-badge sm" style="background:${cc2.bg};color:${cc2.text}">${j}</span>
            <span class="og-arr">→</span>
            <span class="og-badge sm" style="background:${cc3.bg};color:${cc3.text}">${d.k}</span>
          </div>
          <div class="og-bet-odds">${d.odds.toFixed(1)}<small>倍</small></div>
          <button class="og-add-btn" onclick="window.addSynthFromOdds(${i},${j},${d.k},${d.odds})">＋追加</button>
        </div>`;
      }).join('')}
    </div>`;
};

/* ── 合成オッズ計算機へ自動追加 ── */
window.addSynthFromOdds = function(i, j, k, odds) {
  const tbody = document.getElementById('synth-tbody');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="synth-combo" value="${i}→${j}→${k}" style="width:80px"></td>
    <td><input type="number" class="synth-odds" value="${odds}" step="0.1" min="1" style="width:64px"></td>
    <td><input type="number" class="synth-amount" placeholder="100" step="100" min="100" style="width:72px"></td>
    <td><button class="synth-del-btn" onclick="this.closest('tr').remove();calcSyntheticOdds()">×</button></td>`;
  tbody.appendChild(tr);
  tr.style.background = 'rgba(0,212,255,0.12)';
  setTimeout(() => { tr.style.background = ''; }, 1000);
  // 合成オッズ計算機へスクロール
  document.querySelector('.odds-calc-layout')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

function initOddsCalculator() {
  const calcBtn = document.getElementById('odds-calc-btn');
  if (calcBtn) calcBtn.addEventListener('click', calcOdds);
  const synthBtn = document.getElementById('synth-calc-btn');
  if (synthBtn) synthBtn.addEventListener('click', calcSyntheticOdds);
  const addRowBtn = document.getElementById('synth-add-row');
  if (addRowBtn) addRowBtn.addEventListener('click', addSynthRow);
}

function calcOdds() {
  const amount = parseFloat(document.getElementById('calc-amount').value) || 0;
  const odds   = parseFloat(document.getElementById('calc-odds').value) || 0;
  const result = document.getElementById('calc-result');
  if (!amount || !odds) { result.textContent = '金額とオッズを入力してください'; return; }
  const ret  = Math.floor(amount * odds / 100) * 100;
  const profit = ret - amount;
  result.innerHTML = `<span class="calc-return">払戻 ¥${ret.toLocaleString()}</span>
    <span class="calc-profit ${profit >= 0 ? 'positive' : 'negative'}">収益 ${profit >= 0 ? '+' : ''}¥${profit.toLocaleString()}</span>`;
}

function addSynthRow() {
  const tbody = document.getElementById('synth-tbody');
  const idx = tbody.children.length + 1;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="synth-combo" placeholder="1→2→3" style="width:80px"></td>
    <td><input type="number" class="synth-odds" placeholder="オッズ" step="0.1" min="1" style="width:70px"></td>
    <td><input type="number" class="synth-amount" placeholder="金額" step="100" min="100" style="width:80px"></td>
    <td><button class="synth-del-btn" onclick="this.closest('tr').remove();calcSyntheticOdds()">×</button></td>`;
  tbody.appendChild(tr);
}

function calcSyntheticOdds() {
  const rows    = document.querySelectorAll('#synth-tbody tr');
  let totalBet  = 0;
  let sumInv    = 0;
  let maxReturn = 0;
  const details = [];
  rows.forEach(row => {
    const combo  = row.querySelector('.synth-combo')?.value || '';
    const odds   = parseFloat(row.querySelector('.synth-odds')?.value) || 0;
    const amount = parseFloat(row.querySelector('.synth-amount')?.value) || 0;
    if (!odds || !amount) return;
    totalBet += amount;
    sumInv   += amount / odds;
    const ret = Math.floor(amount * odds / 100) * 100;
    maxReturn = Math.max(maxReturn, ret);
    details.push({ combo, odds, amount, ret });
  });
  const el = document.getElementById('synth-result');
  if (!totalBet || !sumInv) { el.innerHTML = '<span style="color:#666">データを入力してください</span>'; return; }
  const synthOdds = parseFloat((totalBet / sumInv).toFixed(2));
  const breakeven = parseFloat((totalBet / synthOdds).toFixed(0));
  el.innerHTML = `
    <div class="synth-main">
      <div class="synth-stat"><div class="synth-val">${synthOdds.toFixed(2)}倍</div><div class="synth-lbl">合成オッズ</div></div>
      <div class="synth-stat"><div class="synth-val">¥${totalBet.toLocaleString()}</div><div class="synth-lbl">合計投資額</div></div>
      <div class="synth-stat"><div class="synth-val">¥${maxReturn.toLocaleString()}</div><div class="synth-lbl">最大払戻</div></div>
      <div class="synth-stat"><div class="synth-val ${synthOdds >= 1.0 ? 'positive' : 'negative'}">${synthOdds >= 1.0 ? '黒字' : '赤字'}</div><div class="synth-lbl">収支判定</div></div>
    </div>
    <div class="synth-detail">
      ${details.map(d => `<div class="synth-row-detail">
        <span>${d.combo || '---'}</span>
        <span>${d.odds}倍</span>
        <span>¥${d.amount.toLocaleString()}</span>
        <span>→ ¥${d.ret.toLocaleString()}</span>
      </div>`).join('')}
    </div>`;
}

function renderAIPrediction(pred) {
  const container = document.getElementById('ai-pred-container');
  const recContainer = document.getElementById('ai-recommendations');
  const analysisEl = document.getElementById('ai-analysis');

  container.innerHTML = '';
  pred.ranked.forEach(item => {
    const racer = item.racer;
    const cc = COURSE_COLORS[racer.course];
    const div = document.createElement('div');
    div.className = `ai-racer-card rank-${item.rank} conf-${item.confidence}`;
    div.innerHTML = `
      <div class="ai-rank-badge">${item.rank}位</div>
      <div class="ai-course" style="background:${cc.bg};color:${cc.text}">${racer.course}コース</div>
      <div class="ai-info">
        <span class="ai-name">${racer.name}</span>
        <span class="ai-class class-${racer.class.toLowerCase()}">${racer.class}</span>
      </div>
      <div class="ai-prob-bar">
        <div class="ai-bar-fill conf-${item.confidence}" style="width:${item.probability}%"></div>
        <span class="ai-prob-text">${item.probability}%</span>
      </div>
      <div class="ai-score-detail">
        ${Object.entries(item.scores).map(([k, v]) => `
          <span class="score-chip" title="${scoreLabel(k)}">${scoreLabel(k)}: ${(v * 100).toFixed(1)}</span>
        `).join('')}
      </div>`;
    container.appendChild(div);
  });

  recContainer.innerHTML = pred.recommendations.map(rec => `
    <div class="rec-card conf-${rec.confidence}">
      <div class="rec-type">${rec.type}</div>
      <div class="rec-bets">${rec.bets.map(b => `<span class="bet-chip">${b}</span>`).join('')}</div>
      <div class="rec-reason">${rec.reason}</div>
      <div class="rec-conf">${confLabel(rec.confidence)}</div>
    </div>`).join('');

  analysisEl.innerHTML = pred.analysisText.map(t => `<p>${t}</p>`).join('');
}

function scoreLabel(key) {
  return {
    exhibitionTime: '展示T',
    originalTime: '原時計',
    courseWinRate: 'コース率',
    startTiming: 'ST',
    tiltBonus: 'チルト',
    motorBonus: 'モーター',
    recentForm: '直近',
  }[key] || key;
}

function confLabel(c) {
  return { high: '◎本命', medium: '○対抗', low: '▲注意' }[c] || c;
}

function renderRacerProfiles(race) {
  const container = document.getElementById('racer-profiles');
  container.innerHTML = '';
  race.racers.forEach(racer => {
    const cc = COURSE_COLORS[racer.course];
    const recentStr = racer.recentResults.map(r => `<span class="result r${r}">${r}</span>`).join('');
    const div = document.createElement('div');
    div.className = 'profile-card';
    div.innerHTML = `
      <div class="profile-header" style="background:${cc.bg};color:${cc.text}">
        <span class="profile-course">${racer.course}コース</span>
        <span class="profile-name">${racer.name}</span>
        <span class="profile-kana">${racer.nameKana}</span>
        <span class="profile-class class-${racer.class.toLowerCase()}">${racer.class}</span>
      </div>
      <div class="profile-body">
        <div class="profile-meta">
          <span>${racer.pref}　${racer.age}歳　${racer.weight}kg</span>
          <span>登録番号 ${racer.id}</span>
        </div>
        <div class="profile-stats-row">
          <div class="pstat"><div class="pstat-val">${racer.winRate}</div><div class="pstat-lbl">勝率</div></div>
          <div class="pstat"><div class="pstat-val">${racer.doubleWinRate}%</div><div class="pstat-lbl">2連率</div></div>
          <div class="pstat"><div class="pstat-val">${racer.tripleWinRate}%</div><div class="pstat-lbl">3連率</div></div>
        </div>
        <div class="profile-equipment">
          <div class="equip-row">
            <span class="equip-label">モーター</span>
            <span>No.${racer.motor.no}</span>
            <span class="${motorClass(racer.motor.winRate)}">${racer.motor.winRate}%</span>
          </div>
          <div class="equip-row">
            <span class="equip-label">ボート</span>
            <span>No.${racer.boat.no}</span>
            <span>${racer.boat.winRate}%</span>
          </div>
          <div class="equip-row">
            <span class="equip-label">チルト</span>
            <span class="${tiltClass(racer.tilt)}">${racer.tilt > 0 ? '+' : ''}${racer.tilt}°</span>
          </div>
        </div>
        <div class="profile-recent">
          <span class="section-mini-label">直近10走</span>
          <div class="recent-results">${recentStr}</div>
        </div>
      </div>`;
    container.appendChild(div);
  });
}

function renderCharts(race) {
  renderExhibitionChart(race);
  renderCourseWinChart(race);
}

function renderExhibitionChart(race) {
  const ctx = document.getElementById('exhibition-chart');
  if (!ctx) return;
  if (chartInstances.exhibition) chartInstances.exhibition.destroy();

  const racersWithET = race.racers.filter(r => r.exhibitionTime !== null);
  if (racersWithET.length === 0) {
    ctx.parentElement.innerHTML = '<div class="chart-placeholder">展示データ集計中...</div>';
    return;
  }

  chartInstances.exhibition = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: race.racers.map(r => `${r.course}コース`),
      datasets: [
        {
          label: '展示タイム (秒)',
          data: race.racers.map(r => r.exhibitionTime ? parseFloat(r.exhibitionTime) : null),
          backgroundColor: race.racers.map(r => COURSE_COLORS[r.course].bg),
          borderColor: race.racers.map(r => r.course === 2 ? '#888' : COURSE_COLORS[r.course].bg),
          borderWidth: 1,
        },
        {
          label: 'オリジナルタイム',
          data: race.racers.map(r => r.originalTime),
          type: 'line',
          borderColor: '#00d4ff',
          pointBackgroundColor: '#00d4ff',
          fill: false,
          tension: 0.3,
          yAxisID: 'y2',
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#ccc' } },
        title: { display: true, text: '展示タイム & オリジナルタイム比較', color: '#ccc' },
      },
      scales: {
        x: { ticks: { color: '#aaa' }, grid: { color: '#333' } },
        y: {
          ticks: { color: '#aaa' },
          grid: { color: '#333' },
          min: 6.5,
          max: 7.2,
          title: { display: true, text: '展示T (秒)', color: '#aaa' },
        },
        y2: {
          position: 'right',
          ticks: { color: '#aaa' },
          grid: { drawOnChartArea: false },
          min: 3.65,
          max: 3.80,
          title: { display: true, text: 'オリジナルT', color: '#aaa' },
        },
      },
    },
  });
}

function renderCourseWinChart(race) {
  const ctx = document.getElementById('course-win-chart');
  if (!ctx) return;
  if (chartInstances.courseWin) chartInstances.courseWin.destroy();

  const labels = ['1コース', '2コース', '3コース', '4コース', '5コース', '6コース'];
  const datasets = race.racers.map(racer => ({
    label: racer.name,
    data: Object.values(racer.courseStats).map(cs => cs.winRate),
    backgroundColor: COURSE_COLORS[racer.course].bg + '99',
    borderColor: COURSE_COLORS[racer.course].bg,
    borderWidth: 2,
    fill: false,
  }));

  chartInstances.courseWin = new Chart(ctx, {
    type: 'radar',
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#ccc' } },
        title: { display: true, text: 'コース別勝率レーダー', color: '#ccc' },
      },
      scales: {
        r: {
          ticks: { color: '#aaa', backdropColor: 'transparent' },
          grid: { color: '#333' },
          pointLabels: { color: '#ccc' },
          min: 0, max: 60,
        },
      },
    },
  });
}

function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      activeTab = tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === tab));
      if (tab === 'charts') {
        const race = getCurrentRace();
        if (race) renderCharts(race);
      }
    });
  });
  setupCourseStatsFilter();
}

function flashUpdatedCells(fields) {
  fields.forEach(f => {
    const courseMatch = f.match(/(\d)コース/);
    if (!courseMatch) return;
    const course = courseMatch[1];
    const race = getCurrentRace();
    if (!race) return;
    [`et-${race.venueId}-${race.no}-${course}`,
     `exh-et-${course}`,
     `exh-st-${course}`].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.add('flash-update');
        setTimeout(() => el.classList.remove('flash-update'), 1500);
      }
    });
  });
}

function startUpdateIndicator() {
  const indicator = document.getElementById('live-indicator');
  if (indicator) {
    indicator.classList.add('live');
    indicator.textContent = '● LIVE更新中';
  }
}

function showUpdateBadge() {
  const badge = document.getElementById('update-badge');
  if (badge) {
    badge.style.display = 'inline';
    setTimeout(() => { badge.style.display = 'none'; }, 2000);
  }
}

function motorClass(rate) {
  if (rate >= 48) return 'motor-good';
  if (rate >= 38) return 'motor-avg';
  return 'motor-bad';
}

function tiltClass(tilt) {
  if (tilt >= 1.5) return 'tilt-high';
  if (tilt >= 0.5) return 'tilt-mid';
  if (tilt === 0.0) return 'tilt-zero';
  return 'tilt-neg';
}

function stClass(st) {
  const v = parseFloat(st);
  if (v <= 0.08) return 'st-fast';
  if (v <= 0.15) return 'st-normal';
  return 'st-slow';
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* ── モーター評価ドット表示（●5段階） ── */
function dotRating(n) {
  const filled = '<span class="mev-dot filled">●</span>'.repeat(n);
  const empty  = '<span class="mev-dot">○</span>'.repeat(5 - n);
  return `<span class="mev-dots">${filled}${empty}</span>`;
}

document.addEventListener('DOMContentLoaded', init);



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


