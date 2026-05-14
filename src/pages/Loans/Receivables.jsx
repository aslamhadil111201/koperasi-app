import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { Search, FileText, X, CheckSquare, Trash2 } from 'lucide-react';

export default function Receivables() {
  const { members, journal, cashLoans, creditGoods, processPayrollDeduction, currentUser, deleteCreditGoods, deleteCashLoan } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [selectedMember, setSelectedMember] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [payments, setPayments] = useState([]);
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);

  // 1. Calculate raw Piutang Dagang (from Journal)
  const rawPiutangDagangMap = useMemo(() => {
    const map = {};
    journal.forEach(entry => {
      if (entry.account === 'Piutang Dagang') {
        const memberId = entry.ref;
        if (!map[memberId]) map[memberId] = 0;
        map[memberId] += (entry.debit || 0) - (entry.credit || 0);
      }
    });
    return map;
  }, [journal]);

  // 2. Active Cash Loans
  const activeCashLoans = useMemo(() => cashLoans.filter(l => l.status === 'Active' && l.remainingAmount > 0), [cashLoans]);
  
  // 3. Active Credit Goods (including Kasbon Ritel/Jasa)
  const activeCreditGoods = useMemo(() => creditGoods.filter(c => c.status === 'Active' && c.remainingAmount > 0), [creditGoods]);

  // Group by member
  const receivablesList = useMemo(() => {
    return members.map(member => {
      const cLoans = activeCashLoans.filter(l => l.memberId === member.id);
      const cGoods = activeCreditGoods.filter(c => c.memberId === member.id);
      
      const pAnggota = cLoans.reduce((sum, l) => sum + l.remainingAmount, 0);
      
      const realGoods = cGoods.filter(c => !c.itemName.includes('Kasbon Penjualan'));
      const kasbonGoods = cGoods.filter(c => c.itemName.includes('Kasbon Penjualan'));
      
      const pBarang = realGoods.reduce((sum, c) => sum + c.remainingAmount, 0);
      const pKasbonBaru = kasbonGoods.reduce((sum, c) => sum + c.remainingAmount, 0);
      
      const rawPDagang = rawPiutangDagangMap[member.id] || 0;
      const legacyDagang = Math.max(0, rawPDagang - pKasbonBaru);

      const pDagang = pKasbonBaru + legacyDagang;
      const total = pDagang + pAnggota + pBarang;

      return {
        id: member.id, name: member.name,
        pDagang, pAnggota, pBarang, legacyDagang, total,
        cLoans, cGoods
      };
    }).filter(m => m.total > 0);
  }, [members, activeCashLoans, activeCreditGoods, rawPiutangDagangMap]);

  const filteredList = receivablesList.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openPaymentModal = (memberData) => {
    setSelectedMember(memberData);
    const initPayments = [];
    
    memberData.cLoans.forEach(l => {
      const unpaid = (l.installments || []).filter(i => i.status !== 'Paid');
      initPayments.push({
        id: l.id, type: 'CashLoan', name: l.name || 'Pinjaman Tunai',
        remainingAmount: l.remainingAmount, 
        tenor: l.tenor, unpaidCount: unpaid.length,
        installments: l.installments || [],
        payInstallments: 0, amount: 0
      });
    });

    memberData.cGoods.forEach(c => {
      const unpaid = (c.installments || []).filter(i => i.status !== 'Paid');
      initPayments.push({
        id: c.id, type: 'CreditGood', name: c.itemName,
        remainingAmount: c.remainingAmount,
        tenor: c.tenor, unpaidCount: unpaid.length,
        installments: c.installments || [],
        payInstallments: 0, amount: 0
      });
    });

    if (memberData.legacyDagang > 0) {
      initPayments.push({
        id: 'legacy', type: 'LegacyDagang', name: 'Hutang Ritel/Jasa Lama (Non-Cicilan)',
        remainingAmount: memberData.legacyDagang,
        amount: 0
      });
    }

    setPayments(initPayments);
    setShowModal(true);
  };

  const handleInstallmentChange = (idx, value) => {
    const newPayments = [...payments];
    const p = newPayments[idx];
    
    if (p.type === 'LegacyDagang') {
      p.amount = Math.min(Math.max(0, value), p.remainingAmount);
    } else {
      const count = Math.min(Math.max(0, value), p.unpaidCount);
      p.payInstallments = count;
      const unpaid = p.installments.filter(i => i.status !== 'Paid');
      let total = 0;
      for (let i = 0; i < count; i++) {
        if (unpaid[i]) total += unpaid[i].amount;
      }
      p.amount = Math.min(total, p.remainingAmount);
    }
    setPayments(newPayments);
  };

  const handleProcess = () => {
    const toPay = payments.filter(p => p.amount > 0);
    if (toPay.length === 0) return alert('Masukkan jumlah cicilan/nominal yang ingin dibayar.');
    
    const totalDeduction = toPay.reduce((s, p) => s + p.amount, 0);
    if (!window.confirm(`Proses potong gaji untuk ${selectedMember.name} sebesar Rp ${totalDeduction.toLocaleString('id-ID')}?`)) return;

    processPayrollDeduction(selectedMember.id, toPay.map(p => ({
      type: p.type, id: p.id, amount: p.amount
    })), txDate);
    
    setShowModal(false);
    setSelectedMember(null);
  };

  return (
    <div className="page-container fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Piutang & Potong Gaji</h1>
          <p className="text-muted">Daftar hutang anggota dan pelunasan (Payroll Deduction)</p>
        </div>
        <div className="search-bar" style={{ width: '300px' }}>
          <Search size={18} className="text-muted" />
          <input type="text" placeholder="Cari anggota..." className="search-input"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="glass-panel">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID Anggota</th>
                <th>Nama Anggota</th>
                <th className="text-right">Kasbon (Ritel/Jasa)</th>
                <th className="text-right">Pinjaman Tunai</th>
                <th className="text-right">Kredit Barang</th>
                <th className="text-right">Total Tagihan</th>
                <th className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-muted">Tidak ada anggota yang memiliki hutang/tagihan.</td>
                </tr>
              ) : (
                filteredList.map(item => (
                  <tr key={item.id}>
                    <td className="font-medium text-primary">{item.id}</td>
                    <td>{item.name}</td>
                    <td className="text-right">{item.pDagang > 0 ? `Rp ${item.pDagang.toLocaleString('id-ID')}` : '-'}</td>
                    <td className="text-right">{item.pAnggota > 0 ? `Rp ${item.pAnggota.toLocaleString('id-ID')}` : '-'}</td>
                    <td className="text-right">{item.pBarang > 0 ? `Rp ${item.pBarang.toLocaleString('id-ID')}` : '-'}</td>
                    <td className="text-right font-bold text-danger">Rp {item.total.toLocaleString('id-ID')}</td>
                    <td className="text-center">
                      <div style={{ display:'flex', gap:'0.5rem', justifyContent:'center' }}>
                        <button className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => openPaymentModal(item)}>
                          <FileText size={14} style={{ marginRight: 4 }} /> Detail & Bayar
                        </button>
                        {currentUser?.username === 'aslamhadilmatin' && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding:'0.25rem 0.5rem', fontSize:'0.8rem', color:'var(--color-danger)' }}
                            title="Hapus semua kredit aktif anggota ini"
                            onClick={() => {
                              if (window.confirm(`Hapus SEMUA data kredit aktif untuk "${item.name}"? Data akan dihapus dari daftar piutang.`)) {
                                item.cGoods.forEach(c => deleteCreditGoods(c.id));
                                item.cLoans.forEach(l => deleteCashLoan(l.id));
                              }
                            }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredList.length > 0 && (
              <tfoot>
                <tr className="bg-primary/5 font-bold">
                  <td colSpan="2" className="text-right">TOTAL KESELURUHAN:</td>
                  <td className="text-right">Rp {filteredList.reduce((s, i) => s + i.pDagang, 0).toLocaleString('id-ID')}</td>
                  <td className="text-right">Rp {filteredList.reduce((s, i) => s + i.pAnggota, 0).toLocaleString('id-ID')}</td>
                  <td className="text-right">Rp {filteredList.reduce((s, i) => s + i.pBarang, 0).toLocaleString('id-ID')}</td>
                  <td className="text-right text-danger">Rp {filteredList.reduce((s, i) => s + i.total, 0).toLocaleString('id-ID')}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {showModal && selectedMember && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content glass-panel" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>Detail Hutang & Potong Gaji</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1rem' }}>
                <span className="text-muted">Anggota:</span> <strong className="text-primary">{selectedMember.name} ({selectedMember.id})</strong>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Tanggal Transaksi</label>
                <input type="date" className="form-control" value={txDate} onChange={(e) => setTxDate(e.target.value)} required />
              </div>

              {payments.map((p, idx) => (
                <div key={p.id} style={{ background: 'rgba(6,182,212,0.04)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong style={{ color: 'var(--color-secondary)' }}>{p.name}</strong>
                    <span className="text-danger font-bold">Sisa Tagihan: Rp {p.remainingAmount.toLocaleString('id-ID')}</span>
                  </div>
                  
                  {p.type === 'LegacyDagang' ? (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label text-xs">Nominal Bayar (Rp)</label>
                      <input type="number" className="form-control" value={p.amount || ''}
                        onChange={(e) => handleInstallmentChange(idx, Number(e.target.value))} max={p.remainingAmount} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 items-end">
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                          Sisa Cicilan: {p.unpaidCount}x dari {p.tenor} Bulan
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label text-xs">Potong Berapa Cicilan?</label>
                          <input type="number" className="form-control" value={p.payInstallments || ''} min={0} max={p.unpaidCount}
                            onChange={(e) => handleInstallmentChange(idx, Number(e.target.value))} />
                        </div>
                      </div>
                      <div className="text-right">
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Nominal Dipotong:</div>
                        <div className="font-bold text-primary" style={{ fontSize: '1.1rem' }}>Rp {p.amount.toLocaleString('id-ID')}</div>
                      </div>
                    </div>
                  )}
                  {p.type !== 'LegacyDagang' && p.installments && p.installments.length > 0 && (
                    <div style={{ marginTop: '1rem', borderTop: '1px dashed var(--color-border)', paddingTop: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Jadwal Cicilan:</div>
                      <div style={{ maxHeight: '120px', overflowY: 'auto', paddingRight: '4px' }}>
                        <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                          <tbody>
                            {p.installments.map(inst => (
                              <tr key={inst.no} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                <td style={{ padding: '4px 0' }}>Bulan ke-{inst.no} ({inst.date})</td>
                                <td style={{ padding: '4px 0', textAlign: 'right' }}>Rp {inst.amount.toLocaleString('id-ID')}</td>
                                <td style={{ padding: '4px 0', textAlign: 'right' }}>
                                  {inst.status === 'Paid' 
                                    ? <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Lunas</span> 
                                    : <span style={{ color: 'var(--color-warning)', fontWeight: 500 }}>Belum</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {payments.length === 0 && (
                <div className="text-center text-muted py-4">Tidak ada tagihan aktif.</div>
              )}

            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '1.1rem' }}>
                Total Potong Gaji: <strong className="text-danger">Rp {payments.reduce((s, p) => s + p.amount, 0).toLocaleString('id-ID')}</strong>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button className="btn btn-primary" onClick={handleProcess} disabled={payments.reduce((s, p) => s + p.amount, 0) === 0}>
                  <CheckSquare size={16} /> Konfirmasi Potong
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
