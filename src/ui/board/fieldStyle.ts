import type { FieldType } from '@/data/board';

// A dizájnvászon (Claude Design) "Stílusalapok" artboardjának mezőszínei és betűjelei.
// A betűjel miatt a típusok színtévesztéssel is megkülönböztethetők.
export const FIELD_STYLE: Record<FieldType, { color: string; ink: string; glyph: string }> = {
  payday: { color: '#F2A33A', ink: '#0E1525', glyph: 'Ft' },
  decision: { color: '#3B82D6', ink: '#FFFFFF', glyph: 'D' },
  market_news: { color: '#E07A2E', ink: '#0E1525', glyph: 'P' },
  temptation: { color: '#148F93', ink: '#FFFFFF', glyph: 'K' },
  investment: { color: '#25865A', ink: '#FFFFFF', glyph: 'B' },
  fate: { color: '#C93C30', ink: '#FFFFFF', glyph: 'S' },
  knowledge: { color: '#E8B730', ink: '#0E1525', glyph: 'T' },
  trap: { color: '#1A1A1A', ink: '#F2A33A', glyph: '!' },
  encounter: { color: '#6F7D2C', ink: '#FFFFFF', glyph: 'Ta' },
  office: { color: '#4F6378', ink: '#FFFFFF', glyph: '§' },
  recharge: { color: '#3FC795', ink: '#0E1525', glyph: '+' },
};

export const BOARD_PAPER = '#E9DFC8';
