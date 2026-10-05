// ============================================================================
// API Route: /api/data/pregame
// A heti élő adatcsomagból (src/data/live/heti.json) épített játékkezdő kontextus.
// Statikus export: build időben fut, a heti rutin újrabuildeléssel frissíti.
// ============================================================================

import { NextResponse } from 'next/server';
import { livePreGameContext } from '@/data/live';

export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: livePreGameContext(),
  });
}
