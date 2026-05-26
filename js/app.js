const API_BASE = 'https://boatrace-api.onrender.com';
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
  buildVenueTabs();
  loadVenueRaces(currentVenueId);
  fetchTomorrowSchedule();
  fetchTomorrowSchedule();
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
    const gradeBadge = v.grade !== '荳闊ｬ'
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
    `<span class="tag">${race.startTime} 逋ｺ襍ｰ</span>` +
    `<span class="tag status-tag-${race.status}">${statusLabel(race.status)}</span>` +
    `<span class="tag">${venue.water}</span>`;
}

function statusLabel(s) {
  return { upcoming: '逋ｺ襍ｰ蜑・, exhibition: '螻慕､ｺ荳ｭ', racing: '繝ｬ繝ｼ繧ｹ荳ｭ', finished: '邨ゆｺ・ }[s] || s;
}

function renderRaceCard(race) {
  const tbody = document.getElementById('race-card-body');
  tbody.innerHTML = '';
  race.racers.forEach(racer => {
    const cc = COURSE_COLORS[racer.course];
    const cs = racer.courseStats[racer.course];
    const nigeLabel = racer.course === 1 && cs
      ? `<span class="stat-chip nige">騾・${cs.nigeRate}%</span>` : '';
    const nigashiLabel = racer.course === 2 && cs
      ? `<span class="stat-chip nigashi">騾・＠ ${cs.nigashiRate}%</span>` : '';

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
          <span>逋ｻ骭ｲ${racer.id}</span>
          ${nigeLabel}${nigashiLabel}
          ${racer.flyingCount > 0 ? `<span class="fl-badge f-badge">F${racer.flyingCount}</span>` : ''}
          ${racer.lateStartCount > 0 ? `<span class="fl-badge l-badge">L${racer.lateStartCount}</span>` : ''}
          ${racer.flPeriod ? `<span class="fl-badge fp-badge">莠区腐莨・/span>` : ''}
        </div>
        <div class="racer-data-grid">
          <div class="rdg-row">
            <span class="rdg-label">蜈ｨ蝗ｽ</span>
            <span>蜍・{racer.winRate}</span>
            <span>2騾｣${racer.doubleWinRate}%</span>
            <span>3騾｣${racer.tripleWinRate}%</span>
          </div>
          <div class="rdg-row">
            <span class="rdg-label tochi-lbl">蠖灘慍</span>
            <span>蜍・{racer.tochiData ? racer.tochiData.winRate : '-'}</span>
            <span>2騾｣${racer.tochiData ? racer.tochiData.doubleWinRate : '-'}%</span>
            <span>3騾｣${racer.tochiData ? racer.tochiData.tripleWinRate : '-'}%</span>
            <span class="tochi-starts">${racer.tochiData ? racer.tochiData.starts + '襍ｰ' : ''}</span>
          </div>
        </div>
        ${racer.flHistory && racer.flHistory.length > 0 ? `
        <div class="fl-history">
          ${racer.flHistory.slice(0, 3).map(fl => `<span class="fl-hist-item ${fl.type === 'F' ? 'fl-hist-f' : 'fl-hist-l'}">${fl.type} ${fl.venue}${fl.course}繧ｳ ${fl.date.replace(/^\d{4}-/, '')}</span>`).join('')}
        </div>` : ''}
        ${racer.motorEval ? `
        <div class="motor-eval-row">
          <span class="mev-pro-tag">PRO</span>
          <span class="mev-item"><span class="mev-lbl">蜃ｺ雜ｳ</span>${dotRating(racer.motorEval.dashiashi)}</span>
          <span class="mev-item"><span class="mev-lbl">陦瑚ｶｳ</span>${dotRating(racer.motorEval.yukiashi)}</span>
          <span class="mev-item"><span class="mev-lbl">莨ｸ縺ｳ</span>${dotRating(racer.motorEval.nobi)}</span>
          <span class="mev-overall mev-${racer.motorEval.sogo.toLowerCase()}">${racer.motorEval.sogo}</span>
        </div>` : ''}
      </td>
      <td class="data-cell">
        <div class="motor-info">M${racer.motor.no}</div>
        <div class="motor-rate ${motorClass(racer.motor.winRate)}">${racer.motor.winRate}%</div>
      </td>
      <td class="data-cell tilt-cell ${tiltClass(racer.tilt)}">
        ${racer.tilt > 0 ? '+' : ''}${racer.tilt}ﾂｰ
      </td>
      <td class="data-cell">
        <span class="original-time">${racer.originalTime}</span>
      </td>
      <td class="data-cell et-cell" id="et-${race.venueId}-${race.no}-${racer.course}">
        ${racer.exhibitionTime !== null
          ? `<span class="et-val rank-${racer.exhibitionRank}">${racer.exhibitionTime}</span>${racer.exhibitionRank != null && racer.exhibitionRank <= 2 ? `<span class="et-rank">笆ｲ${racer.exhibitionRank}菴・/span>` : ''}`
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
      <td class="${tiltClass(racer.tilt)}">${racer.tilt > 0 ? '+' : ''}${racer.tilt}ﾂｰ</td>
      <td class="et-highlight" id="exh-et-${racer.course}">
        ${racer.exhibitionTime !== null
          ? `<strong class="${idx < 2 ? 'top-time' : ''}">${racer.exhibitionTime}</strong>`
          : '<span class="no-data loading">譖ｴ譁ｰ蠕・■</span>'}
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
      <span>蜴滓凾險医Λ繝ｳ繧ｭ繝ｳ繧ｰ</span>
      <span class="ot-note">繝｢繝ｼ繧ｿ繝ｼ蝓ｺ譛ｬ蜃ｺ蜉帶欠讓呻ｼ井ｽ弱＞縺ｻ縺ｩ鬮伜・蜉幢ｼ・/span>
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
        ${racer.course}繧ｳ繝ｼ繧ｹ縲${racer.name}
        <span class="cs-class class-${racer.class.toLowerCase()}">${racer.class}</span>
      </div>
      <div class="cs-body">
        <div class="cs-scroll">
        <table class="cs-table">
          <thead>
            <tr>
              <th>譫</th><th>蜃ｺ襍ｰ</th><th>蜍晉紫</th>
              <th title="1繧ｳ繝ｼ繧ｹ:騾・￡邇・/ 2-6繧ｳ繝ｼ繧ｹ:騾・＠邇・>騾・騾・＠</th>
              <th title="1繧ｳ繝ｼ繧ｹ:蟾ｮ縺輔ｌ邇・ class="new-col">蟾ｮ縺輔ｌ</th>
              <th title="蟾ｮ縺礼紫">蟾ｮ縺・/th>
              <th title="謐ｲ繧顔紫">謐ｲ繧・/th>
              <th title="謐ｲ繧雁ｷｮ縺礼紫" class="new-col">謐ｲ蟾ｮ縺・/th>
              <th title="1繧ｳ繝ｼ繧ｹ:謐ｲ繧雁絢縺輔ｌ邇・/ 2-6繧ｳ繝ｼ繧ｹ:騾・￡譎・逹邇・ class="new-col">謐ｲ蛻ｺ/騾・</th>
              <th title="繧､繝ｳ繧ｳ繝ｼ繧ｹ騾・￡譎・逹邇・ class="new-col">騾・逹</th>
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
          <span class="nige-badge">騾・/span>騾・￡邇・          <span class="nigashi-badge">騾・＠</span>騾・＠邇・          <span class="sashirare-badge">蟾ｮ縺輔ｌ</span>蟾ｮ縺輔ｌ邇・          <span class="sashi-badge">蟾ｮ</span>蟾ｮ縺礼紫
          <span class="makuri-badge">謐ｲ</span>謐ｲ繧顔紫
          <span class="makurisashi-badge">謐ｲ蟾ｮ</span>謐ｲ蟾ｮ縺礼紫
          <span class="makurisashira-badge">謐ｲ蛻ｺ</span>謐ｲ蛻ｺ縺輔ｌ邇・          <span class="nige-ni-badge">騾・</span>騾・凾2逹
          <span class="nige-san-badge">騾・</span>騾・凾3逹
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

  const inRatingLabel = { very_high:'笳・髱槫ｸｸ縺ｫ譛牙茜', high:'笳・譛牙茜', medium:'笆ｳ 譎ｮ騾・, low:'笆ｲ 荳榊茜' };
  const roughLabel    = { very_low:'豕｢・壹⊇縺ｼ縺ｪ縺・, low:'豕｢・夂ｩ上ｄ縺・, low_medium:'豕｢・壹ｄ繧・ｩ上ｄ縺・, medium:'豕｢・壽勸騾・, medium_high:'豕｢・壹ｄ繧・穀繧・, high:'豕｢・夊穀繧後ｄ縺吶＞', very_high:'豕｢・夐撼蟶ｸ縺ｫ闕偵ｌ繧・☆縺・ };

  if (!feat) { el.innerHTML = '<p style="color:#666;padding:16px">繝・・繧ｿ縺ｪ縺・/p>'; return; }

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
      ${feat.tips.map(t => `<span class="vf-tip">庁 ${t}</span>`).join('')}
    </div>

    <div class="vf-characteristics">
      ${feat.characteristics.map(c => `
        <div class="vf-char">
          <span class="vf-char-label">${c.label}</span>
          <span class="vf-char-desc">${c.desc}</span>
        </div>`).join('')}
    </div>

    <div class="vf-section-title">繧ｳ繝ｼ繧ｹ蛻･蜍晉紫蛯ｾ蜷・/div>
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

    <div class="vf-section-title">豌ｴ雉ｪ迚ｹ諤ｧ・・{venue.water}</div>
    <div class="vf-water">
      <div class="vf-water-desc">${water?.description || ''}</div>
      <div class="vf-water-grid">
        <div class="vf-water-item"><span class="vf-wi-label">濶・∈縺ｮ蠖ｱ髻ｿ</span>${water?.boatEffect || ''}</div>
        <div class="vf-water-item"><span class="vf-wi-label">繝｢繝ｼ繧ｿ繝ｼ縺ｸ縺ｮ蠖ｱ髻ｿ</span>${water?.motorEffect || ''}</div>
        <div class="vf-water-item"><span class="vf-wi-label">繧ｹ繧ｿ繝ｼ繝医∈縺ｮ蠖ｱ髻ｿ</span>${water?.startEffect || ''}</div>
      </div>
      <div class="vf-water-tips">
        ${(water?.tips || []).map(t => `<span class="vf-tip">東 ${t}</span>`).join('')}
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
          <span class="wp-vlabel">隧ｲ蠖謎ｼ壼ｴ</span>
          ${w.venues.map(v => `<span class="wp-venue">${v}</span>`).join('')}
        </div>
        <div class="wp-effects">
          <div class="wp-eff"><span class="wp-eff-label">圖 濶・∈縺ｮ蠖ｱ髻ｿ</span><p>${w.boatEffect}</p></div>
          <div class="wp-eff"><span class="wp-eff-label">笞呻ｸ・繝｢繝ｼ繧ｿ繝ｼ縺ｸ縺ｮ蠖ｱ髻ｿ</span><p>${w.motorEffect}</p></div>
          <div class="wp-eff"><span class="wp-eff-label">潤 繧ｹ繧ｿ繝ｼ繝医∈縺ｮ蠖ｱ髻ｿ</span><p>${w.startEffect}</p></div>
        </div>
        <div class="wp-pros-cons">
          <div class="wp-pros">
            <div class="wp-pc-label">繝｡繝ｪ繝・ヨ</div>
            ${w.advantages.map(a => `<div class="wp-pc-item">笨・${a}</div>`).join('')}
          </div>
          <div class="wp-cons">
            <div class="wp-pc-label">繝・Γ繝ｪ繝・ヨ</div>
            ${w.disadvantages.map(d => `<div class="wp-pc-item">笨・${d}</div>`).join('')}
          </div>
        </div>
        <div class="wp-tips">${w.tips.map(t => `<span class="vf-tip">庁 ${t}</span>`).join('')}</div>
      </div>
    </div>`).join('');
}

/* 笏笏 3騾｣蜊倥が繝・ぜ逕滓・・域ｱｺ螳夊ｫ也噪繧ｷ繝ｼ繝嘘NG・・笏笏 */
function generateMockOdds(racers) {
  const seed = racers.reduce((a, r) => a + r.id, 0);
  const rng  = seededRng(seed);
  const W    = [38, 25, 16, 10, 7, 4];   // 繧ｳ繝ｼ繧ｹ蛻･蝓ｺ譛ｬ遒ｺ邇・%)
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

/* 笏笏 3騾｣蜊倥げ繝ｪ繝・ラ謠冗判 笏笏 */
function renderOddsList(race) {
  const container = document.getElementById('odds-grid-container');
  if (!container) return;

  const oddsData = generateMockOdds(race.racers);

  // 繝倥ャ繝繝ｼ陦・  let html = '<div class="og-wrap"><table class="og-table"><thead><tr>';
  html += '<th class="og-corner">1逹竊・br><span class="og-sub">2逹竊・/span></th>';
  for (let j = 1; j <= 6; j++) {
    const cc = COURSE_COLORS[j];
    html += `<th><span class="og-badge" style="background:${cc.bg};color:${cc.text}">${j}</span></th>`;
  }
  html += '</tr></thead><tbody>';

  for (let i = 1; i <= 6; i++) {
    const cc1 = COURSE_COLORS[i];
    html += `<tr><th class="og-row-th"><span class="og-badge" style="background:${cc1.bg};color:${cc1.text}">${i}</span></th>`;
    for (let j = 1; j <= 6; j++) {
      if (i === j) { html += '<td class="og-diag">ﾃ・/td>'; continue; }
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

/* 笏笏 3逹驕ｸ謚槭ヱ繝阪Ν 笏笏 */
window.showOddsDetail = function(i, j, cell) {
  const race = getCurrentRace();
  if (!race) return;
  const oddsData = generateMockOdds(race.racers);

  // 繧ｻ繝ｫ驕ｸ謚槭ワ繧､繝ｩ繧､繝・  document.querySelectorAll('.og-cell').forEach(c => c.classList.remove('og-selected'));
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
      <span class="og-arrow">竊・/span>
      <span class="og-badge md" style="background:${cc2.bg};color:${cc2.text}">${j}</span>
      <span class="og-arrow">竊・3逹繧帝∈謚・/span>
      <span class="og-hint">・九〒蜷域・繧ｪ繝・ぜ縺ｫ霑ｽ蜉</span>
    </div>
    <div class="og-bets">
      ${details.map(d => {
        const cc3 = COURSE_COLORS[d.k];
        const cls = d.odds < 20 ? 'og-s' : d.odds < 50 ? 'og-a' : d.odds < 150 ? 'og-b' : 'og-c';
        return `<div class="og-bet-row ${cls}">
          <div class="og-bet-combo">
            <span class="og-badge sm" style="background:${cc1.bg};color:${cc1.text}">${i}</span>
            <span class="og-arr">竊・/span>
            <span class="og-badge sm" style="background:${cc2.bg};color:${cc2.text}">${j}</span>
            <span class="og-arr">竊・/span>
            <span class="og-badge sm" style="background:${cc3.bg};color:${cc3.text}">${d.k}</span>
          </div>
          <div class="og-bet-odds">${d.odds.toFixed(1)}<small>蛟・/small></div>
          <button class="og-add-btn" onclick="window.addSynthFromOdds(${i},${j},${d.k},${d.odds})">・玖ｿｽ蜉</button>
        </div>`;
      }).join('')}
    </div>`;
};

/* 笏笏 蜷域・繧ｪ繝・ぜ險育ｮ玲ｩ溘∈閾ｪ蜍戊ｿｽ蜉 笏笏 */
window.addSynthFromOdds = function(i, j, k, odds) {
  const tbody = document.getElementById('synth-tbody');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="synth-combo" value="${i}竊・{j}竊・{k}" style="width:80px"></td>
    <td><input type="number" class="synth-odds" value="${odds}" step="0.1" min="1" style="width:64px"></td>
    <td><input type="number" class="synth-amount" placeholder="100" step="100" min="100" style="width:72px"></td>
    <td><button class="synth-del-btn" onclick="this.closest('tr').remove();calcSyntheticOdds()">ﾃ・/button></td>`;
  tbody.appendChild(tr);
  tr.style.background = 'rgba(0,212,255,0.12)';
  setTimeout(() => { tr.style.background = ''; }, 1000);
  // 蜷域・繧ｪ繝・ぜ險育ｮ玲ｩ溘∈繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ
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
  if (!amount || !odds) { result.textContent = '驥鷹｡阪→繧ｪ繝・ぜ繧貞・蜉帙＠縺ｦ縺上□縺輔＞'; return; }
  const ret  = Math.floor(amount * odds / 100) * 100;
  const profit = ret - amount;
  result.innerHTML = `<span class="calc-return">謇墓綾 ﾂ･${ret.toLocaleString()}</span>
    <span class="calc-profit ${profit >= 0 ? 'positive' : 'negative'}">蜿守寢 ${profit >= 0 ? '+' : ''}ﾂ･${profit.toLocaleString()}</span>`;
}

function addSynthRow() {
  const tbody = document.getElementById('synth-tbody');
  const idx = tbody.children.length + 1;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="synth-combo" placeholder="1竊・竊・" style="width:80px"></td>
    <td><input type="number" class="synth-odds" placeholder="繧ｪ繝・ぜ" step="0.1" min="1" style="width:70px"></td>
    <td><input type="number" class="synth-amount" placeholder="驥鷹｡・ step="100" min="100" style="width:80px"></td>
    <td><button class="synth-del-btn" onclick="this.closest('tr').remove();calcSyntheticOdds()">ﾃ・/button></td>`;
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
  if (!totalBet || !sumInv) { el.innerHTML = '<span style="color:#666">繝・・繧ｿ繧貞・蜉帙＠縺ｦ縺上□縺輔＞</span>'; return; }
  const synthOdds = parseFloat((totalBet / sumInv).toFixed(2));
  const breakeven = parseFloat((totalBet / synthOdds).toFixed(0));
  el.innerHTML = `
    <div class="synth-main">
      <div class="synth-stat"><div class="synth-val">${synthOdds.toFixed(2)}蛟・/div><div class="synth-lbl">蜷域・繧ｪ繝・ぜ</div></div>
      <div class="synth-stat"><div class="synth-val">ﾂ･${totalBet.toLocaleString()}</div><div class="synth-lbl">蜷郁ｨ域兜雉・｡・/div></div>
      <div class="synth-stat"><div class="synth-val">ﾂ･${maxReturn.toLocaleString()}</div><div class="synth-lbl">譛螟ｧ謇墓綾</div></div>
      <div class="synth-stat"><div class="synth-val ${synthOdds >= 1.0 ? 'positive' : 'negative'}">${synthOdds >= 1.0 ? '鮟貞ｭ・ : '襍､蟄・}</div><div class="synth-lbl">蜿取髪蛻､螳・/div></div>
    </div>
    <div class="synth-detail">
      ${details.map(d => `<div class="synth-row-detail">
        <span>${d.combo || '---'}</span>
        <span>${d.odds}蛟・/span>
        <span>ﾂ･${d.amount.toLocaleString()}</span>
        <span>竊・ﾂ･${d.ret.toLocaleString()}</span>
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
      <div class="ai-rank-badge">${item.rank}菴・/div>
      <div class="ai-course" style="background:${cc.bg};color:${cc.text}">${racer.course}繧ｳ繝ｼ繧ｹ</div>
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
    exhibitionTime: '螻慕､ｺT',
    originalTime: '蜴滓凾險・,
    courseWinRate: '繧ｳ繝ｼ繧ｹ邇・,
    startTiming: 'ST',
    tiltBonus: '繝√Ν繝・,
    motorBonus: '繝｢繝ｼ繧ｿ繝ｼ',
    recentForm: '逶ｴ霑・,
  }[key] || key;
}

function confLabel(c) {
  return { high: '笳取悽蜻ｽ', medium: '笳句ｯｾ謚・, low: '笆ｲ豕ｨ諢・ }[c] || c;
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
        <span class="profile-course">${racer.course}繧ｳ繝ｼ繧ｹ</span>
        <span class="profile-name">${racer.name}</span>
        <span class="profile-kana">${racer.nameKana}</span>
        <span class="profile-class class-${racer.class.toLowerCase()}">${racer.class}</span>
      </div>
      <div class="profile-body">
        <div class="profile-meta">
          <span>${racer.pref}縲${racer.age}豁ｳ縲${racer.weight}kg</span>
          <span>逋ｻ骭ｲ逡ｪ蜿ｷ ${racer.id}</span>
        </div>
        <div class="profile-stats-row">
          <div class="pstat"><div class="pstat-val">${racer.winRate}</div><div class="pstat-lbl">蜍晉紫</div></div>
          <div class="pstat"><div class="pstat-val">${racer.doubleWinRate}%</div><div class="pstat-lbl">2騾｣邇・/div></div>
          <div class="pstat"><div class="pstat-val">${racer.tripleWinRate}%</div><div class="pstat-lbl">3騾｣邇・/div></div>
        </div>
        <div class="profile-equipment">
          <div class="equip-row">
            <span class="equip-label">繝｢繝ｼ繧ｿ繝ｼ</span>
            <span>No.${racer.motor.no}</span>
            <span class="${motorClass(racer.motor.winRate)}">${racer.motor.winRate}%</span>
          </div>
          <div class="equip-row">
            <span class="equip-label">繝懊・繝・/span>
            <span>No.${racer.boat.no}</span>
            <span>${racer.boat.winRate}%</span>
          </div>
          <div class="equip-row">
            <span class="equip-label">繝√Ν繝・/span>
            <span class="${tiltClass(racer.tilt)}">${racer.tilt > 0 ? '+' : ''}${racer.tilt}ﾂｰ</span>
          </div>
        </div>
        <div class="profile-recent">
          <span class="section-mini-label">逶ｴ霑・0襍ｰ</span>
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
    ctx.parentElement.innerHTML = '<div class="chart-placeholder">螻慕､ｺ繝・・繧ｿ髮・ｨ井ｸｭ...</div>';
    return;
  }

  chartInstances.exhibition = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: race.racers.map(r => `${r.course}繧ｳ繝ｼ繧ｹ`),
      datasets: [
        {
          label: '螻慕､ｺ繧ｿ繧､繝 (遘・',
          data: race.racers.map(r => r.exhibitionTime ? parseFloat(r.exhibitionTime) : null),
          backgroundColor: race.racers.map(r => COURSE_COLORS[r.course].bg),
          borderColor: race.racers.map(r => r.course === 2 ? '#888' : COURSE_COLORS[r.course].bg),
          borderWidth: 1,
        },
        {
          label: '繧ｪ繝ｪ繧ｸ繝翫Ν繧ｿ繧､繝',
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
        title: { display: true, text: '螻慕､ｺ繧ｿ繧､繝 & 繧ｪ繝ｪ繧ｸ繝翫Ν繧ｿ繧､繝豈碑ｼ・, color: '#ccc' },
      },
      scales: {
        x: { ticks: { color: '#aaa' }, grid: { color: '#333' } },
        y: {
          ticks: { color: '#aaa' },
          grid: { color: '#333' },
          min: 6.5,
          max: 7.2,
          title: { display: true, text: '螻慕､ｺT (遘・', color: '#aaa' },
        },
        y2: {
          position: 'right',
          ticks: { color: '#aaa' },
          grid: { drawOnChartArea: false },
          min: 3.65,
          max: 3.80,
          title: { display: true, text: '繧ｪ繝ｪ繧ｸ繝翫ΝT', color: '#aaa' },
        },
      },
    },
  });
}

function renderCourseWinChart(race) {
  const ctx = document.getElementById('course-win-chart');
  if (!ctx) return;
  if (chartInstances.courseWin) chartInstances.courseWin.destroy();

  const labels = ['1繧ｳ繝ｼ繧ｹ', '2繧ｳ繝ｼ繧ｹ', '3繧ｳ繝ｼ繧ｹ', '4繧ｳ繝ｼ繧ｹ', '5繧ｳ繝ｼ繧ｹ', '6繧ｳ繝ｼ繧ｹ'];
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
        title: { display: true, text: '繧ｳ繝ｼ繧ｹ蛻･蜍晉紫繝ｬ繝ｼ繝繝ｼ', color: '#ccc' },
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
    const courseMatch = f.match(/(\d)繧ｳ繝ｼ繧ｹ/);
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
    indicator.textContent = '笳・LIVE譖ｴ譁ｰ荳ｭ';
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

/* 笏笏 繝｢繝ｼ繧ｿ繝ｼ隧穂ｾ｡繝峨ャ繝郁｡ｨ遉ｺ・遺酪5谿ｵ髫趣ｼ・笏笏 */
function dotRating(n) {
  const filled = '<span class="mev-dot filled">笳・/span>'.repeat(n);
  const empty  = '<span class="mev-dot">笳・/span>'.repeat(5 - n);
  return `<span class="mev-dots">${filled}${empty}</span>`;
}

document.addEventListener('DOMContentLoaded', init);




async function fetchTomorrowSchedule() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyymmdd = tomorrow.toISOString().slice(0,10).replace(/-/g,'');
    const res = await fetch(`${API_BASE}/api/schedule/${yyyymmdd}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return;
    const data = await res.json();
    if (!data.venues || data.venues.length === 0) return;
    showTomorrowBanner(data.venues, tomorrow);
  } catch (e) {
    console.warn('翌日スケジュール取得失敗:', e);
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
  banner.innerHTML = `
    <div style="color:#00d4ff;font-weight:bold;margin-bottom:6px">📅 明日(${m}/${d})の開催場</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;">
      ${venues.map(v => {
        const venue = VENUES ? VENUES.find(vn => vn.id === v.venue_id) : null;
        const name = venue ? venue.name : v.venue_id;
        return `<button onclick="selectVenue('${v.venue_id}')" style="background:#0d3a5c;color:#fff;border:1px solid #00d4ff;border-radius:4px;padding:4px 8px;font-size:0.75rem;cursor:pointer;">${name}</button>`;
      }).join('')}
    </div>`;

  const raceSection = document.querySelector('.race-section');
  if (raceSection) raceSection.insertAdjacentElement('afterend', banner);
}
