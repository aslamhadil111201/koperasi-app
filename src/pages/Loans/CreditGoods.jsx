import React, { useState, useMemo } from 'react';
import { Search, Plus, FileText, CheckCircle, XCircle, Clock, Package, X, Calendar } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { buildSchedule } from '../../utils/installment';
import './Loans.css';

const fmt = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

const CreditGoods = () => {
  const creditGoods        = useStore((state) => state.creditGoods);
  const approveCreditGoods = useStore((state) => state.approveCreditGoods);
  const payCreditGoods     = useStore((state) => state.payCreditGoods);
  const addCreditGoods     = useStore((state) => state.addCreditGoods);
  const members            = useStore((state) => state.members);
  const products           = useStore((state) => state.products);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const [searchTerm,      setSearchTerm]      = useState('');
  const [filterStatus,    setFilterStatus]    = useState('Semua');
  const [showModal,       setShowModal]       = useState(false);
  const [showDetail,      setShowDetail]      = useState(false);
  const [showPayModal,    setShowPayModal]    = useState(false);
  const [selectedCredit,  setSelectedCredit]  = useState(null);
  const [payAmount,       setPayAmount]       = useState(0);
  const [useProductList,  setUseProductList]  = useState(true);

  const emptyForm = {
    memberId: '', name: '', itemName: '', amount: 0, dp: 0,
    tenor: 12, interest: 2.0, applyDate: todayStr, takeDate: '', startDate: ''
  };
  const [creditForm, setCreditForm] = useState(emptyForm);

  // Hitung cicilan per bulan dari form
  const sisaKredit   = Math.max(0, creditForm.amount - creditForm.dp);
  const cicilanPerBulan = creditForm.tenor > 0 ? Math.ceil(sisaKredit / creditForm.tenor) : 0;

  // Preview jadwal dari form
  const formSchedule = useMemo(() =>
    buildSchedule(sisaKredit, creditForm.tenor, creditForm.startDate),
    [sisaKredit, creditForm.tenor, creditForm.startDate]
  );

  const handleAddCredit = (e) => {
    e.preventDefault();
    if (!creditForm.memberId) return alert('Pilih anggota!');
    if (!creditForm.itemName) return alert('Pilih atau isi nama barang!');
    addCreditGoods(creditForm);
    setShowModal(false);
    setCreditForm(emptyForm);
  };

  const handleApprove = (credit) => {
    if (window.confirm(`Setujui kredit ${credit.itemName} untuk ${credit.name}?\nKas DP (${fmt(credit.dp)}) akan dicatat ke jurnal.`)) {
      approveCreditGoods(credit.id);
    }
  };

  const openPayModal = (credit) => {
    setSelectedCredit(credit);
    // Default cicilan = sisa / tenor tersisa (estimasi)
    const cicilan = Math.ceil(credit.remainingAmount / (credit.tenor || 1));
    setPayAmount(cicilan);
    setShowPayModal(true);
  };

  const handlePay = (e) => {
    e.preventDefault();
    if (!selectedCredit) return;
    const amount = Number(payAmount);
    if (amount <= 0) return alert('Jumlah bayar harus lebih dari 0');
    if (amount > selectedCredit.remainingAmount) return alert('Jumlah melebihi sisa tagihan!');
    payCreditGoods(selectedCredit.id, amount);
    setShowPayModal(false);
    setSelectedCredit(null);
  };

  const filteredCredits = creditGoods.filter(credit => {
    const matchSearch =
      credit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credit.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credit.itemName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'Semua' || credit.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status) => {
    const map = {
      Active:    <span className="badge badge-success" style={{ display:'flex',alignItems:'center',gap:4 }}><CheckCircle size={12}/> Aktif</span>,
      Pending:   <span className="badge badge-warning" style={{ display:'flex',alignItems:'center',gap:4 }}><Clock size={12}/> Menunggu</span>,
      Completed: <span className="badge badge-primary" style={{ display:'flex',alignItems:'center',gap:4 }}><CheckCircle size={12}/> Lunas</span>,
      Rejected:  <span className="badge badge-danger"  style={{ display:'flex',alignItems:'center',gap:4 }}><XCircle size={12}/> Ditolak</span>,
    };
    return map[status] || <span className="badge">{status}</span>;
  };

  const totalActive  = creditGoods.filter(c => c.status === 'Active').reduce((s,c) => s + c.remainingAmount, 0);
  const totalPending = creditGoods.filter(c => c.status === 'Pending').reduce((s,c) => s + c.amount, 0);
  const totalCompleted = creditGoods.filter(c => c.status === 'Completed').length;

  return (
    <div className="loans-container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2>Kredit Barang</h2>
          <p className="text-muted">Kelola pengajuan kredit barang dengan sistem cicilan bulanan.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setCreditForm(emptyForm); setShowModal(true); }}>
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
          {filteredCredits.length} data
        </span>
      </div>

      {/* Stat Cards */}
      <div className="glass-panel mb-6">
        <div className="grid" style={{ gridTemplateColumns:'repeat(3,1fr)', gap:'1rem' }}>
          <div className="stat-card p-4 rounded-lg">
            <p className="text-muted text-sm">Total Kredit Aktif</p>
            <h3 style={{ color:'var(--color-primary)' }}>{fmt(totalActive)}</h3>
          </div>
          <div className="stat-card p-4 rounded-lg">
            <p className="text-muted text-sm">Menunggu Persetujuan</p>
            <h3 style={{ color:'var(--color-warning)' }}>{fmt(totalPending)}</h3>
          </div>
          <div className="stat-card p-4 rounded-lg">
            <p className="text-muted text-sm">Kredit Lunas</p>
            <h3 style={{ color:'var(--color-success)' }}>{totalCompleted} kredit</h3>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel">
        <div className="flex justify-between items-center mb-6">
          <div className="search-bar" style={{ width:'300px' }}>
            <Search size={18} className="text-muted" />
            <input type="text" placeholder="Cari ID, Nama, atau Barang..." className="search-input"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID Kredit</th>
                <th>Nama Anggota</th>
                <th>Nama Barang</th>
                <th>Tgl Pengajuan</th>
                <th>Harga</th>
                <th>DP</th>
                <th>Cicilan/Bln</th>
                <th>Tenor</th>
                <th>Sisa Tagihan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredCredits.map((credit) => {
                const cicilan = credit.tenor > 0
                  ? Math.ceil((credit.amount - credit.dp) / credit.tenor)
                  : 0;
                return (
                  <tr key={credit.id}>
                    <td className="font-medium">{credit.id}</td>
                    <td>
                      <div>{credit.name}</div>
                      <div style={{ fontSize:'0.75rem', color:'var(--color-text-muted)' }}>{credit.memberId}</div>
                    </td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <Package size={14} style={{ color:'var(--color-text-muted)', flexShrink:0 }} />
                        {credit.itemName}
                      </div>
                    </td>
                    <td style={{ fontSize:'0.82rem', color:'var(--color-text-muted)' }}>{credit.applyDate || '—'}</td>
                    <td>{fmt(credit.amount)}</td>
                    <td>{fmt(credit.dp)}</td>
                    <td style={{ color:'var(--color-secondary)', fontWeight:600 }}>{fmt(cicilan)}</td>
                    <td>{credit.tenor} Bln</td>
                    <td className="font-medium text-primary">{fmt(credit.remainingAmount)}</td>
                    <td>{getStatusBadge(credit.status)}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-secondary"
                          style={{ padding:'0.3rem 0.6rem', fontSize:'0.75rem' }}
                          onClick={() => { setSelectedCredit(credit); setShowDetail(true); }}
                          title="Detail">
                          <FileText size={14} />
                        </button>
                        {credit.status === 'Active' && (
                          <button
                            onClick={() => openPayModal(credit)}
                            className="btn btn-primary"
                            style={{ padding:'0.25rem 0.75rem', fontSize:'0.8rem' }}>
                            Bayar
                          </button>
                        )}
                        {credit.status === 'Pending' && (
                          <button
                            onClick={() => handleApprove(credit)}
                            className="btn btn-success"
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
          {filteredCredits.length === 0 && (
            <div className="text-center p-6 text-muted">Tidak ada data kredit barang ditemukan.</div>
          )}
        </div>
      </div>

      {/* ── Modal Pengajuan ── */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content glass-panel" style={{ width:'100%', maxWidth:'620px', maxHeight:'90vh', overflowY:'auto' }}>
            <div className="modal-header">
              <h3><Plus size={18} /> Pengajuan Kredit Barang</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleAddCredit}>
              <div className="modal-body">

                {/* Tanggal */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Tgl Pengajuan</label>
                    <input type="date" className="form-control" value={creditForm.applyDate}
                      onChange={(e) => setCreditForm({...creditForm, applyDate: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tgl Pengambilan Barang</label>
                    <input type="date" className="form-control" value={creditForm.takeDate}
                      onChange={(e) => setCreditForm({...creditForm, takeDate: e.target.value})} />
                  </div>
                </div>

                {/* Anggota + Barang */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Anggota</label>
                    <select className="form-control" value={creditForm.memberId}
                      onChange={(e) => {
                        const m = members.find(m => m.id === e.target.value);
                        setCreditForm({...creditForm, memberId: e.target.value, name: m?.name || ''});
                      }} required>
                      <option value="">Pilih Anggota...</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.id} - {m.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.4rem' }}>
                      <label className="form-label" style={{ margin:0 }}>Nama Barang</label>
                      <button type="button"
                        onClick={() => { setUseProductList(v => !v); setCreditForm(f => ({...f, itemName:'', amount:0})); }}
                        style={{ fontSize:'0.7rem', color:'var(--color-primary)', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
                        {useProductList ? '✏️ Ketik Manual' : '📦 Dari Inventaris'}
                      </button>
                    </div>
                    {useProductList ? (
                      <select className="form-control" value={creditForm.itemName}
                        onChange={(e) => {
                          const p = products.find(p => p.name === e.target.value);
                          setCreditForm({...creditForm, itemName: e.target.value, amount: p?.price || creditForm.amount});
                        }} required>
                        <option value="">Pilih Barang...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.name}>{p.name} — {fmt(p.price)}</option>
                        ))}
                      </select>
                    ) : (
                      <input type="text" className="form-control" placeholder="Nama barang..."
                        value={creditForm.itemName}
                        onChange={(e) => setCreditForm({...creditForm, itemName: e.target.value})} required />
                    )}
                  </div>
                </div>

                {/* Harga + DP */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Harga Barang (Rp)</label>
                    <input type="number" className="form-control" value={creditForm.amount}
                      onChange={(e) => setCreditForm({...creditForm, amount: Number(e.target.value)})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">DP / Uang Muka (Rp)</label>
                    <input type="number" className="form-control" value={creditForm.dp}
                      onChange={(e) => setCreditForm({...creditForm, dp: Number(e.target.value)})} required />
                  </div>
                </div>

                {/* Tenor + Bunga + Mulai Cicilan */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="form-group">
                    <label className="form-label">Tenor (Bulan)</label>
                    <input type="number" className="form-control" value={creditForm.tenor} min={1}
                      onChange={(e) => setCreditForm({...creditForm, tenor: Number(e.target.value)})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bunga (%/bln)</label>
                    <input type="number" step="0.1" className="form-control" value={creditForm.interest}
                      onChange={(e) => setCreditForm({...creditForm, interest: Number(e.target.value)})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mulai Cicilan</label>
                    <input type="date" className="form-control" value={creditForm.startDate}
                      onChange={(e) => setCreditForm({...creditForm, startDate: e.target.value})} />
                  </div>
                </div>

                {/* Ringkasan cicilan */}
                {creditForm.amount > 0 && creditForm.tenor > 0 && (
                  <div style={{ background:'rgba(6,182,212,0.06)', border:'1px solid rgba(6,182,212,0.2)', borderRadius:'var(--radius-md)', padding:'0.875rem 1rem', fontSize:'0.85rem' }}>
                    <div style={{ fontWeight:700, marginBottom:'0.5rem', color:'var(--color-secondary)' }}>Ringkasan Cicilan</div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.25rem' }}>
                      <span>Harga Barang</span><span>{fmt(creditForm.amount)}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.25rem' }}>
                      <span>DP / Uang Muka</span><span>({fmt(creditForm.dp)})</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.25rem', borderTop:'1px dashed var(--color-border)', paddingTop:'0.25rem' }}>
                      <span>Sisa yang Dicicil</span><span style={{ fontWeight:600 }}>{fmt(sisaKredit)}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', color:'var(--color-primary)', fontWeight:700 }}>
                      <span>Cicilan / Bulan ({creditForm.tenor}x)</span>
                      <span>{fmt(cicilanPerBulan)}</span>
                    </div>
                    {formSchedule.length > 0 && (
                      <div style={{ marginTop:'0.75rem', maxHeight:'140px', overflowY:'auto' }}>
                        <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--color-text-muted)', textTransform:'uppercase', marginBottom:'0.35rem' }}>
                          <Calendar size={11} style={{ marginRight:4 }} />Jadwal Cicilan
                        </div>
                        {formSchedule.map(s => (
                          <div key={s.no} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.75rem', padding:'0.15rem 0', borderBottom:'1px dashed var(--color-border)', color:'var(--color-text-muted)' }}>
                            <span>Cicilan {s.no} — {s.date}</span>
                            <span>{fmt(s.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Ajukan Kredit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Detail ── */}
      {showDetail && selectedCredit && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowDetail(false)}>
          <div className="modal-content glass-panel" style={{ width:'100%', maxWidth:'500px' }}>
            <div className="modal-header">
              <h3><FileText size={18} /> Detail Kredit — {selectedCredit.id}</h3>
              <button className="modal-close-btn" onClick={() => setShowDetail(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              {[
                ['Anggota',       selectedCredit.name],
                ['ID Anggota',    selectedCredit.memberId],
                ['Nama Barang',   selectedCredit.itemName],
                ['Harga Barang',  fmt(selectedCredit.amount)],
                ['DP / Uang Muka',fmt(selectedCredit.dp)],
                ['Sisa Dicicil',  fmt(selectedCredit.amount - selectedCredit.dp)],
                ['Tenor',         `${selectedCredit.tenor} Bulan`],
                ['Bunga',         `${selectedCredit.interest}%/bln`],
                ['Cicilan/Bln',   fmt(Math.ceil((selectedCredit.amount - selectedCredit.dp) / selectedCredit.tenor))],
                ['Sisa Tagihan',  fmt(selectedCredit.remainingAmount)],
                ['Tgl Pengajuan', selectedCredit.applyDate || '—'],
                ['Tgl Pengambilan', selectedCredit.takeDate || '—'],
                ['Status',        selectedCredit.status],
              ].map(([label, value]) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'0.4rem 0', borderBottom:'1px solid var(--color-border)', fontSize:'0.875rem' }}>
                  <span style={{ color:'var(--color-text-muted)' }}>{label}</span>
                  <span style={{ fontWeight:500 }}>{value}</span>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetail(false)}>Tutup</button>
              {selectedCredit.status === 'Active' && (
                <button className="btn btn-primary" onClick={() => { setShowDetail(false); openPayModal(selectedCredit); }}>
                  Bayar Cicilan
                </button>
              )}
              {selectedCredit.status === 'Pending' && (
                <button className="btn btn-success" style={{ background:'var(--color-success)', color:'white' }}
                  onClick={() => { setShowDetail(false); handleApprove(selectedCredit); }}>
                  Setujui Kredit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Bayar Cicilan ── */}
      {showPayModal && selectedCredit && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowPayModal(false)}>
          <div className="modal-content glass-panel" style={{ width:'100%', maxWidth:'420px' }}>
            <div className="modal-header">
              <h3>Bayar Cicilan — {selectedCredit.itemName}</h3>
              <button className="modal-close-btn" onClick={() => setShowPayModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handlePay}>
              <div className="modal-body">
                <div style={{ background:'rgba(255,77,0,0.05)', borderRadius:'var(--radius-md)', padding:'0.875rem 1rem', marginBottom:'1rem', fontSize:'0.85rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.25rem' }}>
                    <span>Anggota</span><span style={{ fontWeight:600 }}>{selectedCredit.name}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.25rem' }}>
                    <span>Barang</span><span>{selectedCredit.itemName}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', color:'var(--color-danger)', fontWeight:700 }}>
                    <span>Sisa Tagihan</span><span>{fmt(selectedCredit.remainingAmount)}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Jumlah Bayar (Rp)</label>
                  <input type="number" className="form-control" value={payAmount} min={1}
                    max={selectedCredit.remainingAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))} required />
                  <p style={{ fontSize:'0.75rem', color:'var(--color-text-muted)', marginTop:'0.35rem' }}>
                    Cicilan normal: {fmt(Math.ceil((selectedCredit.amount - selectedCredit.dp) / selectedCredit.tenor))} / bulan
                  </p>
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

export default CreditGoods;
