import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Search, Users, UserPlus, X, UserCheck, UserCog, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import './MasterData.css';

const Members = () => {
  const members      = useStore((state) => state.members);
  const addMember    = useStore((state) => state.addMember);
  const updateMember = useStore((state) => state.updateMember);

  const [searchTerm,  setSearchTerm]  = useState('');
  const [showModal,   setShowModal]   = useState(false);
  const [editingMember, setEditingMember] = useState(null); // null = mode tambah

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const emptyForm = { name: '', type: 'Calon', pokok: 500000, wajib: 100000, sukarela: 0, joinDate: todayStr };  const [form, setForm] = useState(emptyForm);

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fullCount     = members.filter(m => m.type === 'Penuh').length;
  const calonCount    = members.filter(m => m.type === 'Calon').length;
  const totalSimpanan = members.reduce((sum, m) => sum + m.pokok + m.wajib + m.sukarela, 0);

  const openAddModal = () => {
    setEditingMember(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setForm({
      name:     member.name,
      type:     member.type,
      pokok:    member.pokok,
      wajib:    member.wajib,
      sukarela: member.sukarela,
      joinDate: member.joinDate || todayStr,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMember(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingMember) {
      updateMember(editingMember.id, form);
    } else {
      addMember(form);
    }
    closeModal();
  };

  const hasOldIds = members.some(m => m.id && m.id.startsWith('ANG-'));

  const handleMigrateIds = () => {
    const updatedMembers = members.map(m => ({
      ...m,
      id: m.id?.startsWith('ANG-') ? 'KPKCG-' + m.id.replace('ANG-', '') : m.id
    }));
    // Update store langsung
    useStore.setState({ members: updatedMembers });
    // Update localStorage
    const storeKey = Object.keys(localStorage).find(k => k.startsWith('koperasi-store'));
    if (storeKey) {
      try {
        const store = JSON.parse(localStorage.getItem(storeKey));
        if (store?.state?.members) {
          store.state.members = updatedMembers;
          localStorage.setItem(storeKey, JSON.stringify(store));
        }
      } catch (e) { console.error(e); }
    }
  };

  // ── Pagination ─────────────────────────────────────────────────────────────
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredMembers.length / PAGE_SIZE);
  const pagedMembers = filteredMembers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset ke halaman 1 saat search berubah
  React.useEffect(() => { setCurrentPage(1); }, [searchTerm, filterType]);

  return (
    <div className="master-container">

      {/* Header */}
      <div className="master-header">
        <div className="master-header-title">
          <h2>Data Anggota Koperasi</h2>
          <p>Kelola daftar anggota, jenis keanggotaan, dan saldo awal simpanan.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {hasOldIds && (
            <button className="btn btn-secondary"
              style={{ color: 'var(--color-warning)', borderColor: 'rgba(245,158,11,0.4)', fontSize: '0.8rem' }}
              onClick={handleMigrateIds}
              title="Ubah format ID dari ANG-xxx ke KPKCG-xxx">
              🔄 Update Format ID
            </button>
          )}
          <button className="btn btn-primary" onClick={openAddModal}>
            <UserPlus size={16} /> Tambah Anggota
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="master-stats">
        <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div className="stat-icon primary"><Users size={22} /></div>
          <div className="stat-info" style={{ textAlign: 'center' }}>
            <div className="stat-value">{members.length}</div>
            <div className="stat-label">Total Anggota</div>
          </div>
        </div>
        <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div className="stat-icon success"><UserCheck size={22} /></div>
          <div className="stat-info" style={{ textAlign: 'center' }}>
            <div className="stat-value">{fullCount}</div>
            <div className="stat-label">Anggota Penuh</div>
          </div>
        </div>
        <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div className="stat-icon warning"><UserCog size={22} /></div>
          <div className="stat-info" style={{ textAlign: 'center' }}>
            <div className="stat-value">{calonCount}</div>
            <div className="stat-label">Calon Anggota</div>
          </div>
        </div>
        <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div className="stat-icon secondary"><Users size={22} /></div>
          <div className="stat-info" style={{ textAlign: 'center' }}>
            <div className="stat-value">Rp {(totalSimpanan / 1_000_000).toFixed(1)}Jt</div>
            <div className="stat-label">Total Simpanan</div>
          </div>
        </div>
      </div>

      {/* Table Panel */}
      <div className="glass-panel">
        {/* Toolbar */}
        <div className="master-toolbar">
          <div className="search-bar">
            <Search size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Cari ID atau Nama Anggota..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="master-toolbar-info">
            <Users size={15} />
            <span>{filteredMembers.length} anggota ditemukan</span>
          </div>        </div>

        {/* Table */}
        <div className="master-table-wrapper">
          <table className="master-table">
            <thead>
              <tr>
                <th>ID Anggota</th>
                <th>Nama Anggota</th>
                <th>Status</th>
                <th>Tgl Masuk</th>
                <th>Simpanan Pokok</th>
                <th>Simpanan Wajib</th>
                <th>Simpanan Sukarela</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pagedMembers.map((member) => (
                <tr key={member.id}>
                  <td><span className="cell-id">{member.id}</span></td>
                  <td><span className="cell-name">{member.name}</span></td>
                  <td>
                    <span className={member.type === 'Penuh' ? 'member-type-full' : 'member-type-calon'}>
                      {member.type}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    {member.joinDate ? new Date(member.joinDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="cell-amount">Rp {member.pokok.toLocaleString('id-ID')}</td>
                  <td className="cell-amount">Rp {member.wajib.toLocaleString('id-ID')}</td>
                  <td className="cell-amount">Rp {member.sukarela.toLocaleString('id-ID')}</td>
                  <td>
                    <button
                      className="table-action-btn"
                      onClick={() => openEditModal(member)}
                    >
                      <Pencil size={13} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredMembers.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Users size={24} style={{ color: 'var(--color-text-muted)' }} />
              </div>
              <p>Tidak ada data anggota ditemukan.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.875rem 1rem', borderTop:'1px solid var(--color-border)', fontSize:'0.82rem' }}>
              <span style={{ color:'var(--color-text-muted)' }}>
                Halaman {currentPage} dari {totalPages} · {filteredMembers.length} anggota
              </span>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding:'0.3rem 0.75rem', fontSize:'0.78rem', display:'flex', alignItems:'center', gap:4 }}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
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
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))
                }
                <button
                  className="btn btn-secondary"
                  style={{ padding:'0.3rem 0.75rem', fontSize:'0.78rem', display:'flex', alignItems:'center', gap:4 }}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tambah / Edit Anggota */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {editingMember ? <Pencil size={20} /> : <UserPlus size={20} />}
                {editingMember ? `Edit Anggota — ${editingMember.id}` : 'Tambah Anggota Baru'}
              </h3>
              <button className="modal-close-btn" onClick={closeModal}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Lengkap</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Masukkan nama lengkap..."
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tanggal Masuk</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.joinDate || ''}
                    onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status Keanggotaan</label>
                  <select
                    className="form-control"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="Calon">Calon Anggota</option>
                    <option value="Penuh">Anggota Penuh</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Simpanan Pokok (Rp)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={form.pokok}
                      onChange={(e) => setForm({ ...form, pokok: Number(e.target.value) })}
                      min={0}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Simpanan Wajib (Rp)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={form.wajib}
                      onChange={(e) => setForm({ ...form, wajib: Number(e.target.value) })}
                      min={0}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Simpanan Sukarela (Rp)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.sukarela}
                    onChange={(e) => setForm({ ...form, sukarela: Number(e.target.value) })}
                    min={0}
                  />
                </div>

                {editingMember && (
                  <div className="member-edit-note">
                    ℹ️ Perubahan simpanan di sini hanya mengubah saldo master anggota. Untuk setoran rutin, gunakan menu <strong>Simpanan</strong> di halaman Pinjaman.
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingMember ? 'Simpan Perubahan' : 'Simpan Anggota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
