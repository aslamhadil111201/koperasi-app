import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookMarked, Plus, Edit2, Trash2, X, Check, ExternalLink } from 'lucide-react';
import { useStore } from '../../store/useStore';
import './MasterData.css';

const CATEGORIES = [
  'Aset Lancar',
  'Aset Tetap',
  'Kewajiban Jangka Pendek',
  'Kewajiban Jangka Panjang',
  'Ekuitas',
  'Pendapatan',
  'Harga Pokok Penjualan',
  'Beban Operasional',
  'Pendapatan Lain-lain',
  'Beban Lain-lain'
];

const isDebitCategory = (cat) => cat.startsWith('Aset') || cat.startsWith('Beban') || cat === 'Harga Pokok Penjualan';

const ChartOfAccounts = () => {
  const navigate = useNavigate();
  const accounts = useStore((s) => s.accounts) || [];
  const addAccount = useStore((s) => s.addAccount);
  const updateAccount = useStore((s) => s.updateAccount);
  const deleteAccount = useStore((s) => s.deleteAccount);
  const journal = useStore((s) => s.journal) || [];

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedAcc, setSelectedAcc] = useState(null);
  const [form, setForm] = useState({ id: '', name: '', category: 'Aset Lancar' });
  const [formError, setFormError] = useState('');

  const generateAccountId = (category) => {
    const PSAK_PREFIX = {
      'Aset Lancar': '11', 'Aset Tetap': '12',
      'Kewajiban Jangka Pendek': '21', 'Kewajiban Jangka Panjang': '22',
      'Ekuitas': '31', 'Pendapatan': '41', 'Pendapatan Lain-lain': '42',
      'Harga Pokok Penjualan': '51', 'Beban Operasional': '61', 'Beban Lain-lain': '62'
    };
    const accs = accounts.filter(a => a.category === category);
    if (accs.length > 0) {
      const numIds = accs.map(a => parseInt(a.id)).filter(n => !isNaN(n));
      if (numIds.length > 0) return String(Math.max(...numIds) + 1);
    }
    return PSAK_PREFIX[category] + '01';
  };

  useEffect(() => {
    if (modalMode === 'add') {
      setForm(prev => {
        if (prev.id.length <= 4) return { ...prev, id: generateAccountId(prev.category) };
        return prev;
      });
    }
  }, [form.category, modalMode]);

  const groupedAccounts = useMemo(() => {
    const map = {};
    CATEGORIES.forEach(c => map[c] = []);
    accounts.forEach(a => {
      if (!map[a.category]) map[a.category] = [];
      map[a.category].push(a);
    });
    return map;
  }, [accounts]);

  const getLastTransactionDate = (accountName) => {
    const entries = journal.filter(j => j.account === accountName && j.id !== 'JU-INIT');
    if (entries.length === 0) return null;
    const sorted = entries.sort((a, b) => b.date.localeCompare(a.date));
    return sorted[0].date;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const handleGoToBukuBesar = (accountName) => {
    navigate(`/reports/buku-besar?account=${encodeURIComponent(accountName)}`);
  };

  const handleOpenAdd = () => {
    const defaultCat = 'Aset Lancar';
    setForm({ id: generateAccountId(defaultCat), name: '', category: defaultCat });
    setModalMode('add');
    setShowModal(true);
    setFormError('');
  };

  const handleOpenEdit = (acc) => {
    setForm({ id: acc.id, name: acc.name, category: acc.category });
    setSelectedAcc(acc);
    setModalMode('edit');
    setShowModal(true);
    setFormError('');
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Yakin ingin menghapus akun ${name}?`)) deleteAccount(id);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.id || !form.name) return setFormError('Kode dan Nama Akun wajib diisi.');
    if (modalMode === 'add') {
      if (accounts.find(a => a.id === form.id)) return setFormError('Kode Akun sudah digunakan.');
      if (accounts.find(a => a.name.toLowerCase() === form.name.toLowerCase())) return setFormError('Nama Akun sudah digunakan.');
      addAccount({ id: form.id, name: form.name, category: form.category, type: isDebitCategory(form.category) ? 'debit' : 'credit' });
    } else {
      if (accounts.find(a => a.id === form.id && a.id !== selectedAcc.id)) return setFormError('Kode Akun sudah digunakan.');
      if (accounts.find(a => a.name.toLowerCase() === form.name.toLowerCase() && a.id !== selectedAcc.id)) return setFormError('Nama Akun sudah digunakan.');
      updateAccount(selectedAcc.id, { id: form.id, name: form.name, category: form.category, type: isDebitCategory(form.category) ? 'debit' : 'credit' });
    }
    setShowModal(false);
  };

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="flex items-center gap-2">
            <BookMarked size={24} style={{ color: 'var(--color-primary)' }} />
            Daftar Akun (COA)
          </h2>
          <p className="text-muted">Kelola akun pembukuan koperasi.</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={handleOpenAdd}>
          <Plus size={18} /> Tambah Akun
        </button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {CATEGORIES.map(cat => (
          <div key={cat} className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ borderBottom: '2px solid var(--color-primary)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>
              {cat}
            </h3>
            {groupedAccounts[cat]?.length === 0 ? (
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>Belum ada akun di kategori ini.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {groupedAccounts[cat].sort((a,b) => a.id.localeCompare(b.id)).map(acc => {
                  const lastDate = getLastTransactionDate(acc.name);
                  return (
                    <div key={acc.id} style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', fontFamily: 'monospace', marginRight: '0.5rem' }}>{acc.id}</span>
                          <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{acc.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleGoToBukuBesar(acc.name)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-primary)' }} title="Lihat Buku Besar">
                            <ExternalLink size={15} />
                          </button>
                          <button onClick={() => handleOpenEdit(acc)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-primary)' }} title="Edit Akun">
                            <Edit2 size={15} />
                          </button>
                          {!acc.isDefault && (
                            <button onClick={() => handleDelete(acc.id, acc.name)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-danger)' }} title="Hapus Akun">
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        Transaksi terakhir: {formatDate(lastDate)}
                      </span>
                      {acc.isDefault && (
                        <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', background: 'var(--color-border)', borderRadius: 99, color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>Sistem</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Modal Add/Edit ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalMode === 'add' ? 'Tambah Akun Baru' : 'Edit Akun'}</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Kode Akun</label>
                  <input type="text" className="form-control" value={form.id} onChange={e => setForm({...form, id: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Nama Akun</label>
                  <input type="text" className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <select className="form-control" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {(modalMode === 'edit' && selectedAcc?.isDefault) && (
                    <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>*Akun sistem: nama bisa diubah, kategori bisa dipindah.</p>
                  )}
                </div>
                {formError && <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>{formError}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary flex items-center gap-2"><Check size={16} /> Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartOfAccounts;
