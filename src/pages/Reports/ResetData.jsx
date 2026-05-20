import React, { useState, useMemo } from 'react';
import { Trash2, AlertTriangle, Calendar } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { supabase, isSupabaseReady } from '../../lib/supabase';

const ResetData = () => {
  const currentUser = useStore((s) => s.currentUser);
  const journal = useStore((s) => s.journal) || [];
  const setJournal = useStore((s) => s.setJournal);
  const setMembers = useStore((s) => s.setMembers);
  const setProducts = useStore((s) => s.setProducts);
  const setConsignmentProducts = useStore((s) => s.setConsignmentProducts);
  const setServices = useStore((s) => s.setServices);
  const setCashLoans = useStore((s) => s.setCashLoans);
  const setCreditGoods = useStore((s) => s.setCreditGoods);
  const setMemberSalesTransactions = useStore((s) => s.setMemberSalesTransactions);

  const [selectedMonth, setSelectedMonth] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [confirmAllText, setConfirmAllText] = useState('');
  const [loading, setLoading] = useState(false);

  const allowedUsers = ['aslamhadilmatin', 'uci', 'surtini', 'indah'];
  const isAllowed = allowedUsers.includes(currentUser?.username);

  const monthOptions = useMemo(() => {
    const months = [...new Set(journal.map(j => j.date?.slice(0, 7)))].filter(Boolean).sort().reverse();
    return months;
  }, [journal]);

  const fmtMonth = (ym) => {
    if (!ym) return '';
    const [y, m] = ym.split('-');
    return new Date(y, m - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  const journalCount = selectedMonth
    ? journal.filter(j => j.date?.startsWith(selectedMonth)).length
    : 0;

  // Reset jurnal bulanan
  const handleResetBulanan = async () => {
    if (!selectedMonth) return alert('Pilih bulan terlebih dahulu.');
    if (confirmText !== 'HAPUS') return alert('Ketik "HAPUS" untuk konfirmasi.');

    setLoading(true);
    try {
      // Hapus dari state
      const remaining = journal.filter(j => !j.date?.startsWith(selectedMonth));
      setJournal(remaining);

      // Hapus dari Supabase
      if (isSupabaseReady()) {
        const startDate = `${selectedMonth}-01`;
        const [y, m] = selectedMonth.split('-');
        const lastDay = new Date(y, m, 0).getDate();
        const endDate = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;
        await supabase.from('journal').delete().gte('date', startDate).lte('date', endDate);
        await supabase.from('member_sales_transactions').delete().gte('date', startDate).lte('date', endDate);
      }

      setConfirmText('');
      alert(`Berhasil menghapus ${journalCount} entri jurnal bulan ${fmtMonth(selectedMonth)}.`);
    } catch (err) {
      alert('Gagal: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset semua data
  const handleResetSemua = async () => {
    if (confirmAllText !== 'HAPUS SEMUA DATA') return alert('Ketik "HAPUS SEMUA DATA" untuk konfirmasi.');

    setLoading(true);
    try {
      // Kosongkan state
      setJournal([]);
      setMembers([]);
      setProducts([]);
      setConsignmentProducts([]);
      setServices([]);
      setCashLoans([]);
      setCreditGoods([]);
      setMemberSalesTransactions([]);

      // Kosongkan Supabase
      if (isSupabaseReady()) {
        await supabase.from('journal').delete().neq('journal_id', '___never___');
        await supabase.from('members').delete().neq('member_id', '___never___');
        await supabase.from('products').delete().neq('product_id', '___never___');
        await supabase.from('consignment_products').delete().neq('product_id', '___never___');
        await supabase.from('services').delete().neq('service_id', '___never___');
        await supabase.from('cash_loans').delete().neq('loan_id', '___never___');
        await supabase.from('credit_goods').delete().neq('credit_id', '___never___');
        await supabase.from('member_sales_transactions').delete().neq('tx_id', '___never___');
      }

      setConfirmAllText('');
      alert('Semua data berhasil dihapus. Aplikasi kembali ke kondisi awal.');
    } catch (err) {
      alert('Gagal: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAllowed) {
    return (
      <div className="page-container">
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <AlertTriangle size={48} style={{ color: 'var(--color-danger)', marginBottom: '1rem' }} />
          <h3>Akses Ditolak</h3>
          <p className="text-muted">Hanya akun tertentu yang dapat mengakses menu ini.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mb-6">
        <h2 className="flex items-center gap-2" style={{ color: 'var(--color-danger)' }}>
          <Trash2 size={24} />
          Reset Data
        </h2>
        <p className="text-muted">Hapus data jurnal bulanan atau kosongkan seluruh data sistem.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Reset Bulanan */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} style={{ color: 'var(--color-warning)' }} />
            Reset Jurnal Bulanan
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            Hapus semua transaksi jurnal pada bulan tertentu. Data anggota, produk, dan master data tetap aman.
          </p>

          <div className="form-group">
            <label className="form-label">Pilih Bulan</label>
            <select className="form-control" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
              <option value="">-- Pilih Bulan --</option>
              {monthOptions.map(m => <option key={m} value={m}>{fmtMonth(m)}</option>)}
            </select>
          </div>

          {selectedMonth && (
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', padding: '0.75rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.82rem' }}>
              <strong>{journalCount}</strong> entri jurnal akan dihapus untuk bulan <strong>{fmtMonth(selectedMonth)}</strong>.
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Ketik <strong style={{ color: 'var(--color-danger)' }}>HAPUS</strong> untuk konfirmasi</label>
            <input type="text" className="form-control" value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder='Ketik "HAPUS"' />
          </div>

          <button
            className="btn"
            style={{ background: 'var(--color-warning)', color: '#fff', width: '100%', padding: '0.7rem', fontWeight: 700 }}
            onClick={handleResetBulanan}
            disabled={loading || confirmText !== 'HAPUS' || !selectedMonth}
          >
            {loading ? 'Memproses...' : 'Hapus Jurnal Bulan Ini'}
          </button>
        </div>

        {/* Reset Semua */}
        <div className="glass-panel" style={{ padding: '1.5rem', border: '2px solid var(--color-danger)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)' }}>
            <AlertTriangle size={18} />
            Reset Semua Data
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            <strong style={{ color: 'var(--color-danger)' }}>BAHAYA!</strong> Menghapus SELURUH data: jurnal, anggota, produk, pinjaman, kredit barang, dan semua transaksi. Tidak dapat dikembalikan.
          </p>

          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '0.75rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.82rem', color: 'var(--color-danger)' }}>
            ⚠️ Tindakan ini PERMANEN dan tidak bisa di-undo. Pastikan sudah backup data jika diperlukan.
          </div>

          <div className="form-group">
            <label className="form-label">Ketik <strong style={{ color: 'var(--color-danger)' }}>HAPUS SEMUA DATA</strong> untuk konfirmasi</label>
            <input type="text" className="form-control" value={confirmAllText} onChange={e => setConfirmAllText(e.target.value)} placeholder='Ketik "HAPUS SEMUA DATA"' />
          </div>

          <button
            className="btn"
            style={{ background: 'var(--color-danger)', color: '#fff', width: '100%', padding: '0.7rem', fontWeight: 700 }}
            onClick={handleResetSemua}
            disabled={loading || confirmAllText !== 'HAPUS SEMUA DATA'}
          >
            {loading ? 'Memproses...' : '🗑️ Hapus Semua Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetData;
