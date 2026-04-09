#!/usr/bin/env node
/**
 * WATCHR Mobile — Auto Setup & Fix
 * 
 * 사용법: node setup.js
 * 
 * Node.js만 설치되어 있으면 Windows / Mac / Linux 모두 동작
 * 외부 패키지 설치 불필요 — fs, path만 사용
 */

const fs   = require('fs');
const path = require('path');

/* ══════════════════════════════════════════
   COLOR HELPERS
══════════════════════════════════════════ */
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[38;2;63;185;80m',
  amber:  '\x1b[38;2;245;166;35m',
  red:    '\x1b[38;2;255;59;71m',
  teal:   '\x1b[38;2;0;212;170m',
  blue:   '\x1b[38;2;88;166;255m',
  gray:   '\x1b[38;2;77;96;130m',
  white:  '\x1b[38;2;232;237;248m',
};
const c    = (col, txt) => `${C[col]}${txt}${C.reset}`;
const bold = txt => `${C.bold}${txt}${C.reset}`;

const log = {
  step : txt => console.log(`\n${c('amber', bold(`  ◆ ${txt}`))}`),
  line : ()  => console.log(c('gray', `  ${'─'.repeat(58)}`)),
  ok   : txt => console.log(`  ${c('green',  '✓')}  ${txt}`),
  skip : txt => console.log(`  ${c('gray',   '–')}  ${c('gray', txt)}`),
  warn : txt => console.log(`  ${c('amber',  '!')}  ${c('amber', txt)}`),
  fail : txt => console.log(`  ${c('red',    '✗')}  ${c('red', txt)}`),
  info : txt => console.log(`     ${c('teal', txt)}`),
};

/* ══════════════════════════════════════════
   FILE / DIR HELPERS
══════════════════════════════════════════ */
const ROOT = process.cwd();
const abs  = rel => path.join(ROOT, rel);

/** 폴더 생성 (이미 있으면 건너뜀) */
function makeDir(rel) {
  const p = abs(rel);
  if (fs.existsSync(p)) { log.skip(`${rel} (이미 있음)`); return; }
  fs.mkdirSync(p, { recursive: true });
  log.ok(`폴더 생성: ${rel}`);
}

/** 빈 파일 생성 (이미 있으면 건너뜀) */
function makeFile(rel) {
  const p = abs(rel);
  if (fs.existsSync(p)) { log.skip(`${rel} (이미 있음)`); return; }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, '', 'utf8');
  log.ok(`파일 생성: ${rel}`);
}

/** 비어있는 파일에만 내용 작성 (내용 있으면 건너뜀) */
function writeIfEmpty(rel, content) {
  const p = abs(rel);
  if (!fs.existsSync(p)) { log.warn(`없음 — 건너뜀: ${rel}`); return; }
  const existing = fs.readFileSync(p, 'utf8').trim();
  if (existing.length > 0) { log.skip(`${rel} (내용 있음)`); return; }
  fs.writeFileSync(p, content, 'utf8');
  log.ok(`내용 작성: ${rel}`);
}

/** 파일 읽기 (없으면 null) */
function read(rel) {
  const p = abs(rel);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8');
}

/** 파일 쓰기 */
function write(rel, content) {
  fs.writeFileSync(abs(rel), content, 'utf8');
}

/* ══════════════════════════════════════════
   HEADER
══════════════════════════════════════════ */
console.log('');
console.log(c('amber', bold('  ◆ WATCHR MOBILE — AUTO SETUP & FIX')));
console.log(c('gray',  `  ${'═'.repeat(58)}`));
console.log(c('gray',  `  실행 경로: ${ROOT}`));
console.log(c('gray',  `  ${'═'.repeat(58)}`));

/* ══════════════════════════════════════════
   PHASE 1 — 폴더 구조
══════════════════════════════════════════ */
log.step('PHASE 1 — 폴더 구조 생성');
log.line();

makeDir('src');
makeDir('src/screens');
makeDir('src/components');
makeDir('src/hooks');
makeDir('src/api');
makeDir('src/notifications');
makeDir('src/theme');

/* ══════════════════════════════════════════
   PHASE 2 — 빈 파일 생성
══════════════════════════════════════════ */
log.step('PHASE 2 — 파일 생성');
log.line();

const FILES = [
  '.clinerules',
  '.env',
  'src/theme/tokens.ts',
  'src/api/client.ts',
  'src/screens/WatchlistScreen.tsx',
  'src/screens/FuturesScreen.tsx',
  'src/screens/AlertsScreen.tsx',
  'src/screens/HistoryScreen.tsx',
  'src/components/MarketStrip.tsx',
  'src/components/TickerRow.tsx',
  'src/components/Sparkline.tsx',
  'src/components/FuturesBigCard.tsx',
  'src/components/FuturesGrid.tsx',
  'src/hooks/useWatchlist.ts',
  'src/hooks/useAlerts.ts',
  'src/hooks/useHistory.ts',
  'src/notifications/alertNotify.ts',
];

FILES.forEach(makeFile);

/* ══════════════════════════════════════════
   PHASE 3 — 기본 내용 자동 작성
   비어있는 파일에만 작성
══════════════════════════════════════════ */
log.step('PHASE 3 — 기본 내용 자동 작성 (비어있는 파일만)');
log.line();

writeIfEmpty('.clinerules', `# WATCHR MOBILE — React Native + Expo SDK 53
프레임워크: React Native + Expo (TypeScript)
내비게이션: @react-navigation/bottom-tabs (탭 4개)
API: EXPO_PUBLIC_API_URL 환경변수

# 디자인 토큰 (src/theme/tokens.ts)
Colors.bg:#07090d  bg1:#0c1018  bg2:#111621  bg3:#161d2c
Colors.line:#1e2840  line2:#283350
Colors.t0:#e8edf8  t1:#9aabc8  t2:#4d6082  t3:#2a3a58
Colors.up:#ff3b47  dn:#2b7fff  amber:#f5a623  teal:#00d4aa
FontFamily.mono: IBM_Plex_Mono  sans: NotoSansKR

# 코드 규칙
- StyleSheet.create 사용 (inline style 최소화)
- 색상은 Colors 토큰만 사용
- 숫자/가격: IBM_Plex_Mono 폰트
- 상승 Colors.up / 하락 Colors.dn
- 왼쪽 액센트 바: borderLeftWidth:3, borderLeftColor

# 저장소
- AsyncStorage prefix: sm_
- sm_watchlist / sm_alerts / sm_history
- JSON.stringify/parse 필수

# 폴링
- useFocusEffect + useRef(intervalRef)
- Watchlist: 5000ms / Futures: 60000ms

# 알림
- expo-notifications (로컬 알림)
- 쿨다운: alertId별 60분
`);

writeIfEmpty('.env', `# WATCHR Mobile 환경변수
# 실기기 테스트 시 아래 IP를 본인 PC의 실제 IP로 변경
# Windows: 터미널에서 ipconfig 실행 → IPv4 주소 확인
# Mac:     터미널에서 ifconfig | grep inet 실행
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
`);

/* ══════════════════════════════════════════
   PHASE 4 — 코드 자동 수정
   이미 코드가 있는 파일에서 문제 패턴 교정
══════════════════════════════════════════ */
log.step('PHASE 4 — 코드 자동 수정');
log.line();

const CODE_FILES = [
  'src/hooks/useWatchlist.ts',
  'src/hooks/useAlerts.ts',
  'src/hooks/useHistory.ts',
  'src/screens/WatchlistScreen.tsx',
  'src/screens/FuturesScreen.tsx',
  'src/screens/AlertsScreen.tsx',
  'src/screens/HistoryScreen.tsx',
  'src/components/TickerRow.tsx',
  'src/components/MarketStrip.tsx',
  'src/components/FuturesBigCard.tsx',
  'src/components/FuturesGrid.tsx',
  'src/components/Sparkline.tsx',
  'src/notifications/alertNotify.ts',
];

/* ── Fix 1: localStorage → AsyncStorage ── */
log.info('[ localStorage → AsyncStorage 치환 ]');

CODE_FILES.forEach(rel => {
  let content = read(rel);
  if (!content || !content.includes('localStorage')) return;

  // import 추가
  if (!content.includes('AsyncStorage') &&
      !content.includes('@react-native-async-storage')) {
    content = `import AsyncStorage from '@react-native-async-storage/async-storage';\n` + content;
  }

  // 메서드 치환
  content = content
    .replace(/localStorage\.getItem\(([^)]+)\)/g,            'await AsyncStorage.getItem($1)')
    .replace(/localStorage\.setItem\(([^,]+),\s*([^)]+)\)/g, 'await AsyncStorage.setItem($1, $2)')
    .replace(/localStorage\.removeItem\(([^)]+)\)/g,         'await AsyncStorage.removeItem($1)')
    .replace(/localStorage\.clear\(\)/g,                     'await AsyncStorage.clear()');

  write(rel, content);
  log.ok(`localStorage 치환: ${rel}`);
});

/* ── Fix 2: new Notification() → expo-notifications ── */
log.info('\n  [ new Notification() → expo-notifications 치환 ]');

const NOTIF_FILES = [
  'src/notifications/alertNotify.ts',
  'src/hooks/useAlerts.ts',
  'src/screens/AlertsScreen.tsx',
];

NOTIF_FILES.forEach(rel => {
  let content = read(rel);
  if (!content || !content.includes('new Notification(')) return;

  if (!content.includes('expo-notifications')) {
    content = `import * as Notifications from 'expo-notifications';\n` + content;
  }
  content = content.replace(
    /new Notification\(\s*([^,)]+)(?:,\s*\{[^}]*\})?\s*\)/g,
    (_, title) =>
      `Notifications.scheduleNotificationAsync({ content: { title: ${title.trim()}, sound: true }, trigger: null })`
  );

  write(rel, content);
  log.ok(`Notification 치환: ${rel}`);
});

/* ── Fix 3: AsyncStorage 키 sm_ prefix ── */
log.info('\n  [ AsyncStorage 키 sm_ prefix 추가 ]');

const KEY_MAP = {
  "'watchlist'": "'sm_watchlist'",
  '"watchlist"': '"sm_watchlist"',
  "'alerts'":    "'sm_alerts'",
  '"alerts"':    '"sm_alerts"',
  "'history'":   "'sm_history'",
  '"history"':   '"sm_history"',
};

['src/hooks/useWatchlist.ts', 'src/hooks/useAlerts.ts', 'src/hooks/useHistory.ts']
  .forEach(rel => {
    let content = read(rel);
    if (!content) return;
    let changed = false;
    for (const [from, to] of Object.entries(KEY_MAP)) {
      if (content.includes(to)) continue;      // 이미 sm_ 있음
      if (!content.includes(from)) continue;
      content = content.split(from).join(to);
      changed = true;
    }
    if (changed) { write(rel, content); log.ok(`키 prefix 추가: ${rel}`); }
  });

/* ── Fix 4: Colors import 누락 시 자동 추가 ── */
log.info('\n  [ Colors import 누락 시 자동 추가 ]');

const COLOR_FILES = [
  'src/components/TickerRow.tsx',
  'src/components/MarketStrip.tsx',
  'src/components/FuturesBigCard.tsx',
  'src/components/FuturesGrid.tsx',
  'src/components/Sparkline.tsx',
  'src/screens/WatchlistScreen.tsx',
  'src/screens/FuturesScreen.tsx',
  'src/screens/AlertsScreen.tsx',
  'src/screens/HistoryScreen.tsx',
];

COLOR_FILES.forEach(rel => {
  let content = read(rel);
  if (!content || !content.trim()) return;
  if (!content.includes('Colors')) return;
  if (content.includes('theme/tokens') || content.includes('/tokens')) return;

  const depth = rel.split('/').length - 1;
  const relPath = depth <= 2 ? '../theme/tokens' : '../../theme/tokens';
  const importLine = `import { Colors, FontFamily, fmtPrice, fmtRate } from '${relPath}';`;
  content = importLine + '\n' + content;
  write(rel, content);
  log.ok(`Colors import 추가: ${rel}`);
});

/* ── Fix 5: StyleSheet import 누락 시 자동 추가 ── */
log.info('\n  [ StyleSheet import 누락 시 자동 추가 ]');

const STYLE_FILES = [
  'src/components/TickerRow.tsx',
  'src/components/MarketStrip.tsx',
  'src/screens/WatchlistScreen.tsx',
  'src/screens/FuturesScreen.tsx',
  'src/screens/AlertsScreen.tsx',
  'src/screens/HistoryScreen.tsx',
];

STYLE_FILES.forEach(rel => {
  let content = read(rel);
  if (!content || !content.trim()) return;
  if (!content.includes('StyleSheet')) return;

  // 이미 react-native import에 StyleSheet 있는지 확인
  const rnImport = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]react-native['"]/);
  if (rnImport) {
    if (rnImport[1].includes('StyleSheet')) return; // 이미 있음
    // 기존 import에 StyleSheet 추가
    const updated = rnImport[0].replace('{', '{ StyleSheet,');
    content = content.replace(rnImport[0], updated);
    write(rel, content);
    log.ok(`StyleSheet import 추가: ${rel}`);
  }
});

/* ── Fix 6: JSON.stringify/parse 누락 경고 ── */
log.info('\n  [ JSON 직렬화 누락 검사 ]');

['src/hooks/useWatchlist.ts', 'src/hooks/useAlerts.ts', 'src/hooks/useHistory.ts']
  .forEach(rel => {
    const content = read(rel);
    if (!content || !content.trim()) return;
    if (!content.includes('AsyncStorage')) return;
    if (!content.includes('JSON.parse') || !content.includes('JSON.stringify')) {
      log.warn(`JSON 직렬화 누락 가능성: ${rel}`);
      log.info(`  → AsyncStorage는 string만 저장 가능`);
      log.info(`  → 배열/객체: JSON.stringify로 저장, JSON.parse로 불러오기`);
    }
  });

/* ── Fix 7: useFocusEffect 미사용 경고 ── */
log.info('\n  [ useFocusEffect 폴링 패턴 검사 ]');

['src/screens/WatchlistScreen.tsx', 'src/screens/FuturesScreen.tsx']
  .forEach(rel => {
    const content = read(rel);
    if (!content || !content.trim()) return;
    if (content.includes('setInterval') && !content.includes('useFocusEffect')) {
      log.warn(`useFocusEffect 없음: ${rel}`);
      log.info(`  → setInterval 대신 useFocusEffect + useRef 패턴 사용`);
      log.info(`  → 포그라운드에서만 폴링해야 배터리 절약 가능`);
    }
  });

/* ══════════════════════════════════════════
   PHASE 5 — inspect.js 검사
   (프로젝트 루트에 inspect.js 있을 때만 실행)
══════════════════════════════════════════ */
log.step('PHASE 5 — 코드 검사 (inspect.js)');
log.line();

const inspectPath = path.join(ROOT, 'inspect.js');
if (fs.existsSync(inspectPath)) {
  log.info('inspect.js 발견 → 검사 실행');
  console.log('');
  try {
    require(inspectPath);
  } catch (e) {
    log.fail(`inspect.js 실행 오류: ${e.message}`);
  }
} else {
  log.skip('inspect.js 없음 — 건너뜀 (inspect.js를 루트에 두면 자동 실행됨)');
}

/* ══════════════════════════════════════════
   완료
══════════════════════════════════════════ */
console.log('');
console.log(c('gray',  `  ${'═'.repeat(58)}`));
console.log(c('amber', bold('  완료')));
console.log(c('gray',  `  ${'─'.repeat(58)}`));
console.log(c('teal',  '  다음 단계:'));
console.log(c('teal',  '    1. VS Code 탐색기에서 생성된 파일 확인'));
console.log(c('teal',  '    2. 각 파일 열고 Continue.dev 프롬프트 입력'));
console.log(c('teal',  '    3. Apply → Ctrl+S 저장'));
console.log(c('teal',  '    4. npx expo start 로 앱 실행'));
console.log(c('gray',  `  ${'═'.repeat(58)}`));
console.log('');
