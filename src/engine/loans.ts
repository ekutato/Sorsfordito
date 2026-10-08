// Hitelek a döntésekből: valódi tartozásként (tőke, kamat, törlesztő, futamidő).
// Annuitás: A = P·r / (1 - (1+r)^-n), havi r = éves kamat / 12. Kamatmentesnél A = P / n.
import type { Debt } from '@/types/financial';
import type { LoanSpec } from '@/types/game';
import { LIVE_DATA } from '@/data/live';

export function loanRate(spec: Pick<LoanSpec, 'ratePct' | 'rateKey'>): number {
  const live = spec.rateKey ? LIVE_DATA.ertekek[spec.rateKey] : undefined;
  if (live && typeof live.value === 'number') return live.value;
  return spec.ratePct ?? 0;
}

export function annuityPayment(principal: number, ratePct: number, months: number): number {
  if (months <= 0) return 0;
  const r = ratePct / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

export function annuityPrincipal(payment: number, ratePct: number, months: number): number {
  const r = ratePct / 100 / 12;
  if (r === 0) return payment * months;
  return (payment * (1 - Math.pow(1 + r, -months))) / r;
}

export function annuityMonths(principal: number, ratePct: number, payment: number): number {
  const r = ratePct / 100 / 12;
  if (payment <= 0) return 0;
  if (r === 0) return Math.ceil(principal / payment);
  const x = 1 - (principal * r) / payment;
  if (x <= 0) return 600; // a részlet a kamatot sem fedezi: felső korlát
  return Math.ceil(-Math.log(x) / Math.log(1 + r));
}

/** A döntés hitelleírásából teljes (kerekített) hitelrekord */
export function resolveLoan(spec: LoanSpec): { principal: number; monthlyPayment: number; months: number; ratePct: number } {
  const ratePct = loanRate(spec);
  let { principal, monthlyPayment, months } = spec;
  if (principal !== undefined && months !== undefined && monthlyPayment === undefined) monthlyPayment = annuityPayment(principal, ratePct, months);
  else if (monthlyPayment !== undefined && months !== undefined && principal === undefined) principal = annuityPrincipal(monthlyPayment, ratePct, months);
  else if (principal !== undefined && monthlyPayment !== undefined && months === undefined) months = annuityMonths(principal, ratePct, monthlyPayment);
  const p = Math.round((principal ?? 0) / 1000) * 1000;
  const a = Math.round(monthlyPayment ?? 0);
  return { principal: p, monthlyPayment: a, months: months ?? (a > 0 ? annuityMonths(p, ratePct, a) : 0), ratePct };
}

export function makeDebt(spec: LoanSpec, id: string): Debt {
  const l = resolveLoan(spec);
  return {
    id, type: spec.type, name: spec.name,
    originalAmount: l.principal, remainingAmount: l.principal,
    interestRate: l.ratePct, monthlyPayment: l.monthlyPayment,
    remainingMonths: l.months || 120, isInterestFree: l.ratePct === 0,
    ...(spec.monthlyDraw ? { monthlyDraw: spec.monthlyDraw } : {}),
  };
}
