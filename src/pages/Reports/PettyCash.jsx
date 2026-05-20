import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { Wallet, Plus, ArrowDownToLine, ArrowUpFromLine, ReceiptText, X, History } from 'lucide-react';

export default function PettyCash() {
  const { journal, replenishPettyCash, addPettyCashExpense, addTransaction } = useStore();
  const accounts = useStore((s) => s.accounts) || [];
  
  // Resolve nama akun Kas Kecil dari master data (kode 102) + semua variasi nama
  const kasKecilName = accounts.find(a => a.id === '102')?.name || 'Kas Kecil';
  
  // Match function: cek apakah akun ini adalah Kas Kecil (by ID atau nama)
  const isKasKecilAccount = (accountName) => {
    if (!accountName) return false;
    const lower = accountName.toLowerCase();
    // Match by exact name dari master data
    if (lower === kasKecilName.toLowerCase()) return true;
    // Match variasi umum
    if (lower === 'kas kecil' || lower === 'petty cash') return true;
    return false;
  };
  
  const [showReplenishModal, setShowReplenishModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  
  // Replenish form
  const [replenishAmount, setReplenishAmount] = useState('');
  const [replenishDesc, setReplenishDesc] = useState('Pengisian Kas Kecil');
  const [replenishDate, setReplenishDate] = useState(new Date().toISOString().split('T')[0]);

  // Expense form
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseAccount, setExpenseAccount] = useState('Beban Operasional');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  // Income form
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeAccount, setIncomeAccount] = useState('Pendapatan Lain-lain');
  const [incomeDesc, setIncomeDesc] = useState('');
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]);

  // 1. Hitung Saldo Kas Kecil (case-insensitive match)
  const pettyCashBalance = useMemo(() => {
    let balance = 0;
    journal.forEach(entry => {
      if (isKasKecilAccount(entry.account)) {
        balance += (entry.debit || 0) - (entry.credit || 0);
      }
    });
    return balance;
  }, [journal, kasKecilName]);

  // 2. Ambil Riwayat Transaksi Kas Kecil
  const pettyCashHistory = useMemo(() => {
    // Kita cari semua entry jurnal yang melibatkan 'Kas Kecil'
    // Lalu kita gabungkan dengan entry pasangannya (id jurnal yang sama) untuk mengetahui detail lawannya.
    const history = [];
    const grouped = {};
    
    journal.forEach(entry => {
      if (!grouped[entry.id]) grouped[entry.id] = [];
      grouped[entry.id].push(entry);
    });

    Object.keys(grouped).forEach(jid => {
      const entries = grouped[jid];
      const hasPettyCash = entries.find(e => isKasKecilAccount(e.account));
      if (hasPettyCash) {
        // Tentukan apakah Kas Kecil di debit (Masuk) atau kredit (Keluar)
        const isMasuk = hasPettyCash.debit > 0;
        const amount = isMasuk ? hasPettyCash.debit : hasPettyCash.credit;
        // Cari akun pasangannya
        const lawan = entries.find(e => !isKasKecilAccount(e.account));
        
        history.push({
          id: jid,
          date: hasPettyCash.date,
          description: hasPettyCash.description,
          accountLawan: lawan ? lawan.account : '-',
          type: isMasuk ? 'Masuk' : 'Keluar',
          amount: amount
        });
      }
    });

    // Urutkan dari yang terbaru
    return history.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [journal]);

  const handleReplenish = (e) => {
    e.preventDefault();
    const amountNum = Number(replenishAmount);
    if (amountNum <= 0) return alert('Nominal harus lebih dari 0');
    
    replenishPettyCash(amountNum, replenishDesc, replenishDate);
    setShowReplenishModal(false);
    setReplenishAmount('');
    setReplenishDesc('Pengisian Kas Kecil');
    alert('Pengisian Kas Kecil Berhasil!');
  };

  const handleExpense = (e) => {
    e.preventDefault();
    const amountNum = Number(expenseAmount);
    if (amountNum <= 0) return alert('Nominal harus lebih dari 0');
    if (!expenseDesc.trim()) return alert('Keterangan tidak boleh kosong');

    addPettyCashExpense(expenseAccount, amountNum, expenseDesc, expenseDate);
    setShowExpenseModal(false);
    setExpenseAmount('');
    setExpenseDesc('');
    setExpenseAccount('Beban Operasional');
    alert('Pengeluaran Kas Kecil Berhasil Dicatat!');
  };

  const handleIncome = (e) => {
    e.preventDefault();
    const amountNum = Number(incomeAmount);
    if (amountNum <= 0) return alert('Nominal harus lebih dari 0');
    if (!incomeDesc.trim()) return alert('Keterangan tidak boleh kosong');

    const newId = `JU-${Date.now().toString(36).toUpperCase()}`;
    addTransaction([
      { id: newId, date: incomeDate, description: incomeDesc, ref: 'BKM', debit: amountNum, credit: 0, account: kasKecilName },
      { id: newId, date: incomeDate, description: incomeDesc, ref: 'BKM', debit: 0, credit: amountNum, account: incomeAccount },
    ]);
    setShowIncomeModal(false);
    setIncomeAmount('');
    setIncomeDesc('');
    setIncomeAccount('Pendapatan Lain-lain');
    alert('Pemasukan Kas Kecil Berhasil Dicatat!');
  };

  return (
    <div className="page-container fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="text-primary" size={28} />
            Kas Kecil (Petty Cash)
          </h1>
          <p className="text-muted">Kelola dana operasional harian dan reimbursement</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="stat-card glass-panel flex flex-col justify-center text-center" style={{ padding: '2rem' }}>
          <div className="text-muted font-bold mb-2">SALDO KAS KECIL SAAT INI</div>
          <div className="text-4xl font-black text-primary">Rp {pettyCashBalance.toLocaleString('id-ID')}</div>
        </div>

        <div className="col-span-2 grid grid-cols-3 gap-4">
          <div 
            className="glass-panel cursor-pointer hover-card flex flex-col items-center justify-center text-center"
            style={{ padding: '1.5rem', border: '2px dashed var(--color-success)', background: 'rgba(34,197,94,0.05)' }}
            onClick={() => setShowReplenishModal(true)}
          >
            <ArrowDownToLine size={32} className="text-success mb-2" />
            <h3 className="font-bold mb-1" style={{ fontSize: '0.9rem' }}>Isi Saldo (Reimburse)</h3>
            <p className="text-xs text-muted">Tarik dana dari Kas Utama</p>
          </div>

          <div 
            className="glass-panel cursor-pointer hover-card flex flex-col items-center justify-center text-center"
            style={{ padding: '1.5rem', border: '2px dashed var(--color-primary)', background: 'rgba(255,77,0,0.05)' }}
            onClick={() => setShowIncomeModal(true)}
          >
            <ArrowUpFromLine size={32} className="text-primary mb-2" />
            <h3 className="font-bold mb-1" style={{ fontSize: '0.9rem' }}>Catat Pemasukan</h3>
            <p className="text-xs text-muted">Pendapatan masuk ke Kas Kecil</p>
          </div>

          <div 
            className="glass-panel cursor-pointer hover-card flex flex-col items-center justify-center text-center"
            style={{ padding: '1.5rem', border: '2px dashed var(--color-danger)', background: 'rgba(239,68,68,0.05)' }}
            onClick={() => setShowExpenseModal(true)}
          >
            <ReceiptText size={32} className="text-danger mb-2" />
            <h3 className="font-bold mb-1" style={{ fontSize: '0.9rem' }}>Catat Pengeluaran</h3>
            <p className="text-xs text-muted">Beli ATK, Konsumsi, dll</p>
          </div>
        </div>
      </div>

      <div className="glass-panel">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center gap-2">
          <History size={18} className="text-primary" />
          <h2 className="font-bold">Riwayat Transaksi Kas Kecil</h2>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>ID Jurnal</th>
                <th>Keterangan</th>
                <th>Akun Lawan</th>
                <th className="text-right">Dana Masuk</th>
                <th className="text-right">Dana Keluar</th>
              </tr>
            </thead>
            <tbody>
              {pettyCashHistory.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-muted">
                    Belum ada transaksi kas kecil.
                  </td>
                </tr>
              ) : (
                pettyCashHistory.map((item, idx) => (
                  <tr key={`${item.id}-${idx}`}>
                    <td>{item.date}</td>
                    <td className="text-muted text-sm">{item.id}</td>
                    <td>{item.description}</td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(0,0,0,0.05)', color: 'inherit' }}>
                        {item.accountLawan}
                      </span>
                    </td>
                    <td className="text-right font-bold text-success">
                      {item.type === 'Masuk' ? `Rp ${item.amount.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="text-right font-bold text-danger">
                      {item.type === 'Keluar' ? `Rp ${item.amount.toLocaleString('id-ID')}` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Isi Saldo */}
      {showReplenishModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Isi Saldo Kas Kecil</h3>
              <button className="modal-close-btn" onClick={() => setShowReplenishModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleReplenish}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tanggal Transaksi</label>
                  <input type="date" className="form-control" value={replenishDate} onChange={e => setReplenishDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Nominal Pengisian (Rp)</label>
                  <input type="number" className="form-control" value={replenishAmount} onChange={e => setReplenishAmount(e.target.value)} required min="1" autoFocus />
                  <div className="text-xs text-muted mt-1">Dana akan ditarik dari "Kas Bank" (Kas Utama).</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Keterangan</label>
                  <input type="text" className="form-control" value={replenishDesc} onChange={e => setReplenishDesc(e.target.value)} required />
                </div>
              </div>
              <div className="modal-footer flex gap-2 justify-end">
                <button type="button" className="btn btn-secondary" onClick={() => setShowReplenishModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Proses Isi Saldo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Catat Pengeluaran */}
      {showExpenseModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Catat Pengeluaran Kas Kecil</h3>
              <button className="modal-close-btn" onClick={() => setShowExpenseModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleExpense}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tanggal Transaksi</label>
                  <input type="date" className="form-control" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Kategori Pengeluaran</label>
                  <select className="form-control" value={expenseAccount} onChange={e => setExpenseAccount(e.target.value)}>
                    <optgroup label="Beban Operasional">
                      <option value="Beban Operasional">Beban Operasional Umum</option>
                      <option value="Beban ATK">Beban Alat Tulis Kantor (ATK)</option>
                      <option value="Beban Konsumsi">Beban Konsumsi / Rapat</option>
                      <option value="Beban Transportasi">Beban Transportasi / Bensin</option>
                      <option value="Beban Kebersihan">Beban Kebersihan / Keamanan</option>
                      <option value="Beban Lain-Lain">Beban Lain-Lain</option>
                    </optgroup>
                    <optgroup label="Kewajiban">
                      <option value="Hutang Konsinyasi">Hutang Konsinyasi</option>
                      <option value="Hutang Dagang">Hutang Dagang</option>
                    </optgroup>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Nominal Pengeluaran (Rp)</label>
                  <input type="number" className="form-control" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} required min="1" autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Keterangan / Rincian Belanja</label>
                  <input type="text" className="form-control" placeholder="Contoh: Beli kertas HVS 2 rim" value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)} required />
                </div>
              </div>
              <div className="modal-footer flex gap-2 justify-end">
                <button type="button" className="btn btn-secondary" onClick={() => setShowExpenseModal(false)}>Batal</button>
                <button type="submit" className="btn btn-danger">Catat Pengeluaran</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Catat Pemasukan */}
      {showIncomeModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Catat Pemasukan Kas Kecil</h3>
              <button className="modal-close-btn" onClick={() => setShowIncomeModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleIncome}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tanggal Transaksi</label>
                  <input type="date" className="form-control" value={incomeDate} onChange={e => setIncomeDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Kategori Pemasukan</label>
                  <select className="form-control" value={incomeAccount} onChange={e => setIncomeAccount(e.target.value)}>
                    <optgroup label="Pendapatan">
                      <option value="Pendapatan Lain-lain">Pendapatan Lain-lain</option>
                      <option value="Pendapatan Bunga">Pendapatan Bunga</option>
                      <option value="Pendapatan Jasa">Pendapatan Jasa</option>
                    </optgroup>
                    <optgroup label="Piutang">
                      <option value="Piutang Dagang">Pelunasan Piutang Dagang</option>
                    </optgroup>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Nominal Pemasukan (Rp)</label>
                  <input type="number" className="form-control" value={incomeAmount} onChange={e => setIncomeAmount(e.target.value)} required min="1" autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Keterangan</label>
                  <input type="text" className="form-control" placeholder="Contoh: Terima pembayaran piutang" value={incomeDesc} onChange={e => setIncomeDesc(e.target.value)} required />
                </div>
              </div>
              <div className="modal-footer flex gap-2 justify-end">
                <button type="button" className="btn btn-secondary" onClick={() => setShowIncomeModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Catat Pemasukan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
