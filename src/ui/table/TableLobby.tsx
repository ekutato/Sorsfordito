'use client';

import { useEffect, useState } from 'react';
import { useTableStore, inviteLink } from '@/store/table-store';
import { useSettingsStore } from '@/store/settings-store';
import { PRESETS_BY_DIFFICULTY } from '@/data/character-presets';
import { TIME_SCALE_CONFIGS, type TimeScale } from '@/types/game';
import { MAX_PLAYERS } from '@/engine/table/state';
import { formatHUF } from '@/engine/financial-calculator';
import { ConnectionBanner } from './TableBar';

const SCALES: TimeScale[] = ['sprint', 'marathon', 'ultra'];

/** Belépés: szoba nyitása vagy csatlakozás kóddal / meghívólinkkel */
export function TableEntry({ initialCode, onBack }: { initialCode?: string; onBack: () => void }) {
  const { createRoom, joinRoom, status, error } = useTableStore();
  const [name, setName] = useState('');
  const [code, setCode] = useState(initialCode ?? '');
  const busy = status === 'connecting';
  const nameOk = name.trim().length >= 2;
  return (
    <div className="flex-1 flex flex-col px-6 py-8 space-y-6">
      <div>
        <button onClick={onBack} className="text-sm text-[var(--color-text-muted)] underline">← Vissza</button>
        <h1 className="text-2xl font-extrabold mt-3">Asztali játék társasággal</h1>
        <p className="text-base text-[var(--color-text-muted)] mt-1">2-{MAX_PLAYERS} fő, egy asztalnál vagy távolról. Mindenki a saját telefonján játszik, a körök együtt haladnak.</p>
      </div>
      <label className="block">
        <span className="text-sm font-semibold">A neved</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder="pl. Anna"
          className="mt-1 w-full bg-[var(--color-bg-card)] border border-white/10 rounded-xl px-4 py-3 text-lg" />
      </label>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <h2 className="text-lg font-bold">Csatlakozom egy szobához</h2>
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))}
          placeholder="Szobakód (4 betű)" aria-label="Szobakód" inputMode="text" autoCapitalize="characters"
          className="w-full bg-[var(--color-bg)] border border-white/10 rounded-xl px-4 py-3 text-2xl font-mono tracking-[0.4em] text-center uppercase" />
        <button disabled={!nameOk || code.length !== 4 || busy} onClick={() => joinRoom(code, name.trim())}
          className="w-full h-12 rounded-xl text-base font-extrabold disabled:opacity-40" style={{ background: '#F2A33A', color: '#0E1525' }}>
          {busy ? 'Kapcsolódás…' : 'Csatlakozom'}
        </button>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <h2 className="text-lg font-bold">Én nyitom a szobát</h2>
        <p className="text-sm text-[var(--color-text-muted)]">A te telefonod lesz az asztal: a szabályokat (Játékmesteri beállítások) te állítod, és a te telefonodnak nyitva kell maradnia a játék alatt.</p>
        <button disabled={!nameOk || busy} onClick={() => createRoom(name.trim(), { rules: useSettingsStore.getState().rules() })}
          className="w-full h-12 rounded-xl text-base font-bold border border-white/20 bg-white/10 disabled:opacity-40">
          Szobát nyitok
        </button>
      </div>
      {error && <p role="alert" className="text-base text-rose-300">{error}</p>}
    </div>
  );
}

/** Karakterválasztó (a lobbyban és a késői csatlakozásnál) */
export function CharacterPicker({ selected, onPick }: { selected?: string; onPick: (id: string) => void }) {
  return (
    <div className="space-y-2">
      {PRESETS_BY_DIFFICULTY.map((p) => (
        <button key={p.id} onClick={() => onPick(p.id)} aria-pressed={selected === p.id}
          className={`w-full text-left rounded-xl border px-4 py-3 ${selected === p.id ? 'border-amber-400 bg-amber-400/10' : 'border-white/10 bg-white/5'}`}>
          <span className="text-base font-semibold">{p.avatar} {p.name} ({p.age} év)</span>
          <span className="block text-sm text-[var(--color-text-muted)]">Kezdő egyenleg: {formatHUF(p.startingFinancials.balance)}</span>
        </button>
      ))}
    </div>
  );
}

/** Játék közben érkezett játékos: karakterválasztás, aztán indul a saját játéka */
export function LateJoin() {
  const { table, setProfile, leave } = useTableStore();
  if (!table) return null;
  return (
    <div className="flex-1 flex flex-col px-5 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">A játék már elindult</h1>
        <p className="text-base text-[var(--color-text-muted)] mt-1">
          Asztal {table.roomCode} · a többiek a {table.round}. fordulónál tartanak. Válassz karaktert: a saját tempódban, az 1. körtől játszol, és a ranglistán veled együtt mérjük az eredményt.
        </p>
      </div>
      <CharacterPicker onPick={setProfile} />
      <ConnectionBanner />
      <button onClick={leave} className="text-sm underline text-[var(--color-text-muted)]">Kilépek a szobából</button>
    </div>
  );
}

/** A szoba nem fogadta a belépést (megtelt vagy véget ért) */
export function NotAdmitted() {
  const { table, leave } = useTableStore();
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-4 text-center">
      <h1 className="text-xl font-extrabold">Nem sikerült beszállni</h1>
      <p className="text-base text-[var(--color-text-muted)]">
        {table?.phase === 'finished' ? 'Ez a játék már véget ért.' : 'A szoba megtelt (legfeljebb 10 fő).'} Kérj új szobakódot a játékvezetőtől.
      </p>
      <button onClick={leave} className="h-12 px-6 rounded-xl text-base font-bold" style={{ background: '#F2A33A', color: '#0E1525' }}>Kilépek</button>
    </div>
  );
}

/** Váróterem: kód, meghívás, játékosok, karakterválasztás, indítás */
export function TableLobby() {
  const { table, role, playerId, roomCode, setProfile, configure, start, leave, error } = useTableStore();
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (copied) { const t = setTimeout(() => setCopied(false), 2000); return () => clearTimeout(t); } }, [copied]);
  if (!table || !roomCode) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 text-center">
        <p className="text-lg">{role === 'host' ? 'Szoba nyitása…' : 'Csatlakozás a szobához…'}</p>
        <div className="w-full max-w-sm"><ConnectionBanner /></div>
        {error && <p className="text-sm text-[var(--color-text-muted)]">{error}</p>}
        <button onClick={leave} className="text-sm underline text-[var(--color-text-muted)]">Mégse</button>
      </div>
    );
  }
  const me = table.players.find((p) => p.id === playerId);
  const isHost = role === 'host';
  const link = inviteLink(roomCode);
  const allReady = table.players.length >= 1 && table.players.every((p) => p.profileId);
  const scale = table.config.timeScale ?? 'sprint';
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'Pénzügyi Sorsfordító', text: `Csatlakozz a játékhoz! Szobakód: ${roomCode}`, url: link });
      else { await navigator.clipboard.writeText(link); setCopied(true); }
    } catch { /* megszakítva */ }
  };
  return (
    <div className="flex-1 flex flex-col px-5 py-6 space-y-5">
      <div className="text-center space-y-1">
        <p className="text-sm text-[var(--color-text-muted)]">Szobakód</p>
        <p className="text-5xl font-mono font-extrabold tracking-[0.3em]" aria-label={`Szobakód: ${roomCode.split('').join(' ')}`}>{roomCode}</p>
        <button onClick={share} className="mt-2 h-11 px-4 rounded-xl text-base font-semibold border border-white/15 bg-white/5">
          {copied ? 'Link kimásolva ✓' : 'Meghívó küldése'}
        </button>
        <p className="text-xs text-[var(--color-text-muted)] break-all">{link}</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">Játékosok ({table.players.length}/{MAX_PLAYERS})</h2>
        <ul className="space-y-1.5">
          {table.players.map((p) => {
            const prof = PRESETS_BY_DIFFICULTY.find((x) => x.id === p.profileId);
            return (
              <li key={p.id} className="flex items-center gap-3 rounded-xl px-3 py-2 bg-white/5">
                <span className="w-4 h-4 rounded-full shrink-0" style={{ background: p.color }} />
                <span className="flex-1 text-base font-semibold">{p.name}{p.id === table.hostId ? ' (asztal)' : ''}{p.id === playerId ? ' - te' : ''}</span>
                <span className="text-sm text-[var(--color-text-muted)]">{prof ? `${prof.avatar} ${prof.name}` : 'választ…'}</span>
                {!p.connected && <span className="text-xs text-rose-300">kiesett</span>}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">A karaktered</h2>
        <CharacterPicker selected={me?.profileId} onPick={setProfile} />
      </section>

      {isHost ? (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">Időtáv</h2>
          <div className="grid grid-cols-3 gap-2">
            {SCALES.map((t) => (
              <button key={t} onClick={() => configure({ timeScale: t, totalRounds: TIME_SCALE_CONFIGS[t].totalRounds, monthsPerRound: TIME_SCALE_CONFIGS[t].monthsPerRound })}
                className={`h-12 rounded-xl text-sm font-bold border ${scale === t ? 'border-amber-400 bg-amber-400/15' : 'border-white/10 bg-white/5'}`}>
                {TIME_SCALE_CONFIGS[t].displayName}
              </button>
            ))}
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">{TIME_SCALE_CONFIGS[scale].totalRounds} forduló. A szabályok a Játékmesteri beállításaid szerint mindenkire ugyanazok.</p>
          {table.players.length === 1 && allReady && (
            <p className="text-sm rounded-lg px-3 py-2" style={{ background: '#FEF3C7', color: '#1C1A16' }}>
              Egyelőre egyedül vagy. Ha most indítasz, a többiek később is beszállhatnak a kóddal, és a saját tempójukban, az 1. körtől játszanak.
            </p>
          )}
          <button onClick={() => { if (!table.config.timeScale) configure({ timeScale: scale, totalRounds: TIME_SCALE_CONFIGS[scale].totalRounds, monthsPerRound: TIME_SCALE_CONFIGS[scale].monthsPerRound }); start(); }}
            disabled={!allReady}
            className={`w-full h-14 rounded-2xl text-lg font-extrabold disabled:opacity-40 ${allReady ? 'pulse-cta' : ''}`} style={{ background: '#F2A33A', color: '#0E1525' }}>
            {!allReady ? 'Mindenki válasszon karaktert' : table.players.length === 1 ? 'Indítás egyedül' : `Indítás (${table.players.length} játékos)`}
          </button>
        </section>
      ) : (
        <p className="text-base text-center text-[var(--color-text-muted)]">Várunk, hogy a szobát nyitó játékos elindítsa a játékot…</p>
      )}

      <ConnectionBanner />
      <button onClick={leave} className="text-sm underline text-[var(--color-text-muted)]">Kilépek a szobából</button>
    </div>
  );
}
