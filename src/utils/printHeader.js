/**
 * Mengambil logo koperasi sebagai base64 data URL untuk di-embed di PDF/print.
 * Pakai cache agar tidak fetch ulang setiap cetak.
 */
let _logoCache = null;

export const getLogoBase64 = async () => {
  if (_logoCache) return _logoCache;
  try {
    const response = await fetch('/logo.png');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        _logoCache = reader.result;
        resolve(_logoCache);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

/**
 * Menghasilkan blok HTML header kop surat untuk laporan cetak.
 * @param {string} logoBase64 - Data URL logo (bisa null)
 * @param {string} judulLaporan - Judul laporan, misal "LAPORAN LABA / RUGI"
 * @param {string} periodeLabel - Label periode, misal "Januari 2026"
 * @param {string} cetakLabel - Label dicetak, misal tanggal cetak
 * @returns {string} HTML string
 */
export const buildPrintHeader = (logoBase64, judulLaporan, periodeLabel, cetakLabel) => {
  const logoHTML = logoBase64
    ? `<img src="${logoBase64}" alt="Logo KPKCG" style="height:64px;width:64px;object-fit:contain;flex-shrink:0;" />`
    : `<div style="width:64px;height:64px;background:#FF4D00;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:18px;flex-shrink:0;">K</div>`;

  return `
  <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;padding-bottom:12px;border-bottom:3px solid #FF4D00;">
    ${logoHTML}
    <div style="flex:1;text-align:center;">
      <div style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;">
        KOPERASI PEMASARAN KARYA CIPTA GEMILANG
      </div>
      <div style="font-size:11px;color:#6b7280;margin-top:2px;">
        Jl. Contoh No. 1, Jakarta &nbsp;|&nbsp; Telp: (021) 000-0000
      </div>
      <div style="font-size:15px;font-weight:800;margin-top:6px;color:#FF4D00;letter-spacing:1px;text-transform:uppercase;">
        ${judulLaporan}
      </div>
      <div style="font-size:11px;color:#444;margin-top:2px;">
        ${periodeLabel}
      </div>
    </div>
    <div style="text-align:right;font-size:9px;color:#9ca3af;min-width:100px;">
      Dicetak:<br/>${cetakLabel}
    </div>
  </div>`;
};
