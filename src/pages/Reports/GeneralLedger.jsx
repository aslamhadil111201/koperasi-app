import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Filter, Download, Calendar, Search, X, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useStore } from '../../store/useStore';
import './Reports.css';

const GeneralLedger = () => {
  const journal = useStore((state) => state.journal);
  const currentUser = useStore((state) => state.currentUser);
  const deleteTransaction = useStore((state) => state.deleteTransaction);
  const addTransaction = useStore((state) => state.addTransaction);
  const location = useLocation();
  const navigate = useNavigate();

  // ── Filter State ──────────────────────────────────────────────────────────
  const [searchTerm,   setSearchTerm]   = useState(location.state?.searchStr || '');
  const [filterMonth,  setFilterMonth]  = useState('');   // format: 'YYYY-MM'
  const [filterAkun,   setFilterAkun]   = useState('');
  const [currentPage,  setCurrentPage]  = useState(1);
  const PAGE_SIZE = 50;

  // Reset halaman saat filter berubah
  React.useEffect(() => { setCurrentPage(1); }, [searchTerm, filterMonth, filterAkun]);

  // ── Jurnal Manual Modal ───────────────────────────────────────────────────
  const [showJurnalModal, setShowJurnalModal] = useState(false);
  const [jurnalForm, setJurnalForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    ref: '',
    entries: [
      { account: '', debit: '', credit: '' },
      { account: '', debit: '', credit: '' },
    ]
  });

  const addJurnalRow = () => {
    setJurnalForm(f => ({ ...f, entries: [...f.entries, { account: '', debit: '', credit: '' }] }));
  };

  const removeJurnalRow = (idx) => {
    if (jurnalForm.entries.length <= 2) return;
    setJurnalForm(f => ({ ...f, entries: f.entries.filter((_, i) => i !== idx) }));
  };

  const updateJurnalEntry = (idx, field, value) => {
    setJurnalForm(f => ({
      ...f,
      entries: f.entries.map((e, i) => i === idx ? { ...e, [field]: value } : e)
    }));
  };

  const handleSubmitJurnal = (e) => {
    e.preventDefault();
    const { date, description, ref, entries } = jurnalForm;
    if (!date || !description) return alert('Tanggal dan keterangan wajib diisi.');
    
    const validEntries = entries.filter(e => e.account && (Number(e.debit) > 0 || Number(e.credit) > 0));
    if (validEntries.length < 2) return alert('Minimal 2 baris jurnal dengan akun dan nominal.');
    
    const totalDebit = validEntries.reduce((s, e) => s + (Number(e.debit) || 0), 0);
    const totalCredit = validEntries.reduce((s, e) => s + (Number(e.credit) || 0), 0);
    if (totalDebit !== totalCredit) return alert(`Jurnal tidak seimbang! Debit: ${totalDebit.toLocaleString('id-ID')}, Kredit: ${totalCredit.toLocaleString('id-ID')}`);

    const newId = `JU-${Date.now().toString(36).toUpperCase()}`;
    const journalEntries = validEntries.map(e => ({
      id: newId,
      date,
      description,
      ref: ref || 'MNL',
      debit: Number(e.debit) || 0,
      credit: Number(e.credit) || 0,
      account: e.account,
    }));

    addTransaction(journalEntries);
    setShowJurnalModal(false);
    setJurnalForm({
      date: new Date().toISOString().split('T')[0],
      description: '',
      ref: '',
      entries: [
        { account: '', debit: '', credit: '' },
        { account: '', debit: '', credit: '' },
      ]
    });
    alert('Jurnal manual berhasil dicatat!');
  };

  const accounts = useStore((state) => state.accounts) || [];

  // Unique akun list for dropdown (gabungan dari master data dan jurnal lama)
  const akunList = useMemo(() => {
    const list = new Set([
      ...accounts.map(a => a.name),
      ...journal.map(j => j.account)
    ]);
    return [...list].sort();
  }, [journal, accounts]);

  // Unique months list for dropdown
  const monthList = useMemo(() => {
    const months = [...new Set(journal.map(j => j.date?.slice(0, 7)))].filter(Boolean).sort().reverse();
    return months;
  }, [journal]);

  // ── Filtered Journal ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const result = journal.filter(item => {
      const matchSearch = !searchTerm ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.account?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchMonth = !filterMonth || item.date?.startsWith(filterMonth);
      const matchAkun  = !filterAkun  || item.account === filterAkun;
      return matchSearch && matchMonth && matchAkun;
    });

    // Urutkan dari yang terakhir diinput (index terbesar = paling atas)
    return result.reverse();
  }, [journal, searchTerm, filterMonth, filterAkun]);

  const totalDebit  = filtered.reduce((sum, item) => sum + item.debit,  0);
  const totalCredit = filtered.reduce((sum, item) => sum + item.credit, 0);

  const hasFilter = searchTerm || filterMonth || filterAkun;

  const resetFilters = () => {
    setSearchTerm('');
    setFilterMonth('');
    setFilterAkun('');
    setCurrentPage(1);
  };

  // Pagination helper
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedData = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const PaginationBar = () => {
    return (
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.875rem 1.5rem', borderTop:'1px solid var(--color-border)', fontSize:'0.82rem', background: 'transparent' }}>
        <span style={{ color:'var(--color-text-muted)' }}>
          Halaman {currentPage} dari {totalPages} · {filtered.length} entri
        </span>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <button className="btn btn-secondary"
            style={{ padding:'0.3rem 0.75rem', fontSize:'0.78rem', display:'flex', alignItems:'center', gap:4 }}
            onClick={() => setCurrentPage(p => Math.max(1, p-1))}
            disabled={currentPage === 1}>
            <ChevronLeft size={14} /> Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i+1)
            .filter(p => p===1 || p===totalPages || Math.abs(p-currentPage)<=1)
            .map((p, idx, arr) => (
              <React.Fragment key={p}>
                {idx > 0 && arr[idx-1] !== p-1 && <span style={{ padding:'0.3rem 0.25rem', color:'var(--color-text-muted)' }}>…</span>}
                <button
                  className={`btn ${currentPage===p ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding:'0.3rem 0.625rem', fontSize:'0.78rem', minWidth:32 }}
                  onClick={() => setCurrentPage(p)}>
                  {p}
                </button>
              </React.Fragment>
            ))
          }
          <button className="btn btn-secondary"
            style={{ padding:'0.3rem 0.75rem', fontSize:'0.78rem', display:'flex', alignItems:'center', gap:4 }}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}
            disabled={currentPage === totalPages}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  // Format month label: 'YYYY-MM' → 'Jan 2024'
  const fmtMonth = (ym) => {
    if (!ym) return '';
    const [y, m] = ym.split('-');
    return new Date(y, m - 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
  };

  const handleCetakPDF = () => {
    const today = new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });
    const periodeLabel = filterMonth ? fmtMonth(filterMonth) : 'Semua Periode';
    const akunLabel    = filterAkun  ? filterAkun             : 'Semua Akun';

    // Urutkan dari yang terlama (Ascending) untuk Print
    const printData = [...filtered].sort((a, b) => {
      if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
      return a.id.localeCompare(b.id);
    });

    const rowsHTML = printData.length === 0
      ? `<tr><td colspan="7" style="text-align:center;padding:20px;color:#9ca3af">Tidak ada data jurnal.</td></tr>`
      : printData.map((item, i) => {
          const isDebit = item.debit > 0;
          return `<tr style="background:${i%2===0?'#fff':'#f9fafb'}">
            <td>${item.date}</td>
            <td style="font-family:monospace;font-size:10px">${item.id}</td>
            <td style="font-family:monospace;font-size:10px;color:#6b7280">${item.ref || '-'}</td>
            <td>${item.description}</td>
            <td>${item.account}</td>
            <td style="text-align:center">
              <span style="padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;
                background:${isDebit?'rgba(255,77,0,0.1)':'rgba(16,185,129,0.1)'};
                color:${isDebit?'#FF4D00':'#10b981'}">
                ${isDebit?'Debet':'Kredit'}
              </span>
            </td>
            <td style="text-align:right;color:${isDebit?'#111':'#9ca3af'}">${item.debit>0?'Rp '+item.debit.toLocaleString('id-ID'):'-'}</td>
            <td style="text-align:right;color:${!isDebit?'#111':'#9ca3af'}">${item.credit>0?'Rp '+item.credit.toLocaleString('id-ID'):'-'}</td>
          </tr>`;
        }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Jurnal Umum KPKCG</title>
<style>
  @page { size: A4 landscape; margin: 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid #FF4D00; padding-bottom: 10px; }
  .header h1 { font-size: 18px; font-weight: 800; color: #FF4D00; }
  .header p  { font-size: 10px; color: #6b7280; margin-top: 2px; }
  .meta { font-size: 10px; color: #6b7280; text-align: right; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: #FF4D00; color: #fff; padding: 7px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
  td { padding: 6px 10px; border-bottom: 1px solid #f3f4f6; font-size: 11px; }
  tfoot td { background: #f9fafb; font-weight: 700; border-top: 2px solid #e5e7eb; }
  .footer { margin-top: 16px; text-align: center; font-size: 9px; color: #9ca3af; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>KPKCG — Jurnal Umum</h1>
      <p>Koperasi Pemasaran Karya Cipta Gemilang</p>
      <p>Periode: ${periodeLabel} &nbsp;|&nbsp; Akun: ${akunLabel} &nbsp;|&nbsp; ${filtered.length} entri</p>
    </div>
    <div class="meta">
      <div>Dicetak: ${today}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Tanggal</th>
        <th>No. Bukti</th>
        <th>Ref</th>
        <th>Keterangan</th>
        <th>Akun</th>
        <th style="text-align:center">Tipe</th>
        <th style="text-align:right">Debit (Rp)</th>
        <th style="text-align:right">Kredit (Rp)</th>
      </tr>
    </thead>
    <tbody>${rowsHTML}</tbody>
    <tfoot>
      <tr>
        <td colspan="6" style="text-align:right">TOTAL</td>
        <td style="text-align:right;color:#FF4D00">Rp ${totalDebit.toLocaleString('id-ID')}</td>
        <td style="text-align:right;color:#10b981">Rp ${totalCredit.toLocaleString('id-ID')}</td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">KPKCG — Koperasi Pemasaran Karya Cipta Gemilang &nbsp;|&nbsp; ${today}</div>
  <script>window.onload=function(){window.print();setTimeout(function(){window.close();},500);}</script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=1000,height=700');
    if (!win) { alert('Izinkan pop-up untuk mencetak.'); return; }
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  return (
    <div className="reports-container">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2>Jurnal Umum</h2>
          <p className="text-muted">Catatan historis seluruh transaksi keuangan koperasi.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-primary" onClick={() => setShowJurnalModal(true)}>
            <Plus size={16} /> Jurnal Manual
          </button>
          <button className="btn btn-primary" onClick={handleCetakPDF}>
            <Download size={16} /> Cetak PDF
          </button>
        </div>
      </div>

      {/* Quick Links ke Laporan */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }} onClick={() => navigate('/reports/buku-besar')}>📖 Buku Besar</button>
        <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }} onClick={() => navigate('/reports/arus-kas')}>💰 Arus Kas</button>
        <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }} onClick={() => navigate('/reports/profit-loss')}>📊 Laba / Rugi</button>
        <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }} onClick={() => navigate('/reports/neraca')}>⚖️ Neraca</button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="ledger-filter-bar glass-panel">
        {/* Search */}
        <div className="search-bar" style={{ flex: 1, minWidth: 180 }}>
          <Search size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Cari keterangan, ID, atau akun..."
            className="search-input"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Bulan */}
        <div className="search-bar" style={{ minWidth: 160 }}>
          <Calendar size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <select
            className="search-input"
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            <option value="">Semua Periode</option>
            {monthList.map(m => (
              <option key={m} value={m}>{fmtMonth(m)}</option>
            ))}
          </select>
        </div>

        {/* Akun */}
        <div className="search-bar" style={{ minWidth: 180 }}>
          <Filter size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <select
            className="search-input"
            value={filterAkun}
            onChange={e => setFilterAkun(e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            <option value="">Semua Akun</option>
            {akunList.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* Reset */}
        {hasFilter && (
          <button className="btn btn-secondary" onClick={resetFilters} title="Reset filter">
            <X size={15} /> Reset
          </button>
        )}

        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
          {filtered.length} entri
        </span>
      </div>

      {/* ── Table ── */}
      <div className="glass-panel">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>No. Bukti</th>
                <th>Ref</th>
                <th>Keterangan</th>
                <th>Akun</th>
                <th style={{ textAlign: 'center', width: 60 }}>Tipe</th>
                <th className="text-right">Debit (Rp)</th>
                <th className="text-right">Kredit (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, index) => {
                const isDebit = item.debit > 0;
                return (
                  <tr key={`${item.id}-${index}`}>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                      {item.date}
                      {['aslamhadilmatin', 'uci', 'surtini', 'indah'].includes(currentUser?.username) && item.timestamp && (
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '2px' }}>
                          {new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {item.id}
                        {['aslamhadilmatin', 'uci', 'surtini', 'indah'].includes(currentUser?.username) && item.id !== 'JU-INIT' && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus seluruh jurnal dan riwayat untuk transaksi ${item.id}?\n\nCATATAN: Stok barang tidak otomatis kembali, harap sesuaikan di menu Inventory.`)) {
                                deleteTransaction(item.id);
                              }
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: 0, display: 'flex' }}
                            title="Batalkan / Hapus Transaksi Ini"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {item.ref || '-'}
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {item.description}
                      {item.isClosingEntry && (
                        <span style={{ marginLeft: 8, fontSize: '0.65rem', padding: '0.15rem 0.4rem', background: 'var(--color-danger)', color: 'white', borderRadius: 999 }}>
                          JURNAL PENUTUP
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      {item.account}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.65rem',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        background: isDebit ? 'rgba(255,77,0,0.1)' : 'rgba(16,185,129,0.1)',
                        color: isDebit ? 'var(--color-primary)' : 'var(--color-success)',
                        border: `1px solid ${isDebit ? 'rgba(255,77,0,0.2)' : 'rgba(16,185,129,0.2)'}`,
                        whiteSpace: 'nowrap',
                      }}>
                        {isDebit ? 'Debet' : 'Kredit'}
                      </span>
                    </td>
                    <td className="text-right" style={{ fontSize: '0.875rem' }}>
                      {item.debit  > 0 ? item.debit.toLocaleString('id-ID')  : '-'}
                    </td>
                    <td className="text-right" style={{ fontSize: '0.875rem' }}>
                      {item.credit > 0 ? item.credit.toLocaleString('id-ID') : '-'}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    Tidak ada data jurnal ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--color-surface-hover)', fontWeight: 'bold' }}>
                <td colSpan="6" className="text-right p-4">Total</td>
                <td className="text-right text-primary p-4">{totalDebit.toLocaleString('id-ID')}</td>
                <td className="text-right text-success p-4">{totalCredit.toLocaleString('id-ID')}</td>
              </tr>
            </tfoot>
          </table>
          <PaginationBar />
        </div>
      </div>

      {/* Modal Jurnal Manual */}
      {showJurnalModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowJurnalModal(false)}>
          <div className="modal-content" style={{ maxWidth: 650 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Buat Jurnal Manual</h3>
              <button className="modal-close-btn" onClick={() => setShowJurnalModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmitJurnal}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Tanggal</label>
                    <input type="date" className="form-control" value={jurnalForm.date} onChange={e => setJurnalForm(f => ({ ...f, date: e.target.value }))} required />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Keterangan</label>
                    <input type="text" className="form-control" placeholder="Deskripsi transaksi" value={jurnalForm.description} onChange={e => setJurnalForm(f => ({ ...f, description: e.target.value }))} required />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Ref (Opsional)</label>
                    <input type="text" className="form-control" placeholder="BKK / BKM / MNL" value={jurnalForm.ref} onChange={e => setJurnalForm(f => ({ ...f, ref: e.target.value }))} />
                  </div>
                </div>

                <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--color-border)' }}>
                        <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Akun</th>
                        <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', width: 140 }}>Debit (Rp)</th>
                        <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', width: 140 }}>Kredit (Rp)</th>
                        <th style={{ width: 36 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {jurnalForm.entries.map((entry, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '0.4rem 0.5rem' }}>
                            <select className="form-control" style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }} value={entry.account} onChange={e => updateJurnalEntry(idx, 'account', e.target.value)} required>
                              <option value="">-- Pilih Akun --</option>
                              {accounts.sort((a,b) => a.id.localeCompare(b.id, undefined, {numeric:true})).map(a => (
                                <option key={a.id} value={a.name}>{a.id} - {a.name}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '0.4rem 0.5rem' }}>
                            <input type="number" min="0" className="form-control" style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem', textAlign: 'right' }} placeholder="0" value={entry.debit} onChange={e => updateJurnalEntry(idx, 'debit', e.target.value)} />
                          </td>
                          <td style={{ padding: '0.4rem 0.5rem' }}>
                            <input type="number" min="0" className="form-control" style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem', textAlign: 'right' }} placeholder="0" value={entry.credit} onChange={e => updateJurnalEntry(idx, 'credit', e.target.value)} />
                          </td>
                          <td style={{ padding: '0.4rem 0.25rem' }}>
                            {jurnalForm.entries.length > 2 && (
                              <button type="button" onClick={() => removeJurnalRow(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 2 }}>
                                <X size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <button type="button" onClick={addJurnalRow} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Plus size={14} /> Tambah Baris
                          </button>
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 700, fontSize: '0.82rem' }}>
                          {(jurnalForm.entries.reduce((s, e) => s + (Number(e.debit) || 0), 0)).toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 700, fontSize: '0.82rem' }}>
                          {(jurnalForm.entries.reduce((s, e) => s + (Number(e.credit) || 0), 0)).toLocaleString('id-ID')}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {(() => {
                  const td = jurnalForm.entries.reduce((s, e) => s + (Number(e.debit) || 0), 0);
                  const tc = jurnalForm.entries.reduce((s, e) => s + (Number(e.credit) || 0), 0);
                  const balanced = td === tc && td > 0;
                  return (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: balanced ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
                      {balanced ? '✓ Jurnal seimbang' : td > 0 || tc > 0 ? `✗ Tidak seimbang (selisih: Rp ${Math.abs(td - tc).toLocaleString('id-ID')})` : ''}
                    </div>
                  );
                })()}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowJurnalModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary"><Plus size={14} /> Simpan Jurnal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralLedger;
