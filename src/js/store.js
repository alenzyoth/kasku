// State bersama. Modul lain memakai subscribe() untuk bereaksi saat data berubah (pola observer).
import { loadTx, saveTx, loadBudget, saveBudget } from './storage.js';

let state = { transactions: loadTx(), budget: loadBudget() };
const listeners = new Set();

export const getState = () => state;

// Mendaftarkan pendengar dan langsung memanggilnya sekali dengan state saat ini
export const subscribe = (fn) => {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
};

// Satu-satunya jalan mengubah data: buat state BARU, simpan, lalu beri tahu semua pendengar
export const dispatch = (patch) => {
  const next = { ...state, ...patch };
  if ('transactions' in patch) saveTx(next.transactions);
  if ('budget' in patch) saveBudget(next.budget);
  state = next;
  listeners.forEach((fn) => fn(state));
};
