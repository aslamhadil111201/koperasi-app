import React, { useState, useMemo } from 'react';
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign, Plus, X, FileText } from 'lucide-react';
import { useStore } from '../../store/useStore';
import './Reports.css';



const ProfitLoss = () => {
  const journal    = useStore((state) => state.journal);
  const accounts   = useStore((state) => state.accounts) || [];
  const addExpense = useStore((state) => state.addExpense);
  const addIncome  = useStore((state) => state.addIncome);

  const EXPENSE_ACCOUNTS = useMemo(() => accounts.filter(a => a.category.includes('Beban')).map(a => a.name), [accounts]);
  const INCOME_ACCOUNTS = useMemo(() => accounts.filter(a => a.category.includes('Pendapatan')).map(a => a.name), [accounts]);

  // ── Period Filter ─────────────────────────────────────────────────────────
  const monthOptions = useMemo(() => {
    const months = [...new Set(journal.map(j => j.date?.slice(0, 7)))].filter(Boolean).sort().reverse();
    return months;
  }, [journal]);

  const [selectedMonth, setSelectedMonth] = useState('');

  const fmtMonth = (ym) => {
    if (!ym) return 'Semua Periode';
    const [y, m] = ym.split('-');
    return new Date(y, m - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  const filtered = useMemo(() => {
    // Kecualikan jurnal penutup agar Laba Rugi tetap menampilkan performa asli
    const activeJournal = journal.filter(e => !e.isClosingEntry);
    if (!selectedMonth) return activeJournal;
    return activeJournal.filter(e => e.date?.startsWith(selectedMonth));
  }, [journal, selectedMonth]);

  // ── Modal State ───────────────────────────────────────────────────────────
  const [modalType, setModalType]   = useState(null); // 'expense' | 'income' | null
  const [form, setForm]             = useState({ akun: '', description: '', amount: '' });
  const [formError, setFormError]   = useState('');

  const openModal = (type) => {
    setModalType(type);
    setForm({ akun: type === 'expense' ? EXPENSE_ACCOUNTS[0] : INCOME_ACCOUNTS[0], description: '', amount: '' });
    setFormError('');
  };

  const closeModal = () => { setModalType(null); setFormError(''); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!form.akun || !form.description.trim()) return setFormError('Keterangan wajib diisi.');
    if (!amount || amount <= 0) return setFormError('Jumlah harus lebih dari 0.');
    if (modalType === 'expense') addExpense(form.akun, form.description, amount);
    else addIncome(form.akun, form.description, amount);
    closeModal();
  };

  // ── Calculations (from filtered journal) ─────────────────────────────────
  const sumCredit = (keyword) =>
    filtered.filter(e => e.account.includes(keyword)).reduce((s, e) => s + e.credit, 0);
  const sumDebit = (keyword) =>
    filtered.filter(e => e.account.includes(keyword)).reduce((s, e) => s + e.debit, 0);

  // Revenue
  const revenues = INCOME_ACCOUNTS.map(akun => ({
    akun,
    value: filtered.filter(e => e.account === akun).reduce((s, e) => s + e.credit, 0),
  }));
  const totalRevenue = revenues.reduce((s, r) => s + r.value, 0);

  // HPP — dari kategori Harga Pokok Penjualan
  const hppAccounts = [...new Set([...accounts.filter(a => a.category === 'Harga Pokok Penjualan').map(a => a.name), ...filtered.filter(e => e.account.startsWith('Harga Pokok')).map(e => e.account)])].sort();
  const hppItems = hppAccounts.map(akun => ({
    akun,
    value: filtered.filter(e => e.account === akun).reduce((s, e) => s + e.debit, 0),
  }));
  const totalHPP = hppItems.reduce((s, h) => s + h.value, 0);

  // Laba Kotor = Pendapatan - HPP
  const grossProfit = totalRevenue - totalHPP;

  // Expenses — dari kategori Beban
  const bebanAccounts = [...new Set([...EXPENSE_ACCOUNTS, ...filtered.filter(e => e.account.startsWith('Beban')).map(e => e.account)])].sort();
  const expenses = bebanAccounts.map(akun => ({
    akun,
    value: filtered.filter(e => e.account === akun).reduce((s, e) => s + e.debit, 0),
  }));
  const totalExpense = expenses.reduce((s, ex) => s + ex.value, 0);

  // Laba Bersih = Laba Kotor - Beban
  const netProfit = grossProfit - totalExpense;
  const isEmpty   = totalRevenue === 0 && totalExpense === 0 && totalHPP === 0;

  const fmt = (n) => `Rp ${n.toLocaleString('id-ID')}`;

  const handleCetak = () => {
    const todayLabel = new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });
    const periodeLabel = selectedMonth ? fmtMonth(selectedMonth) : 'Semua Periode';

    const revenueRows = revenues.filter(r => r.value > 0).map(r =>
      `<tr><td style="padding-left:20px">${r.akun}</td><td style="text-align:right">Rp ${r.value.toLocaleString('id-ID')}</td></tr>`
    ).join('') || `<tr><td colspan="2" style="color:#9ca3af;padding-left:20px">Belum ada pendapatan.</td></tr>`;

    const hppRows = hppItems.map(h =>
      `<tr><td style="padding-left:20px">${h.akun}</td><td style="text-align:right;color:#f59e0b">Rp ${h.value.toLocaleString('id-ID')}</td></tr>`
    ).join('') || `<tr><td colspan="2" style="color:#9ca3af;padding-left:20px">Belum ada HPP.</td></tr>`;

    const expenseRows = expenses.map(ex =>
      `<tr><td style="padding-left:20px">${ex.akun}</td><td style="text-align:right;color:#ef4444">Rp ${ex.value.toLocaleString('id-ID')}</td></tr>`
    ).join('') || `<tr><td colspan="2" style="color:#9ca3af;padding-left:20px">Belum ada beban.</td></tr>`;

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Laba Rugi KPKCG</title>
<style>
  @page { size: A4; margin: 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; }
  .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #FF4D00; padding-bottom: 12px; }
  .header h1 { font-size: 16px; font-weight: 800; }
  .header h2 { font-size: 14px; font-weight: 700; margin-top: 4px; }
  .header p  { font-size: 10px; color: #6b7280; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  .section-title td { font-weight: 700; font-size: 13px; padding: 10px 0 4px; border-bottom: 2px solid #FF4D00; color: #FF4D00; }
  td { padding: 5px 8px; }
  .total-row td { font-weight: 700; border-top: 1px dashed #e5e7eb; padding-top: 6px; }
  .gross-row { background: #fff3ee; }
  .gross-row td { font-weight: 700; font-size: 13px; padding: 8px; border-radius: 4px; }
  .net-row td { font-weight: 800; font-size: 15px; padding: 10px 8px; border-top: 3px solid #111; }
  .text-right { text-align: right; }
  .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px; }
</style>
</head>
<body>
  <div class="header">
    <h1>KOPERASI PEMASARAN KARYA CIPTA GEMILANG</h1>
    <h2>LAPORAN LABA / RUGI</h2>
    <p>Periode: ${periodeLabel}</p>
    <p>Dicetak: ${todayLabel}</p>
  </div>

  <table>
    <tr class="section-title"><td colspan="2">PENDAPATAN</td></tr>
    ${revenueRows}
    <tr class="total-row">
      <td>Total Pendapatan</td>
      <td class="text-right" style="color:#10b981">Rp ${totalRevenue.toLocaleString('id-ID')}</td>
    </tr>

    <tr class="section-title"><td colspan="2">HARGA POKOK PENJUALAN (HPP)</td></tr>
    ${hppRows}
    <tr class="total-row">
      <td>Total HPP</td>
      <td class="text-right" style="color:#f59e0b">Rp ${totalHPP.toLocaleString('id-ID')}</td>
    </tr>

    <tr style="height:8px"><td colspan="2"></td></tr>
    <tr class="gross-row">
      <td>LABA KOTOR (Pendapatan − HPP)</td>
      <td class="text-right" style="color:${grossProfit>=0?'#10b981':'#ef4444'}">Rp ${grossProfit.toLocaleString('id-ID')}</td>
    </tr>

    <tr class="section-title"><td colspan="2">BEBAN OPERASIONAL</td></tr>
    ${expenseRows}
    <tr class="total-row">
      <td>Total Beban Operasional</td>
      <td class="text-right" style="color:#ef4444">Rp ${totalExpense.toLocaleString('id-ID')}</td>
    </tr>

    <tr style="height:8px"><td colspan="2"></td></tr>
    <tr class="net-row">
      <td>${netProfit >= 0 ? 'LABA BERSIH' : 'RUGI BERSIH'}</td>
      <td class="text-right" style="color:${netProfit>=0?'#FF4D00':'#ef4444'}">
        Rp ${Math.abs(netProfit).toLocaleString('id-ID')}
      </td>
    </tr>
    ${totalRevenue > 0 ? `<tr><td style="color:#6b7280;font-size:10px">Margin Laba Bersih</td>
      <td class="text-right" style="color:#6b7280;font-size:10px">${((netProfit/totalRevenue)*100).toFixed(1)}%</td></tr>` : ''}
  </table>

  <div class="footer">KPKCG — Koperasi Pemasaran Karya Cipta Gemilang &nbsp;|&nbsp; ${todayLabel}</div>

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

      {/* ── Header ── */}
      <div className="flex justify-between items-center">
        <div>
          <h2>Laporan Laba / Rugi</h2>
          <p className="text-muted">
            {selectedMonth ? `Periode: ${fmtMonth(selectedMonth)}` : 'Semua periode berjalan'}
          </p>
        </div>
        <div className="flex gap-3" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Pilih Periode */}
          <div className="search-bar" style={{ minWidth: 200 }}>
            <Calendar size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            <select
              className="search-input"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              <option value="">Semua Periode</option>
              {monthOptions.map(m => (
                <option key={m} value={m}>{fmtMonth(m)}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-secondary" onClick={() => openModal('income')}>
            <Plus size={15} /> Catat Pendapatan
          </button>
          <button className="btn btn-secondary" style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--color-danger)', borderColor: 'rgba(239,68,68,0.2)' }} onClick={() => openModal('expense')}>
            <Plus size={15} /> Catat Beban
          </button>
          <button className="btn btn-primary" onClick={handleCetak}>
            <Download size={15} /> Cetak
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} style={{ color: 'var(--color-success)' }} />
            <span className="text-muted text-sm">Total Pendapatan</span>
          </div>
          <h3 style={{ color: 'var(--color-success)', fontSize: '1.3rem' }}>{fmt(totalRevenue)}</h3>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={18} style={{ color: 'var(--color-warning)' }} />
            <span className="text-muted text-sm">Total HPP</span>
          </div>
          <h3 style={{ color: 'var(--color-warning)', fontSize: '1.3rem' }}>{fmt(totalHPP)}</h3>
          <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>Harga Pokok Penjualan</p>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={18} style={{ color: 'var(--color-danger)' }} />
            <span className="text-muted text-sm">Total Beban</span>
          </div>
          <h3 style={{ color: 'var(--color-danger)', fontSize: '1.3rem' }}>{fmt(totalExpense)}</h3>
        </div>
        <div className="glass-panel p-4" style={{ border: `2px solid ${netProfit >= 0 ? 'var(--color-primary)' : 'var(--color-danger)'}` }}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={18} style={{ color: netProfit >= 0 ? 'var(--color-primary)' : 'var(--color-danger)' }} />
            <span className="text-sm font-bold" style={{ color: netProfit >= 0 ? 'var(--color-primary)' : 'var(--color-danger)' }}>
              {netProfit >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}
            </span>
          </div>
          <h3 style={{ color: netProfit >= 0 ? 'var(--color-primary)' : 'var(--color-danger)', fontSize: '1.3rem' }}>
            {fmt(Math.abs(netProfit))}
          </h3>
          {!isEmpty && (
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Margin: {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%
            </p>
          )}
        </div>
      </div>

      {/* ── Empty State ── */}
      {isEmpty && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <FileText size={48} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
          <h3 style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Belum Ada Data Transaksi</h3>
          <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
            Laporan akan terisi otomatis setelah ada transaksi penjualan.<br />
            Atau tambahkan beban/pendapatan manual di bawah ini.
          </p>
          <div className="flex gap-3" style={{ justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => openModal('income')}>
              <Plus size={15} /> Catat Pendapatan
            </button>
            <button className="btn btn-primary" onClick={() => openModal('expense')}>
              <Plus size={15} /> Catat Beban
            </button>
          </div>
        </div>
      )}

      {/* ── Detail Laporan ── */}
      {!isEmpty && (
        <div className="glass-panel" style={{ padding: '2rem' }}>

          {/* Pendapatan */}
          <div style={{ marginBottom: '2rem' }}>
            <div className="flex justify-between items-center" style={{ borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              <h3>Pendapatan</h3>
              <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }} onClick={() => openModal('income')}>
                <Plus size={13} /> Tambah
              </button>
            </div>
            {revenues.filter(r => r.value > 0).length === 0 ? (
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>Belum ada pendapatan dicatat.</p>
            ) : (
              revenues.filter(r => r.value > 0).map(r => (
                <div key={r.akun} className="flex justify-between mb-2" style={{ fontSize: '0.9rem' }}>
                  <span>{r.akun}</span>
                  <span style={{ fontWeight: 500 }}>{fmt(r.value)}</span>
                </div>
              ))
            )}
            <div className="flex justify-between font-bold mt-4 pt-2" style={{ borderTop: '1px dashed var(--color-border)', fontSize: '0.95rem' }}>
              <span>Total Pendapatan</span>
              <span style={{ color: 'var(--color-success)' }}>{fmt(totalRevenue)}</span>
            </div>
          </div>

          {/* HPP */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              <h3>Harga Pokok Penjualan (HPP)</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                Harga beli / modal barang yang terjual
              </p>
            </div>
            {hppItems.length === 0 ? (
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>Belum ada HPP tercatat. HPP otomatis tercatat saat transaksi penjualan.</p>
            ) : (
              hppItems.map(h => (
                <div key={h.akun} className="flex justify-between mb-2" style={{ fontSize: '0.9rem' }}>
                  <span>{h.akun}</span>
                  <span style={{ fontWeight: 500, color: 'var(--color-warning)' }}>{fmt(h.value)}</span>
                </div>
              ))
            )}
            <div className="flex justify-between font-bold mt-4 pt-2" style={{ borderTop: '1px dashed var(--color-border)', fontSize: '0.95rem' }}>
              <span>Total HPP</span>
              <span style={{ color: 'var(--color-warning)' }}>{fmt(totalHPP)}</span>
            </div>
          </div>

          {/* Laba Kotor */}
          <div style={{ background: grossProfit >= 0 ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', borderRadius: 'var(--radius-md)', padding: '0.875rem 1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Laba Kotor</span>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.15rem 0 0' }}>
                Total Pendapatan − HPP = {fmt(totalRevenue)} − {fmt(totalHPP)}
              </p>
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: grossProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {fmt(grossProfit)}
            </span>
          </div>

          {/* Beban */}
          <div>
            <div className="flex justify-between items-center" style={{ borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              <h3>Beban Operasional</h3>
              <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem', color: 'var(--color-danger)' }} onClick={() => openModal('expense')}>
                <Plus size={13} /> Tambah
              </button>
            </div>
            {expenses.length === 0 ? (
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>Belum ada beban dicatat.</p>
            ) : (
              expenses.map(ex => (
                <div key={ex.akun} className="flex justify-between mb-2" style={{ fontSize: '0.9rem' }}>
                  <span>{ex.akun}</span>
                  <span style={{ fontWeight: 500 }}>{fmt(ex.value)}</span>
                </div>
              ))
            )}
            <div className="flex justify-between font-bold mt-4 pt-2" style={{ borderTop: '1px dashed var(--color-border)', fontSize: '0.95rem' }}>
              <span>Total Beban Operasional</span>
              <span style={{ color: 'var(--color-danger)' }}>{fmt(totalExpense)}</span>
            </div>
          </div>

          {/* Net */}
          <div style={{ borderTop: '3px solid var(--color-border)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
            <div className="flex justify-between" style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
              <span>Laba Kotor</span><span>{fmt(grossProfit)}</span>
            </div>
            <div className="flex justify-between" style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
              <span>Beban Operasional</span><span>({fmt(totalExpense)})</span>
            </div>
            <div className="flex justify-between" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              <span style={{ color: netProfit >= 0 ? 'var(--color-primary)' : 'var(--color-danger)' }}>
                {netProfit >= 0 ? '✅ Laba Bersih' : '❌ Rugi Bersih'}
              </span>
              <span style={{ color: netProfit >= 0 ? 'var(--color-primary)' : 'var(--color-danger)' }}>
                {fmt(Math.abs(netProfit))}
              </span>
            </div>
            <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.5rem' }}>
              {selectedMonth ? `* Periode: ${fmtMonth(selectedMonth)} · ${filtered.length} entri jurnal` : `* Semua periode · ${filtered.length} entri jurnal`}
            </p>
          </div>
        </div>
      )}

      {/* ── Modal ── */}
      {modalType && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>{modalType === 'expense' ? '📋 Catat Beban' : '💰 Catat Pendapatan'}</h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Akun */}
              <div>
                <label style={{ fontSize: '0.83rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                  {modalType === 'expense' ? 'Jenis Beban' : 'Jenis Pendapatan'}
                </label>
                <select
                  className="search-input"
                  style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.6rem 0.875rem', background: 'var(--color-surface)', cursor: 'pointer' }}
                  value={form.akun}
                  onChange={e => setForm(f => ({ ...f, akun: e.target.value }))}
                >
                  {(modalType === 'expense' ? EXPENSE_ACCOUNTS : INCOME_ACCOUNTS).map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              {/* Keterangan */}
              <div>
                <label style={{ fontSize: '0.83rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Keterangan</label>
                <input
                  type="text"
                  placeholder="Contoh: Gaji bulan Mei 2026"
                  style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.6rem 0.875rem', background: 'var(--color-surface)', outline: 'none', fontSize: '0.875rem', color: 'var(--color-text-main)', boxSizing: 'border-box' }}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              {/* Jumlah */}
              <div>
                <label style={{ fontSize: '0.83rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Jumlah (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  min="1"
                  style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.6rem 0.875rem', background: 'var(--color-surface)', outline: 'none', fontSize: '0.875rem', color: 'var(--color-text-main)', boxSizing: 'border-box' }}
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                />
              </div>
              {formError && <p style={{ color: 'var(--color-danger)', fontSize: '0.82rem' }}>{formError}</p>}
              <div className="flex gap-3" style={{ justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Batal</button>
                <button type="submit" className="btn btn-primary">
                  {modalType === 'expense' ? 'Simpan Beban' : 'Simpan Pendapatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitLoss;
