// ============================================================================
// PENZUGYI SORSFORDITO - Crisis Handler
// Valsagkezeles: ha az egyenleg 0 ala megy
// ============================================================================

import type { FinancialSheet, HUF, Debt } from '@/types/financial';
import type { CrisisState, CrisisOption, GameEvent } from '@/types/game';
import { computeFinancials } from './financial-calculator';

/**
 * Letrehozza a valsagkezelesi opciókat az aktualis hiany alapjan
 */
export function createCrisisOptions(
  sheet: FinancialSheet,
  round: number
): CrisisState {
  const deficit = Math.abs(sheet.balance);
  const options: CrisisOption[] = [];

  // 1. Szemelyi kolcson (mindig elerheto)
  options.push({
    id: 'crisis-personal-loan',
    name: 'Személyi kölcsön',
    description:
      `Felveszel ${formatAmount(deficit + 50_000)} Ft személyi kölcsönt. ` +
      'Azonnal megoldja a problémát, de havi törlesztő és kamat jár hozzá.',
    immediateRelief: deficit + 50_000,
    cost: [
      {
        target: 'loanPayments',
        amount: Math.round((deficit + 50_000) / 24), // 24 havi torlesztes
        description: `Havi törlesztő: +${Math.round((deficit + 50_000) / 24).toLocaleString('hu-HU')} Ft`,
      },
    ],
    lesson:
      'A személyi kölcsön kamata 10-20% éves. ' +
      'Ha nincs vészhelyzeti alapod, a legdrágább megoldás marad.',
  });

  // 2. Szuloktol / csaladtol kerni (ha fiatal)
  if (sheet.debts.length < 3) {
    options.push({
      id: 'crisis-family-help',
      name: 'Családi segítség',
      description:
        `Megkéred a szüleidet/rokonaidat, hogy segítsenek ${formatAmount(deficit)} Ft-tal. ` +
        'Nincs kamat, de a kapcsolat terhelődik. 6 hónapon belül visszaadod.',
      immediateRelief: deficit,
      cost: [
        {
          target: 'other',
          amount: Math.round(deficit / 6), // 6 honap alatt visszaadod
          description: `Visszafizetés családnak: +${Math.round(deficit / 6).toLocaleString('hu-HU')} Ft/hó (6 hónap)`,
        },
      ],
      lesson:
        'A családi kölcsön kamatmentes, de a feszültség kamatos kamattal nő. ' +
        'Ha kérsz, legyen egyértelmű visszafizetési terv.',
    });
  }

  // 3. Mellekallas / tulora
  options.push({
    id: 'crisis-side-hustle',
    name: 'Mellékállás keresése',
    description:
      'Hétvégi munkát, futárkodást vagy freelance projektet vállalsz. ' +
      '+60 000 Ft/hó extra bevétel, de az időd és energiád csökken.',
    immediateRelief: 60_000,
    cost: [
      {
        target: 'other',
        amount: 10_000, // Tobb stressz, tobb koltés is
        description: 'Extra kiadás (benzin, étkezés munka közben): +10 000 Ft/hó',
      },
    ],
    lesson:
      'A mellékállás rövid távon segít, de hosszú távon kiégéshez vezet. ' +
      'A cél: a fő bevételt növelni, nem a munkaórákat.',
  });

  // 4. Befektetes eladasa (ha van)
  if (sheet.investments.length > 0) {
    const sellableValue = sheet.investments.reduce(
      (sum, inv) => sum + inv.currentValue,
      0
    );
    options.push({
      id: 'crisis-sell-investment',
      name: 'Befektetés eladása (vészhelyzeti)',
      description:
        `Eladod a befektetéseid egy részét vagy egészét. ` +
        `Elérhető: ${formatAmount(sellableValue)} Ft. De elveszíted a jövőbeli hozamot.`,
      immediateRelief: Math.min(sellableValue, deficit),
      cost: [],
      lesson:
        'A befektetés eladása vészhelyzetben a „tűzoltó" megoldás. ' +
        'Ezért fontos, hogy ELŐBB legyen vészhelyzeti alap, és UTÁNA fektess be.',
    });
  }

  // 5. Hitelkartya (legrosszabb opcio)
  options.push({
    id: 'crisis-credit-card',
    name: 'Hitelkártya-limit',
    description:
      'A hitelkártyád limitjéből fedezel mindent. Gyors, de 25-30% éves kamat! ' +
      'Ha nem fizeted vissza 1 hónapon belül, a kamat exponenciálisan nő.',
    immediateRelief: deficit + 100_000,
    cost: [
      {
        target: 'loanPayments',
        amount: Math.round((deficit + 100_000) * 0.025), // ~30% eves = 2.5% havas
        description: `Hitelkártya kamat: +${Math.round((deficit + 100_000) * 0.025).toLocaleString('hu-HU')} Ft/hó`,
      },
    ],
    lesson:
      'A hitelkártya a legdrágább hitelforma (25-40% THM). ' +
      'Egyetlen szabály: SOHA ne gördítsd a tartozást hónapról hónapra.',
  });

  return { deficit, options };
}

/**
 * Alkalmazza a kivalasztott valsagkezelesi opciot
 */
export function applyCrisisOption(
  sheet: FinancialSheet,
  option: CrisisOption,
  round: number,
  gameDate: string
): { updatedSheet: FinancialSheet; events: GameEvent[] } {
  let updatedSheet = { ...sheet };

  // Azonnali segitseg hozzaadasa
  updatedSheet.balance += option.immediateRelief;

  // Ha szemelyi kolcson vagy hitelkartya → uj adossag
  if (option.id === 'crisis-personal-loan' || option.id === 'crisis-credit-card') {
    const newDebt: Debt = {
      id: `debt-crisis-${round}`,
      type: option.id === 'crisis-credit-card' ? 'credit_card' : 'personal_loan',
      name: option.id === 'crisis-credit-card' ? 'Hitelkártya tartozás' : 'Személyi kölcsön (válság)',
      originalAmount: option.immediateRelief,
      remainingAmount: option.immediateRelief,
      interestRate: option.id === 'crisis-credit-card' ? 30 : 15,
      monthlyPayment: option.cost[0]?.amount ?? 0,
      remainingMonths: option.id === 'crisis-credit-card' ? 48 : 24,
      isInterestFree: false,
    };
    updatedSheet.debts = [...updatedSheet.debts, newDebt];
  }

  // Koltseg-hatasok alkalmazasa
  for (const cost of option.cost) {
    if (cost.target === 'loanPayments') {
      updatedSheet.expenses = {
        ...updatedSheet.expenses,
        loanPayments: updatedSheet.expenses.loanPayments + cost.amount,
      };
    } else if (cost.target === 'other') {
      updatedSheet.expenses = {
        ...updatedSheet.expenses,
        other: updatedSheet.expenses.other + cost.amount,
      };
    }
  }

  // Ha befektetes eladasa
  if (option.id === 'crisis-sell-investment') {
    // Az osszes befektetest eladjuk
    updatedSheet.investments = [];
    updatedSheet.income = { ...updatedSheet.income, passive: 0 };
  }

  // Ha mellekallas
  if (option.id === 'crisis-side-hustle') {
    updatedSheet.income = {
      ...updatedSheet.income,
      salary: updatedSheet.income.salary + 60_000,
    };
  }

  updatedSheet.computed = computeFinancials(updatedSheet);

  const events: GameEvent[] = [
    {
      round,
      gameDate,
      type: 'crisis',
      description: `Válságkezelés: ${option.name}`,
      financialImpact: option.immediateRelief,
      details: {
        crisisOptionId: option.id,
        lesson: option.lesson,
      },
    },
  ];

  return { updatedSheet, events };
}

function formatAmount(amount: HUF): string {
  return amount.toLocaleString('hu-HU');
}
