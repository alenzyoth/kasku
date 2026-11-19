import { buildSeed, DEFAULT_BUDGET } from './data.js';
import { log } from './utils.js';

const KEY_TX = 'kasku.transactions.v1';
const KEY_BUDGET = 'kasku.budget.v1';

// Data dari localStorage bisa rusak atau diubah manual, jadi bentuknya diperiksa dulu
const isTx = (t) =>
  t && typeof t.id === 'string' && typeof t.desc === 'string' && typeof t.category === 'string' &&
  (t.type === 'income' || t.type === 'expense') && Number.isInteger(t.amount) && typeof t.date === 'string';

export const loadTx = () => {
  try {
    const raw = localStorage.getItem(KEY_TX);
    if (raw === null) return buildSeed(); // kunjungan pertama
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isTx) : [];
  } catch (error) {
    log('warn', 'Gagal membaca transaksi:', error.message);
    return [];
  }
};

export const saveTx = (txs) => {
  try {
    localStorage.setItem(KEY_TX, JSON.stringify(txs));
  } catch (error) {
    log('warn', 'Gagal menyimpan transaksi:', error.message);
  }
};

export const loadBudget = () => {
  try {
    const raw = localStorage.getItem(KEY_BUDGET);
    if (raw === null) return DEFAULT_BUDGET;
    const n = Number(JSON.parse(raw));
    return Number.isInteger(n) && n >= 0 ? n : DEFAULT_BUDGET;
  } catch (error) {
    log('warn', 'Gagal membaca anggaran:', error.message);
    return DEFAULT_BUDGET;
  }
};

export const saveBudget = (budget) => {
  try {
    localStorage.setItem(KEY_BUDGET, JSON.stringify(budget));
  } catch (error) {
    log('warn', 'Gagal menyimpan anggaran:', error.message);
  }
};
