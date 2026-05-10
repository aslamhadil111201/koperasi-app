import React, { useState } from 'react';
import { Search, X, TrendingUp, Calendar, CreditCard } from 'lucide-react';
import { useStore } from '../../store/useStore';
import './Loans.css';

const Savings = () => {
  const members       = useStore((state) => state.members);
  const journal       = useStore((state) => state.journal);
  const depositSavings = useStore((state) => state.depositSavings);

  const [searchTerm,   setSearchTerm]   = useState('');
  const [filterType,   setFilterType]   = useState('Semua');
  const [showDeposit,  setShowDeposit]  = useState(false);
  const [showDetail,   setShowDetail]   = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [depositForm,  setDepositForm]  = useState({ memberId: '', pokok: 0, wajib: 0, sukarela: 0, date: new Date().toLocaleDateString('en-CA') });

  const filteredMembers = members.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        m.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType   = filterType === 'Semua' || m.type === filterType;
    return matchSearch && matchType;
  });

  // Riwayat setoran simpanan anggota dari jurnal
  const getMemberHistory = (memberId) =>
    journal
      .filter(j => j.ref === memberId && j.account === 'Kas' && j.debit > 0 &&
                   j.description.toLowerCase().includes('simpanan'))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

  const openDetail = (member) => {
    setSelectedMember(member);
    setShowDetail(true);
  };

  const handleDeposit = (e) => {
    e.preventDefault();
    if (!depositForm.memberId) return alert('Pilih anggota terlebih dahulu');
    depositSavings(depositForm.memberId, depositForm.pokok, depositForm.wajib, depositForm.sukarela, depositForm.date);
    setShowDeposit(false);
    setDepositForm({ memberId: '', pokok: 0, wajib: 0, sukarela: 0, date: new Date().toLocaleDateString('en-CA') });
  };

  return (
    <div className="loans-container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2>Simpanan Anggota</h2>
          <p className="text-muted">Kelola data simpanan pokok, wajib, dan sukarela.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowDeposit(true)}>+ Setor Simpanan</button>
      </div>

      {/* Filter Chips */}
      <div className="filter-chips">
        {['Semua', 'Penuh', 'Calon'].map(t => (
          <button
            key={t}
            className={`filter-chip chip-${t === 'Semua' ? 'all' : t === 'Penuh' ? 'active' : 'pending'} ${filterType === t ? 'active' : ''}`}
            onClick={() => setFilterType(t)}
          >
            {t === 'Semua' ? 'Semua Anggota' : t === 'Penuh' ? '✓ Anggota Penuh' : '⏳ Calon Anggota'}
          </button>
        ))}
        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginLeft: '0.25rem' }}>
          {filteredMembers.length} anggota
        </span>
      </div>

      <div className="glass-panel">
        <div className="flex justify-between items-center mb-6">
          <div className="search-bar" style={{ width: '300px' }}>
            <Search size={18} className="text-muted" />
            <input
              type="text"
              placeholder="Cari ID atau Nama Anggota..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowDeposit(true)}>+ Setor Simpanan</button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID Anggota</th>
                <th>Nama Anggota</th>
                <th>Status</th>
                <th>Tgl Masuk</th>
                <th>Simpanan Pokok</th>
                <th>Simpanan Wajib</th>
                <th>Simpanan Sukarela</th>
                <th>Total Simpanan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => {
                const total = member.pokok + member.wajib + member.sukarela;
                return (
                  <tr key={member.id}>
                    <td className="font-medium">{member.id}</td>
                    <td>{member.name}</td>
                    <td>
                      <span className={`badge ${member.type === 'Penuh' ? 'badge-success' : 'badge-warning'}`}>
                        {member.type}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                      {member.joinDate
                        ? new Date(member.joinDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td>Rp {member.pokok.toLocaleString('id-ID')}</td>
                    <td>Rp {member.wajib.toLocaleString('id-ID')}</td>
                    <td>Rp {member.sukarela.toLocaleString('id-ID')}</td>
                    <td className="font-bold text-primary">Rp {total.toLocaleString('id-ID')}</td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                        onClick={() => openDetail(member)}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredMembers.length === 0 && (
            <div className="text-center p-6 text-muted">
              Tidak ada data anggota ditemukan.
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Detail Simpanan ── */}
      {showDetail && selectedMember && (() => {
        const history = getMemberHistory(selectedMember.id);
        const total   = selectedMember.pokok + selectedMember.wajib + selectedMember.sukarela;
        return (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowDetail(false)}>
            <div className="modal-content glass-panel" style={{ width: '100%', maxWidth: '560px' }}>
              {/* Header */}
              <div className="modal-header">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CreditCard size={20} />
                  Detail Simpanan — {selectedMember.name}
                </h3>
                <button className="modal-close-btn" onClick={() => setShowDetail(false)}>
                  <X size={16} />
                </button>
              </div>

              <div className="modal-body">
                {/* Ringkasan saldo */}
                <div className="savings-detail-summary">
                  <div className="savings-detail-item">
                    <span className="savings-detail-label">ID Anggota</span>
                    <span className="savings-detail-value">{selectedMember.id}</span>
                  </div>
                  <div className="savings-detail-item">
                    <span className="savings-detail-label">Status</span>
                    <span className="savings-detail-value">
                      <span className={`badge ${selectedMember.type === 'Penuh' ? 'badge-success' : 'badge-warning'}`}>
                        {selectedMember.type}
                      </span>
                    </span>
                  </div>
                  <div className="savings-detail-item">
                    <span className="savings-detail-label">Tanggal Masuk</span>
                    <span className="savings-detail-value">
                      {selectedMember.joinDate
                        ? new Date(selectedMember.joinDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
                        : '—'}
                    </span>
                  </div>
                  <div className="savings-detail-item" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                    <span className="savings-detail-label">Simpanan Pokok</span>
                    <span className="savings-detail-value">Rp {selectedMember.pokok.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="savings-detail-item">
                    <span className="savings-detail-label">Simpanan Wajib</span>
                    <span className="savings-detail-value">Rp {selectedMember.wajib.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="savings-detail-item">
                    <span className="savings-detail-label">Simpanan Sukarela</span>
                    <span className="savings-detail-value">Rp {selectedMember.sukarela.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="savings-detail-item savings-detail-total">
                    <span className="savings-detail-label">Total Simpanan</span>
                    <span className="savings-detail-value text-primary">Rp {total.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Riwayat setoran */}
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  Riwayat Setoran
                </h4>

                {history.length > 0 ? (
                  <div className="savings-history-list">
                    {history.map((tx, i) => (
                      <div key={`${tx.id}-${i}`} className="savings-history-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="savings-history-icon">
                            <TrendingUp size={15} />
                          </div>
                          <div>
                            <p style={{ fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>{tx.description}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Calendar size={11} /> {tx.date}
                            </p>
                          </div>
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                          +Rp {tx.debit.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    Belum ada riwayat setoran tercatat.
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDetail(false)}>Tutup</button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setShowDetail(false);
                    setDepositForm({ memberId: selectedMember.id, pokok: 0, wajib: 0, sukarela: 0, date: new Date().toLocaleDateString('en-CA') });
                    setShowDeposit(true);
                  }}
                >
                  + Setor Simpanan
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Modal Setor Simpanan ── */}
      {showDeposit && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowDeposit(false)}>
          <div className="modal-content glass-panel" style={{ width: '100%', maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Setor Simpanan</h3>
              <button className="modal-close-btn" onClick={() => setShowDeposit(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleDeposit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tanggal Setoran</label>
                  <input type="date" className="form-control" value={depositForm.date}
                    onChange={(e) => setDepositForm({ ...depositForm, date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Anggota</label>
                  <select
                    className="form-control"
                    value={depositForm.memberId}
                    onChange={(e) => setDepositForm({ ...depositForm, memberId: e.target.value })}
                    required
                  >
                    <option value="">Pilih Anggota...</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.id} - {m.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Simpanan Pokok (Rp)</label>
                  <input type="number" className="form-control" value={depositForm.pokok}
                    onChange={(e) => setDepositForm({ ...depositForm, pokok: Number(e.target.value) })} min={0} />
                </div>
                <div className="form-group">
                  <label className="form-label">Simpanan Wajib (Rp)</label>
                  <input type="number" className="form-control" value={depositForm.wajib}
                    onChange={(e) => setDepositForm({ ...depositForm, wajib: Number(e.target.value) })} min={0} />
                </div>
                <div className="form-group">
                  <label className="form-label">Simpanan Sukarela (Rp)</label>
                  <input type="number" className="form-control" value={depositForm.sukarela}
                    onChange={(e) => setDepositForm({ ...depositForm, sukarela: Number(e.target.value) })} min={0} />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeposit(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Setoran</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Savings;
