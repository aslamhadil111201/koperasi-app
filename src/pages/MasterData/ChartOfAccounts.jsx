import React, { useState, useMemo, useEffect } from 'react';
import { BookMarked, Plus, Edit2, Trash2, DollarSign, X, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';
import './MasterData.css'; // Asumsi CSS sama dengan Inventory/Members

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
  const accounts = useStore((s) => s.accounts) || [];
  const addAccount = useStore((s) => s.addAccount);
  const updateAccount = useStore((s) => s.updateAccount);
  const deleteAccount = useStore((s) => s.deleteAccount);
  const setSaldoAwal = useStore((s) => s.setSaldoAwal);
  const journal = useStore((s) => s.journal) || [];

  // ─── Modal States ────────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedAcc, setSelectedAcc] = useState(null);
  
  const [form, setForm] = useState({ id: '', name: '', category: 'Aset Lancar' });
  const [formError, setFormError] = useState('');

  // ─── Saldo Awal Modal States ─────────────────────────────────────────────
  const [showSaldoModal, setShowSaldoModal] = useState(false);
  const [saldoForm, setSaldoForm] = useState({ accountName: '', amount: '' });

  const generateAccountId = (category) => {
    const PSAK_PREFIX = {
      'Aset Lancar': '11',
      'Aset Tetap': '12',
      'Kewajiban Jangka Pendek': '21',
      'Kewajiban Jangka Panjang': '22',
      'Ekuitas': '31',
      'Pendapatan': '41',
      'Pendapatan Lain-lain': '42',
      'Harga Pokok Penjualan': '51',
      'Beban Operasional': '61',
      'Beban Lain-lain': '62'
    };

    const accs = accounts.filter(a => a.category === category);
    if (accs.length > 0) {
      const numIds = accs.map(a => parseInt(a.id)).filter(n => !isNaN(n));
      if (numIds.length > 0) {
        return String(Math.max(...numIds) + 1);
      }
    }
    
    return PSAK_PREFIX[category] + '01';
  };

  useEffect(() => {
    if (modalMode === 'add') {
      setForm(prev => {
        const expectedId = generateAccountId(prev.category);
        if (prev.id !== expectedId && prev.id === generateAccountId(prev.category === 'Aset Lancar' ? prev.category : 'Aset Lancar')) {
           return { ...prev, id: expectedId };
        }
        // Agar jika hanya mengubah kategori form, id juga ikut update (apabila user belum ketik id sendiri yang terlalu jauh beda)
        if (prev.id.length <= 4) {
           return { ...prev, id: expectedId };
        }
        return prev;
      });
    }
  }, [form.category, modalMode]);

  // ─── Group Data ──────────────────────────────────────────────────────────
  const groupedAccounts = useMemo(() => {
    const map = {};
    CATEGORIES.forEach(c => map[c] = []);
    accounts.forEach(a => {
      if (!map[a.category]) map[a.category] = [];
      map[a.category].push(a);
    });
    return map;
  }, [accounts]);

  // Cari saldo awal berjalan dari jurnal JU-INIT
  const getSaldoAwal = (accountName) => {
    const initEntries = journal.filter(j => j.id === 'JU-INIT' && j.account === accountName);
    const totDeb = initEntries.reduce((s, e) => s + (e.debit || 0), 0);
    const totCre = initEntries.reduce((s, e) => s + (e.credit || 0), 0);
    return Math.abs(totDeb - totCre);
  };

  const fmt = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

  // ─── Handlers ────────────────────────────────────────────────────────────
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
    if (window.confirm(`Yakin ingin menghapus akun ${name}?`)) {
      deleteAccount(id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.id || !form.name) return setFormError('Kode dan Nama Akun wajib diisi.');
    
    if (modalMode === 'add') {
      if (accounts.find(a => a.id === form.id)) return setFormError('Kode Akun sudah digunakan.');
      if (accounts.find(a => a.name.toLowerCase() === form.name.toLowerCase())) return setFormError('Nama Akun sudah digunakan.');
      addAccount({
        id: form.id,
        name: form.name,
        category: form.category,
        type: isDebitCategory(form.category) ? 'debit' : 'credit'
      });
    } else {
      if (accounts.find(a => a.id === form.id && a.id !== selectedAcc.id)) return setFormError('Kode Akun sudah digunakan.');
      if (accounts.find(a => a.name.toLowerCase() === form.name.toLowerCase() && a.id !== selectedAcc.id)) return setFormError('Nama Akun sudah digunakan.');
      updateAccount(selectedAcc.id, {
        id: form.id,
        name: form.name,
        category: form.category,
        type: isDebitCategory(form.category) ? 'debit' : 'credit'
      });
    }
    setShowModal(false);
  };

  const handleOpenSaldo = (acc) => {
    setSaldoForm({ accountName: acc.name, amount: getSaldoAwal(acc.name) || '' });
    setShowSaldoModal(true);
  };

  const handleSaveSaldo = (e) => {
    e.preventDefault();
    setSaldoAwal(saldoForm.accountName, Number(saldoForm.amount) || 0);
    setShowSaldoModal(false);
  };

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="flex items-center gap-2">
            <BookMarked size={24} style={{ color: 'var(--color-primary)' }} />
            Daftar Akun (COA)
          </h2>
          <p className="text-muted">Kelola akun pembukuan dan atur saldo awal historis.</p>
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
                  const sAwal = getSaldoAwal(acc.name);
                  return (
                    <div key={acc.id} style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', fontFamily: 'monospace', marginRight: '0.5rem' }}>{acc.id}</span>
                          <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{acc.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleOpenSaldo(acc)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-success)' }} title="Set Saldo Awal">
                            <DollarSign size={15} />
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
                      {sAwal > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600 }}>
                          Saldo Awal: {fmt(sAwal)}
                        </div>
                      )}
                      {acc.isDefault && (
                        <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', background: 'var(--color-border)', borderRadius: 99, color: 'var(--color-text-muted)' }}>Sistem</span>
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
                  <input type="text" className="form-control" value={form.id} onChange={e => setForm({...form, id: e.target.value})} required disabled={modalMode === 'edit' && selectedAcc?.isDefault} />
                </div>
              <div className="form-group">
                <label className="form-label">Nama Akun</label>
                <input type="text" className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <select className="form-control" value={form.category} onChange={e => setForm({...form, category: e.target.value})} disabled={modalMode === 'edit' && selectedAcc?.isDefault}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {(modalMode === 'edit' && selectedAcc?.isDefault) && (
                  <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>*Akun sistem tidak dapat diubah kategori dan kodenya.</p>
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

      {/* ── Modal Saldo Awal ── */}
      {showSaldoModal && (
        <div className="modal-overlay" onClick={() => setShowSaldoModal(false)}>
          <div className="modal-content" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Set Saldo Awal</h3>
              <button className="modal-close-btn" onClick={() => setShowSaldoModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveSaldo}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Akun</label>
                  <input type="text" className="form-control" value={saldoForm.accountName} disabled />
                </div>
              <div className="form-group">
                <label className="form-label">Nominal Saldo Awal (Rp)</label>
                <input type="number" className="form-control" value={saldoForm.amount} onChange={e => setSaldoForm({...saldoForm, amount: e.target.value})} min="0" autoFocus />
                <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                  *Saldo penyeimbang otomatis akan dialokasikan ke akun "Saldo Penyeimbang" untuk menjaga keseimbangan Neraca.
                </p>
              </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSaldoModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary flex items-center gap-2"><Check size={16} /> Simpan Saldo</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChartOfAccounts;
