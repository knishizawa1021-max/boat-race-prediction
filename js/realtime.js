const REALTIME_INTERVAL = 30000;
let realtimeTimer = null;
let lastUpdateTime = null;
let updateCallbacks = [];

function onRealtimeUpdate(cb) {
  updateCallbacks.push(cb);
}

function startRealtimeUpdates(getRaceFn) {
  stopRealtimeUpdates();
  simulateUpdate(getRaceFn);
  realtimeTimer = setInterval(() => simulateUpdate(getRaceFn), REALTIME_INTERVAL);
}

function stopRealtimeUpdates() {
  if (realtimeTimer) {
    clearInterval(realtimeTimer);
    realtimeTimer = null;
  }
}

function simulateUpdate(getRaceFn) {
  const race = getRaceFn();
  if (!race) return;
  if (race.status !== 'exhibition' && race.status !== 'racing') {
    stopRealtimeUpdates();
    return;
  }

  const updatedFields = [];
  race.racers.forEach(racer => {
    const drift = (Math.random() - 0.5) * 0.02;
    if (racer.exhibitionTime !== null) {
      const prev = parseFloat(racer.exhibitionTime);
      racer.exhibitionTime = (prev + drift * 0.5).toFixed(2);
      updatedFields.push(`${racer.course}コース 展示タイム`);
    } else {
      const baseET = [6.82, 6.75, 6.70, 6.78, 6.88, 6.95];
      racer.exhibitionTime = (baseET[racer.course - 1] + drift).toFixed(2);
      updatedFields.push(`${racer.course}コース 展示タイム`);
    }
    if (racer.startTiming === null && Math.random() > 0.4) {
      racer.startTiming = (0.07 + Math.random() * 0.15).toFixed(2);
      updatedFields.push(`${racer.course}コース ST`);
    }
  });

  rankExhibition(race.racers);
  lastUpdateTime = new Date();

  updateCallbacks.forEach(cb => cb({
    race,
    updatedFields,
    timestamp: lastUpdateTime,
  }));
}

function getLastUpdateTime() {
  return lastUpdateTime;
}

function formatUpdateTime(date) {
  if (!date) return '---';
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function startCountdown(targetFn, displayEl) {
  function tick() {
    const target = targetFn();
    if (!target || !displayEl) return;
    const diff = target - Date.now();
    if (diff <= 0) {
      displayEl.textContent = 'LIVE';
      displayEl.className = 'countdown live';
      return;
    }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    displayEl.textContent = h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    displayEl.className = 'countdown ' + (diff < 60000 ? 'urgent' : diff < 300000 ? 'soon' : '');
  }
  tick();
  return setInterval(tick, 1000);
}
