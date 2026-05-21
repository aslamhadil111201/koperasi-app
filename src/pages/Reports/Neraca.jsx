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
  const journal = useStore((s) => s.journal) || [];
  const accounts = useStore((s) => s.accounts) || [];

  // Default = hari ini
  const todayRaw = new Date();
  const todayStr = `${todayRaw.getFullYear()}-${String(todayRaw.getMonth()+1).padStart(2,'0')}-${String(todayRaw.getDate()).padStart(2,'0')}`;

  const [filterDate, setFilterDate] = useState(todayStr);

  const today = new Date(filterDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

  // Normalize journal account names (case-insensitive match to master data)
  const normalizedJournal = useMemo(() => {
    if (!accounts.length) return journal;
    const nameMap = {};
    accounts.forEach(a => { nameMap[a.name.toLowerCase().trim()] = a.name; });
    return journal.map(j => {
      if (!j.account) return j;
      const key = j.account.toLowerCase().trim();
      const canonical = nameMap[key];
      if (canonical && canonical !== j.account) return { ...j, account: canonical };
      return j;
    });
  }, [journal, accounts]);

  const balances = useMemo(() => {
    // Group accounts by category
    const aktivaLancarAccs = accounts.filter(a => a.category === 'Aset Lancar');
    const aktivaTetapAccs = accounts.filter(a => a.category === 'Aset Tetap');
    const kewajibanAccs = accounts.filter(a => a.category.includes('Kewajiban'));
    const ekuitasAccs = accounts.filter(a => a.category === 'Ekuitas');

    const calcBalance = (accName, mode) => {
      const entries = normalizedJournal.filter(e => e.account === accName && e.date <= filterDate);
      const totalDebit = entries.reduce((s, e) => s + (e.debit || 0), 0);
      const totalCredit = entries.reduce((s, e) => s + (e.credit || 0), 0);
      return mode === 'debit' ? totalDebit - totalCredit : totalCredit - totalDebit;
    };

    const aktivaLancarItems = aktivaLancarAccs.map(a => ({ name: a.name, value: calcBalance(a.name, 'debit') }));
    const aktivaTetapItems = aktivaTetapAccs.map(a => ({ name: a.name, value: calcBalance(a.name, 'debit') }));
    const kewajibanItems = kewajibanAccs.map(a => ({ name: a.name, value: calcBalance(a.name, 'credit') }));
    const ekuitasItems = ekuitasAccs.filter(a => a.name !== 'Saldo Penyeimbang').map(a => ({ name: a.name, value: calcBalance(a.name, 'credit') }));

    const totalAktivaLancar = aktivaLancarItems.reduce((s, i) => s + i.value, 0);
    const totalAktivaTetap = aktivaTetapItems.reduce((s, i) => s + i.value, 0);
    const totalAktiva = totalAktivaLancar + totalAktivaTetap;
    const totalKewajiban = kewajibanItems.reduce((s, i) => s + i.value, 0);
    const totalEkuitas = ekuitasItems.reduce((s, i) => s + i.value, 0);

    return {
      aktivaLancarItems, aktivaTetapItems, totalAktivaLancar, totalAktivaTetap, totalAktiva,
      kewajibanItems, ekuitasItems, totalKewajiban, totalEkuitas,
    };
  }, [normalizedJournal, accounts, filterDate]);

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
    const isSeimbang = Math.abs(balances.totalAktiva - (balances.totalKewajiban + balances.totalEkuitas)) < 1;

    const aktivaHTML = balances.aktivaLancarItems.map(i => 
      `<div class="row indent"><span>${i.name}</span><span>${fmt(i.value)}</span></div>`
    ).join('');
    const aktivaTetapHTML = balances.aktivaTetapItems.map(i => 
      `<div class="row indent"><span>${i.name}</span><span>${fmt(i.value)}</span></div>`
    ).join('');
    const kewajibanHTML = balances.kewajibanItems.map(i => 
      `<div class="row indent"><span>${i.name}</span><span>${fmt(i.value)}</span></div>`
    ).join('');
    const ekuitasHTML = balances.ekuitasItems.map(i => 
      `<div class="row indent"><span>${i.name}</span><span>${fmt(i.value)}</span></div>`
    ).join('');

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
  .section { border: 1px solid #ddd; border-radius: 6px; padding: 16px; }
  .section-title { font-size: 13px; font-weight: 800; margin-bottom: 12px; text-transform: uppercase; }
  .aktiva-title { color: #FF4D00; }
  .pasiva-title { color: #06b6d4; }
  .sub-title { font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; margin: 8px 0 4px; }
  .row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; }
  .row.indent { padding-left: 12px; }
  .row.total { font-weight: 700; border-top: 1px solid #e5e7eb; margin-top: 6px; padding-top: 6px; }
  .row.grand-total { font-weight: 800; font-size: 12px; border-top: 3px double #111; margin-top: 12px; padding-top: 8px; }
  .balance-check { text-align: center; margin-top: 16px; padding: 8px; border-radius: 4px; font-weight: 600; font-size: 11px; }
  .balanced { background: #d1fae5; color: #065f46; }
  .unbalanced { background: #fef3c7; color: #92400e; }
  .footer { text-align: center; font-size: 9px; color: #9ca3af; margin-top: 16px; }
</style>
</head>
<body>
  <div class="header">
    <h1>Koperasi Pemasaran Karya Cipta Gemilang</h1>
    <h2>NERACA</h2>
    <p>Per ${today}</p>
  </div>

  <div class="grid">
    <div class="section">
      <div class="section-title aktiva-title">AKTIVA</div>
      <div class="sub-title">Aktiva Lancar</div>
      ${aktivaHTML}
      <div class="row total"><span>Total Aktiva Lancar</span><span>${fmt(balances.totalAktivaLancar)}</span></div>
      ${aktivaTetapHTML ? `<div class="sub-title">Aktiva Tetap</div>${aktivaTetapHTML}<div class="row total"><span>Total Aktiva Tetap</span><span>${fmt(balances.totalAktivaTetap)}</span></div>` : ''}
      <div class="row grand-total"><span>TOTAL AKTIVA</span><span>${fmt(balances.totalAktiva)}</span></div>
    </div>
    <div class="section">
      <div class="section-title pasiva-title">KEWAJIBAN & EKUITAS</div>
      <div class="sub-title">Kewajiban</div>
      ${kewajibanHTML}
      <div class="row total"><span>Total Kewajiban</span><span>${fmt(balances.totalKewajiban)}</span></div>
      <div class="sub-title">Ekuitas</div>
      ${ekuitasHTML}
      <div class="row total"><span>Total Ekuitas</span><span>${fmt(balances.totalEkuitas)}</span></div>
      <div class="row grand-total"><span>TOTAL KEWAJIBAN + EKUITAS</span><span>${fmt(balances.totalKewajiban + balances.totalEkuitas)}</span></div>
    </div>
  </div>

  <div class="balance-check ${isSeimbang ? 'balanced' : 'unbalanced'}">
    ${isSeimbang
      ? `✅ Neraca Seimbang — Total Aktiva = Total Kewajiban + Ekuitas = ${fmt(balances.totalAktiva)}`
      : `⚠️ Neraca Tidak Seimbang — periksa entri jurnal`}
  </div>

  <div class="footer">KPKCG — Koperasi Pemasaran Karya Cipta Gemilang</div>
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

          {balances.aktivaLancarItems.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                Aktiva Lancar
              </div>
              {balances.aktivaLancarItems.map(item => (
                <RowItem key={item.name} label={item.name} value={item.value} indent />
              ))}
            </div>
          )}

          {balances.aktivaTetapItems.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                Aktiva Tetap
              </div>
              {balances.aktivaTetapItems.map(item => (
                <RowItem key={item.name} label={item.name} value={item.value} indent />
              ))}
            </div>
          )}

          <RowItem label="Total Aktiva Lancar" value={balances.totalAktivaLancar} bold borderTop />
          {balances.totalAktivaTetap > 0 && <RowItem label="Total Aktiva Tetap" value={balances.totalAktivaTetap} bold />}

          <div style={{ marginTop: '1.5rem', borderTop: '3px double var(--color-border)', paddingTop: '0.75rem' }}>
            <RowItem label="TOTAL AKTIVA" value={balances.totalAktiva} bold />
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
            {balances.kewajibanItems.map(item => (
              <RowItem key={item.name} label={item.name} value={item.value} indent />
            ))}
          </div>

          <RowItem label="Total Kewajiban" value={balances.totalKewajiban} bold borderTop />

          {/* Ekuitas */}
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
              Ekuitas
            </div>
            {balances.ekuitasItems.map(item => (
              <RowItem key={item.name} label={item.name} value={item.value} indent />
            ))}
          </div>

          <RowItem label="Total Ekuitas" value={balances.totalEkuitas} bold borderTop />

          <div style={{ marginTop: '1.5rem', borderTop: '3px double var(--color-border)', paddingTop: '0.75rem' }}>
            <RowItem label="TOTAL KEWAJIBAN + EKUITAS" value={balances.totalKewajiban + balances.totalEkuitas} bold />
          </div>
        </div>
      </div>

      {/* Balance Check */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem' }}>
        {Math.abs(balances.totalAktiva - (balances.totalKewajiban + balances.totalEkuitas)) < 1 ? (
          <div style={{ color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ✅ Neraca seimbang — Total Aktiva = Total Kewajiban + Ekuitas ({fmt(balances.totalAktiva)})
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
