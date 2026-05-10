/**
 * Hitung jadwal cicilan
 * @param {number} total - Total tagihan
 * @param {number} installments - Jumlah cicilan (1 = tempo lunas)
 * @param {string} startDate - Tanggal mulai bayar (YYYY-MM-DD)
 * @returns {Array} - [{no, date, amount, remaining}]
 */
export const buildSchedule = (total, installments, startDate) => {
  if (!startDate || installments < 1 || total <= 0) return [];
  const perCicilan = Math.floor(total / installments);
  const sisa = total - perCicilan * installments; // selisih pembulatan ke cicilan terakhir

  const schedule = [];
  const [y, m, d] = startDate.split('-').map(Number);

  for (let i = 0; i < installments; i++) {
    const date = new Date(y, m - 1 + i, d);
    const yyyy = date.getFullYear();
    const mm   = String(date.getMonth() + 1).padStart(2, '0');
    const dd   = String(date.getDate()).padStart(2, '0');
    const amount = i === installments - 1 ? perCicilan + sisa : perCicilan;
    const remaining = total - perCicilan * (i + 1) - (i === installments - 1 ? sisa : 0);
    schedule.push({
      no: i + 1,
      date: `${yyyy}-${mm}-${dd}`,
      amount,
      remaining: Math.max(0, remaining),
    });
  }
  return schedule;
};
