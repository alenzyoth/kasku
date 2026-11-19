// Komunikasi data lewat Fetch API: dua GET (file JSON lokal dan API publik) dan satu POST.
const RATE_URL = 'https://open.er-api.com/v6/latest/USD'; // API publik kurs, tanpa kunci
const TEST_API = 'https://jsonplaceholder.typicode.com';  // API uji coba, tidak menyimpan data

// Promise + setTimeout (callback): jeda yang bisa di-await
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// fetch hanya menolak promise saat jaringan gagal. Status 404/500 TETAP lolos,
// jadi response.ok harus dicek manual (Modul 2, bagian 9.3).
async function request(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Gagal mengambil data (status ${response.status})`);
  return response.json();
}

// GET file JSON lokal
export const getSample = () => request('./data/contoh.json');

// GET API publik. Bentuk respons diperiksa dulu sebelum dipakai.
export async function getUsdRate() {
  const data = await request(RATE_URL);
  const rate = data?.rates?.IDR;
  if (data?.result !== 'success' || typeof rate !== 'number') throw new Error('Format data kurs tidak dikenali.');
  return { rate, updated: data.time_last_update_utc };
}

// POST: body harus string JSON + header Content-Type
export const sendFeedback = (payload) =>
  request(`${TEST_API}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
