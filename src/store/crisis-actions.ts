// Mínusz egyenleg: a bankszámla nem mehet mínuszba, ezért a kör végén a hiányt kötelező rendezni.
// A megoldások a játékos valós helyzetéhez igazodnak (CLAUDE.md 1., 4. és 8. szabály):
// - befektetés eladása, ha van;
// - családi segítség fiatalnak / otthon lakónak (jövedelem nélkül a szülők fedezik, egyébként 0%-os családi kölcsön);
// - személyi kölcsön csak rendszeres munkabérrel (a heti csomag MNB-s THM-jével, valódi hitelként);
// - végső eset: késedelem - a ki nem fizetett számla tartozássá válik, a késedelmi kamat a jegybanki alapkamat
//   (Ptk. 6:48. §, nem vállalkozás), és a pénzügyi stressz rontja az egyensúlyt és az egészséget.
import { useGameStore } from './game-store';
import { situationOfGame } from '@/engine/situation';
import { netMinimumWage } from '@/engine/employment';
import { makeDebt } from '@/engine/loans';
import { LIVE_DATA } from '@/data/live';
import { INVESTMENT_OPTIONS } from '@/data/investment-options';
import { formatHUF } from '@/engine/financial-calculator';
import type { GameState } from '@/types/game';

export interface CrisisChoice {
  id: 'sell' | 'family' | 'loan' | 'overdue';
  title: string;
  text: string;
  /** Mibe kerül / mi a következménye */
  consequence: string;
  available: boolean;
  /** Miért nem választható (ha nem) */
  reason?: string;
}

const roundUp = (n: number, step: number) => Math.ceil(n / step) * step;
const baseRate = () => LIVE_DATA.ertekek['mnb.baseRate']?.value ?? 0;
const loanThm = () => LIVE_DATA.ertekek['bank.personalLoanThm']?.value ?? 0;

/** Eladható pénzügyi befektetések (a vagyontárgy és a képzés nem) a legkisebbtől */
function sellable(game: GameState) {
  const sheet = game.players[game.activePlayerIndex].financialSheet;
  return sheet.investments
    .filter((i) => !i.optionId.startsWith('asset:') && !['inv-professional-cert', 'inv-language'].includes(i.optionId) && i.currentValue > 0)
    .sort((a, b) => a.currentValue - b.currentValue);
}

/** A hiány fedezéséhez eladandó befektetések */
function toSell(game: GameState, deficit: number) {
  const out: ReturnType<typeof sellable> = [];
  let sum = 0;
  for (const i of sellable(game)) { if (sum >= deficit) break; out.push(i); sum += i.currentValue; }
  return { list: out, sum };
}

export function crisisChoices(game: GameState): CrisisChoice[] {
  const sheet = game.players[game.activePlayerIndex].financialSheet;
  const deficit = Math.max(0, -sheet.balance);
  const s = situationOfGame(game);
  const sell = toSell(game, deficit);
  const noIncome = s.salary < netMinimumWage() / 2;
  const familyOk = s.livesWithParents || s.age < 26;
  const loanOk = s.employed && s.salary >= netMinimumWage() && !s.student;
  const principal = roundUp(deficit + 20_000, 10_000);
  return [
    {
      id: 'sell', title: 'Eladok egy befektetést',
      text: sell.list.length ? `Eladod: ${sell.list.map((i) => INVESTMENT_OPTIONS.find((o) => o.id === i.optionId)?.name ?? i.optionId).join(', ')} (mostani értéken ${formatHUF(sell.sum)}).` : 'Nincs eladható befektetésed.',
      consequence: 'A befektetés havi hozama is megszűnik. Ezért kell a vésztartalék: hogy ne rossz pillanatban kelljen eladni.',
      available: sell.sum >= deficit && deficit > 0,
      reason: sell.list.length ? 'A befektetéseid értéke nem fedezi a hiányt.' : 'Nincs eladható befektetésed.',
    },
    {
      id: 'family', title: noIncome ? 'A szüleid kisegítenek' : 'Kölcsönt kérsz a családtól',
      text: noIncome
        ? `Saját jövedelem nélkül a szüleid fedezik a ${formatHUF(deficit)} hiányt.`
        : `A család kölcsönad ${formatHUF(deficit)}-ot kamat nélkül, 12 havi részletben fizeted vissza.`,
      consequence: noIncome ? 'Nem kell visszafizetned, de a kiadásaidat érdemes átnézni: a hiány a következő hónapban is jöhet.' : `Havi ${formatHUF(Math.ceil(deficit / 12))} törlesztő, kamat nélkül.`,
      available: familyOk && deficit > 0,
      reason: 'Ebben az élethelyzetben nem a szülők a megoldás.',
    },
    {
      id: 'loan', title: 'Személyi kölcsönt veszel fel',
      text: `${formatHUF(principal)} személyi kölcsön 24 hónapra, a mostani átlagos THM-mel (${loanThm().toLocaleString('hu-HU')}%, MNB).`,
      consequence: 'Rendes hitel: havi törlesztő, kamat, és a hitel szorongással jár (egyensúly −1).',
      available: loanOk && deficit > 0,
      reason: 'A bank rendszeres munkabért kér (legalább a nettó minimálbért); diákként vagy jövedelem nélkül nem ad hitelt.',
    },
    {
      id: 'overdue', title: 'Késve fizetek (a számlák várnak)',
      text: `A ki nem fizetett ${formatHUF(deficit)} tartozássá válik: késedelmi kamat (a jegybanki alapkamat, most ${baseRate().toLocaleString('hu-HU')}%), felszólítás, rosszabb esetben a szolgáltatás kikapcsolása.`,
      consequence: 'A következő 3 hónapban rendezed a jövedelmedből. A pénzügyi stressz megterhel: egyensúly −1, egészség −1.',
      available: deficit > 0,
    },
  ];
}

/** A választott megoldás végrehajtása (a napló összege = az egyenlegváltozás) */
export function resolveCrisis(id: CrisisChoice['id']): boolean {
  const st = useGameStore.getState();
  const game = st.game;
  if (!game) return false;
  const choice = crisisChoices(game).find((c) => c.id === id);
  if (!choice?.available) return false;
  const p = game.players[game.activePlayerIndex];
  const pid = p.playerId;
  const deficit = Math.max(0, -p.financialSheet.balance);
  const nextId = () => `valsag-${game.currentRound}-${p.financialSheet.debts.length}`;

  if (id === 'sell') {
    for (const inv of toSell(game, deficit).list) {
      st.removeInvestment(pid, inv.optionId);
      st.logEvent({ type: 'crisis', description: `Válság: eladva - ${INVESTMENT_OPTIONS.find((o) => o.id === inv.optionId)?.name ?? inv.optionId}`, financialImpact: inv.currentValue });
    }
  } else if (id === 'family') {
    const s = situationOfGame(game);
    if (s.salary < netMinimumWage() / 2) {
      st.modifyBalance(pid, deficit, 'A szüleid fedezték a hiányt');
      st.logEvent({ type: 'crisis', description: 'Válság: a szüleid fedezték a hiányt', financialImpact: deficit });
    } else {
      st.addDebt(pid, { id: nextId(), type: 'family_loan', name: 'Családi kölcsön', originalAmount: deficit, remainingAmount: deficit, interestRate: 0, monthlyPayment: Math.ceil(deficit / 12), remainingMonths: 12, isInterestFree: true }, true);
      st.logEvent({ type: 'crisis', description: 'Válság: családi kölcsön (0%, 12 hónap)', financialImpact: deficit });
    }
  } else if (id === 'loan') {
    const principal = roundUp(deficit + 20_000, 10_000);
    st.addDebt(pid, makeDebt({ name: 'Személyi kölcsön (válság)', type: 'personal_loan', principal, months: 24, rateKey: 'bank.personalLoanThm' }, nextId()), true);
    st.logEvent({ type: 'crisis', description: `Válság: személyi kölcsön ${formatHUF(principal)}`, financialImpact: principal });
    st.modifyWellbeing(pid, 'egyensuly', -1);
  } else {
    const rate = baseRate();
    const months = 3;
    const r = rate / 100 / 12;
    const payment = Math.ceil(r ? (deficit * r) / (1 - Math.pow(1 + r, -months)) : deficit / months);
    st.addDebt(pid, { id: nextId(), type: 'overdue', name: 'Késedelmes tartozás (ki nem fizetett számlák)', originalAmount: deficit, remainingAmount: deficit, interestRate: rate, monthlyPayment: payment, remainingMonths: months, isInterestFree: false }, true);
    st.logEvent({ type: 'crisis', description: 'Válság: késedelembe estél (a számlák tartozássá váltak)', financialImpact: deficit });
    st.modifyWellbeing(pid, 'egyensuly', -1);
    st.modifyWellbeing(pid, 'egeszseg', -1);
  }
  return true;
}
