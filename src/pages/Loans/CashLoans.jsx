import React, { useState } from 'react';
import { Search, Plus, FileText, CheckCircle, XCircle, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../../store/useStore';
import SearchableSelect from '../../components/SearchableSelect';
import './Loans.css';

const fmt = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

const CashLoans = () => {
  const cashLoans       = useStore((state) => state.cashLoans);
  const journal         = useStore((state) => state.journal);
  const accounts        = useStore((state) => state.accounts) || [];
  const approveCashLoan = useStore((state) => state.approveCashLoan);
  const payCashLoan     = useStore((state) => state.payCashLoan);
  const addCashLoan     = useStore((state) => state.addCashLoan);
  const members         = useStore((state) => state.members);

  const isKasAccount = (name) => {
    if (!name) return false;
    const lower = name.toLowerCase().trim();
    const kasBankName = (accounts.find(a => a.id === '101')?.name || '').toLowerCase().trim();
    if (kasBankName && lower === kasBankName) return true;
    return lower.includes('kas bank') || lower.includes('kas kecil') || lower.includes('kas ');
  };

  const today    = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const thisMonth = todayStr.slice(0, 7);

  const [searchTerm,   setSearchTerm]   = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [showModal,    setShowModal]    = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showDetail,   setShowDetail]   = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [payAmount,    setPayAmount]    = useState(0);
  const [payDate,      setPayDate]      = useState(todayStr);
  const [currentPage,  setCurrentPage]  = useState(1);
  const PAGE_SIZE = 10;

  const [loanForm, setLoanForm] = useState({
    memberId: '', name: '', amount: 0, tenor: 12, interest: 1.5,
    applyDate: todayStr, takeDate: ''
  });

  const handleAddLoan = (e) => {
    e.preventDefault();
    if (!loanForm.memberId) return alert('Pilih anggota!');
    addCashLoan(loanForm);
    setShowModal(false);
    setLoanForm({ memberId: '', name: '', amount: 0, tenor: 12, interest: 1.5, applyDate: todayStr, takeDate: '' });
  };

  const handleApprove = (loan) => {
    const txDate = window.prompt('Masukkan tanggal pencairan (YYYY-MM-DD):', todayStr);
    if (!txDate) return;
    if (window.confirm(`Setujui pinjaman ${fmt(loan.amount)} untuk ${loan.name} pada tanggal ${txDate}?\nKas akan otomatis berkurang.`)) {
      approveCashLoan(loan.id, txDate);
    }
  };

  const openPayModal = (loan) => {
    setSelectedLoan(loan);
    const cicilan = Math.ceil(loan.amount / loan.tenor);
    setPayAmount(Math.min(cicilan, loan.remainingAmount));
    setPayDate(todayStr);
    setShowPayModal(true);
  };

  const handlePay = (e) => {
    e.preventDefault();
    if (!selectedLoan) return;
    const amount = Number(payAmount);
    if (amount <= 0) return alert('Jumlah bayar harus lebih dari 0');
    if (amount > selectedLoan.remainingAmount) return alert('Jumlah melebihi sisa tagihan!');
    payCashLoan(selectedLoan.id, amount, payDate);
    setShowPayModal(false);
    setSelectedLoan(null);
  };

  const filteredLoans = cashLoans.filter(loan => {
    const matchSearch = loan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        loan.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'Semua' || loan.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Reset halaman saat filter/search berubah
  React.useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus]);
  const totalPages = Math.ceil(filteredLoans.length / PAGE_SIZE);
  const pagedLoans = filteredLoans.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const getStatusBadge = (status) => {
    const map = {
      Active:    <span className="badge badge-success" style={{ display:'flex',alignItems:'center',gap:4 }}><CheckCircle size={12}/> Aktif</span>,
      Pending:   <span className="badge badge-warning" style={{ display:'flex',alignItems:'center',gap:4 }}><Clock size={12}/> Menunggu</span>,
      Completed: <span className="badge badge-primary" style={{ display:'flex',alignItems:'center',gap:4 }}><CheckCircle size={12}/> Lunas</span>,
      Rejected:  <span className="badge badge-danger"  style={{ display:'flex',alignItems:'center',gap:4 }}><XCircle size={12}/> Ditolak</span>,
    };
    return map[status] || <span className="badge">{status}</span>;
  };

  const totalActive        = cashLoans.filter(l => l.status === 'Active').reduce((s,l) => s + l.remainingAmount, 0);
  const totalPending       = cashLoans.filter(l => l.status === 'Pending').reduce((s,l) => s + l.amount, 0);
  const pencairanBulanIni  = journal
    .filter(j => j.account.toLowerCase().includes('piutang') && j.debit > 0 && j.date.startsWith(thisMonth))
    .reduce((s,j) => s + j.debit, 0);
  const angsuranBulanIni   = journal
    .filter(j => isKasAccount(j.account) && j.debit > 0 && j.date.startsWith(thisMonth) &&
                 j.description.toLowerCase().includes('angsuran pinjaman'))
    .reduce((s,j) => s + j.debit, 0);

  return (
    <div className="loans-container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2>Pinjaman Tunai</h2>
          <p className="text-muted">Kelola pengajuan dan angsuran pinjaman tunai anggota.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Pengajuan Baru
        </button>
      </div>

      {/* Filter Chips */}
      <div className="filter-chips">
        {['Semua','Active','Pending','Completed','Rejected'].map(s => (
          <button key={s}
            className={`filter-chip chip-${s==='Semua'?'all':s==='Active'?'active':s==='Pending'?'pending':s==='Completed'?'done':'reject'} ${filterStatus===s?'active':''}`}
            onClick={() => setFilterStatus(s)}>
            {s==='Semua'?'Semua':s==='Active'?'✓ Aktif':s==='Pending'?'⏳ Menunggu':s==='Completed'?'✔ Lunas':'✕ Ditolak'}
          </button>
        ))}
        <span style={{ fontSize:'0.78rem', color:'var(--color-text-muted)', marginLeft:'0.25rem' }}>
          {filteredLoans.length} data
        </span>
      </div>

      {/* Stat Cards */}
      <div className="glass-panel mb-6">
        <div className="grid" style={{ gridTemplateColumns:'repeat(4,1fr)', gap:'1rem' }}>
          {[
            { label: 'Total Pinjaman Aktif',  value: totalActive,        color: 'var(--color-primary)' },
            { label: 'Menunggu Persetujuan',   value: totalPending,       color: 'var(--color-warning)' },
            { label: 'Pencairan Bulan Ini',    value: pencairanBulanIni,  color: 'var(--color-success)' },
            { label: 'Angsuran Bulan Ini',     value: angsuranBulanIni,   color: 'var(--color-secondary)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="stat-card p-4 rounded-lg">
              <p className="text-muted text-sm">{label}</p>
              <h3 style={{ color }}>{fmt(value)}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel">
        <div className="flex justify-between items-center mb-6">
          <div className="search-bar" style={{ width:'300px' }}>
            <Search size={18} className="text-muted" />
            <input type="text" placeholder="Cari ID Pinjaman atau Nama..." className="search-input"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID Pinjaman</th>
                <th>Nama Anggota</th>
                <th>Tgl Pengajuan</th>
                <th>Tgl Pengambilan</th>
                <th>Plafon</th>
                <th>Cicilan/Bln</th>
                <th>Tenor</th>
                <th>Bunga</th>
                <th>Sisa Tagihan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pagedLoans.map((loan) => {
                const cicilan = loan.tenor > 0 ? Math.ceil(loan.amount / loan.tenor) : 0;
                return (
                  <tr key={loan.id}>
                    <td><span className="cell-id">{loan.id}</span></td>
                    <td>
                      <div>{loan.name}</div>
                      <div style={{ fontSize:'0.75rem', color:'var(--color-text-muted)' }}>{loan.memberId}</div>
                    </td>
                    <td style={{ fontSize:'0.82rem', color:'var(--color-text-muted)' }}>{loan.applyDate || '—'}</td>
                    <td style={{ fontSize:'0.82rem', color:'var(--color-text-muted)' }}>{loan.takeDate || '—'}</td>
                    <td>{fmt(loan.amount)}</td>
                    <td style={{ color:'var(--color-secondary)', fontWeight:600 }}>{fmt(cicilan)}</td>
                    <td>{loan.tenor} Bln</td>
                    <td>{loan.interest}%</td>
                    <td className="font-medium text-primary">{fmt(loan.remainingAmount)}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {getStatusBadge(loan.status)}
                        {loan.installments && loan.installments.some(s => s.status === 'Pending' && s.dueDate < new Date().toISOString().split('T')[0]) && (
                          <span className="badge badge-danger" style={{ fontSize: '0.65rem', padding: '2px 4px' }}>Nunggak</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-secondary"
                          style={{ padding:'0.3rem 0.6rem', fontSize:'0.75rem' }}
                          onClick={() => { setSelectedLoan(loan); setShowDetail(true); }}
                          title="Detail">
                          <FileText size={14} />
                        </button>
                        {loan.status === 'Active' && (
                          <button onClick={() => openPayModal(loan)} className="btn btn-primary"
                            style={{ padding:'0.25rem 0.75rem', fontSize:'0.8rem' }}>
                            Bayar
                          </button>
                        )}
                        {loan.status === 'Pending' && (
                          <button onClick={() => handleApprove(loan)} className="btn btn-success"
                            style={{ padding:'0.25rem 0.75rem', fontSize:'0.8rem', background:'var(--color-success)', color:'white' }}>
                            Setujui
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredLoans.length === 0 && (
            <div className="text-center p-6 text-muted">Tidak ada data pinjaman ditemukan.</div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.875rem 1rem', borderTop:'1px solid var(--color-border)', fontSize:'0.82rem' }}>
              <span style={{ color:'var(--color-text-muted)' }}>
                Halaman {currentPage} dari {totalPages} · {filteredLoans.length} data
              </span>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <button className="btn btn-secondary"
                  style={{ padding:'0.3rem 0.75rem', fontSize:'0.78rem', display:'flex', alignItems:'center', gap:4 }}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}>
                  <ChevronLeft size={14} /> Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx-1] !== p - 1 && <span style={{ padding:'0.3rem 0.25rem', color:'var(--color-text-muted)' }}>…</span>}
                      <button
                        className={`btn ${currentPage === p ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding:'0.3rem 0.625rem', fontSize:'0.78rem', minWidth:32 }}
                        onClick={() => setCurrentPage(p)}>
                        {p}
                      </button>
                    </React.Fragment>
                  ))
                }
                <button className="btn btn-secondary"
                  style={{ padding:'0.3rem 0.75rem', fontSize:'0.78rem', display:'flex', alignItems:'center', gap:4 }}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}>
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Pengajuan ── */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content glass-panel" style={{ width:'100%', maxWidth:'500px' }}>
            <div className="modal-header">
              <h3><Plus size={18} /> Pengajuan Pinjaman Tunai</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleAddLoan}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Anggota</label>
                  <SearchableSelect
                    options={members.map(m => ({ value: m.id, label: `${m.id} - ${m.name}` }))}
                    value={loanForm.memberId}
                    onChange={(val) => {
                      const m = members.find(m => m.id === val);
                      setLoanForm({...loanForm, memberId: val, name: m?.name || ''});
                    }}
                    placeholder="Ketik untuk mencari anggota..."
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Tgl Pengajuan</label>
                    <input type="date" className="form-control" value={loanForm.applyDate}
                      onChange={(e) => setLoanForm({...loanForm, applyDate: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tgl Pengambilan</label>
                    <input type="date" className="form-control" value={loanForm.takeDate}
                      onChange={(e) => setLoanForm({...loanForm, takeDate: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Plafon Pinjaman (Rp)</label>
                  <input type="number" className="form-control" value={loanForm.amount}
                    onChange={(e) => setLoanForm({...loanForm, amount: Number(e.target.value)})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Tenor (Bulan)</label>
                    <input type="number" className="form-control" value={loanForm.tenor}
                      onChange={(e) => setLoanForm({...loanForm, tenor: Number(e.target.value)})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bunga (%/bln)</label>
                    <input type="number" step="0.1" className="form-control" value={loanForm.interest}
                      onChange={(e) => setLoanForm({...loanForm, interest: Number(e.target.value)})} required />
                  </div>
                </div>
                {loanForm.amount > 0 && loanForm.tenor > 0 && (
                  <div style={{ background:'rgba(6,182,212,0.06)', border:'1px solid rgba(6,182,212,0.2)', borderRadius:'var(--radius-md)', padding:'0.875rem 1rem', fontSize:'0.85rem' }}>
                    <div style={{ fontWeight:700, color:'var(--color-secondary)', marginBottom:'0.5rem' }}>Estimasi Cicilan</div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.25rem' }}>
                      <span>Cicilan pokok/bulan</span>
                      <span style={{ fontWeight:600 }}>{fmt(Math.ceil(loanForm.amount / loanForm.tenor))}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span>Total tenor</span><span>{loanForm.tenor} bulan</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Ajukan Pinjaman</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Detail ── */}
      {showDetail && selectedLoan && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowDetail(false)}>
          <div className="modal-content glass-panel" style={{ width:'100%', maxWidth:'460px' }}>
            <div className="modal-header">
              <h3><FileText size={18} /> Detail Pinjaman — {selectedLoan.id}</h3>
              <button className="modal-close-btn" onClick={() => setShowDetail(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              {[
                ['Anggota',         selectedLoan.name],
                ['ID Anggota',      selectedLoan.memberId],
                ['Plafon',          fmt(selectedLoan.amount)],
                ['Tenor',           `${selectedLoan.tenor} Bulan`],
                ['Bunga',           `${selectedLoan.interest}%/bln`],
                ['Cicilan/Bln',     fmt(Math.ceil(selectedLoan.amount / selectedLoan.tenor))],
                ['Sisa Tagihan',    fmt(selectedLoan.remainingAmount)],
                ['Tgl Pengajuan',   selectedLoan.applyDate || '—'],
                ['Tgl Pengambilan', selectedLoan.takeDate  || '—'],
                ['Status',          selectedLoan.status],
              ].map(([label, value]) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'0.4rem 0', borderBottom:'1px solid var(--color-border)', fontSize:'0.875rem' }}>
                  <span style={{ color:'var(--color-text-muted)' }}>{label}</span>
                  <span style={{ fontWeight:500 }}>{value}</span>
                </div>
              ))}
              
              {selectedLoan.installments && selectedLoan.installments.length > 0 && (
                <div style={{ marginTop:'1rem', background:'rgba(6,182,212,0.06)', border:'1px solid rgba(6,182,212,0.2)', borderRadius:'var(--radius-md)', padding:'0.875rem 1rem' }}>
                  <div style={{ fontSize:'0.8rem', fontWeight:700, color:'var(--color-secondary)', marginBottom:'0.5rem' }}>
                    <Clock size={14} style={{ display:'inline', marginRight:6, verticalAlign:'text-bottom' }} />
                    Jadwal Cicilan
                  </div>
                  <div style={{ maxHeight:'150px', overflowY:'auto' }}>
                    {selectedLoan.installments.map(s => {
                      const isOverdue = s.status === 'Pending' && s.dueDate < new Date().toISOString().split('T')[0];
                      const statusColor = s.status === 'Paid' ? 'var(--color-success)' : isOverdue ? 'var(--color-danger)' : 'var(--color-text-muted)';
                      const statusText = s.status === 'Paid' ? 'Lunas' : isOverdue ? 'Nunggak' : 'Pending';
                      return (
                        <div key={s.no} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', padding:'0.25rem 0', borderBottom:'1px dashed var(--color-border)' }}>
                          <div>
                            <span>Cicilan ke-{s.no} ({s.dueDate})</span>
                            <span style={{ marginLeft: 8, fontSize: '0.7rem', padding: '2px 6px', borderRadius: 4, background: s.status === 'Paid' ? 'rgba(16,185,129,0.1)' : isOverdue ? 'rgba(239,68,68,0.1)' : 'rgba(156,163,175,0.1)', color: statusColor }}>
                              {statusText}
                            </span>
                          </div>
                          <span style={{ fontWeight:500 }}>{fmt(s.amount)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetail(false)}>Tutup</button>
              {selectedLoan.status === 'Active' && (
                <button className="btn btn-primary" onClick={() => { setShowDetail(false); openPayModal(selectedLoan); }}>
                  Bayar Angsuran
                </button>
              )}
              {selectedLoan.status === 'Pending' && (
                <button className="btn btn-success" style={{ background:'var(--color-success)', color:'white' }}
                  onClick={() => { setShowDetail(false); handleApprove(selectedLoan); }}>
                  Setujui Pinjaman
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Bayar Angsuran ── */}
      {showPayModal && selectedLoan && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowPayModal(false)}>
          <div className="modal-content glass-panel" style={{ width:'100%', maxWidth:'400px' }}>
            <div className="modal-header">
              <h3>Bayar Angsuran — {selectedLoan.id}</h3>
              <button className="modal-close-btn" onClick={() => setShowPayModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handlePay}>
              <div className="modal-body">
                <div style={{ background:'rgba(255,77,0,0.05)', borderRadius:'var(--radius-md)', padding:'0.875rem 1rem', marginBottom:'1rem', fontSize:'0.85rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.25rem' }}>
                    <span>Anggota</span><span style={{ fontWeight:600 }}>{selectedLoan.name}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.25rem' }}>
                    <span>Cicilan Normal</span>
                    <span style={{ color:'var(--color-secondary)', fontWeight:600 }}>
                      {fmt(Math.ceil(selectedLoan.amount / selectedLoan.tenor))}/bln
                    </span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', color:'var(--color-danger)', fontWeight:700 }}>
                    <span>Sisa Tagihan</span><span>{fmt(selectedLoan.remainingAmount)}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Jumlah Bayar (Rp)</label>
                  <input type="number" className="form-control" value={payAmount} min={1}
                    max={selectedLoan.remainingAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))} required />
                  <p style={{ fontSize:'0.75rem', color:'var(--color-text-muted)', marginTop:'0.35rem' }}>
                    Maks: {fmt(selectedLoan.remainingAmount)}
                  </p>
                </div>
                <div className="form-group">
                  <label className="form-label">Tanggal Bayar</label>
                  <input type="date" className="form-control" value={payDate}
                    onChange={(e) => setPayDate(e.target.value)} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPayModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Konfirmasi Bayar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashLoans;
