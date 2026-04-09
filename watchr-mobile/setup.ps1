# ============================================================
#  WATCHR Mobile — Auto Setup & Fix Script
#  사용법: PowerShell 터미널에서 .\setup.ps1 실행
#  기능:  폴더 생성 → 빈 파일 생성 → 코드 자동 수정
# ============================================================

# PowerShell 5.x 이상 필요. 실행 정책 오류 시:
# Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# ── 색상 헬퍼 ──────────────────────────────────────────────
function Write-Step  ($msg) { Write-Host "`n  ◆ $msg" -ForegroundColor Cyan }
function Write-Ok    ($msg) { Write-Host "    ✓  $msg" -ForegroundColor Green }
function Write-Skip  ($msg) { Write-Host "    -  $msg" -ForegroundColor DarkGray }
function Write-Warn  ($msg) { Write-Host "    !  $msg" -ForegroundColor Yellow }
function Write-Fail  ($msg) { Write-Host "    ✗  $msg" -ForegroundColor Red }
function Write-Info  ($msg) { Write-Host "       $msg" -ForegroundColor DarkCyan }
function Write-Line       { Write-Host "  $('─' * 60)" -ForegroundColor DarkGray }

# ── 파일 생성 헬퍼 (존재하면 건너뜀) ─────────────────────
function New-EmptyFile ($RelPath) {
    $FullPath = Join-Path $PWD $RelPath
    if (Test-Path $FullPath) {
        Write-Skip $RelPath
    } else {
        $null = New-Item -ItemType File -Force -Path $FullPath
        Write-Ok "생성: $RelPath"
    }
}

# ── 폴더 생성 헬퍼 ────────────────────────────────────────
function New-Dir ($RelPath) {
    $FullPath = Join-Path $PWD $RelPath
    if (Test-Path $FullPath) {
        Write-Skip "$RelPath (이미 있음)"
    } else {
        $null = New-Item -ItemType Directory -Force -Path $FullPath
        Write-Ok "폴더: $RelPath"
    }
}

# ── 파일에 내용 쓰기 헬퍼 (이미 내용 있으면 건너뜀) ──────
function Set-FileContent ($RelPath, $Content) {
    $FullPath = Join-Path $PWD $RelPath
    if (-not (Test-Path $FullPath)) {
        Write-Warn "$RelPath 파일 없음 — 먼저 파일을 생성하세요"
        return
    }
    $existing = Get-Content $FullPath -Raw -ErrorAction SilentlyContinue
    if ($existing -and $existing.Trim().Length -gt 0) {
        Write-Skip "$RelPath (내용 있음 — 덮어쓰기 건너뜀)"
        return
    }
    Set-Content -Path $FullPath -Value $Content -Encoding UTF8
    Write-Ok "내용 작성: $RelPath"
}

# ── 코드 내 문자열 치환 헬퍼 ─────────────────────────────
function Update-FileContent ($RelPath, $FindStr, $ReplaceStr, $Description) {
    $FullPath = Join-Path $PWD $RelPath
    if (-not (Test-Path $FullPath)) { return }
    $content = Get-Content $FullPath -Raw -Encoding UTF8
    if ($null -eq $content) { return }
    if ($content -notmatch [regex]::Escape($FindStr)) { return }
    $newContent = $content -replace [regex]::Escape($FindStr), $ReplaceStr
    Set-Content -Path $FullPath -Value $newContent -Encoding UTF8 -NoNewline
    Write-Ok "수정: $RelPath — $Description"
}

# ── 파일에 특정 패턴 없으면 맨 앞에 줄 추가 ──────────────
function Add-ImportIfMissing ($RelPath, $Pattern, $ImportLine) {
    $FullPath = Join-Path $PWD $RelPath
    if (-not (Test-Path $FullPath)) { return }
    $content = Get-Content $FullPath -Raw -Encoding UTF8
    if ($null -eq $content -or $content.Trim().Length -eq 0) { return }
    if ($content -match [regex]::Escape($Pattern)) { return }
    $newContent = $ImportLine + "`n" + $content
    Set-Content -Path $FullPath -Value $newContent -Encoding UTF8 -NoNewline
    Write-Ok "import 추가: $RelPath"
}

# ══════════════════════════════════════════════════════════
Write-Host ""
Write-Host "  ◆ WATCHR MOBILE — AUTO SETUP & FIX" -ForegroundColor Yellow
Write-Host "  $('═' * 60)" -ForegroundColor DarkGray
Write-Host "  실행 경로: $PWD" -ForegroundColor DarkGray
Write-Host "  $('═' * 60)" -ForegroundColor DarkGray

# ══════════════════════════════════════════════════════════
#  PHASE 1 — 폴더 구조 생성
# ══════════════════════════════════════════════════════════
Write-Step "PHASE 1 — 폴더 구조 생성"
Write-Line

New-Dir "src"
New-Dir "src\screens"
New-Dir "src\components"
New-Dir "src\hooks"
New-Dir "src\api"
New-Dir "src\notifications"
New-Dir "src\theme"

# ══════════════════════════════════════════════════════════
#  PHASE 2 — 빈 파일 생성
# ══════════════════════════════════════════════════════════
Write-Step "PHASE 2 — 파일 생성 (존재하는 파일은 건너뜀)"
Write-Line

New-EmptyFile ".clinerules"
New-EmptyFile ".env"
New-EmptyFile "src\theme\tokens.ts"
New-EmptyFile "src\api\client.ts"
New-EmptyFile "src\screens\WatchlistScreen.tsx"
New-EmptyFile "src\screens\FuturesScreen.tsx"
New-EmptyFile "src\screens\AlertsScreen.tsx"
New-EmptyFile "src\screens\HistoryScreen.tsx"
New-EmptyFile "src\components\MarketStrip.tsx"
New-EmptyFile "src\components\TickerRow.tsx"
New-EmptyFile "src\components\Sparkline.tsx"
New-EmptyFile "src\components\FuturesBigCard.tsx"
New-EmptyFile "src\components\FuturesGrid.tsx"
New-EmptyFile "src\hooks\useWatchlist.ts"
New-EmptyFile "src\hooks\useAlerts.ts"
New-EmptyFile "src\hooks\useHistory.ts"
New-EmptyFile "src\notifications\alertNotify.ts"

# ══════════════════════════════════════════════════════════
#  PHASE 3 — 기본 파일 내용 자동 작성 (비어있는 파일만)
# ══════════════════════════════════════════════════════════
Write-Step "PHASE 3 — 기본 내용 자동 작성 (비어있는 파일만)"
Write-Line

# ── .clinerules ──
Set-FileContent ".clinerules" @"
# WATCHR MOBILE — React Native + Expo SDK 53
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
"@

# ── .env ──
Set-FileContent ".env" @"
# WATCHR Mobile 환경변수
# 실기기 테스트 시 아래 IP를 본인 PC의 실제 IP로 변경
# PC IP 확인: PowerShell에서 ipconfig 실행 후 IPv4 주소 확인
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
"@

# ══════════════════════════════════════════════════════════
#  PHASE 4 — 코드 자동 수정
#  (이미 코드가 작성된 파일에서 문제 패턴 자동 교정)
# ══════════════════════════════════════════════════════════
Write-Step "PHASE 4 — 코드 자동 수정"
Write-Line

# 수정 대상 파일 목록
$codeFiles = @(
    "src\hooks\useWatchlist.ts",
    "src\hooks\useAlerts.ts",
    "src\hooks\useHistory.ts",
    "src\screens\WatchlistScreen.tsx",
    "src\screens\AlertsScreen.tsx",
    "src\screens\HistoryScreen.tsx",
    "src\screens\FuturesScreen.tsx",
    "src\components\TickerRow.tsx",
    "src\components\MarketStrip.tsx",
    "src\components\FuturesBigCard.tsx",
    "src\components\FuturesGrid.tsx",
    "src\components\Sparkline.tsx",
    "src\notifications\alertNotify.ts"
)

Write-Info "[ localStorage → AsyncStorage 치환 ]"
foreach ($f in $codeFiles) {
    $fp = Join-Path $PWD $f
    if (-not (Test-Path $fp)) { continue }
    $c = Get-Content $fp -Raw -Encoding UTF8
    if ($null -eq $c -or $c -notmatch "localStorage") { continue }

    # import 추가
    if ($c -notmatch "AsyncStorage" -and $c -notmatch "@react-native-async-storage") {
        $c = "import AsyncStorage from '@react-native-async-storage/async-storage';`n" + $c
    }
    # getItem
    $c = $c -replace "localStorage\.getItem\(([^)]+)\)", 'await AsyncStorage.getItem($1)'
    # setItem
    $c = $c -replace "localStorage\.setItem\(([^,]+),\s*([^)]+)\)", 'await AsyncStorage.setItem($1, $2)'
    # removeItem
    $c = $c -replace "localStorage\.removeItem\(([^)]+)\)", 'await AsyncStorage.removeItem($1)'
    # clear
    $c = $c -replace "localStorage\.clear\(\)", 'await AsyncStorage.clear()'

    Set-Content -Path $fp -Value $c -Encoding UTF8 -NoNewline
    Write-Ok "localStorage 치환: $f"
}

Write-Info ""
Write-Info "[ new Notification() → expo-notifications 치환 ]"
$notifFiles = @(
    "src\notifications\alertNotify.ts",
    "src\hooks\useAlerts.ts",
    "src\screens\AlertsScreen.tsx"
)
foreach ($f in $notifFiles) {
    $fp = Join-Path $PWD $f
    if (-not (Test-Path $fp)) { continue }
    $c = Get-Content $fp -Raw -Encoding UTF8
    if ($null -eq $c -or $c -notmatch "new Notification\(") { continue }

    if ($c -notmatch "expo-notifications") {
        $c = "import * as Notifications from 'expo-notifications';`n" + $c
    }
    $c = $c -replace "new Notification\(([^,)]+)(?:,\s*\{[^}]*\})?\)", `
        "Notifications.scheduleNotificationAsync({ content: { title: `$1, sound: true }, trigger: null })"

    Set-Content -Path $fp -Value $c -Encoding UTF8 -NoNewline
    Write-Ok "Notification 치환: $f"
}

Write-Info ""
Write-Info "[ AsyncStorage 키에 sm_ prefix 추가 ]"
$keyMap = @{
    "'watchlist'" = "'sm_watchlist'"
    '"watchlist"' = '"sm_watchlist"'
    "'alerts'"    = "'sm_alerts'"
    '"alerts"'    = '"sm_alerts"'
    "'history'"   = "'sm_history'"
    '"history"'   = '"sm_history"'
}
$prefixFiles = @(
    "src\hooks\useWatchlist.ts",
    "src\hooks\useAlerts.ts",
    "src\hooks\useHistory.ts"
)
foreach ($f in $prefixFiles) {
    $fp = Join-Path $PWD $f
    if (-not (Test-Path $fp)) { continue }
    $c = Get-Content $fp -Raw -Encoding UTF8
    if ($null -eq $c) { continue }
    $changed = $false
    foreach ($key in $keyMap.Keys) {
        $val = $keyMap[$key]
        if ($c -match [regex]::Escape($val)) { continue }  # 이미 sm_ 있음
        if ($c -match [regex]::Escape($key)) {
            $c = $c -replace [regex]::Escape($key), $val
            $changed = $true
        }
    }
    if ($changed) {
        Set-Content -Path $fp -Value $c -Encoding UTF8 -NoNewline
        Write-Ok "키 prefix 추가: $f"
    }
}

Write-Info ""
Write-Info "[ Colors import 누락 시 자동 추가 ]"
$colorFiles = @(
    "src\components\TickerRow.tsx",
    "src\components\MarketStrip.tsx",
    "src\components\FuturesBigCard.tsx",
    "src\components\FuturesGrid.tsx",
    "src\components\Sparkline.tsx",
    "src\screens\WatchlistScreen.tsx",
    "src\screens\FuturesScreen.tsx",
    "src\screens\AlertsScreen.tsx",
    "src\screens\HistoryScreen.tsx"
)
foreach ($f in $colorFiles) {
    $fp = Join-Path $PWD $f
    if (-not (Test-Path $fp)) { continue }
    $c = Get-Content $fp -Raw -Encoding UTF8
    if ($null -eq $c -or $c.Trim().Length -eq 0) { continue }
    if ($c -notmatch "Colors") { continue }
    if ($c -match "from.*theme.tokens" -or $c -match "from.*tokens") { continue }

    $depth = ($f -split "\\").Count - 1
    $rel   = if ($depth -le 2) { "../theme/tokens" } else { "../../theme/tokens" }
    $line  = "import { Colors, FontFamily, fmtPrice, fmtRate } from '$rel';"
    $c     = $line + "`n" + $c
    Set-Content -Path $fp -Value $c -Encoding UTF8 -NoNewline
    Write-Ok "Colors import 추가: $f"
}

# ══════════════════════════════════════════════════════════
#  PHASE 5 — node fix.js 실행 (있으면)
# ══════════════════════════════════════════════════════════
Write-Step "PHASE 5 — node fix.js 추가 수정 실행"
Write-Line

$fixPath = Join-Path $PWD "fix.js"
if (Test-Path $fixPath) {
    Write-Info "fix.js 발견 → node fix.js --apply 실행"
    node fix.js --apply
} else {
    Write-Skip "fix.js 없음 — 건너뜀 (fix.js를 루트에 두면 추가 수정 가능)"
}

# ══════════════════════════════════════════════════════════
#  PHASE 6 — inspect.js 검사 실행 (있으면)
# ══════════════════════════════════════════════════════════
Write-Step "PHASE 6 — inspect.js 검사 실행"
Write-Line

$inspPath = Join-Path $PWD "inspect.js"
if (Test-Path $inspPath) {
    Write-Info "inspect.js 발견 → node inspect.js 실행"
    node inspect.js
} else {
    Write-Skip "inspect.js 없음 — 건너뜀"
}

# ══════════════════════════════════════════════════════════
#  완료
# ══════════════════════════════════════════════════════════
Write-Host ""
Write-Host "  $('═' * 60)" -ForegroundColor DarkGray
Write-Host "  ◆ 완료" -ForegroundColor Yellow
Write-Host "  $('─' * 60)" -ForegroundColor DarkGray
Write-Host "  다음 단계:" -ForegroundColor DarkCyan
Write-Host "    1. VS Code 탐색기에서 생성된 파일 확인" -ForegroundColor DarkCyan
Write-Host "    2. 각 파일을 열고 Continue.dev 프롬프트 입력" -ForegroundColor DarkCyan
Write-Host "    3. Apply → Ctrl+S 저장" -ForegroundColor DarkCyan
Write-Host "    4. npx expo start 로 앱 실행" -ForegroundColor DarkCyan
Write-Host "  $('═' * 60)" -ForegroundColor DarkGray
Write-Host ""
