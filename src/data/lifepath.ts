// Életpálya mód: 16 évestől a pénzügyi függetlenségig, évente egy lépéssel.
// A fordulópont-években a játék megáll (döntés), a rutinéveket összevonja.
// A szabályok forrása és az egyszerűsítések indoklása: docs/kutatas.md 7. fejezet.
// Szerencsés, de reális esetben a teljes függetlenség 40 év körül érhető el:
// ehhez kb. 22 éves kortól 50% körüli megtakarítási ráta kell (vagy egy jó befektetés/vállalkozás).

export interface LifepathMilestone {
  age: number;
  id: string;
  title: string;
  /** Mit dönt a játékos ezen a fordulóponton */
  decision: string;
  /** Valós szabály röviden, forrással a kutatásban */
  realRule?: string;
}

export const LIFEPATH_START_AGE = 16;
export const LIFEPATH_TARGET_AGE = 40;
export const LIFEPATH_MAX_AGE = 50;

export const LIFEPATH_MILESTONES: readonly LifepathMilestone[] = [
  { age: 16, id: 'lp-diakmunka', title: 'Első diákmunka', decision: 'Vállalsz-e nyári munkát, és mire fordítod az első saját pénzed?',
    realRule: '16 évtől lehet munkát vállalni, 18 év alatt a szülő hozzájárulásával, napi legfeljebb 8 órában.' },
  { age: 18, id: 'lp-palyavalasztas', title: 'Pályaválasztás', decision: 'Egyetem (diákhitellel vagy anélkül), szakma vagy azonnali munka?',
    realRule: 'Diákhitel2: legfeljebb a tandíj összege, 0% kamattal; Diákhitel1: változó kamattal.' },
  { age: 22, id: 'lp-elso-allas', title: 'Első teljes állás', decision: 'Mekkora megtakarítási rátával indulsz? Itt dől el a legtöbb.',
    realRule: 'Minimálbér 2026-ban bruttó 322 800 Ft, garantált bérminimum 373 200 Ft.' },
  { age: 24, id: 'lp-koltozes', title: 'Önálló lakhatás', decision: 'Albérlet, lakótárs vagy otthon maradás - és mennyit spórolsz vele?' },
  { age: 27, id: 'lp-elso-lakas', title: 'Első saját lakás', decision: 'Vásárolsz-e, és ha igen, támogatott hitellel?',
    realRule: 'Támogatott lakáshitelek: a kamat, az összeg és a feltételek a heti adatcsomagból jönnek, mert gyakran változnak.' },
  { age: 30, id: 'lp-csalad', title: 'Család vagy szabadság', decision: 'Családalapítás, karrierváltás vagy vállalkozás - mindegyiknek más az ára és a haszna.' },
  { age: 33, id: 'lp-karrier', title: 'Karriercsúcs felé', decision: 'Több felelősség több pénzért, vagy egyensúly?' },
  { age: 36, id: 'lp-ongondoskodas', title: 'Öngondoskodás', decision: 'Nyugdíjpénztár, NYESZ vagy TBSZ - mit választasz az adókedvezményért?',
    realRule: 'Önkéntes nyugdíjpénztár: 20%, évi max. 150 000 Ft adó-visszatérítés; NYESZ: 20%, évi max. 100 000 Ft.' },
  { age: 40, id: 'lp-merleg', title: 'Mérleg 40 évesen', decision: 'Hol tartasz a fokozatos célokban? Kiléphetsz-e a mókuskerékből?' },
];

/** Az Életpálya mód egyszerűsítései: a tanulság megmarad, az adminisztráció nem */
export const LIFEPATH_SIMPLIFICATIONS = [
  'A diákmunka jogszabályi részletei helyett egyetlen kártya: nettó kereset és a munka-szabadidő kompromisszum.',
  'A támogatott hiteleknél csak 2-3 kulcsfeltétel (kamat, összeg, kötelezettség, büntetőkamat).',
  'Nyugdíjszámítás helyett egy "nyugdíjrés" mutató.',
  'Adóból csak a kamatadó különbsége: bankbetét 28%, állampapír és 5 éves TBSZ 0%.',
  'A rutinéveket a játék összevonja; csak a fordulópontoknál áll meg.',
  'Nem hagyható ki: tartalékképzés, kamatos kamat, THM és a csapdák.',
] as const;

/** 16 éves kezdőprofil (Életpálya mód) - nulla jövedelemmel, szülőknél lakva */
export const LIFEPATH_PRESET_16 = {
  id: 'teen_start',
  name: 'Bori',
  age: 16,
  title: 'Gimnazista, 16 évesen',
  situation: 'Szülőknél lakik, zsebpénzből és nyári diákmunkából gazdálkodik. Minden döntése még előtte van.',
  startingFinancials: { balance: 40_000, salary: 0, housing: 0, utilities: 0, food: 0, transport: 0, other: 15_000 },
} as const;
