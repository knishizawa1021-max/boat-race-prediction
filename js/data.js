const VENUES = [
  { id: 'kiryu',       name: '桐生',   pref: '群馬', water: '淡水', grade: 'G1'   },
  { id: 'toda',        name: '戸田',   pref: '埼玉', water: '淡水', grade: '一般'  },
  { id: 'edogawa',     name: '江戸川', pref: '東京', water: '汽水', grade: '一般'  },
  { id: 'heiwajima',   name: '平和島', pref: '東京', water: '海水', grade: 'G1'   },
  { id: 'tamagawa',    name: '多摩川', pref: '東京', water: '淡水', grade: 'SG'   },
  { id: 'hamanako',    name: '浜名湖', pref: '静岡', water: '汽水', grade: '一般'  },
  { id: 'gamagori',    name: '蒲郡',   pref: '愛知', water: '海水', grade: 'G1'   },
  { id: 'tokoname',    name: '常滑',   pref: '愛知', water: '海水', grade: '一般'  },
  { id: 'tsu',         name: '津',     pref: '三重', water: '海水', grade: 'G1'   },
  { id: 'mikuni',      name: '三国',   pref: '福井', water: '海水', grade: 'G1'   },
  { id: 'biwako',      name: 'びわこ', pref: '滋賀', water: '淡水', grade: '一般'  },
  { id: 'suminoe',     name: '住之江', pref: '大阪', water: '淡水', grade: 'SG'   },
  { id: 'amagasaki',   name: '尼崎',   pref: '兵庫', water: '海水', grade: '一般'  },
  { id: 'naruto',      name: '鳴門',   pref: '徳島', water: '海水', grade: '一般'  },
  { id: 'marugame',    name: '丸亀',   pref: '香川', water: '海水', grade: 'G1'   },
  { id: 'kojima',      name: '児島',   pref: '岡山', water: '海水', grade: '一般'  },
  { id: 'miyajima',    name: '宮島',   pref: '広島', water: '海水', grade: 'G1'   },
  { id: 'tokuyama',    name: '徳山',   pref: '山口', water: '海水', grade: '一般'  },
  { id: 'shimonoseki', name: '下関',   pref: '山口', water: '海水', grade: '一般'  },
  { id: 'wakamatsu',   name: '若松',   pref: '福岡', water: '海水', grade: '一般'  },
  { id: 'ashiya',      name: '芦屋',   pref: '福岡', water: '海水', grade: '一般'  },
  { id: 'fukuoka',     name: '福岡',   pref: '福岡', water: '海水', grade: 'G1'   },
  { id: 'karatsu',     name: 'からつ', pref: '佐賀', water: '海水', grade: '一般'  },
  { id: 'omura',       name: '大村',   pref: '長崎', water: '海水', grade: '一般'  },
];

const COURSE_COLORS = {
  1: { bg: '#f0f0f0', text: '#1a1a1a', label: '白' },
  2: { bg: '#2a2a2a', text: '#ffffff', label: '黒' },
  3: { bg: '#e82929', text: '#ffffff', label: '赤' },
  4: { bg: '#1a6bc5', text: '#ffffff', label: '青' },
  5: { bg: '#e8b01a', text: '#1a1a1a', label: '黄' },
  6: { bg: '#2aaa2a', text: '#ffffff', label: '緑' },
};

const VENUE_FEATURES = {
  kiryu:       { courseWinRates:[55,17,12,8,5,3],  inRating:'high',      roughness:'medium',      tips:['赤城おろし（冬季強風）注意','淡水でエンジン出力差大','まくりより差しが決まりやすい'], characteristics:[{label:'水面',desc:'淡水・山間コース。浮力が少なくエンジンの整備状態が重要。'},{label:'風',desc:'赤城おろしの影響大。冬季は向かい風が強く艇速に影響する。'},{label:'傾向',desc:'1マークに引き波が残りやすい。差し・まくり差しが決まりやすい。'}] },
  toda:        { courseWinRates:[46,20,14,10,7,3],  inRating:'medium',    roughness:'high',        tips:['全国屈指の難水面','川幅が狭く独特の波','荒れ展開に注意'], characteristics:[{label:'水面',desc:'淡水・日本一川幅が狭い。独特の引き波が残りやすい。'},{label:'特徴',desc:'波が複雑でアウトコースが伸びにくい。荒れレースになりやすい。'},{label:'傾向',desc:'1コース逃げ率がやや低め。実力者が外枠から絡んでくる。'}] },
  edogawa:     { courseWinRates:[42,18,15,12,8,5],  inRating:'low',       roughness:'very_high',   tips:['潮の影響が最大級','満潮退き潮で傾向が激変','アウトが有利になる時間帯あり'], characteristics:[{label:'水面',desc:'汽水・河川。潮の干満差が激しく時間帯で水面が全く変わる。'},{label:'潮',desc:'満潮時はインが有利、引き潮時は水面が荒れアウトが有利になる。'},{label:'傾向',desc:'全国屈指の難水面。1コース逃げ率が全国最低水準になりやすい。'}] },
  heiwajima:   { courseWinRates:[50,17,13,10,6,4],  inRating:'medium',    roughness:'medium_high', tips:['南風（海風）で水面荒れる','北風時は比較的穏やか','荒れに強い選手に注目'], characteristics:[{label:'水面',desc:'海水。東京湾からの風の影響を受けやすい。'},{label:'風',desc:'南風（海からの風）が強い時は水面が荒れる。北風時は穏やか。'},{label:'傾向',desc:'荒れ展開になりやすく実力差が出にくい。'}] },
  tamagawa:    { courseWinRates:[57,19,11,7,4,2],   inRating:'very_high', roughness:'low',         tips:['インが非常に強い','差しが決まりやすい','まくりは決まりにくい'], characteristics:[{label:'水面',desc:'淡水・多摩川。非常に安定した穏やかな水面。'},{label:'特徴',desc:'1コースの逃げが非常に決まりやすい。差しも有効。'},{label:'傾向',desc:'まくりが決まりにくい。1コース軸が基本。'}] },
  hamanako:    { courseWinRates:[51,17,13,10,6,3],  inRating:'high',      roughness:'medium',      tips:['湖内で比較的穏やか','潮干満差あり','広い水面'], characteristics:[{label:'水面',desc:'汽水・浜名湖。広い水面でうねりが出ることも。'},{label:'潮',desc:'干満差は小さいが外洋の影響を受ける。'},{label:'傾向',desc:'オールラウンドな水面。1コース有利。'}] },
  gamagori:    { courseWinRates:[53,17,12,10,5,3],  inRating:'high',      roughness:'low',         tips:['三河湾の穏やかな水面','モーター差が出やすい','堅い展開が多い'], characteristics:[{label:'水面',desc:'海水・三河湾。比較的安定した水面でモーター性能差が出やすい。'},{label:'特徴',desc:'荒れることが少なく、1コースが安定して有利。'},{label:'傾向',desc:'堅い展開が多い。1コース逃げ率が安定。'}] },
  tokoname:    { courseWinRates:[54,17,12,9,5,3],   inRating:'high',      roughness:'low_medium',  tips:['セントレア隣接','防潮堤で守られた水面','スピード重視'], characteristics:[{label:'水面',desc:'海水・伊勢湾内。中部国際空港に隣接するが防潮堤で穏やか。'},{label:'特徴',desc:'整った水面でスピード勝負になりやすい。'},{label:'傾向',desc:'1コース有利が続く。'}] },
  tsu:         { courseWinRates:[47,18,14,11,7,3],  inRating:'medium',    roughness:'high',        tips:['伊勢湾で荒れやすい','潮流注意','アウトも絡む'], characteristics:[{label:'水面',desc:'海水・伊勢湾内。風と潮の影響を受けやすい。'},{label:'荒れ',desc:'外洋からの影響で水面が荒れることが多い。'},{label:'傾向',desc:'アウトコースが絡みやすい荒れ展開が多い。'}] },
  mikuni:      { courseWinRates:[46,18,14,11,7,4],  inRating:'medium',    roughness:'very_high',   tips:['日本海側で強風多い','冬は特に荒れる','難水面'], characteristics:[{label:'水面',desc:'海水・日本海側。冬季は特に水面が荒れやすい。'},{label:'風',desc:'日本海からの強風（特に冬）が影響大。波が高くなりやすい。'},{label:'傾向',desc:'荒れレース多い。1コース逃げ率が低め。'}] },
  biwako:      { courseWinRates:[50,17,13,10,6,4],  inRating:'medium',    roughness:'medium',      tips:['琵琶湖の風に注意','季節変動大','広大な水面'], characteristics:[{label:'水面',desc:'淡水・琵琶湖内。広大な水面のため風の影響を受けやすい。'},{label:'特徴',desc:'季節や天候によって水面状況が大きく変わる。'},{label:'傾向',desc:'安定している時も多いが荒れると難水面に変貌。'}] },
  suminoe:     { courseWinRates:[62,17,10,6,3,2],   inRating:'very_high', roughness:'very_low',    tips:['インが日本一強い','全国最高水準の1コース勝率','荒れにくい'], characteristics:[{label:'水面',desc:'淡水。非常に安定した水面で1コース逃げ率が全国トップクラス。'},{label:'特徴',desc:'波がほとんどなくスタートも揃いやすい。1コース有利が顕著。'},{label:'傾向',desc:'荒れにくい。1コース軸の買い目が基本戦略。'}] },
  amagasaki:   { courseWinRates:[52,18,12,10,5,3],  inRating:'high',      roughness:'low',         tips:['運河型で穏やか','差しが決まりやすい','堅い展開多い'], characteristics:[{label:'水面',desc:'海水・運河型コース。比較的穏やかな水面。'},{label:'特徴',desc:'1コースが安定して有利。2コースの差しも決まりやすい。'},{label:'傾向',desc:'安定した展開が多い。'}] },
  naruto:      { courseWinRates:[44,19,15,11,7,4],  inRating:'low',       roughness:'very_high',   tips:['鳴門の渦潮に隣接','潮流が最強クラス','干潮時はアウト有利'], characteristics:[{label:'水面',desc:'海水・鳴門海峡に近く潮流の影響が非常に強い。'},{label:'潮',desc:'干満差大。潮の流れで1マークの位置関係が変わる。'},{label:'傾向',desc:'全国屈指の難水面。潮が速い時間帯はアウトが有利。'}] },
  marugame:    { courseWinRates:[52,18,13,9,5,3],   inRating:'high',      roughness:'medium',      tips:['瀬戸内海・比較的穏やか','差しが効く','読みやすい展開'], characteristics:[{label:'水面',desc:'海水・瀬戸内海。比較的穏やかな水面。'},{label:'特徴',desc:'2コースの差しが決まりやすい傾向。'},{label:'傾向',desc:'展開が読みやすく買い目が組み立てやすい。'}] },
  kojima:      { courseWinRates:[53,18,12,10,5,2],  inRating:'high',      roughness:'low',         tips:['内海で安定','スピード勝負','インが強い'], characteristics:[{label:'水面',desc:'海水・瀬戸内海の内湾。安定した水面。'},{label:'特徴',desc:'水面が穏やかでスピード勝負になりやすい。'},{label:'傾向',desc:'1コース逃げ率が安定して高い。'}] },
  miyajima:    { courseWinRates:[49,18,14,10,6,3],  inRating:'medium',    roughness:'medium',      tips:['世界遺産前のコース','潮の干満影響あり','干潮時注意'], characteristics:[{label:'水面',desc:'海水・厳島神社の対岸。潮の干満差がある。'},{label:'潮',desc:'潮流の影響で水面状況が変化する。'},{label:'傾向',desc:'干満差によって展開が変わりやすい。'}] },
  tokuyama:    { courseWinRates:[54,17,12,9,5,3],   inRating:'high',      roughness:'low',         tips:['安定した水面','インが有利','堅い展開が多い'], characteristics:[{label:'水面',desc:'海水・徳山湾内。防波堤に守られた安定した水面。'},{label:'特徴',desc:'荒れることが少なく1コースが有利な展開が多い。'},{label:'傾向',desc:'堅い展開が多い。'}] },
  shimonoseki: { courseWinRates:[48,18,14,11,6,3],  inRating:'medium',    roughness:'medium_high', tips:['関門海峡の潮流注意','うねりあり','中穴が出やすい'], characteristics:[{label:'水面',desc:'海水・関門海峡に近い。潮流の影響を受けやすい。'},{label:'潮',desc:'潮流による水面変化に注意が必要。'},{label:'傾向',desc:'潮次第で展開が変わる。中穴が出やすい。'}] },
  wakamatsu:   { courseWinRates:[52,17,13,10,5,3],  inRating:'high',      roughness:'low',         tips:['運河型で穏やか','インが有利','差しも決まる'], characteristics:[{label:'水面',desc:'海水・運河型コース。比較的穏やかな水面。'},{label:'特徴',desc:'安定した水面でレース展開が読みやすい。'},{label:'傾向',desc:'1コース有利。差しも決まりやすい。'}] },
  ashiya:      { courseWinRates:[53,18,12,9,5,3],   inRating:'high',      roughness:'low',         tips:['安定水面','差しが決まりやすい','堅い展開'], characteristics:[{label:'水面',desc:'海水・運河型。安定した水面で走りやすい。'},{label:'特徴',desc:'2コースの差しが決まりやすい傾向。'},{label:'傾向',desc:'予測しやすい展開が多い。'}] },
  fukuoka:     { courseWinRates:[51,17,13,10,6,3],  inRating:'high',      roughness:'medium',      tips:['博多湾の風注意','比較的安定','オーソドックスな展開'], characteristics:[{label:'水面',desc:'海水・博多湾。風の強さによって水面状況が変わる。'},{label:'風',desc:'博多湾からの風が影響することがある。'},{label:'傾向',desc:'比較的オーソドックスな展開が多い。'}] },
  karatsu:     { courseWinRates:[46,18,14,12,6,4],  inRating:'medium',    roughness:'high',        tips:['玄界灘に近く波荒い','外海の影響大','荒れに強い選手'], characteristics:[{label:'水面',desc:'海水・玄界灘に近い。外海の影響を受けやすく波が荒い。'},{label:'特徴',desc:'波が荒くなりやすく難水面になることが多い。'},{label:'傾向',desc:'荒れ展開が多くアウトコースも絡みやすい。'}] },
  omura:       { courseWinRates:[63,16,10,6,3,2],   inRating:'very_high', roughness:'very_low',    tips:['日本一穏やかな水面','インが最強クラス','荒れはまず起きない'], characteristics:[{label:'水面',desc:'海水・大村湾内。日本一穏やかとも言われる。1コース逃げ率が全国トップクラス。'},{label:'特徴',desc:'ほぼ波がなくスタートが揃いやすい。1コースの逃げが非常に有効。'},{label:'傾向',desc:'1コース絡みの堅い展開が非常に多い。波乱が起きにくい。'}] },
};

const WATER_FEATURES = {
  '淡水': {
    color: '#4a9eff',
    icon: '💧',
    description: '河川・湖の真水（塩分を含まない）',
    venues: ['桐生', '戸田', '多摩川', 'びわこ', '住之江'],
    boatEffect: '浮力が海水より小さく艇が沈みがち。エンジン出力と整備状態がより重要になる。',
    motorEffect: '塩分がないためモーターの腐食が少なく整備状態がダイレクトに出やすい。',
    startEffect: '水面が安定している場合が多くスタートタイミングが取りやすい。',
    advantages: ['水面が穏やかになりやすい', 'モーター差が出やすい', 'インコースが有利になりやすい'],
    disadvantages: ['浮力が少なくエンジン負荷が大きい', '季節・天候で水量変化'],
    tips: ['エンジン出足・行き足を重視', '当日の整備変更をチェック', '水温変化に注意'],
    inAdvantage: 'high',
  },
  '海水': {
    color: '#1a8fc5',
    icon: '🌊',
    description: '塩分を含む海水（干満差・潮流の影響あり）',
    venues: ['平和島', '蒲郡', '常滑', '津', '三国', '尼崎', '鳴門', '丸亀', '児島', '宮島', '徳山', '下関', '若松', '芦屋', '福岡', 'からつ', '大村'],
    boatEffect: '塩分で浮力がやや増す。艇が浮きやすく艇速が出やすい傾向。',
    motorEffect: '塩水による腐食に注意。同じエンジン設定でも出力感が変わることがある。',
    startEffect: '潮の流れによりスタートラインの有利不利が変わることがある。',
    advantages: ['浮力が大きく艇速が出やすい', '整備の効果が出やすい'],
    disadvantages: ['潮の干満差の影響', '塩害でモーター腐食', '荒れやすい場所もある'],
    tips: ['満潮・干潮の時刻を確認', '潮流の方向と強さに注意', '季節風の確認を怠らない'],
    inAdvantage: 'medium',
  },
  '汽水': {
    color: '#2a9a7a',
    icon: '🌀',
    description: '淡水と海水が混ざった汽水域（特性が変化しやすい難水面）',
    venues: ['江戸川', '浜名湖'],
    boatEffect: '塩分濃度が時間帯で変化するため浮力も変わる。適応力のある選手が有利。',
    motorEffect: '塩分の変動に対応できるセッティングが求められる。',
    startEffect: '潮の流れが強い時はスタートラインへの影響大。艇が流されやすい。',
    advantages: ['潮が穏やかな時は走りやすい'],
    disadvantages: ['潮流で水面状況が大きく変わる', '予測が困難', '荒れやすい'],
    tips: ['潮汐表は必須', '干潮・満潮に合わせたコース傾向変化を把握', '荒れを見込んだ買い目も検討'],
    inAdvantage: 'low',
  },
};

const BASE_RACERS = [
  {
    id: 4214, name: '山口 剛', nameKana: 'やまぐち つよし', pref: '埼玉',
    class: 'A1', age: 42, weight: 52.0,
    winRate: 6.89, doubleWinRate: 33.4, tripleWinRate: 57.2,
    course: 1,
    motor: { no: 56, winRate: 44.2 }, boat: { no: 12, winRate: 39.7 },
    tilt: 0.0, originalTime: 3.718,
    motorEval: { dashiashi: 4, yukiashi: 3, nobi: 4, sogo: 'A' },
    flyingCount: 0, lateStartCount: 0,
    flHistory: [], flPeriod: false,
    courseStats: {
      1: { starts:248, wins:131, winRate:52.8, nigeRate:54.3, sashirareRate:18.6, makurisashiraRate:7.2, nigashiRate:null, sashiRate:null, makuriRate:null, makurisashiRate:null, nigeNiRate:null, nigeSanRate:null },
      2: { starts:92,  wins:14,  winRate:15.2, nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:62.0, sashiRate:18.4, makuriRate:8.7,  makurisashiRate:6.3,  nigeNiRate:28.5, nigeSanRate:19.2 },
      3: { starts:71,  wins:10,  winRate:14.1, nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:null, sashiRate:12.7, makuriRate:22.5, makurisashiRate:9.8,  nigeNiRate:18.7, nigeSanRate:15.4 },
      4: { starts:55,  wins:6,   winRate:10.9, nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:null, sashiRate:5.5,  makuriRate:18.2, makurisashiRate:7.6,  nigeNiRate:12.3, nigeSanRate:12.8 },
      5: { starts:38,  wins:3,   winRate:7.9,  nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:null, sashiRate:2.6,  makuriRate:13.2, makurisashiRate:5.2,  nigeNiRate:8.4,  nigeSanRate:10.5 },
      6: { starts:22,  wins:1,   winRate:4.5,  nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:null, sashiRate:0.0,  makuriRate:9.1,  makurisashiRate:4.1,  nigeNiRate:5.8,  nigeSanRate:8.9  },
    },
    recentResults: ['1','1','2','1','3','1','2','1','F','1'],
  },
  {
    id: 3948, name: '田村 隆信', nameKana: 'たむら たかのぶ', pref: '徳島',
    class: 'A1', age: 45, weight: 51.5,
    winRate: 7.12, doubleWinRate: 36.8, tripleWinRate: 61.3,
    course: 2,
    motor: { no: 43, winRate: 51.3 }, boat: { no: 7, winRate: 42.1 },
    tilt: 0.5, originalTime: 3.702,
    motorEval: { dashiashi: 5, yukiashi: 4, nobi: 3, sogo: 'S' },
    flyingCount: 1, lateStartCount: 0,
    flHistory: [{ date:'2025-09-14', type:'F', venue:'桐生', course:2 }],
    flPeriod: false,
    courseStats: {
      1: { starts:89,  wins:42,  winRate:47.2, nigeRate:49.8, sashirareRate:22.4, makurisashiraRate:9.4, nigashiRate:null, sashiRate:null, makuriRate:null, makurisashiRate:null, nigeNiRate:null, nigeSanRate:null },
      2: { starts:186, wins:35,  winRate:18.8, nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:58.4, sashiRate:22.1, makuriRate:6.5,  makurisashiRate:8.4,  nigeNiRate:32.1, nigeSanRate:21.5 },
      3: { starts:142, wins:24,  winRate:16.9, nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:null, sashiRate:15.5, makuriRate:19.7, makurisashiRate:11.3, nigeNiRate:20.4, nigeSanRate:17.6 },
      4: { starts:98,  wins:12,  winRate:12.2, nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:null, sashiRate:7.1,  makuriRate:16.3, makurisashiRate:8.7,  nigeNiRate:14.3, nigeSanRate:13.9 },
      5: { starts:67,  wins:7,   winRate:10.4, nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:null, sashiRate:4.5,  makuriRate:11.9, makurisashiRate:6.2,  nigeNiRate:9.8,  nigeSanRate:11.2 },
      6: { starts:41,  wins:3,   winRate:7.3,  nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:null, sashiRate:2.4,  makuriRate:7.3,  makurisashiRate:4.8,  nigeNiRate:6.3,  nigeSanRate:8.7  },
    },
    recentResults: ['2','1','1','3','2','1','1','2','1','3'],
  },
  {
    id: 4320, name: '峰 竜太', nameKana: 'みね りゅうた', pref: '佐賀',
    class: 'A1', age: 38, weight: 52.5,
    winRate: 8.03, doubleWinRate: 41.2, tripleWinRate: 66.8,
    course: 3,
    motor: { no: 21, winRate: 38.9 }, boat: { no: 31, winRate: 36.4 },
    tilt: 1.5, originalTime: 3.695,
    motorEval: { dashiashi: 3, yukiashi: 4, nobi: 5, sogo: 'A' },
    flyingCount: 0, lateStartCount: 0,
    flHistory: [], flPeriod: false,
    courseStats: {
      1: { starts:112, wins:58,  winRate:51.8, nigeRate:54.0, sashirareRate:17.8, makurisashiraRate:6.5, nigashiRate:null, sashiRate:null, makuriRate:null, makurisashiRate:null, nigeNiRate:null, nigeSanRate:null },
      2: { starts:124, wins:28,  winRate:22.6, nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:55.7, sashiRate:26.6, makuriRate:9.7,  makurisashiRate:10.2, nigeNiRate:30.6, nigeSanRate:20.3 },
      3: { starts:198, wins:45,  winRate:22.7, nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:null, sashiRate:18.2, makuriRate:28.3, makurisashiRate:14.5, nigeNiRate:22.2, nigeSanRate:18.9 },
      4: { starts:115, wins:19,  winRate:16.5, nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:null, sashiRate:8.7,  makuriRate:22.6, makurisashiRate:10.8, nigeNiRate:16.5, nigeSanRate:15.2 },
      5: { starts:82,  wins:10,  winRate:12.2, nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:null, sashiRate:4.9,  makuriRate:17.1, makurisashiRate:7.9,  nigeNiRate:11.4, nigeSanRate:12.8 },
      6: { starts:53,  wins:5,   winRate:9.4,  nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:null, sashiRate:1.9,  makuriRate:13.2, makurisashiRate:5.7,  nigeNiRate:7.6,  nigeSanRate:9.5  },
    },
    recentResults: ['1','3','1','1','2','1','1','4','1','1'],
  },
  {
    id: 4444, name: '桐生 順平', nameKana: 'きりゅう じゅんぺい', pref: '静岡',
    class: 'A1', age: 35, weight: 51.0,
    winRate: 7.56, doubleWinRate: 38.9, tripleWinRate: 63.4,
    course: 4,
    motor: { no: 68, winRate: 47.8 }, boat: { no: 25, winRate: 41.2 },
    tilt: 0.5, originalTime: 3.711,
    motorEval: { dashiashi: 4, yukiashi: 3, nobi: 4, sogo: 'B' },
    flyingCount: 2, lateStartCount: 1,
    flHistory: [
      { date:'2026-01-22', type:'F', venue:'住之江', course:4 },
      { date:'2025-11-05', type:'F', venue:'戸田',   course:3 },
      { date:'2025-07-18', type:'L', venue:'桐生',   course:2 },
    ],
    flPeriod: true,
    courseStats: {
      1: { starts:134, wins:65,  winRate:48.5, nigeRate:51.2, sashirareRate:20.3, makurisashiraRate:8.1, nigashiRate:null, sashiRate:null, makuriRate:null, makurisashiRate:null, nigeNiRate:null, nigeSanRate:null },
      2: { starts:97,  wins:18,  winRate:18.6, nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:60.8, sashiRate:20.6, makuriRate:7.2,  makurisashiRate:9.1,  nigeNiRate:29.3, nigeSanRate:20.8 },
      3: { starts:128, wins:25,  winRate:19.5, nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:null, sashiRate:16.4, makuriRate:24.2, makurisashiRate:12.6, nigeNiRate:21.8, nigeSanRate:17.3 },
      4: { starts:175, wins:32,  winRate:18.3, nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:null, sashiRate:9.7,  makuriRate:20.0, makurisashiRate:11.4, nigeNiRate:15.8, nigeSanRate:14.6 },
      5: { starts:104, wins:15,  winRate:14.4, nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:null, sashiRate:5.8,  makuriRate:15.4, makurisashiRate:8.2,  nigeNiRate:10.7, nigeSanRate:12.3 },
      6: { starts:61,  wins:6,   winRate:9.8,  nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:null, sashiRate:3.3,  makuriRate:11.5, makurisashiRate:5.9,  nigeNiRate:7.1,  nigeSanRate:9.0  },
    },
    recentResults: ['2','1','3','2','F','2','1','1','3','2'],
  },
  {
    id: 4128, name: '馬場 貴也', nameKana: 'ばば たかや', pref: '滋賀',
    class: 'A1', age: 40, weight: 52.0,
    winRate: 6.34, doubleWinRate: 30.7, tripleWinRate: 53.6,
    course: 5,
    motor: { no: 14, winRate: 33.1 }, boat: { no: 48, winRate: 31.8 },
    tilt: 0.0, originalTime: 3.734,
    motorEval: { dashiashi: 2, yukiashi: 3, nobi: 3, sogo: 'C' },
    flyingCount: 0, lateStartCount: 1,
    flHistory: [{ date:'2025-10-03', type:'L', venue:'蒲郡', course:5 }],
    flPeriod: false,
    courseStats: {
      1: { starts:78,  wins:33,  winRate:42.3, nigeRate:44.8, sashirareRate:26.2, makurisashiraRate:10.3, nigashiRate:null, sashiRate:null, makuriRate:null, makurisashiRate:null, nigeNiRate:null, nigeSanRate:null },
      2: { starts:89,  wins:13,  winRate:14.6, nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:66.3, sashiRate:16.9, makuriRate:5.6,  makurisashiRate:7.2,  nigeNiRate:26.7, nigeSanRate:18.4 },
      3: { starts:102, wins:16,  winRate:15.7, nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:null, sashiRate:13.7, makuriRate:19.6, makurisashiRate:10.1, nigeNiRate:18.9, nigeSanRate:16.7 },
      4: { starts:118, wins:18,  winRate:15.3, nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:null, sashiRate:8.5,  makuriRate:16.9, makurisashiRate:9.4,  nigeNiRate:14.0, nigeSanRate:13.3 },
      5: { starts:154, wins:24,  winRate:15.6, nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:null, sashiRate:5.2,  makuriRate:14.9, makurisashiRate:7.7,  nigeNiRate:9.6,  nigeSanRate:11.7 },
      6: { starts:73,  wins:7,   winRate:9.6,  nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:null, sashiRate:2.7,  makuriRate:9.6,  makurisashiRate:5.3,  nigeNiRate:6.2,  nigeSanRate:8.5  },
    },
    recentResults: ['3','2','1','4','2','3','L','2','3','2'],
  },
  {
    id: 4556, name: '羽野 直也', nameKana: 'はの なおや', pref: '大阪',
    class: 'A2', age: 30, weight: 51.5,
    winRate: 5.87, doubleWinRate: 26.3, tripleWinRate: 48.9,
    course: 6,
    motor: { no: 77, winRate: 29.4 }, boat: { no: 63, winRate: 27.9 },
    tilt: -0.5, originalTime: 3.751,
    motorEval: { dashiashi: 2, yukiashi: 2, nobi: 3, sogo: 'C' },
    flyingCount: 1, lateStartCount: 0,
    flHistory: [{ date:'2025-12-28', type:'F', venue:'住之江', course:6 }],
    flPeriod: false,
    courseStats: {
      1: { starts:45,  wins:18,  winRate:40.0, nigeRate:42.2, sashirareRate:28.9, makurisashiraRate:12.8, nigashiRate:null, sashiRate:null, makuriRate:null, makurisashiRate:null, nigeNiRate:null, nigeSanRate:null },
      2: { starts:61,  wins:8,   winRate:13.1, nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:70.5, sashiRate:14.8, makuriRate:4.9,  makurisashiRate:5.9,  nigeNiRate:23.4, nigeSanRate:16.9 },
      3: { starts:78,  wins:10,  winRate:12.8, nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:null, sashiRate:10.3, makuriRate:15.4, makurisashiRate:8.7,  nigeNiRate:16.4, nigeSanRate:14.5 },
      4: { starts:95,  wins:11,  winRate:11.6, nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:null, sashiRate:6.3,  makuriRate:13.7, makurisashiRate:7.1,  nigeNiRate:12.2, nigeSanRate:11.8 },
      5: { starts:112, wins:14,  winRate:12.5, nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:null, sashiRate:4.5,  makuriRate:12.5, makurisashiRate:6.4,  nigeNiRate:8.5,  nigeSanRate:10.3 },
      6: { starts:138, wins:16,  winRate:11.6, nigeRate:null, sashirareRate:null, makurisashiraRate:null, nigashiRate:null, sashiRate:2.2,  makuriRate:10.1, makurisashiRate:4.8,  nigeNiRate:5.9,  nigeSanRate:7.8  },
    },
    recentResults: ['4','3','2','5','3','F','2','3','4','3'],
  },
];

const CATEGORY_LABELS = {
  all:      '全体',
  recent10: '直近10走',
  recent6m: '直近6ヶ月',
  tochi:    '当地',
  sg:       'SG',
  g1:       'G1',
  general:  '一般',
};

function seededRng(seed) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateCategoryStats(racer, category) {
  const rng = seededRng(racer.id * 13 + category.split('').reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0));
  const startFactors  = { all:1.00, recent10:0.05, recent6m:0.40, tochi:0.18, sg:0.06, g1:0.12, general:0.55 };
  const winFactors    = { all:1.00, recent10:0.9+rng()*0.4, recent6m:0.9+rng()*0.2, tochi:0.75+rng()*0.5, sg:0.65+rng()*0.4, g1:0.80+rng()*0.3, general:1.0+rng()*0.2 };
  const sf = startFactors[category] || 1;
  const wf = winFactors[category]   || 1;
  const result = {};
  for (const [c, s] of Object.entries(racer.courseStats)) {
    const starts = Math.max(1, Math.round(s.starts * sf));
    const wins   = Math.max(0, Math.min(starts, Math.round(s.wins * sf * wf)));
    const wr = parseFloat(((wins / starts) * 100).toFixed(1));
    const adj = (f) => f != null ? parseFloat(Math.max(0, f * (0.80 + rng() * 0.40)).toFixed(1)) : null;
    result[c] = {
      starts, wins, winRate: wr,
      nigeRate: adj(s.nigeRate), sashirareRate: adj(s.sashirareRate), makurisashiraRate: adj(s.makurisashiraRate),
      nigashiRate: adj(s.nigashiRate), sashiRate: adj(s.sashiRate),
      makuriRate: adj(s.makuriRate), makurisashiRate: adj(s.makurisashiRate),
      nigeNiRate: adj(s.nigeNiRate), nigeSanRate: adj(s.nigeSanRate),
    };
  }
  return result;
}

function generateTochiData(racer, venueId) {
  const hash = (racer.id * 31 + venueId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 17) % 1000;
  const factor = 0.72 + (hash % 56) / 100;
  const starts = 18 + (hash % 52);
  const wins   = Math.round(starts * (racer.winRate / 100) * factor);
  const winRate = parseFloat(Math.max(2.0, racer.winRate * factor).toFixed(2));
  const doubleWinRate = parseFloat(Math.max(8, racer.doubleWinRate * (0.68 + (hash % 35) / 100)).toFixed(1));
  const tripleWinRate = parseFloat(Math.max(15, racer.tripleWinRate * (0.72 + (hash % 28) / 100)).toFixed(1));
  return { starts, wins, winRate, doubleWinRate, tripleWinRate };
}

function generateRaces(venueId) {
  const races = [];
  const now = new Date();
  for (let i = 1; i <= 12; i++) {
    const startMin = 9 * 60 + (i - 1) * 40 + 30;
    const raceTime = new Date(now);
    raceTime.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
    const diff = raceTime - now;
    let status = diff < -5*60000 ? 'finished' : diff < 0 ? 'racing' : diff < 35*60000 ? 'exhibition' : 'upcoming';
    const racers = generateRaceRacers(venueId, i, status);
    if (status !== 'upcoming') rankExhibition(racers);
    races.push({
      no: i, venueId,
      date: now.toISOString().split('T')[0],
      startTime: `${String(Math.floor(startMin/60)).padStart(2,'0')}:${String(startMin%60).padStart(2,'0')}`,
      status,
      grade: i===12?'メイン':i>=10?'優勝戦':i>=8?'準優勝戦':'予選',
      racers,
    });
  }
  return races;
}

function generateRaceRacers(venueId, raceNo, status) {
  const seed = venueId.length + raceNo;
  return BASE_RACERS.map((r, idx) => {
    const racer = JSON.parse(JSON.stringify(r));
    racer.course = idx + 1;
    racer.tochiData = generateTochiData(r, venueId);
    const hasST = status !== 'upcoming';
    if (hasST) {
      const baseET = [6.82, 6.75, 6.70, 6.78, 6.88, 6.95];
      racer.exhibitionTime = (baseET[idx] + (seed%7)*0.01 - 0.03).toFixed(2);
      racer.startTiming    = (0.08 + idx*0.02 + (seed%5)*0.01).toFixed(2);
      racer.exhibitionRank = null;
    } else {
      racer.exhibitionTime = null;
      racer.startTiming    = null;
      racer.exhibitionRank = null;
    }
    return racer;
  });
}

function rankExhibition(racers) {
  const withET = racers.filter(r => r.exhibitionTime !== null);
  [...withET].sort((a,b) => parseFloat(a.exhibitionTime)-parseFloat(b.exhibitionTime))
             .forEach((r,i) => { r.exhibitionRank = i+1; });
  return racers;
}

function getVenueById(id) {
  return VENUES.find(v => v.id === id) || VENUES[0];
}
