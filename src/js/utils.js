// Fungsi murni (input sama -> hasil sama, tanpa efek samping) dan helper kecil.
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Function declaration: mengamankan teks sebelum masuk innerHTML (cegah XSS)
export function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, (ch) => ESC[ch]);
}

// Function expression + rest parameter: pembungkus console (level: 'log' | 'warn' | 'error')
export const log = function (level, ...messages) {
  console[level]('[Kasku]', ...messages);
};

/* ---------- Format ---------- */
const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
export const formatRupiah = (n) => rupiah.format(n);

/* ---------- Tanggal ---------- */
const pad = (n) => String(n).padStart(2, '0');
export const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const addDays = (n, from = new Date()) => new Date(from.getFullYear(), from.getMonth(), from.getDate() + n);
export const monthKey = (isoDate) => isoDate.slice(0, 7); // "2026-10"

// Dirakit dari komponen lokal (new Date('2026-10-09') dibaca UTC dan bisa meleset sehari)
export const formatDate = (isoDate) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

/* ---------- Operasi transaksi: semua mengembalikan array/objek BARU (immutable) ---------- */
export const addTx = (txs, tx) => [...txs, tx];
export const removeTx = (txs, id) => txs.filter((t) => t.id !== id);

// Terbaru di atas. [...txs] menyalin karena sort() mengubah array aslinya.
export const sortTx = (txs) => [...txs].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

export const filterTx = (txs, { type = 'semua', category = 'semua', keyword = '' }) => {
  const k = keyword.trim().toLowerCase();
  return txs.filter((t) =>
    (type === 'semua' || t.type === type) &&
    (category === 'semua' || t.category === category) &&
    (!k || t.desc.toLowerCase().includes(k)));
};

export const inMonth = (txs, key) => txs.filter((t) => monthKey(t.date) === key);

// reduce: { income: 1500000, expense: 170000 }
export const summarize = (txs) =>
  txs.reduce(
    (acc, { type, amount }) => (type === 'income'
      ? { ...acc, income: acc.income + amount }
      : { ...acc, expense: acc.expense + amount }),
    { income: 0, expense: 0 },
  );

export const balanceOf = (txs) => {
  const { income, expense } = summarize(txs);
  return income - expense;
};

// reduce dengan computed property name: { "Makan & minum": 18000, ... }
export const spentByCategory = (txs) =>
  txs
    .filter((t) => t.type === 'expense')
    .reduce((acc, { category, amount }) => ({ ...acc, [category]: (acc[category] ?? 0) + amount }), {});

export const budgetStatus = (spent, budget) => {
  if (budget <= 0) return { pct: 0, level: 'none' };
  const ratio = spent / budget; // level ditentukan dari rasio asli, bukan angka yang sudah dibulatkan
  return { pct: Math.floor(ratio * 100), level: ratio >= 1 ? 'over' : ratio >= 0.7 ? 'warn' : 'ok' };
};

// rest parameter + spread: gabungkan beberapa daftar tanpa id ganda
export const mergeUnique = (base, ...others) => {
  const seen = new Set(base.map((t) => t.id));
  return [...base, ...others.flat().filter((t) => !seen.has(t.id))];
};

export const validateTx = ({ desc, amount, date }) => {
  const errors = {};
  if (desc.trim().length < 3) errors.desc = 'Keterangan minimal 3 karakter.';
  const n = Number(amount);
  if (!amount || !Number.isInteger(n) || n <= 0) errors.amount = 'Jumlah harus bilangan bulat lebih dari 0.';
  else if (n > 1_000_000_000) errors.amount = 'Jumlah terlalu besar.';
  if (!date) errors.date = 'Pilih tanggal transaksi.';
  return errors;
};