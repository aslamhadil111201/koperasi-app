import React, { useState, useMemo } from 'react';
import { Scale, Printer, Calendar } from 'lucide-react';
import { useStore } from '../../store/useStore';
import './Reports.css';

const fmt = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

const netBalance = (journal, accountName, mode = 'debit', upToDate) => {
  const entries = journal.filter(e =>
    e.account === accountName && (!upToDate || e.date <= upToDate)
  );
  const totalDebit  = entries.reduce((s, e) => s + (e.debit  || 0), 0);
  const totalCredit = entries.reduce((s, e) => s + (e.credit || 0), 0);
  return mode === 'debit' ? totalDebit - totalCredit : totalCredit - totalDebit;
};

const Neraca = () => {
  const journal = useStore((s) => s.journal);

  // Default = hari ini
  const todayRaw = new Date();
  const todayStr = `${todayRaw.getFullYear()}-${String(todayRaw.getMonth()+1).padStart(2,'0')}-${String(todayRaw.getDate()).padStart(2,'0')}`;

  const [filterDate, setFilterDate] = useState(todayStr);

  const today = new Date(filterDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

  const balances = useMemo(() => {
    const kas              = netBalance(journal, 'Kas Bank',          'debit',  filterDate);
    const piutangAnggota   = netBalance(journal, 'Piutang Anggota',   'debit',  filterDate);
    const piutangBarang    = netBalance(journal, 'Piutang Barang',    'debit',  filterDate);
    const persediaan       = netBalance(journal, 'Persediaan Barang', 'debit',  filterDate);
    const totalAktivaLancar = kas + piutangAnggota + piutangBarang + persediaan;

    const hutangKonsinyasi = netBalance(journal, 'Hutang Konsinyasi', 'credit', filterDate);
    const simpananAnggota  = netBalance(journal, 'Simpanan Anggota',  'credit', filterDate);
    const totalKewajiban   = hutangKonsinyasi + simpananAnggota;

    const modalKoperasi = totalAktivaLancar - totalKewajiban;

    return {
      kas, piutangAnggota, piutangBarang, persediaan, totalAktivaLancar,
      hutangKonsinyasi, simpananAnggota, totalKewajiban, modalKoperasi,
    };
  }, [journal, filterDate]);

  const RowItem = ({ label, value, indent = false, bold = false, borderTop = false }) => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '0.45rem 0',
      paddingLeft: indent ? '1.25rem' : 0,
      borderTop: borderTop ? '2px solid var(--color-border)' : 'none',
      fontWeight: bold ? 700 : 400,
      fontSize: bold ? '0.95rem' : '0.875rem',
    }}>
      <span style={{ color: bold ? 'var(--color-text-main)' : 'var(--color-text-muted)' }}>{label}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums', color: bold ? 'var(--color-text-main)' : 'var(--color-text-main)' }}>
        {fmt(value)}
      </span>
    </div>
  );

  const handleCetak = () => {
    const isSeimbang = Math.abs(balances.totalAktivaLancar - (balances.totalKewajiban + balances.modalKoperasi)) < 1;

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Neraca KPKCG</title>
<style>
  @page { size: A4; margin: 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; }
  .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #111; padding-bottom: 12px; }
  .header h1 { font-size: 14px; font-weight: 800; text-transform: uppercase; }
  .header h2 { font-size: 13px; font-weight: 700; margin-top: 4px; }
  .header p  { font-size: 11px; color: #444; margin-top: 2px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .section { border: 1px solid #e5e7eb; border-radius: 6px; padding: 14px; }
  .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid; }
  .aktiva-title  { color: #FF4D00; border-color: #FF4D00; }
  .pasiva-title  { color: #06b6d4; border-color: #06b6d4; }
  .sub-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; margin: 10px 0 6px; }
  .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; border-bottom: 1px solid #f3f4f6; }
  .row.indent { padding-left: 14px; color: #444; }
  .row.total { font-weight: 700; font-size: 12px; border-top: 2px solid #e5e7eb; border-bottom: none; padding-top: 6px; margin-top: 4px; }
  .row.grand-total { font-weight: 800; font-size: 13px; border-top: 3px double #111; border-bottom: none; padding-top: 8px; margin-top: 8px; }
  .balance-check { margin-top: 16px; padding: 10px 14px; border-radius: 6px; font-size: 11px; font-weight: 600; text-align: center; }
  .balanced   { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
  .unbalanced { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
  .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px; }
</style>
</head>
<body>
  <div class="header">
    <h1>Koperasi Pemasaran Karya Cipta Gemilang</h1>
    <h2>NERACA (BALANCE SHEET)</h2>
    <p>Per tanggal ${today}</p>
  </div>

  <div class="grid">
    <!-- AKTIVA -->
    <div class="section">
      <div class="section-title aktiva-title">AKTIVA</div>
      <div class="sub-title">Aktiva Lancar</div>
      <div class="row indent"><span>Kas Bank</span><span>${fmt(balances.kas)}</span></div>
      <div class="row indent"><span>Piutang Anggota</span><span>${fmt(balances.piutangAnggota)}</span></div>
      <div class="row indent"><span>Piutang Barang</span><span>${fmt(balances.piutangBarang)}</span></div>
      <div class="row indent"><span>Persediaan Barang</span><span>${fmt(balances.persediaan)}</span></div>
      <div class="row total"><span>Total Aktiva Lancar</span><span>${fmt(balances.totalAktivaLancar)}</span></div>
      <div class="row grand-total"><span>TOTAL AKTIVA</span><span>${fmt(balances.totalAktivaLancar)}</span></div>
    </div>

    <!-- KEWAJIBAN & EKUITAS -->
    <div class="section">
      <div class="section-title pasiva-title">KEWAJIBAN &amp; EKUITAS</div>
      <div class="sub-title">Kewajiban</div>
      <div class="row indent"><span>Hutang Konsinyasi</span><span>${fmt(balances.hutangKonsinyasi)}</span></div>
      <div class="row indent"><span>Simpanan Anggota</span><span>${fmt(balances.simpananAnggota)}</span></div>
      <div class="row total"><span>Total Kewajiban</span><span>${fmt(balances.totalKewajiban)}</span></div>

      <div class="sub-title" style="margin-top:14px">Ekuitas</div>
      <div class="row indent"><span>Modal Koperasi</span><span>${fmt(balances.modalKoperasi)}</span></div>
      <div class="row total"><span>Total Ekuitas</span><span>${fmt(balances.modalKoperasi)}</span></div>

      <div class="row grand-total">
        <span>TOTAL KEWAJIBAN + EKUITAS</span>
        <span>${fmt(balances.totalKewajiban + balances.modalKoperasi)}</span>
      </div>
    </div>
  </div>

  <div class="balance-check ${isSeimbang ? 'balanced' : 'unbalanced'}">
    ${isSeimbang
      ? `✅ Neraca Seimbang — Total Aktiva = Total Kewajiban + Ekuitas = ${fmt(balances.totalAktivaLancar)}`
      : `⚠️ Neraca Tidak Seimbang — periksa entri jurnal`}
  </div>

  <div class="footer">KPKCG — Koperasi Pemasaran Karya Cipta Gemilang &nbsp;|&nbsp; Dicetak: ${today}</div>
  <script>window.onload=function(){window.print();setTimeout(function(){window.close();},500);}</script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=1000');
    if (!win) { alert('Izinkan pop-up untuk mencetak.'); return; }
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  return (
    <div className="reports-container">
      {/* Header */}
      <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Scale size={22} style={{ color: 'var(--color-primary)' }} />
            Neraca (Balance Sheet)
          </h2>
          <p className="text-muted">Per tanggal {today} — KPKCG</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ minWidth: 180 }}>
            <Calendar size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            <input
              type="date"
              className="search-input"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              style={{ cursor: 'pointer' }}
            />
          </div>
          <button className="btn btn-primary" onClick={handleCetak} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Printer size={15} /> Cetak Neraca
          </button>
        </div>
      </div>

      {/* Neraca Title Block */}
      <div className="glass-panel" style={{ textAlign: 'center', padding: '1.25rem' }}>
        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>KOPERASI PEMASARAN KARYA CIPTA GEMILANG</div>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '0.25rem' }}>NERACA</div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.15rem' }}>Per {today}</div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* LEFT: AKTIVA */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--color-primary)', fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            AKTIVA
          </h3>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
              Aktiva Lancar
            </div>
            <RowItem label="Kas Bank" value={balances.kas} indent />
            <RowItem label="Piutang Anggota" value={balances.piutangAnggota} indent />
            <RowItem label="Piutang Barang" value={balances.piutangBarang} indent />
            <RowItem label="Persediaan Barang" value={balances.persediaan} indent />
          </div>

          <RowItem label="Total Aktiva Lancar" value={balances.totalAktivaLancar} bold borderTop />

          <div style={{ marginTop: '1.5rem', borderTop: '3px double var(--color-border)', paddingTop: '0.75rem' }}>
            <RowItem label="TOTAL AKTIVA" value={balances.totalAktivaLancar} bold />
          </div>
        </div>

        {/* RIGHT: KEWAJIBAN + EKUITAS */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--color-secondary)', fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            KEWAJIBAN &amp; EKUITAS
          </h3>

          {/* Kewajiban */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
              Kewajiban
            </div>
            <RowItem label="Hutang Konsinyasi" value={balances.hutangKonsinyasi} indent />
            <RowItem label="Simpanan Anggota" value={balances.simpananAnggota} indent />
          </div>

          <RowItem label="Total Kewajiban" value={balances.totalKewajiban} bold borderTop />

          {/* Ekuitas */}
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
              Ekuitas
            </div>
            <RowItem label="Modal Koperasi" value={balances.modalKoperasi} indent />
          </div>

          <RowItem label="Total Ekuitas" value={balances.modalKoperasi} bold borderTop />

          <div style={{ marginTop: '1.5rem', borderTop: '3px double var(--color-border)', paddingTop: '0.75rem' }}>
            <RowItem label="TOTAL KEWAJIBAN + EKUITAS" value={balances.totalKewajiban + balances.modalKoperasi} bold />
          </div>
        </div>
      </div>

      {/* Balance Check */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem' }}>
        {Math.abs(balances.totalAktivaLancar - (balances.totalKewajiban + balances.modalKoperasi)) < 1 ? (
          <div style={{ color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ✅ Neraca seimbang — Total Aktiva = Total Kewajiban + Ekuitas ({fmt(balances.totalAktivaLancar)})
          </div>
        ) : (
          <div style={{ color: 'var(--color-warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⚠️ Neraca tidak seimbang — periksa entri jurnal.
          </div>
        )}
      </div>
    </div>
  );
};

export default Neraca;
