import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Save, ExternalLink, Calendar, AlertTriangle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import './MasterData.css';

const isDebitCategory = (cat) => cat.startsWith('Aset') || cat.startsWith('Beban') || cat === 'Harga Pokok Penjualan';

const NeracaSaldo = () => {
  const navigate = useNavigate();
  const accounts = useStore((s) => s.accounts) || [];
  const journal = useStore((s) => s.journal) || [];
  const setSaldoAwal = useStore((s) => s.setSaldoAwal);

  const [tanggal, setTanggal] = useState('2026-01-01');
  const [saldoInputs, setSaldoInputs] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  // Semua akun diurutkan berdasarkan nomor akun
  const allAccounts = useMemo(() => 
    [...accounts].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true })),
  [accounts]);

  // Ambil saldo awal yang sudah ada dari jurnal JU-INIT
  const existingSaldo = useMemo(() => {
    const map = {};
    journal.filter(j => j.id === 'JU-INIT' && j.account !== 'Saldo Penyeimbang').forEach(j => {
      map[j.account] = j.debit > 0 ? j.debit : j.credit;
    });
    return map;
  }, [journal]);

  const getInputValue = (accName) => {
    if (saldoInputs[accName] !== undefined) return saldoInputs[accName];
    return existingSaldo[accName] || '';
  };

  // Format angka dengan titik ribuan untuk display
  const formatDisplay = (value) => {
    if (value === '' || value === '-') return value;
    const num = Number(String(value).replace(/\./g, ''));
    if (isNaN(num)) return value;
    const isNeg = num < 0;
    const abs = Math.abs(num).toLocaleString('id-ID');
    return isNeg ? `-${abs}` : abs;
  };

  // Parse angka dari format display (hapus titik)
  const parseInput = (value) => {
    return value.replace(/\./g, '');
  };

  const handleInputChange = (accName, rawValue) => {
    const value = parseInput(rawValue);
    if (value === '' || value === '-' || !isNaN(Number(value))) {
      setSaldoInputs(prev => ({ ...prev, [accName]: value }));
    }
  };

  const getDisplayValue = (accName) => {
    const raw = getInputValue(accName);
    if (raw === '' || raw === 0) return '';
    return formatDisplay(raw);
  };

  // Hitung total debit dan kredit
  const { totalDebit, totalKredit } = useMemo(() => {
    let debit = 0;
    let kredit = 0;
    allAccounts.forEach(acc => {
      const val = Number(getInputValue(acc.name)) || 0;
      if (val === 0) return;
      if (isDebitCategory(acc.category)) {
        debit += val;
      } else {
        kredit += val;
      }
    });
    return { totalDebit: debit, totalKredit: kredit };
  }, [allAccounts, saldoInputs, existingSaldo]);

  const isBalance = totalDebit === totalKredit;
  const selisih = Math.abs(totalDebit - totalKredit);

  const fmt = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

  const handleSimpan = () => {
    if (!isBalance && selisih > 0) {
      if (!window.confirm(`Total Debit dan Kredit belum seimbang (selisih ${fmt(selisih)}). Sistem akan otomatis menambahkan Saldo Penyeimbang. Lanjutkan?`)) return;
    }

    allAccounts.forEach(acc => {
      const val = Number(getInputValue(acc.name)) || 0;
      const existingVal = existingSaldo[acc.name] || 0;
      if (val !== existingVal) {
        setSaldoAwal(acc.name, val, tanggal);
      }
    });

    setSuccessMsg('Neraca Saldo Awal berhasil disimpan!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleGoToBukuBesar = (accountName) => {
    navigate(`/reports/buku-besar?account=${encodeURIComponent(accountName)}`);
  };

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="flex items-center gap-2">
            <Scale size={24} style={{ color: 'var(--color-primary)' }} />
            Neraca Saldo Awal
          </h2>
          <p className="text-muted">Input saldo awal perkiraan sesuai PSAK untuk memulai pembukuan.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="search-bar" style={{ minWidth: 180 }}>
            <Calendar size={15} style={{ color: 'var(--color-text-muted)' }} />
            <input type="date" className="search-input" value={tanggal} onChange={e => setTanggal(e.target.value)} />
          </div>
          <button className="btn btn-primary flex items-center gap-2" onClick={handleSimpan}>
            <Save size={16} /> Simpan Saldo Awal
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="glass-panel" style={{ padding: '0.75rem 1.25rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', marginBottom: '1rem', color: 'var(--color-success)', fontWeight: 600, fontSize: '0.85rem' }}>
          {successMsg}
        </div>
      )}

      {/* Info */}
      <div className="glass-panel" style={{ padding: '0.75rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <AlertTriangle size={16} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>
          Saldo Awal per Tanggal: <strong style={{ color: 'var(--color-text-main)' }}>{tanggal}</strong>. 
          Pastikan total Debit = total Kredit agar neraca seimbang.
        </p>
      </div>

      {/* Tabel Neraca Saldo */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1.25rem', background: 'rgba(255,77,0,0.04)', borderBottom: '1px solid var(--color-border)', textAlign: 'center' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>KPKCG — NERACA SALDO</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>{tanggal}</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '0.7rem 1rem', textAlign: 'center', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', width: 80 }}>No. Akun</th>
                <th style={{ padding: '0.7rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Nama Akun</th>
                <th style={{ padding: '0.7rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', width: 180 }}>Debet (Rp)</th>
                <th style={{ padding: '0.7rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', width: 180 }}>Kredit (Rp)</th>
                <th style={{ width: 36 }}></th>
              </tr>
            </thead>
            <tbody>
              {allAccounts.map((acc, i) => {
                const isDebit = isDebitCategory(acc.category);
                return (
                  <tr key={acc.id} style={{ borderBottom: '1px solid var(--color-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)' }}>
                    <td style={{ padding: '0.5rem 1rem', textAlign: 'center', fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{acc.id}</td>
                    <td style={{ padding: '0.5rem 1rem', fontWeight: 500 }}>{acc.name}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      {isDebit ? (
                        <input
                          type="number"
                          style={{ width: '100%', padding: '0.35rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.82rem', textAlign: 'right', background: 'var(--color-surface)', color: 'var(--color-text-main)' }}
                          value={getDisplayValue(acc.name)}
                          onChange={e => handleInputChange(acc.name, e.target.value)}
                          placeholder="0"
                        />
                      ) : (
                        <span style={{ display: 'block', textAlign: 'right', color: 'var(--color-text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      {!isDebit ? (
                        <input
                          type="number"
                          style={{ width: '100%', padding: '0.35rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.82rem', textAlign: 'right', background: 'var(--color-surface)', color: 'var(--color-text-main)' }}
                          value={getDisplayValue(acc.name)}
                          onChange={e => handleInputChange(acc.name, e.target.value)}
                          placeholder="0"
                        />
                      ) : (
                        <span style={{ display: 'block', textAlign: 'right', color: 'var(--color-text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem' }}>
                      <button onClick={() => handleGoToBukuBesar(acc.name)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-primary)', padding: 2 }} title="Lihat Buku Besar">
                        <ExternalLink size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: 'rgba(0,0,0,0.04)', fontWeight: 700, borderTop: '2px solid var(--color-border)' }}>
                <td colSpan={2} style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.85rem' }}>Jumlah:</td>
                <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--color-primary)', fontSize: '0.9rem' }}>{fmt(totalDebit)}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--color-success)', fontSize: '0.9rem' }}>{fmt(totalKredit)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Balance Status */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Status: </span>
          {isBalance ? (
            <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>✓ SEIMBANG</span>
          ) : (
            <span style={{ fontWeight: 700, color: 'var(--color-danger)' }}>✗ TIDAK SEIMBANG (Selisih: {fmt(selisih)})</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem' }}>
          <span>Debit: <strong style={{ color: 'var(--color-primary)' }}>{fmt(totalDebit)}</strong></span>
          <span>Kredit: <strong style={{ color: 'var(--color-success)' }}>{fmt(totalKredit)}</strong></span>
        </div>
      </div>
    </div>
  );
};

export default NeracaSaldo;
