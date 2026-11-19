import { addDays, toISODate } from './utils.js';

export const CATEGORIES = {
  expense: ['Makan & minum', 'Transportasi', 'Kuliah & buku', 'Pulsa & internet', 'Hiburan', 'Kos & tagihan', 'Lainnya'],
  income: ['Kiriman orang tua', 'Beasiswa', 'Kerja paruh waktu', 'Lainnya'],
};
export const ALL_CATEGORIES = [...new Set([...CATEGORIES.expense, ...CATEGORIES.income])];
export const DEFAULT_BUDGET = 1_500_000;

// [keterangan, jenis, kategori, jumlah, berapa hari lalu]
const sample = [
  ['Kiriman orang tua', 'income', 'Kiriman orang tua', 1500000, 5],
  ['Makan siang kantin', 'expense', 'Makan & minum', 18000, 4],
  ['Fotokopi modul praktikum', 'expense', 'Kuliah & buku', 12000, 3],
  ['Paket data bulanan', 'expense', 'Pulsa & internet', 65000, 2],
  ['Bensin motor', 'expense', 'Transportasi', 30000, 1],
  ['Nongkrong dengan teman', 'expense', 'Hiburan', 45000, 0],
];

// Array of objects. Tanggal dijepit ke awal bulan ini supaya contoh selalu tampil di ringkasan bulan berjalan.
export const buildSeed = (now = new Date()) => {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return sample.map(([desc, type, category, amount, daysAgo], i) => {
    const day = addDays(-daysAgo, now);
    return { id: `seed-${i + 1}`, desc, type, category, amount, date: toISODate(day < monthStart ? monthStart : day) };
  });
};
