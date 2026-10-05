// ============================================================================
// PENZUGYI SORSFORDITO - Game Data Exports
// Összegyűjti az összes tartalmi adatot
// ============================================================================

// Élethelyzet presetek
export {
  LIFE_SITUATION_PRESETS,
  CHARACTER_PRESETS,
  FREE_PRESETS,
  PREMIUM_PRESETS,
  PRESETS_BY_DIFFICULTY,
} from './character-presets';

// Befektetési lehetőségek
export { INVESTMENT_OPTIONS } from './investment-options';

// Tudás kártyák
export { KNOWLEDGE_CARDS } from './knowledge-cards';

// Epilógusok
export { EPILOGUE_CARDS, determineEpilogue } from './epilogues';

// Mock gazdasági adatok
export {
  MOCK_ECONOMIC_DATA_2026_Q1,
  MOCK_NEWS_EVENTS,
} from './mock-economic-data';

// Döntések és sorsfordítók
export {
  getDecisionsFor,
  getDecisionForRound,
  getScriptedFateEvents,
  getFateEventForRound,
  getContentStats,
} from './decisions';
