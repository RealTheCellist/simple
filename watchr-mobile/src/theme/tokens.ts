// src/theme/tokens.ts
export const Colors = {
  bg: '#07090d',
  bg1: '#0c1018',
  bg2: '#111621',
  bg3: '#161d2c',
  line: '#1e2840',
  line2: '#283350',
  t0: '#e8edf8',
  t1: '#9aabc8',
  t2: '#4d6082',
  t3: '#2a3a58',
  up: '#ff3b47',
  upGlow: 'rgba(255,59,71,.15)',
  dn: '#2b7fff',
  dnGlow: 'rgba(43,127,255,.15)',
  amber: '#f5a623',
  teal: '#00d4aa',
} as const;
export const FontFamily = {
  mono: 'IBMPlexMono_500Medium',
  monoSemiBold: 'IBMPlexMono_600SemiBold',
  sans: 'NotoSansKR_400Regular',
  sansMedium: 'NotoSansKR_500Medium',
  sansBold: 'NotoSansKR_700Bold',
};

export const fmtPrice = (n: number): string =>
  n.toLocaleString('ko-KR');

export const fmtRate = (r: number): string =>
  (r >= 0 ? '+' : '') + r.toFixed(2) + '%';
