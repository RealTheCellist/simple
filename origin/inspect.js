#!/usr/bin/env node
/**
 * WATCHR Mobile — Code Inspector
 * 프로젝트 루트에 놓고 실행: node inspect.js
 * 파일이 존재하지 않으면 해당 항목은 LOCKED — 검사 불가
 */

const fs   = require('fs');
const path = require('path');

/* ════════════════════════════════
   TERMINAL COLOR HELPERS
════════════════════════════════ */
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  red:    '\x1b[38;2;255;59;71m',
  green:  '\x1b[38;2;63;185;80m',
  amber:  '\x1b[38;2;245;166;35m',
  teal:   '\x1b[38;2;0;212;170m',
  blue:   '\x1b[38;2;43;127;255m',
  gray:   '\x1b[38;2;77;96;130m',
  white:  '\x1b[38;2;232;237;248m',
  bgDark: '\x1b[48;2;12;16;24m',
};

const c = (color, text) => `${C[color]}${text}${C.reset}`;
const bold = text => `${C.bold}${text}${C.reset}`;

/* ════════════════════════════════
   CHECK REGISTRY — 19 FILES / 87 CHECKS
════════════════════════════════ */
const REGISTRY = [
  {
    id: 'clinerules', path: '.clinerules', group: 'CORE',
    checks: [
      { label: '디자인 토큰 up/dn 색상 정의',     type: 'all',  patterns: ['#ff3b47', '#2b7fff'] },
      { label: 'IBM Plex Mono 폰트 명시',          type: 'any',  patterns: ['IBM_Plex_Mono', 'IBM Plex Mono'] },
      { label: 'AsyncStorage prefix "sm_" 정의',   type: 'all',  patterns: ['sm_', 'AsyncStorage'] },
      { label: '폴링 정책 명시 (useFocusEffect)',  type: 'any',  patterns: ['useFocusEffect', '5000'] },
      { label: 'EXPO_PUBLIC_API_URL 환경변수 명시', type: 'all',  patterns: ['EXPO_PUBLIC_API_URL'] },
    ],
  },
  {
    id: 'app', path: 'App.tsx', group: 'CORE',
    checks: [
      { label: 'createBottomTabNavigator 사용',    type: 'any',  patterns: ['createBottomTabNavigator', 'BottomTab'] },
      { label: '탭 4개 정의 (Watchlist·Futures·Alerts·History)', type: 'all', patterns: ['Watchlist', 'Futures', 'Alerts', 'History'] },
      { label: 'activeTintColor amber 색상',        type: 'any',  patterns: ['amber', '#f5a623', 'activeTintColor'] },
      { label: '탭바 어두운 배경 (bg1/#0c1018)',    type: 'any',  patterns: ['#0c1018', 'bg1', 'Colors.bg1'] },
      { label: 'useFonts IBM_Plex_Mono 로드',       type: 'any',  patterns: ['IBM_Plex_Mono', 'useFonts'] },
      { label: '[금지] 흰 배경(#ffffff) 탭바',      type: 'notAny', warn: true, patterns: ["'#fff'", '"#fff"', "'white'", '"white"', '#ffffff'] },
    ],
  },
  {
    id: 'tokens', path: 'src/theme/tokens.ts', group: 'CORE',
    checks: [
      { label: 'Colors 객체 export',               type: 'all',  patterns: ['export', 'Colors'] },
      { label: 'up 색상 #ff3b47',                  type: 'all',  patterns: ['#ff3b47'] },
      { label: 'dn 색상 #2b7fff',                  type: 'all',  patterns: ['#2b7fff'] },
      { label: '배경 계층 (bg/#07090d, bg1/#0c1018)', type: 'all', patterns: ['#07090d', '#0c1018'] },
      { label: 'amber 색상 정의',                  type: 'any',  patterns: ['amber', '#f5a623'] },
      { label: 'FontFamily 정의',                  type: 'any',  patterns: ['IBM_Plex_Mono', 'FontFamily'] },
      { label: 'fmtPrice 유틸 함수',               type: 'any',  patterns: ['fmtPrice', 'toLocaleString'] },
    ],
  },
  {
    id: 'client', path: 'src/api/client.ts', group: 'API',
    checks: [
      { label: 'EXPO_PUBLIC_API_URL 환경변수 사용', type: 'all',  patterns: ['EXPO_PUBLIC_API_URL'] },
      { label: 'fetchPrice 함수 존재',              type: 'all',  patterns: ['fetchPrice'] },
      { label: 'fetchBatch 함수 존재',              type: 'all',  patterns: ['fetchBatch'] },
      { label: 'fetchFutures 함수 존재',            type: 'all',  patterns: ['fetchFutures'] },
      { label: '실패 시 null 반환 + catch 처리',    type: 'all',  patterns: ['null', 'catch'] },
      { label: '[경고] localhost 하드코딩 금지',    type: 'notAny', warn: true, patterns: ["'http://localhost:3000'", '"http://localhost:3000"'] },
    ],
  },
  {
    id: 'dotenv', path: '.env', group: 'CORE',
    checks: [
      { label: 'EXPO_PUBLIC_API_URL 정의',          type: 'all',  patterns: ['EXPO_PUBLIC_API_URL'] },
      { label: '[경고] localhost 대신 실제 IP 권장', type: 'notAny', warn: true, patterns: ['localhost'] },
    ],
  },
  {
    id: 'watchlist', path: 'src/screens/WatchlistScreen.tsx', group: 'SCREENS',
    checks: [
      { label: 'useFocusEffect 포그라운드 폴링',    type: 'all',  patterns: ['useFocusEffect'] },
      { label: 'useRef로 interval 관리',             type: 'all',  patterns: ['useRef'] },
      { label: 'clearInterval cleanup 처리',         type: 'all',  patterns: ['clearInterval'] },
      { label: 'useWatchlist 훅 사용',               type: 'all',  patterns: ['useWatchlist'] },
      { label: '[금지] localStorage 사용',           type: 'notAll', patterns: ['localStorage'] },
      { label: 'SafeAreaView 사용',                  type: 'all',  patterns: ['SafeAreaView'] },
      { label: 'Colors 토큰 사용',                   type: 'all',  patterns: ['Colors'] },
      { label: 'FlatList 사용',                      type: 'all',  patterns: ['FlatList'] },
    ],
  },
  {
    id: 'futures', path: 'src/screens/FuturesScreen.tsx', group: 'SCREENS',
    checks: [
      { label: 'useFocusEffect 포그라운드 폴링',    type: 'all',  patterns: ['useFocusEffect'] },
      { label: '60초 폴링 간격',                    type: 'any',  patterns: ['60000', '60 * 1000', '60*1000'] },
      { label: 'fetchFutures 호출',                  type: 'all',  patterns: ['fetchFutures'] },
      { label: 'null 처리 (API 실패 대비)',           type: 'all',  patterns: ['null'] },
    ],
  },
  {
    id: 'alerts', path: 'src/screens/AlertsScreen.tsx', group: 'SCREENS',
    checks: [
      { label: 'useAlerts 훅 사용',                  type: 'all',  patterns: ['useAlerts'] },
      { label: "above/below 조건 UI",                type: 'any',  patterns: ["'above'", "'below'", 'above', 'below'] },
      { label: '[금지] 브라우저 new Notification()',  type: 'notAll', patterns: ['new Notification('] },
      { label: 'Colors 토큰 사용',                   type: 'all',  patterns: ['Colors'] },
    ],
  },
  {
    id: 'history', path: 'src/screens/HistoryScreen.tsx', group: 'SCREENS',
    checks: [
      { label: 'useHistory 훅 사용',                 type: 'all',  patterns: ['useHistory'] },
      { label: 'FlatList 사용',                      type: 'all',  patterns: ['FlatList'] },
      { label: 'clearAll + Alert.alert 구현',        type: 'any',  patterns: ['clearAll', 'Alert.alert', 'Alert.confirm'] },
    ],
  },
  {
    id: 'marketstrip', path: 'src/components/MarketStrip.tsx', group: 'COMPONENTS',
    checks: [
      { label: 'horizontal ScrollView',              type: 'all',  patterns: ['horizontal', 'ScrollView'] },
      { label: 'Colors 토큰 사용',                   type: 'all',  patterns: ['Colors'] },
      { label: 'IBM_Plex_Mono 폰트',                 type: 'any',  patterns: ['IBM_Plex_Mono', 'mono', 'FontFamily'] },
    ],
  },
  {
    id: 'tickerrow', path: 'src/components/TickerRow.tsx', group: 'COMPONENTS',
    checks: [
      { label: '왼쪽 3px 액센트 바 (borderLeft)',    type: 'any',  patterns: ['borderLeftWidth', 'borderLeft'] },
      { label: 'StyleSheet.create 사용',             type: 'all',  patterns: ['StyleSheet'] },
      { label: 'up/dn 색상 분기',                    type: 'any',  patterns: ['Colors.up', 'Colors.dn'] },
      { label: 'hasAlert prop 처리',                 type: 'any',  patterns: ['hasAlert', 'alertPip'] },
      { label: 'IBM_Plex_Mono 가격 폰트',            type: 'any',  patterns: ['IBM_Plex_Mono', 'mono', 'FontFamily'] },
    ],
  },
  {
    id: 'sparkline', path: 'src/components/Sparkline.tsx', group: 'COMPONENTS',
    checks: [
      { label: 'react-native-svg 사용',              type: 'any',  patterns: ['react-native-svg', 'react-native-svg', 'Svg'] },
      { label: 'SVG Path 생성 (d 문자열)',            type: 'any',  patterns: ['Path', 'strokeWidth'] },
      { label: 'fill none 설정',                     type: 'any',  patterns: ['fill=', 'fillOpacity', "fill:'none'", 'fill: none'] },
    ],
  },
  {
    id: 'futuresbig', path: 'src/components/FuturesBigCard.tsx', group: 'COMPONENTS',
    checks: [
      { label: 'Sparkline 컴포넌트 사용',            type: 'all',  patterns: ['Sparkline'] },
      { label: 'Colors 토큰 사용',                   type: 'all',  patterns: ['Colors'] },
    ],
  },
  {
    id: 'futuresgrid', path: 'src/components/FuturesGrid.tsx', group: 'COMPONENTS',
    checks: [
      { label: '2열 그리드 (numColumns:2)',           type: 'any',  patterns: ['numColumns', '2'] },
      { label: '하단 2px 바 (borderBottom)',          type: 'any',  patterns: ['borderBottom', 'borderWidth'] },
    ],
  },
  {
    id: 'usewatchlist', path: 'src/hooks/useWatchlist.ts', group: 'HOOKS',
    checks: [
      { label: 'AsyncStorage 사용',                  type: 'all',  patterns: ['AsyncStorage'] },
      { label: '[금지] localStorage 사용',           type: 'notAll', patterns: ['localStorage'] },
      { label: 'sm_watchlist 키 사용',               type: 'all',  patterns: ['sm_watchlist'] },
      { label: 'useFocusEffect 폴링',                type: 'all',  patterns: ['useFocusEffect'] },
      { label: 'addTicker / removeTicker 구현',      type: 'all',  patterns: ['addTicker', 'removeTicker'] },
      { label: '중복 체크 (includes/find/some)',     type: 'any',  patterns: ['includes', 'find', 'some'] },
      { label: 'checkAlerts 연동',                   type: 'all',  patterns: ['checkAlerts'] },
      { label: 'JSON.parse / JSON.stringify',        type: 'all',  patterns: ['JSON.parse', 'JSON.stringify'] },
    ],
  },
  {
    id: 'usealerts', path: 'src/hooks/useAlerts.ts', group: 'HOOKS',
    checks: [
      { label: 'AsyncStorage 사용',                  type: 'all',  patterns: ['AsyncStorage'] },
      { label: '[금지] localStorage 사용',           type: 'notAll', patterns: ['localStorage'] },
      { label: 'sm_alerts 키 사용',                  type: 'all',  patterns: ['sm_alerts'] },
      { label: "above/below operator 정의",          type: 'any',  patterns: ["'above'", "'below'"] },
      { label: 'checkAlerts 함수 구현',              type: 'all',  patterns: ['checkAlerts'] },
      { label: '60분 쿨다운 로직',                   type: 'any',  patterns: ['3600000', '60 * 60', '60*60', 'cooldown'] },
      { label: '[금지] 브라우저 new Notification()', type: 'notAll', patterns: ['new Notification('] },
    ],
  },
  {
    id: 'usehistory', path: 'src/hooks/useHistory.ts', group: 'HOOKS',
    checks: [
      { label: 'AsyncStorage 사용',                  type: 'all',  patterns: ['AsyncStorage'] },
      { label: 'sm_history 키 사용',                 type: 'all',  patterns: ['sm_history'] },
      { label: '최대 50건 제한 (slice/splice)',       type: 'any',  patterns: ['50', 'slice', 'splice'] },
      { label: 'addLog / getLogs / clearAll 구현',   type: 'all',  patterns: ['addLog', 'getLogs', 'clearAll'] },
    ],
  },
  {
    id: 'alertnotify', path: 'src/notifications/alertNotify.ts', group: 'NOTIFICATIONS',
    checks: [
      { label: 'expo-notifications import',          type: 'any',  patterns: ['expo-notifications', 'Notifications'] },
      { label: 'scheduleNotificationAsync 사용',     type: 'all',  patterns: ['scheduleNotificationAsync'] },
      { label: 'requestPermissionsAsync 사용',       type: 'all',  patterns: ['requestPermissionsAsync'] },
      { label: '[금지] 브라우저 new Notification()', type: 'notAll', patterns: ['new Notification('] },
      { label: '쿨다운 Map 관리',                    type: 'any',  patterns: ['Map', 'cooldown', 'timestamp'] },
    ],
  },
];

/* ════════════════════════════════
   CHECK ENGINE
════════════════════════════════ */
function runCheck(content, check) {
  const { type, patterns } = check;

  const hits    = patterns.filter(p => content.includes(p));
  const missing = patterns.filter(p => !content.includes(p));

  if (type === 'all')    return { pass: missing.length === 0, hits, missing };
  if (type === 'any')    return { pass: hits.length > 0,      hits, missing };
  if (type === 'notAll') return { pass: !patterns.some(p => content.includes(p)), hits, missing };
  if (type === 'notAny') return { pass: hits.length === 0,    hits, missing };
  return { pass: false, hits: [], missing: patterns };
}

/* ════════════════════════════════
   PRINT HELPERS
════════════════════════════════ */
const PAD = 60;

function printHeader() {
  const line = '═'.repeat(68);
  console.log('');
  console.log(c('amber', bold('  ◆ WATCHR MOBILE — CODE INSPECTOR')));
  console.log(c('gray',  `  ${line}`));
  console.log(c('gray',  `  실행 경로: ${process.cwd()}`));
  console.log(c('gray',  `  실행 시각: ${new Date().toLocaleString('ko-KR')}`));
  console.log(c('gray',  `  ${'─'.repeat(68)}`));
  console.log('');
}

function printGroupHeader(group) {
  console.log('');
  console.log(c('teal', `  ┌─ ${group} ${'─'.repeat(Math.max(0, 60 - group.length))}┐`));
}

function printFileResult(reg, fileExists, results) {
  const icon  = fileExists ? (results.every(r => r.ok) ? c('green','✓') : c('amber','!')) : c('red','✗');
  const label = fileExists ? c('white', reg.path) : c('red', reg.path);
  const tag   = fileExists ? '' : c('red', '  [FILE NOT FOUND — LOCKED]');
  console.log(`  │  ${icon}  ${label}${tag}`);

  if (!fileExists) return;

  for (const r of results) {
    let bullet, text;
    if (r.isLocked) {
      bullet = c('gray', '  │     · ');
      text   = c('gray', `[LOCKED] ${r.label}`);
    } else if (r.ok) {
      bullet = c('green', '  │     ✓ ');
      text   = c('gray', r.label);
    } else if (r.warn) {
      bullet = c('amber', '  │     ⚠ ');
      text   = c('amber', `${r.label}`);
      if (r.hits.length > 0) text += c('red', `  ← 발견: ${r.hits.join(', ')}`);
    } else {
      bullet = c('red', '  │     ✗ ');
      text   = c('white', r.label);
      if (r.missing.length > 0) text += c('red', `  ← 없음: ${r.missing.join(', ')}`);
    }
    console.log(bullet + text);
  }
}

function printSummary(stats) {
  const line = '─'.repeat(68);
  console.log('');
  console.log(c('gray', `  ${line}`));
  console.log(c('amber', bold('  ◆ INSPECTION SUMMARY')));
  console.log(c('gray', `  ${line}`));

  // file stats
  console.log(`  ${bold('파일')}   ${c('white', `${stats.filesFound}`)} / ${stats.filesTotal} 존재  ${stats.filesMissing > 0 ? c('red', `(${stats.filesMissing}개 없음)`) : c('green', '(전부 있음)')}`);
  console.log(`  ${bold('검사')}   ${c('green', `PASS ${stats.pass}`)}  ${c('red', `FAIL ${stats.fail}`)}  ${stats.warn > 0 ? c('amber', `WARN ${stats.warn}`) : ''}  ${c('gray', `LOCKED ${stats.locked}`)}`);

  const total  = stats.pass + stats.fail + stats.warn;
  const pct    = total > 0 ? Math.round(stats.pass / total * 100) : 0;
  const barLen = 40;
  const filled = Math.round(barLen * pct / 100);
  const bar    = '█'.repeat(filled) + '░'.repeat(barLen - filled);
  const barColor = pct >= 80 ? 'green' : pct >= 50 ? 'amber' : 'red';

  console.log('');
  console.log(`  ${c(barColor, bar)}  ${c(barColor, bold(`${pct}%`))}`);
  console.log('');

  if (stats.filesMissing > 0) {
    console.log(c('red', `  ⚠  누락된 파일 ${stats.filesMissing}개 — 해당 항목은 검사 불가 (LOCKED)`));
  }
  if (stats.fail > 0) {
    console.log(c('red', `  ✗  FAIL ${stats.fail}개 — 코드 수정 필요`));
  }
  if (stats.warn > 0) {
    console.log(c('amber', `  !  WARN ${stats.warn}개 — 권장 사항 확인`));
  }
  if (pct === 100) {
    console.log(c('green', '  ✓  모든 검사 통과'));
  }

  console.log(c('gray', `  ${'═'.repeat(68)}`));
  console.log('');
}

function printGroupFooter() {
  console.log(c('teal', `  └${'─'.repeat(68)}┘`));
}

/* ════════════════════════════════
   MAIN
════════════════════════════════ */
function main() {
  printHeader();

  const stats = {
    filesTotal: REGISTRY.length,
    filesFound: 0,
    filesMissing: 0,
    pass: 0, fail: 0, warn: 0, locked: 0,
  };

  let lastGroup = null;

  for (const reg of REGISTRY) {
    // group header
    if (reg.group !== lastGroup) {
      if (lastGroup !== null) printGroupFooter();
      printGroupHeader(reg.group);
      lastGroup = reg.group;
    }

    const filePath   = path.join(process.cwd(), reg.path);
    const fileExists = fs.existsSync(filePath);

    if (fileExists) {
      stats.filesFound++;
    } else {
      stats.filesMissing++;
      stats.locked += reg.checks.length;
      printFileResult(reg, false, []);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const results = [];

    for (const check of reg.checks) {
      const { pass, hits, missing } = runCheck(content, check);
      const isWarn = check.warn && !pass;

      if (isWarn) {
        stats.warn++;
        results.push({ ok: false, warn: true, label: check.label, hits, missing });
      } else if (pass) {
        stats.pass++;
        results.push({ ok: true, label: check.label, hits, missing });
      } else {
        stats.fail++;
        results.push({ ok: false, warn: false, label: check.label, hits, missing });
      }
    }

    printFileResult(reg, true, results);
  }

  if (lastGroup !== null) printGroupFooter();

  printSummary(stats);

  // exit code: 0 = all pass/warn, 1 = any fail
  process.exit(stats.fail > 0 ? 1 : 0);
}

main();
