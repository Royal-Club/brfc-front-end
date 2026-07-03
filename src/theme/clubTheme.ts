import type { CSSProperties } from 'react';

// BRFC club identity — derived from the crest (deep navy + champagne gold).
// Shared app-wide so every view reads as one football-club product.
export const club = {
  navy: '#14213D',
  navyDeep: '#0E1830',
  navySoft: '#1B2A4A',
  gold: '#C6A15B',
  goldSoft: '#D8BC84',
  // Broadcast-style surfaces
  panel: 'linear-gradient(160deg, #1B2A4A 0%, #14213D 55%, #0E1830 100%)',
  panelBorder: 'rgba(198, 161, 91, 0.28)',
  pitch: '#2E9E5B',
  // Surfaces that read on the navy panel
  tileBg: 'rgba(255, 255, 255, 0.04)',
  tileBorder: '1px solid rgba(255, 255, 255, 0.09)',
  textPrimary: '#F5F7FA',
  textMuted: 'rgba(245, 247, 250, 0.62)',
};

// Uppercase, tracked "broadcast label" used on stat tiles.
export const kicker: CSSProperties = {
  textTransform: 'uppercase',
  letterSpacing: 1.4,
  fontWeight: 700,
  fontSize: 11,
};

// Tabular figures so numbers line up like a scoreboard.
export const scoreNum: CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"tnum"',
};
