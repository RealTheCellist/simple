#!/usr/bin/env node
/**
 * WATCHR Mobile — Auto Fixer
 *
 * 사용법:
 *   node fix.js              → dry-run (미리보기만, 파일 변경 없음)
 *   node fix.js --apply      → 실제 수정 (.bak 백업 자동 생성)
 *   node fix.js --file=src/hooks/useWatchlist.ts  → 파일 하나만
 *   node fix.js --apply --file=App.tsx
 */

const fs   = require('fs');
const path = require('path');

/* ════════════════════════════════
   ARG PARSE
════════════════════════════════ */
const ARGS      = process.argv.slice(2);
const DRY_RUN   = !ARGS.includes('--apply');
const FILE_ONLY = (ARGS.find(a => a.startsWith('--file=')) || '').replace('--file=', '') || null;

/* ════════════════════════════════
   COLORS
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
  purple: '\x1b[38;2;163;113;247m',
};
const c    = (col, txt) => `${C[col]}${txt}${C.reset}`;
const bold = txt => `${C.bold}${txt}${C.reset}`;
const dim  = txt => `${C.dim}${txt}${C.reset}`;

/* ════════════════════════════════
   DIFF PRINTER
   변경된 라인을 before/after로 출력
════════════════════════════════ */
function printDiff(before, after, filePath) {
  const bLines = before.split('\n');
  const aLines = after.split('\n');
  const maxLen = Math.max(bLines.length, aLines.length);
  let diffCount = 0;
  const diffs = [];

  for (let i = 0; i < maxLen; i++) {
    const bl = bLines[i];
    const al = aLines[i];
    if (bl !== al) {
      diffCount++;
      diffs.push({ line: i + 1, before: bl, after: al });
    }
  }

  if (diffCount === 0) return 0;

  console.log(c('gray', `    ┌── diff: ${filePath}`));
  for (const d of diffs.slice(0, 12)) {
    if (d.before !== undefined) {
      console.log(c('red',   `    │  - L${d.line}: ${(d.before || '').trim().slice(0, 80)}`));
    }
    if (d.after !== undefined) {
      console.log(c('green', `    │  + L${d.line}: ${(d.after  || '').trim().slice(0, 80)}`));
    }
  }
  if (diffs.length > 12) {
    console.log(c('gray', `    │  ... 외 ${diffs.length - 12}개 변경`));
  }
  console.log(c('gray', `    └── ${diffCount}줄 변경`));
  return diffCount;
}

/* ════════════════════════════════
   FIX DEFINITIONS
   각 fix는 { id, desc, canAuto, files, transform?, manual? }
   transform(content) → newContent  (자동 수정)
   manual: 수동 수정 안내 문자열
════════════════════════════════ */
const FIXES = [

  /* ──────────────────────────────
     .clinerules
  ────────────────────────────── */
  {
    id: 'clinerules-create',
    group: 'CORE',
    desc: '.clinerules 파일이 없으면 기본 템플릿 생성',
    canAuto: true,
    files: ['.clinerules'],
    createIfMissing: true,
    template: () => `# WATCHR MOBILE — React Native + Expo SDK 53
프레임워크: React Native + Expo (TypeScript)
내비게이션: @react-navigation/bottom-tabs (탭 4개)
API: EXPO_PUBLIC_API_URL 환경변수

# 디자인 토큰 (src/theme/tokens.ts)
Colors.bg:#07090d  bg1:#0c1018  bg2:#111621  bg3:#161d2c
Colors.line:#1e2840  line2:#283350
Colors.t0:#e8edf8  t1:#9aabc8  t2:#4d6082  t3:#2a3a58
Colors.up:#ff3b47  dn:#2b7fff  amber:#f5a623  teal:#00d4aa
FontFamily.mono: IBM_Plex_Mono  sans: NotoSansKR

# 컴포넌트 규칙
- StyleSheet.create 사용 (inline style 최소화)
- 색상은 Colors 토큰 import
- 숫자/가격: IBM_Plex_Mono 폰트
- 상승→Colors.up / 하락→Colors.dn
- 왼쪽 액센트 바: borderLeftWidth:3, borderLeftColor

# 저장소
- AsyncStorage prefix: "sm_"
- sm_watchlist / sm_alerts / sm_history
- JSON.stringify/parse 필수

# 폴링
- useFocusEffect + useRef(intervalRef)
- Watchlist: 5000ms / Futures: 60000ms

# 알림
- expo-notifications (로컬 알림)
- 쿨다운: alertId별 60분
`,
  },

  /* ──────────────────────────────
     .env
  ────────────────────────────── */
  {
    id: 'env-create',
    group: 'CORE',
    desc: '.env 파일이 없으면 기본 템플릿 생성',
    canAuto: true,
    files: ['.env'],
    createIfMissing: true,
    template: () => `# WATCHR Mobile — 환경변수
# 실기기 테스트 시 localhost 대신 PC의 실제 IP 주소로 변경
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
`,
  },

  /* ──────────────────────────────
     localStorage → AsyncStorage (모든 .ts/.tsx)
  ────────────────────────────── */
  {
    id: 'localstorage-replace',
    group: 'STORAGE',
    desc: 'localStorage → AsyncStorage 전환 (import + 메서드 치환)',
    canAuto: true,
    files: [
      'src/hooks/useWatchlist.ts',
      'src/hooks/useAlerts.ts',
      'src/hooks/useHistory.ts',
      'src/screens/WatchlistScreen.tsx',
      'src/screens/AlertsScreen.tsx',
      'src/screens/HistoryScreen.tsx',
    ],
    transform(content, filePath) {
      if (!content.includes('localStorage')) return null; // 수정 불필요

      let next = content;

      // 1. import 추가 (없을 때만)
      if (!next.includes('AsyncStorage') && !next.includes('@react-native-async-storage')) {
        next = `import AsyncStorage from '@react-native-async-storage/async-storage';\n` + next;
      }

      // 2. localStorage.getItem('key') → await AsyncStorage.getItem('key')
      next = next.replace(
        /localStorage\.getItem\(([^)]+)\)/g,
        (_, k) => `await AsyncStorage.getItem(${k})`
      );

      // 3. localStorage.setItem('key', val) → await AsyncStorage.setItem('key', val)
      next = next.replace(
        /localStorage\.setItem\(([^,]+),\s*([^)]+)\)/g,
        (_, k, v) => `await AsyncStorage.setItem(${k.trim()}, ${v.trim()})`
      );

      // 4. localStorage.removeItem('key') → await AsyncStorage.removeItem('key')
      next = next.replace(
        /localStorage\.removeItem\(([^)]+)\)/g,
        (_, k) => `await AsyncStorage.removeItem(${k})`
      );

      // 5. localStorage.clear() → await AsyncStorage.clear()
      next = next.replace(/localStorage\.clear\(\)/g, 'await AsyncStorage.clear()');

      return next === content ? null : next;
    },
  },

  /* ──────────────────────────────
     sm_ prefix 키 자동 추가
  ────────────────────────────── */
  {
    id: 'storage-key-prefix',
    group: 'STORAGE',
    desc: 'AsyncStorage 키에 "sm_" prefix 추가',
    canAuto: true,
    files: [
      'src/hooks/useWatchlist.ts',
      'src/hooks/useAlerts.ts',
      'src/hooks/useHistory.ts',
    ],
    transform(content, filePath) {
      let next = content;
      // 'watchlist' → 'sm_watchlist', 'alerts' → 'sm_alerts', 'history' → 'sm_history'
      const keyMap = {
        "'watchlist'": "'sm_watchlist'",
        '"watchlist"': '"sm_watchlist"',
        "'alerts'":    "'sm_alerts'",
        '"alerts"':    '"sm_alerts"',
        "'history'":   "'sm_history'",
        '"history"':   '"sm_history"',
      };
      for (const [from, to] of Object.entries(keyMap)) {
        if (next.includes(to)) continue; // 이미 올바른 키
        next = next.split(from).join(to);
      }
      return next === content ? null : next;
    },
  },

  /* ──────────────────────────────
     브라우저 Notification → expo-notifications
  ────────────────────────────── */
  {
    id: 'notification-replace',
    group: 'NOTIFICATIONS',
    desc: 'new Notification() → Expo Notifications 전환',
    canAuto: true,
    files: [
      'src/notifications/alertNotify.ts',
      'src/hooks/useAlerts.ts',
      'src/screens/AlertsScreen.tsx',
    ],
    transform(content, filePath) {
      if (!content.includes('new Notification(')) return null;

      let next = content;

      // import 추가
      if (!next.includes('expo-notifications') && !next.includes('Notifications')) {
        next = `import * as Notifications from 'expo-notifications';\n` + next;
      }

      // new Notification(title, { body }) → scheduleNotificationAsync 패턴
      next = next.replace(
        /new Notification\(\s*([^,)]+)\s*(?:,\s*\{[^}]*body\s*:\s*([^,}]+)[^}]*\})?\s*\)/g,
        (_, title, body) => {
          const b = (body || '""').trim();
          return `Notifications.scheduleNotificationAsync({ content: { title: ${title.trim()}, body: ${b}, sound: true }, trigger: null })`;
        }
      );

      return next === content ? null : next;
    },
  },

  /* ──────────────────────────────
     StyleSheet import 누락 시 추가
  ────────────────────────────── */
  {
    id: 'stylesheet-import',
    group: 'STYLE',
    desc: 'StyleSheet 사용하지만 import 누락된 경우 자동 추가',
    canAuto: true,
    files: [
      'src/components/TickerRow.tsx',
      'src/components/MarketStrip.tsx',
      'src/components/FuturesBigCard.tsx',
      'src/components/FuturesGrid.tsx',
      'src/screens/WatchlistScreen.tsx',
      'src/screens/FuturesScreen.tsx',
      'src/screens/AlertsScreen.tsx',
      'src/screens/HistoryScreen.tsx',
    ],
    transform(content) {
      if (!content.includes('StyleSheet')) return null;
      if (content.includes("import") && content.includes('StyleSheet')) {
        // StyleSheet 이미 import에 포함 여부 확인
        const importMatch = content.match(/import\s*\{[^}]+\}\s*from\s*['"]react-native['"]/);
        if (importMatch && importMatch[0].includes('StyleSheet')) return null;
        if (!importMatch) return null;

        // StyleSheet을 기존 react-native import에 추가
        const newImport = importMatch[0].replace(/\{/, '{ StyleSheet, ').replace(/,\s*,/, ',');
        return content.replace(importMatch[0], newImport);
      }
      return null;
    },
  },

  /* ──────────────────────────────
     Colors import 누락 시 추가
  ────────────────────────────── */
  {
    id: 'colors-import',
    group: 'STYLE',
    desc: 'Colors 사용하지만 import 없으면 자동 추가',
    canAuto: true,
    files: [
      'src/components/TickerRow.tsx',
      'src/components/MarketStrip.tsx',
      'src/components/FuturesBigCard.tsx',
      'src/components/FuturesGrid.tsx',
      'src/components/Sparkline.tsx',
      'src/screens/WatchlistScreen.tsx',
      'src/screens/FuturesScreen.tsx',
      'src/screens/AlertsScreen.tsx',
      'src/screens/HistoryScreen.tsx',
    ],
    transform(content, filePath) {
      if (!content.includes('Colors')) return null;
      if (content.includes("from '../theme/tokens'") ||
          content.includes("from '../../theme/tokens'") ||
          content.includes("from './tokens'")) return null;

      const depth = filePath.split('/').length - 1;
      const rel   = depth <= 2 ? '../theme/tokens' : '../../theme/tokens';
      const line  = `import { Colors, FontFamily, fmtPrice, fmtRate } from '${rel}';\n`;

      // 첫 번째 import 라인 뒤에 추가
      const firstImport = content.indexOf('import ');
      if (firstImport === -1) return line + content;

      const endOfLine = content.indexOf('\n', firstImport);
      return content.slice(0, endOfLine + 1) + line + content.slice(endOfLine + 1);
    },
  },

  /* ──────────────────────────────
     JSON.parse/stringify 누락 확인 (안내만)
  ────────────────────────────── */
  {
    id: 'json-serialize',
    group: 'STORAGE',
    desc: 'AsyncStorage 사용 시 JSON.stringify/parse 누락',
    canAuto: false,
    files: [
      'src/hooks/useWatchlist.ts',
      'src/hooks/useAlerts.ts',
      'src/hooks/useHistory.ts',
    ],
    manual: `AsyncStorage는 string만 저장 가능합니다.
배열·객체 저장 시 반드시 JSON.stringify/parse 처리:

  // 저장
  await AsyncStorage.setItem('sm_watchlist', JSON.stringify(tickers));

  // 불러오기
  const raw = await AsyncStorage.getItem('sm_watchlist');
  const tickers = raw ? JSON.parse(raw) : [];`,
  },

  /* ──────────────────────────────
     useFocusEffect 폴링 패턴 (안내만)
  ────────────────────────────── */
  {
    id: 'focus-effect-polling',
    group: 'POLLING',
    desc: 'useFocusEffect 포그라운드 폴링 패턴 누락',
    canAuto: false,
    files: [
      'src/screens/WatchlistScreen.tsx',
      'src/screens/FuturesScreen.tsx',
    ],
    manual: `포그라운드에서만 폴링하려면 useFocusEffect를 사용하세요:

  import { useFocusEffect } from '@react-navigation/native';
  import { useCallback, useRef } from 'react';

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useFocusEffect(
    useCallback(() => {
      intervalRef.current = setInterval(async () => {
        const data = await fetchPrice(ticker);
        if (data) setPrice(data);
      }, 5000); // Futures는 60000

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [ticker])
  );`,
  },

  /* ──────────────────────────────
     60분 쿨다운 패턴 (안내만)
  ────────────────────────────── */
  {
    id: 'cooldown-pattern',
    group: 'NOTIFICATIONS',
    desc: '알림 60분 쿨다운 Map 패턴 누락',
    canAuto: false,
    files: [
      'src/notifications/alertNotify.ts',
      'src/hooks/useAlerts.ts',
    ],
    manual: `같은 알림이 60분 내에 재발동되지 않도록 Map으로 관리하세요:

  const cooldownMap = new Map<string, number>(); // alertId → timestamp

  function isOnCooldown(alertId: string): boolean {
    const last = cooldownMap.get(alertId);
    if (!last) return false;
    return Date.now() - last < 60 * 60 * 1000; // 60분
  }

  function markCooldown(alertId: string) {
    cooldownMap.set(alertId, Date.now());
  }

  // 알림 발송 시
  if (!isOnCooldown(alert.id)) {
    await sendAlert(title, body);
    markCooldown(alert.id);
  }`,
  },

  /* ──────────────────────────────
     SafeAreaView 누락 (안내만)
  ────────────────────────────── */
  {
    id: 'safe-area',
    group: 'UI',
    desc: 'SafeAreaView 누락 — 노치/홈바 영역 처리',
    canAuto: false,
    files: ['src/screens/WatchlistScreen.tsx'],
    manual: `화면 루트를 SafeAreaView로 감싸고 StatusBar를 설정하세요:

  import { SafeAreaView, StatusBar } from 'react-native';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      {/* 내용 */}
    </SafeAreaView>
  );`,
  },

  /* ──────────────────────────────
     Expo Notifications 초기화 (안내만)
  ────────────────────────────── */
  {
    id: 'notifications-setup',
    group: 'NOTIFICATIONS',
    desc: 'expo-notifications App.tsx 초기화 코드 확인',
    canAuto: false,
    files: ['App.tsx'],
    manual: `App.tsx에서 알림 핸들러를 초기화하세요:

  import * as Notifications from 'expo-notifications';

  // 앱 상단 (컴포넌트 밖)
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge:  true,
    }),
  });`,
  },

];

/* ════════════════════════════════
   APPLY ENGINE
════════════════════════════════ */
function applyFix(fix, filePath, dryRun) {
  const absPath = path.join(process.cwd(), filePath);
  const exists  = fs.existsSync(absPath);

  // 파일 생성 fix
  if (fix.createIfMissing) {
    if (exists) return { status: 'skip', msg: '이미 존재' };
    const content = fix.template();
    if (!dryRun) {
      fs.mkdirSync(path.dirname(absPath), { recursive: true });
      fs.writeFileSync(absPath, content, 'utf8');
    }
    return { status: 'created', content, msg: '파일 생성됨' };
  }

  // 파일 없으면 skip
  if (!exists) return { status: 'locked', msg: '파일 없음 — 먼저 생성 필요' };

  const before = fs.readFileSync(absPath, 'utf8');

  // 자동 수정
  if (fix.canAuto && fix.transform) {
    const after = fix.transform(before, filePath);
    if (!after) return { status: 'ok', msg: '수정 불필요' };
    if (!dryRun) {
      fs.writeFileSync(absPath + '.bak', before, 'utf8'); // 백업
      fs.writeFileSync(absPath, after, 'utf8');
    }
    return { status: 'fixed', before, after, msg: dryRun ? '(dry-run) 수정 예정' : '수정 완료 (.bak 백업 생성)' };
  }

  return { status: 'skip', msg: '수정 불필요 (이미 OK)' };
}

/* ════════════════════════════════
   MANUAL GUIDANCE CHECK
════════════════════════════════ */
function checkNeedsManual(fix, filePath) {
  if (fix.canAuto) return false;
  const absPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(absPath)) return false;
  const content = fs.readFileSync(absPath, 'utf8');

  // 수동 안내가 필요한지 각 fix별로 판단
  switch (fix.id) {
    case 'json-serialize':
      return content.includes('AsyncStorage') &&
             (!content.includes('JSON.parse') || !content.includes('JSON.stringify'));
    case 'focus-effect-polling':
      return !content.includes('useFocusEffect') && content.includes('setInterval');
    case 'cooldown-pattern':
      return !content.includes('cooldown') && !content.includes('3600000') &&
             (content.includes('checkAlerts') || content.includes('Notification'));
    case 'safe-area':
      return !content.includes('SafeAreaView');
    case 'notifications-setup':
      return content.includes('Notifications') && !content.includes('setNotificationHandler');
    default:
      return false;
  }
}

/* ════════════════════════════════
   MAIN
════════════════════════════════ */
function main() {
  console.log('');
  console.log(c('amber', bold('  ◆ WATCHR MOBILE — AUTO FIXER')));
  console.log(c('gray',  `  ${'═'.repeat(62)}`));

  if (DRY_RUN) {
    console.log(c('amber', '  모드: DRY-RUN (미리보기만 — 파일 변경 없음)'));
    console.log(c('gray',  '  실제 수정하려면: node fix.js --apply'));
  } else {
    console.log(c('green', '  모드: APPLY (실제 수정 + .bak 백업 생성)'));
  }
  if (FILE_ONLY) {
    console.log(c('teal', `  대상 파일: ${FILE_ONLY}`));
  }
  console.log(c('gray', `  ${'─'.repeat(62)}`));
  console.log('');

  const stats = { fixed: 0, created: 0, skipped: 0, locked: 0, manual: 0 };
  let lastGroup = null;

  for (const fix of FIXES) {
    // 그룹 헤더
    if (fix.group !== lastGroup) {
      if (lastGroup !== null) console.log('');
      console.log(c('teal', `  ┌─ ${fix.group} ${'─'.repeat(Math.max(0, 55 - fix.group.length))}┐`));
      lastGroup = fix.group;
    }

    const targetFiles = FILE_ONLY
      ? fix.files.filter(f => f === FILE_ONLY || f.endsWith(FILE_ONLY))
      : fix.files;

    if (targetFiles.length === 0) continue;

    console.log(`  │  ${c('purple', bold(fix.desc))}`);

    let anyAction = false;

    for (const filePath of targetFiles) {
      const result = fix.canAuto || fix.createIfMissing
        ? applyFix(fix, filePath, DRY_RUN)
        : { status: 'manual' };

      // 수동 안내 필요 여부
      const needsManual = !fix.canAuto && !fix.createIfMissing
        ? checkNeedsManual(fix, filePath)
        : false;

      switch (result.status) {
        case 'created':
          console.log(`  │    ${c('green', '+')}  ${c('green', filePath)} — ${result.msg}`);
          if (result.content) {
            const preview = result.content.split('\n').slice(0, 4).map(l => `  │      ${c('gray', l)}`).join('\n');
            console.log(preview);
            console.log(c('gray', `  │      ...`));
          }
          stats.created++;
          anyAction = true;
          break;

        case 'fixed':
          console.log(`  │    ${DRY_RUN ? c('amber', '~') : c('green', '✓')}  ${c('white', filePath)} — ${c(DRY_RUN ? 'amber' : 'green', result.msg)}`);
          printDiff(result.before, result.after, filePath);
          stats.fixed++;
          anyAction = true;
          break;

        case 'locked':
          console.log(`  │    ${c('red', '🔒')} ${c('gray', filePath)} — ${c('red', result.msg)}`);
          stats.locked++;
          anyAction = true;
          break;

        case 'ok':
        case 'skip':
          // 조용히 넘김 (이미 OK인 파일은 출력 최소화)
          stats.skipped++;
          break;

        case 'manual':
          if (needsManual) {
            console.log(`  │    ${c('amber', '!')}  ${c('white', filePath)} — ${c('amber', '수동 수정 필요')}`);
            stats.manual++;
            anyAction = true;
          } else {
            stats.skipped++;
          }
          break;
      }
    }

    // 수동 안내 블록 출력
    if (!fix.canAuto && fix.manual) {
      const hasAnyManual = targetFiles.some(f => checkNeedsManual(fix, f));
      if (hasAnyManual) {
        console.log(c('amber', `  │`));
        console.log(c('amber', `  │    ┌── 수동 수정 가이드`));
        const guideLines = fix.manual.split('\n');
        for (const line of guideLines) {
          console.log(c('amber', `  │    │  `) + c('gray', line));
        }
        console.log(c('amber', `  │    └──────────────────────────────────────`));
      }
    }

    if (!anyAction && !FILE_ONLY) {
      console.log(c('gray', `  │    ${dim('(해당 파일 전부 OK)')}`));
    }
  }

  console.log(c('teal', `  └${'─'.repeat(62)}┘`));

  /* SUMMARY */
  console.log('');
  console.log(c('gray', `  ${'═'.repeat(62)}`));
  console.log(c('amber', bold('  ◆ FIX SUMMARY')));
  console.log(c('gray', `  ${'─'.repeat(62)}`));

  if (DRY_RUN) {
    console.log(`  ${c('amber', `수정 예정    ${stats.fixed}개`)}   ${c('green', `생성 예정    ${stats.created}개`)}   ${c('red', `수동 필요    ${stats.manual}개`)}   ${c('gray', `LOCKED    ${stats.locked}개`)}`);
    console.log('');
    if (stats.fixed > 0 || stats.created > 0) {
      console.log(c('amber', `  실제 적용하려면: ${bold('node fix.js --apply')}`));
    } else if (stats.manual > 0) {
      console.log(c('amber', `  자동 수정 가능한 항목 없음 — 위 가이드를 참고해 수동 수정`));
    } else {
      console.log(c('green', `  수정할 항목 없음 — 코드가 스펙에 맞습니다 ✓`));
    }
  } else {
    console.log(`  ${c('green', `수정 완료    ${stats.fixed}개`)}   ${c('green', `파일 생성    ${stats.created}개`)}   ${c('red', `수동 필요    ${stats.manual}개`)}   ${c('gray', `LOCKED    ${stats.locked}개`)}`);
    console.log('');
    if (stats.fixed > 0 || stats.created > 0) {
      console.log(c('green', `  백업 파일: .bak 확장자로 원본 보관됨`));
      console.log(c('teal',  `  변경 후 검사 재실행: ${bold('node inspect.js')}`));
    }
    if (stats.manual > 0) {
      console.log(c('amber', `  수동 수정 ${stats.manual}개 — 위 가이드를 참고해 직접 수정 후 inspect.js 재실행`));
    }
  }

  console.log(c('gray', `  ${'═'.repeat(62)}`));
  console.log('');
}

main();
