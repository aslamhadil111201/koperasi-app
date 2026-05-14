import React, { useState, useMemo } from 'react';
import { Lock, FileText, Check, AlertTriangle, Calendar } from 'lucide-react';
import { useStore } from '../../store/useStore';
import './Reports.css';

const Closing = () => {
  const journal = useStore((s) => s.journal) || [];
  const accounts = useStore((s) => s.accounts) || [];
  const closePeriod = useStore((s) => s.closePeriod);

  // Period Options: list of YYYY-MM and YYYY from journal dates
  const periodOptions = useMemo(() => {
    const dates = journal.map(j => j.date).filter(Boolean);
    const months = [...new Set(dates.map(d => d.slice(0, 7)))];
    const years = [...new Set(dates.map(d => d.slice(0, 4)))];
    const all = [...new Set([...years, ...months])].sort().reverse();
    return all;
  }, [journal]);

  const [selectedPeriod, setSelectedPeriod] = useState(periodOptions[0] || '');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ─── Preview Data ─────────────────────────────────────────────────────────
  // Hitung perkiraan saldo yang akan ditutup hingga akhir periode terpilih.
  const preview = useMemo(() => {
    if (!selectedPeriod) return null;

    let periodDate;
    if (selectedPeriod.length === 4) {
      // Tahunan
      periodDate = `${selectedPeriod}-12-31`;
    } else {
      // Bulanan
      const [year, month] = selectedPeriod.split('-');
      const lastDay = new Date(year, month, 0).getDate();
      periodDate = `${selectedPeriod}-${String(lastDay).padStart(2, '0')}`;
    }

    const nominalAccounts = accounts.filter(a => 
      a.category.includes('Pendapatan') || 
      a.category.includes('Beban') || 
      a.category === 'Harga Pokok Penjualan'
    );
    const nominalAccountNames = nominalAccounts.map(a => a.name);

    const relevantJournal = journal.filter(j => 
      j.date <= periodDate && nominalAccountNames.includes(j.account)
    );

    const balances = {};
    nominalAccounts.forEach(acc => {
      balances[acc.name] = { debit: 0, credit: 0, type: acc.type, category: acc.category };
    });

    relevantJournal.forEach(e => {
      if (balances[e.account]) {
        balances[e.account].debit += (e.debit || 0);
        balances[e.account].credit += (e.credit || 0);
      }
    });

    let totalPendapatan = 0;
    let totalBeban = 0;
    let totalHPP = 0;

    Object.keys(balances).forEach(accName => {
      const b = balances[accName];
      const net = b.type === 'debit' ? (b.debit - b.credit) : (b.credit - b.debit);
      if (net === 0) return;

      if (b.category.includes('Pendapatan')) totalPendapatan += net;
      else if (b.category === 'Harga Pokok Penjualan') totalHPP += net;
      else if (b.category.includes('Beban')) totalBeban += net;
    });

    const netProfit = totalPendapatan - totalHPP - totalBeban;

    return {
      periodDate,
      totalPendapatan,
      totalHPP,
      totalBeban,
      netProfit,
      isEmpty: totalPendapatan === 0 && totalHPP === 0 && totalBeban === 0
    };
  }, [selectedPeriod, journal, accounts]);

  const handleClose = () => {
    if (!preview || preview.isEmpty) {
      setErrorMsg('Tidak ada saldo nominal yang bisa ditutup pada periode ini.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    if (window.confirm(`Proses Tutup Buku akan menihilkan semua saldo Pendapatan dan Beban hingga ${preview.periodDate}, dan memindahkan selisihnya ke SHU Tahun Berjalan. Lanjutkan?`)) {
      try {
        const fmtLabel = selectedPeriod.length === 4 
          ? `Tahun ${selectedPeriod}` 
          : new Date(selectedPeriod + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
          
        closePeriod(preview.periodDate, `Periode ${fmtLabel}`);
        setSuccessMsg(`Tutup buku periode ${fmtLabel} berhasil dieksekusi!`);
        setTimeout(() => setSuccessMsg(''), 4000);
      } catch (err) {
        setErrorMsg('Gagal memproses tutup buku.');
        setTimeout(() => setErrorMsg(''), 3000);
      }
    }
  };

  const fmt = (n) => `Rp ${n.toLocaleString('id-ID')}`;
  const fmtPeriodLabel = (p) => {
    if (!p) return '';
    if (p.length === 4) return `Tahunan - ${p}`;
    const [y, m] = p.split('-');
    return `Bulanan - ${new Date(y, m - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
  };

  return (
    <div className="reports-container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2>Tutup Buku (Closing)</h2>
          <p className="text-muted">Proses akhir bulan / akhir tahun untuk menihilkan akun nominal sesuai PSAK.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6" style={{ alignItems: 'start' }}>
        {/* Kiri: Form Tutup Buku */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div className="flex items-center gap-3 mb-6">
            <div style={{ background: 'rgba(255,77,0,0.1)', color: 'var(--color-primary)', padding: 12, borderRadius: 12 }}>
              <Lock size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Proses Tutup Buku</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Pilih periode transaksi yang akan ditutup.</p>
            </div>
          </div>

          <div className="form-group mb-6">
            <label className="form-label">Periode</label>
            <div className="search-bar" style={{ width: '100%' }}>
              <Calendar size={18} style={{ color: 'var(--color-text-muted)' }} />
              <select
                className="search-input"
                style={{ width: '100%', fontSize: '1rem', padding: '0.2rem 0' }}
                value={selectedPeriod}
                onChange={e => setSelectedPeriod(e.target.value)}
              >
                {periodOptions.map(p => (
                  <option key={p} value={p}>{fmtPeriodLabel(p)}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: 4 }}>Peringatan Sistem</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  Proses ini akan menghasilkan <strong>Jurnal Penutup</strong> yang meng-kredit/mendebit seluruh akun nominal (Pendapatan & Beban) sehingga bersaldo Nol (0) di Buku Besar, lalu memindahkan selisihnya ke akun <strong>SHU Tahun Berjalan</strong>.
                </p>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {successMsg}
            </div>
          )}

          <button 
            className="btn btn-primary w-full" 
            style={{ padding: '0.875rem', fontSize: '1rem' }}
            onClick={handleClose}
            disabled={!preview || preview.isEmpty}
          >
            <Check size={20} /> Eksekusi Tutup Buku
          </button>
        </div>

        {/* Kanan: Preview */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={20} color="var(--color-secondary)" />
            Pratinjau Jurnal Penutup
          </h3>

          {!preview ? (
            <p className="text-muted text-center py-6 text-sm">Pilih periode untuk melihat pratinjau.</p>
          ) : preview.isEmpty ? (
            <div className="text-center py-8">
              <div style={{ background: 'rgba(0,0,0,0.03)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Lock size={28} color="var(--color-text-muted)" />
              </div>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>Tidak ada saldo nominal di periode ini atau periode ini sudah ditutup.</p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                Batas tanggal tutup: <strong style={{ color: 'var(--color-text-main)' }}>{preview.periodDate}</strong>
              </p>
              
              <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <div className="flex justify-between p-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Total Pendapatan</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-success)' }}>{fmt(preview.totalPendapatan)}</span>
                </div>
                <div className="flex justify-between p-3" style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.01)' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Total HPP</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-danger)' }}>{fmt(preview.totalHPP)}</span>
                </div>
                <div className="flex justify-between p-3" style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.01)' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Total Beban</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-danger)' }}>{fmt(preview.totalBeban)}</span>
                </div>
                
                <div className="flex justify-between p-4" style={{ background: 'rgba(6,182,212,0.05)' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Total Laba/Rugi (SHU) dipindah</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: preview.netProfit >= 0 ? 'var(--color-primary)' : 'var(--color-danger)' }}>
                    {fmt(preview.netProfit)}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '1.5rem', lineHeight: 1.5 }}>
                *Sistem akan men-generate jurnal yang mengenolkan seluruh akun spesifik yang menyusun total di atas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Closing;
