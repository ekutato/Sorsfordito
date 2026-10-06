// A játékos neve egy helyen: a kezdőképernyőn és az asztali belépésnél ugyanaz a mező tölti.
import { isLocalNet } from '@/net/transport';

const KEY = 'sorsfordito-nev';
// Helyi tesztcsatornán minden lap külön játékos
const store = () => (isLocalNet() ? sessionStorage : localStorage);

export function loadPlayerName(): string {
  try { return store().getItem(KEY) ?? ''; } catch { return ''; }
}

export function savePlayerName(name: string) {
  try { store().setItem(KEY, name.slice(0, 20)); } catch { /* nincs tárhely */ }
}
