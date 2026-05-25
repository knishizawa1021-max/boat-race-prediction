const AI_WEIGHTS = {
  exhibitionTime: 0.28,
  originalTime:   0.18,
  courseWinRate:  0.20,
  startTiming:    0.15,
  tiltBonus:      0.08,
  motorBonus:     0.07,
  recentForm:     0.04,
};

function calcExhibitionScore(racer, allRacers) {
  const times = allRacers
    .filter(r => r.exhibitionTime !== null)
    .map(r => parseFloat(r.exhibitionTime));
  if (times.length === 0) {
    const ot = allRacers.map(r => r.originalTime);
    const min = Math.min(...ot);
    const max = Math.max(...ot);
    return max === min ? 0.5 : (max - racer.originalTime) / (max - min);
  }
  const min = Math.min(...times);
  const max = Math.max(...times);
  const val = racer.exhibitionTime !== null ? parseFloat(racer.exhibitionTime) : max;
  return max === min ? 0.5 : (max - val) / (max - min);
}

function calcOriginalTimeScore(racer, allRacers) {
  const times = allRacers.map(r => r.originalTime);
  const min = Math.min(...times);
  const max = Math.max(...times);
  return max === min ? 0.5 : (max - racer.originalTime) / (max - min);
}

function calcCourseWinRateScore(racer) {
  const cs = racer.courseStats[racer.course];
  if (!cs) return 0.1;
  return Math.min(cs.winRate / 60, 1.0);
}

function calcStartTimingScore(racer) {
  if (racer.startTiming === null) return 0.45;
  const st = parseFloat(racer.startTiming);
  if (st <= 0.01) return 0.6;
  if (st <= 0.10) return 1.0 - st * 3;
  if (st <= 0.20) return 0.7 - st;
  return 0.1;
}

function calcTiltScore(racer) {
  const t = racer.tilt;
  if (t === 1.5 || t === 2.0) return 1.0;
  if (t === 0.5 || t === 1.0) return 0.75;
  if (t === 0.0) return 0.5;
  if (t === -0.5) return 0.25;
  return 0.1;
}

function calcMotorScore(racer) {
  return Math.min(racer.motor.winRate / 60, 1.0);
}

function calcRecentFormScore(racer) {
  const results = racer.recentResults.slice(0, 5);
  let score = 0;
  results.forEach((r, i) => {
    const w = (5 - i) / 15;
    if (r === '1') score += w * 1.0;
    else if (r === '2') score += w * 0.6;
    else if (r === '3') score += w * 0.3;
    else if (r === 'F' || r === 'L' || r === 'K') score += w * -0.5;
  });
  return Math.max(0, Math.min(1, score + 0.3));
}

function courseAdvantageMultiplier(course) {
  const mult = { 1: 1.35, 2: 1.10, 3: 1.00, 4: 0.90, 5: 0.82, 6: 0.78 };
  return mult[course] || 1.0;
}

function runAIPrediction(racers) {
  const scores = racers.map(racer => {
    const s = {
      exhibitionTime: calcExhibitionScore(racer, racers) * AI_WEIGHTS.exhibitionTime,
      originalTime:   calcOriginalTimeScore(racer, racers) * AI_WEIGHTS.originalTime,
      courseWinRate:  calcCourseWinRateScore(racer) * AI_WEIGHTS.courseWinRate,
      startTiming:    calcStartTimingScore(racer) * AI_WEIGHTS.startTiming,
      tiltBonus:      calcTiltScore(racer) * AI_WEIGHTS.tiltBonus,
      motorBonus:     calcMotorScore(racer) * AI_WEIGHTS.motorBonus,
      recentForm:     calcRecentFormScore(racer) * AI_WEIGHTS.recentForm,
    };
    const total = Object.values(s).reduce((a, b) => a + b, 0);
    const adjusted = total * courseAdvantageMultiplier(racer.course);
    return { racer, scores: s, raw: total, adjusted };
  });

  const totalAdj = scores.reduce((a, b) => a + b.adjusted, 0);
  scores.forEach(s => {
    s.probability = Math.round((s.adjusted / totalAdj) * 1000) / 10;
  });

  scores.sort((a, b) => b.probability - a.probability);

  const ranked = scores.map((s, i) => ({
    ...s,
    rank: i + 1,
    confidence: i === 0 ? (s.probability > 40 ? 'high' : s.probability > 28 ? 'medium' : 'low')
                        : i === 1 ? (s.probability > 22 ? 'medium' : 'low') : 'low',
  }));

  return {
    ranked,
    recommendations: buildRecommendations(ranked),
    analysisText: buildAnalysis(ranked, racers),
  };
}

function buildRecommendations(ranked) {
  const r = ranked;
  const top = r[0].racer.course;
  const sec = r[1].racer.course;
  const thr = r[2].racer.course;

  return [
    {
      type: '単勝',
      bets: [`${top}`],
      confidence: r[0].confidence,
      reason: `${r[0].racer.name}が総合スコア最高値`,
    },
    {
      type: '2連単',
      bets: [`${top}→${sec}`, `${sec}→${top}`],
      confidence: r[0].probability > 30 ? 'medium' : 'low',
      reason: `上位2名の組み合わせ`,
    },
    {
      type: '2連複',
      bets: [`${Math.min(top, sec)}-${Math.max(top, sec)}`],
      confidence: 'medium',
      reason: `確率上位2名のBOX`,
    },
    {
      type: '3連単',
      bets: [`${top}→${sec}→${thr}`, `${top}→${thr}→${sec}`],
      confidence: 'low',
      reason: `AI上位3名の流し`,
    },
    {
      type: '3連複',
      bets: [`${[top, sec, thr].sort((a, b) => a - b).join('-')}`],
      confidence: 'medium',
      reason: `AI上位3名BOX`,
    },
  ];
}

function buildAnalysis(ranked, racers) {
  const top = ranked[0];
  const cs1 = racers[0].courseStats[1];
  const cs2 = racers[1].courseStats[2];
  const lines = [];

  lines.push(`【AI総合評価】${top.racer.name}（${top.racer.course}コース）が総合スコア最上位。`);

  if (racers[0].exhibitionTime) {
    const etTimes = racers.filter(r => r.exhibitionTime).map(r => parseFloat(r.exhibitionTime));
    const bestET = Math.min(...etTimes);
    const bestETRacer = racers.find(r => r.exhibitionTime && parseFloat(r.exhibitionTime) === bestET);
    lines.push(`展示タイム最速：${bestETRacer.name}（${bestET}秒）がエンジン好調。`);
  }

  if (cs1) {
    lines.push(`1コース逃げ率：${cs1.nigeRate}%。インから${cs1.nigeRate > 50 ? '逃げ切り有力' : '差されるリスクあり'}。`);
  }
  if (cs2) {
    lines.push(`2コース（${racers[1].name}）の逃し率：${cs2.nigashiRate}%。`);
  }

  const highTilt = racers.filter(r => r.tilt >= 1.0);
  if (highTilt.length) {
    lines.push(`チルト高設定（${highTilt.map(r => `${r.name}:${r.tilt}°`).join('、')}）はまくり攻撃力が増大。`);
  }

  return lines;
}
