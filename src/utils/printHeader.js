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
 * @param {boolean} showAddress - Tampilkan alamat & telepon (default true)
 * @returns {string} HTML string
 */
export const buildPrintHeader = (logoBase64, judulLaporan, periodeLabel, cetakLabel, showAddress = true) => {
  const logoHTML = logoBase64
    ? `<img src="${logoBase64}" alt="Logo KPKCG" style="height:48px;width:48px;object-fit:contain;flex-shrink:0;" />`
    : `<div style="width:48px;height:48px;background:#FF4D00;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:16px;flex-shrink:0;">K</div>`;

  return `
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;padding-bottom:8px;border-bottom:3px solid #FF4D00;page-break-after:avoid;page-break-inside:avoid;">
    ${logoHTML}
    <div style="flex:1;text-align:center;">
      <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;">
        KOPERASI PEMASARAN KARYA CIPTA GEMILANG
      </div>
      ${showAddress ? `<div style="font-size:9px;color:#6b7280;margin-top:1px;">
        Jl. Australia I Kav.C1/2, Warnasari, Kec. Citangkil, Kota Cilegon, Banten 42443 &nbsp;|&nbsp; Telp: +62 852-1940-4228
      </div>` : ''}
      <div style="font-size:13px;font-weight:800;margin-top:4px;color:#FF4D00;letter-spacing:1px;text-transform:uppercase;">
        ${judulLaporan}
      </div>
      <div style="font-size:9px;color:#444;margin-top:1px;">
        ${periodeLabel}
      </div>
    </div>
    <div style="text-align:right;font-size:8px;color:#9ca3af;min-width:80px;flex-shrink:0;">
      Dicetak:<br/>${cetakLabel}
    </div>
  </div>`;
};
