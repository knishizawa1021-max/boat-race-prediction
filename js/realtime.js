const API_BASE = 'https://boatrace-api.onrender.com';
const REALTIME_INTERVAL = 60000;
let realtimeTimer = null;
let oddsTimer = null;
let resultTimer = null;
let lastUpdateTime = null;
let updateCallbacks = [];
let useRealData = true;

function onRealtimeUpdate(cb) { updateCallbacks.push(cb); }

function startRealtimeUpdates(getRaceFn) {
  stopRealtimeUpdates();
  fetchAndUpdate(getRaceFn);
  realtimeTimer = setInterval(() => fetchAndUpdate(getRaceFn), REALTIME_INTERVAL);
  fetchAndUpdateOdds(getRaceFn);
  oddsTimer = setInterval(() => fetchAndUpdateOdds(getRaceFn), REALTIME_INTERVAL);
  fetchAndUpdateResult(getRaceFn);
  resultTimer = setInterval(() => fetchAndUpdateResult(getRaceFn), REALTIME_INTERVAL);
}

function stopRealtimeUpdates() {
  [realtimeTimer, oddsTimer, resultTimer].forEach(t => t && clearInterval(t));
  realtimeTimer = oddsTimer = resultTimer = null;
}

async function fetchAndUpdate(getRaceFn) {
  const race = getRaceFn();
  if (!race) return;
  if (race.status !== 'exhibition' && race.status !== 'racing') { stopRealtimeUpdates(); return; }
  if (useRealData) {
    try {
      const result = await fetchRealExhibition(race);
      if (result) {
        lastUpdateTime = new Date();
        updateCallbacks.forEach(cb => cb({ race, updatedFields: result.updatedFields, timestamp: lastUpdateTime, isRealData: true }));
        return;
      }
    } catch (e) { console.warn('展示データ取得失敗:', e); useRealData = false; }
  }
  simulateUpdate(getRaceFn);
}

async function fetchRealExhibition(race) {
  const res = await fetch(`${API_BASE}/api/exhibition/${race.venueId}/${race.no}`, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error || !data.times || Object.keys(data.times).length === 0) return null;
  const updatedFields = [];
  race.racers.forEach(racer => {
    const t = data.times[String(racer.course)];
    if (!t) return;
    if (t.exhibitionTime != null) { racer.exhibitionTime = t.exhibitionTime; updatedFields.push(`${racer.course}コース 展示タイム`); }
    if (t.startTiming != null) { racer.startTiming = t.startTiming; updatedFields.push(`${racer.course}コース ST`); }
  });
  if (updatedFields.length > 0) rankExhibition(race.racers);
  return { updatedFields };
}

async function fetchAndUpdateOdds(getRaceFn) {
  const race = getRaceFn();
  if (!race || race.status === 'finished') return;
  try {
    const res = await fetch(`${API_BASE}/api/odds/${race.venueId}/${race.no}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return;
    const data = await res.json();
    if (data.odds && Object.keys(data.odds).length > 0) {
      race.realOdds = data.odds;
      updateCallbacks.forEach(cb => cb({ race, updatedFields: ['odds'], timestamp: new Date(), isRealData: true }));
      console.info(`オッズ更新: ${Object.keys(data.odds).length}件`);
    }
  } catch (e) { console.warn('オッズ取得失敗:', e); }
}

async function fetchAndUpdateResult(getRaceFn) {
  const race = getRaceFn();
  if (!race || race.status !== 'finished') return;
  try {
    const res = await fetch(`${API_BASE}/api/result/${race.venueId}/${race.no}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return;
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      race.raceResult = data.results;
      updateCallbacks.forEach(cb => cb({ race, updatedFields: ['result'], timestamp: new Date(), isRealData: true }));
      console.info(`結果更新: ${data.results.length}着`);
    }
  } catch (e) { console.warn('結果取得失敗:', e); }
}

async function fetchRealOdds(venueId, raceNo) {
  try {
    const res = await fetch(`${API_BASE}/api/odds/${venueId}/${raceNo}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const data = await res.json();
    return data.odds || null;
  } catch (e) { return null; }
}

function simulateUpdate(getRaceFn) {
  const race = getRaceFn();
  if (!race) return;
  const updatedFields = [];
  race.racers.forEach(racer => {
    const drift = (Math.random() - 0.5) * 0.02;
    if (racer.exhibitionTime !== null) {
      racer.exhibitionTime = (parseFloat(racer.exhibitionTime) + drift * 0.5).toFixed(2);
    } else {
      racer.exhibitionTime = ([6.82,6.75,6.70,6.78,6.88,6.95][racer.course-1] + drift).toFixed(2);
    }
    updatedFields.push(`${racer.course}コース 展示タイム`);
    if (racer.startTiming === null && Math.random() > 0.4) {
      racer.startTiming = (0.07 + Math.random() * 0.15).toFixed(2);
      updatedFields.push(`${racer.course}コース ST`);
    }
  });
  rankExhibition(race.racers);
  lastUpdateTime = new Date();
  updateCallbacks.forEach(cb => cb({ race, updatedFields, timestamp: lastUpdateTime, isRealData: false }));
}

function getLastUpdateTime() { return lastUpdateTime; }

function formatUpdateTime(date) {
  if (!date) return '---';
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function startCountdown(targetFn, displayEl) {
  function tick() {
    const target = targetFn();
    if (!target || !displayEl) return;
    const diff = target - Date.now();
    if (diff <= 0) { displayEl.textContent = 'LIVE'; displayEl.className = 'countdown live'; return; }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    displayEl.textContent = h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    displayEl.className = 'countdown ' + (diff < 60000 ? 'urgent' : diff < 300000 ? 'soon' : '');
  }
  tick();
  return setInterval(tick, 1000);
}

async function checkApiHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) { useRealData = true; return true; }
  } catch (e) { useRealData = false; }
  return false;
}

checkApiHealth();
