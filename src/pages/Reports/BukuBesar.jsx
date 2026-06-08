import React, { useState, useMemo } from 'react';
import { BookMarked, Calendar, Printer, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { getLogoBase64, buildPrintHeader } from '../../utils/printHeader';
import './Reports.css';

const fmt = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

const BukuBesar = () => {
  const journal = useStore((s) => s.journal) || [];

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const accounts = useStore((s) => s.accounts) || [];

  // Normalize: pastikan nama akun di jurnal match dengan Daftar Akun (case-insensitive + trim)
  const normalizedJournal = useMemo(() => {
    if (!journal || !accounts || accounts.length === 0) return journal;
    // Build lookup map: lowercase trimmed name -> canonical name
    const nameMap = {};
    accounts.forEach(a => { nameMap[a.name.toLowerCase().trim()] = a.name; });
    
    return journal.map(j => {
      if (!j.account) return j;
      const key = j.account.toLowerCase().trim();
      const canonical = nameMap[key];
      if (canonical && canonical !== j.account) {
        return { ...j, account: canonical };
      }
      return j;
    });
  }, [journal, accounts]);

  // Urutan akun berdasarkan nomor akun di master data (sesuai aturan akuntansi 1-7)
  // Akun yang ada di jurnal tapi tidak di master data diletakkan di akhir (alphabetical)
  const accountSortOrder = useMemo(() => {
    const order = {};
    accounts.forEach((a, i) => { order[a.name] = i; });
    return order;
  }, [accounts]);

  const sortByAccountOrder = (a, b) => {
    const ia = accountSortOrder[a];
    const ib = accountSortOrder[b];
    if (ia !== undefined && ib !== undefined) return ia - ib;
    if (ia !== undefined) return -1; // akun master data duluan
    if (ib !== undefined) return 1;
    return a.localeCompare(b); // fallback alphabetical
  };

  // Semua akun unik dari jurnal dan master data
  const allAccounts = useMemo(() => {
    if (!normalizedJournal || !accounts) return [];
    const list = new Set([
      ...accounts.map(a => a.name),
      ...normalizedJournal.map(j => j.account)
    ]);
    return [...list].sort(sortByAccountOrder);
  }, [normalizedJournal, accounts, accountSortOrder]);

  const [selectedAccount, setSelectedAccount] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('account') || '';
  });
  const [selectedMonth,   setSelectedMonth]   = useState('');
  const [expandedAccounts, setExpandedAccounts] = useState({});

  const monthOptions = useMemo(() => {
    const months = [...new Set(normalizedJournal.map(j => j.date?.slice(0, 7)))].filter(Boolean).sort().reverse();
    return months;
  }, [normalizedJournal]);

  const fmtMonth = (ym) => {
    if (!ym) return 'Semua Periode';
    const [y, m] = ym.split('-');
    return new Date(y, m - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  // Filter jurnal
  const filtered = useMemo(() => {
    return normalizedJournal.filter(j => {
      const matchAccount = !selectedAccount || j.account === selectedAccount;
      const matchMonth   = !selectedMonth   || j.date?.startsWith(selectedMonth);
      return matchAccount && matchMonth;
    });
  }, [normalizedJournal, selectedAccount, selectedMonth]);

  // Group by akun dengan perhitungan Saldo Awal
  const groupedByAccount = useMemo(() => {
    const map = {};

    // 1. Jika ada filter bulan, hitung saldo awal (akumulasi transaksi sebelum bulan terpilih)
    if (selectedMonth) {
      normalizedJournal.forEach(entry => {
        const matchAccount = !selectedAccount || entry.account === selectedAccount;
        if (matchAccount && entry.date < `${selectedMonth}-01`) {
          if (!map[entry.account]) map[entry.account] = { saldoAwal: 0, entries: [] };
          map[entry.account].saldoAwal += (entry.debit || 0) - (entry.credit || 0);
        }
      });
    }

    // 2. Masukkan transaksi bulan terpilih
    filtered.forEach(entry => {
      if (!map[entry.account]) map[entry.account] = { saldoAwal: 0, entries: [] };
      map[entry.account].entries.push(entry);
    });

    return map;
  }, [filtered, normalizedJournal, selectedMonth, selectedAccount]);

  // Hitung saldo berjalan per akun
  const getEntriesWithBalance = (akunData) => {
    let balance = akunData?.saldoAwal || 0;
    const rawEntries = Array.isArray(akunData?.entries) ? akunData.entries : [];
    const entries = rawEntries.slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    
    const result = [];
    
    // Jika ada saldo awal, sisipkan sebagai entri pertama
    if (selectedMonth && balance !== 0) {
      result.push({
        date: `${selectedMonth}-01`,
        id: '-',
        description: 'Saldo Awal',
        debit: balance > 0 ? balance : 0,
        credit: balance < 0 ? Math.abs(balance) : 0,
        balance: balance,
        isSaldoAwal: true
      });
    }

    entries.forEach(e => {
      balance += (e.debit || 0) - (e.credit || 0);
      result.push({ ...e, balance });
    });
    
    return result;
  };

  const toggleAccount = (akun) =>
    setExpandedAccounts(prev => ({ ...prev, [akun]: !prev[akun] }));

  const accountsToShow = selectedAccount
    ? [selectedAccount]
    : Object.keys(groupedByAccount).sort(sortByAccountOrder);

  const handleCetak = async () => {
    const today = new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });
    const periodeLabel = selectedMonth
      ? new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { month:'long', year:'numeric' })
      : 'Semua Periode';
    const akunLabel  = selectedAccount || 'Semua Akun';
    const logoBase64 = await getLogoBase64();
    const headerHTML = buildPrintHeader(logoBase64, 'BUKU BESAR', `Periode: ${periodeLabel} &nbsp;|&nbsp; Akun: ${akunLabel} &nbsp;|&nbsp; ${filtered.length} entri · ${accountsToShow.length} akun`, today);

    // Helper: format saldo dengan tanda D/K berdasarkan tipe normal akun
    const fmtSaldo = (balance, akunName) => {
      const acc = accounts.find(a => a.name === akunName);
      const isDebitNormal = !acc || acc.type === 'debit';
      const absVal = Math.abs(balance).toLocaleString('id-ID');
      // Untuk akun normal debit: positif = D, negatif = K
      // Untuk akun normal kredit: positif = K, negatif = D
      if (isDebitNormal) {
        return balance >= 0
          ? `Rp ${absVal} (D)`
          : `Rp ${absVal} (K)`;
      } else {
        return balance <= 0
          ? `Rp ${absVal} (K)`
          : `Rp ${absVal} (D)`;
      }
    };

    const fmtSaldoColor = (balance, akunName) => {
      const acc = accounts.find(a => a.name === akunName);
      const isDebitNormal = !acc || acc.type === 'debit';
      // Warna merah jika saldo berlawanan dengan normal (tidak wajar)
      const isNormal = isDebitNormal ? balance >= 0 : balance <= 0;
      return isNormal ? '#FF4D00' : '#ef4444';
    };

    const accountsHTML = accountsToShow.map(akun => {
      const entries = getEntriesWithBalance(groupedByAccount[akun] || { saldoAwal: 0, entries: [] });
      const totalDebit  = entries.reduce((s,e) => s + (e.debit  || 0), 0);
      const totalCredit = entries.reduce((s,e) => s + (e.credit || 0), 0);
      const saldoAkhir  = totalDebit - totalCredit;

      const rowsHTML = entries.map((e, i) => `
        <tr style="background:${i%2===0?'#fff':'#f9fafb'}">
          <td style="padding:5px 8px">${e.date}</td>
          <td style="padding:5px 8px;font-family:monospace;font-size:10px">${e.id}</td>
          <td style="padding:5px 8px">${e.description}</td>
          <td style="padding:5px 8px;text-align:right;color:${e.debit>0?'#111':'#9ca3af'}">${e.debit>0?'Rp '+e.debit.toLocaleString('id-ID'):'-'}</td>
          <td style="padding:5px 8px;text-align:right;color:${e.credit>0?'#111':'#9ca3af'}">${e.credit>0?'Rp '+e.credit.toLocaleString('id-ID'):'-'}</td>
          <td style="padding:5px 8px;text-align:right;font-weight:600;color:${fmtSaldoColor(e.balance, akun)}">
            ${fmtSaldo(e.balance, akun)}
          </td>
        </tr>`).join('');

      return `
        <div style="margin-bottom:20px;page-break-inside:avoid">
          <div style="background:#FF4D00;color:#fff;padding:7px 12px;border-radius:6px 6px 0 0;display:flex;justify-content:space-between;align-items:center">
            <span style="font-weight:700;font-size:12px">${akun}</span>
            <span style="font-size:10px">
              D: Rp ${totalDebit.toLocaleString('id-ID')} &nbsp;|&nbsp;
              K: Rp ${totalCredit.toLocaleString('id-ID')} &nbsp;|&nbsp;
              Saldo: ${fmtSaldo(saldoAkhir, akun)}
            </span>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead>
              <tr style="background:#fff3ee">
                <th style="padding:6px 10px;text-align:left;font-size:10px;color:#6b7280;border-bottom:1px solid #e5e7eb">Tanggal</th>
                <th style="padding:6px 10px;text-align:left;font-size:10px;color:#6b7280;border-bottom:1px solid #e5e7eb">No. Bukti</th>
                <th style="padding:6px 10px;text-align:left;font-size:10px;color:#6b7280;border-bottom:1px solid #e5e7eb">Keterangan</th>
                <th style="padding:6px 10px;text-align:right;font-size:10px;color:#6b7280;border-bottom:1px solid #e5e7eb">Debit</th>
                <th style="padding:6px 10px;text-align:right;font-size:10px;color:#6b7280;border-bottom:1px solid #e5e7eb">Kredit</th>
                <th style="padding:6px 10px;text-align:right;font-size:10px;color:#6b7280;border-bottom:1px solid #e5e7eb">Saldo</th>
              </tr>
            </thead>
            <tbody>${rowsHTML}</tbody>
            <tfoot>
              <tr style="background:#f9fafb;font-weight:700;border-top:2px solid #e5e7eb">
                <td colspan="3" style="padding:6px 10px;text-align:right">Total</td>
                <td style="padding:6px 10px;text-align:right;color:#10b981">Rp ${totalDebit.toLocaleString('id-ID')}</td>
                <td style="padding:6px 10px;text-align:right;color:#ef4444">Rp ${totalCredit.toLocaleString('id-ID')}</td>
                <td style="padding:6px 10px;text-align:right;color:${fmtSaldoColor(saldoAkhir, akun)}">
                  ${fmtSaldo(saldoAkhir, akun)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Buku Besar KPKCG</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; }
  .footer { margin-top: 12px; text-align: center; font-size: 9px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 6px; }
  .akun-block { margin-bottom: 14px; page-break-inside: avoid; }
</style>
</head>
<body>
  ${headerHTML}
  ${accountsHTML}
  <div class="footer">KPKCG — Koperasi Pemasaran Karya Cipta Gemilang &nbsp;|&nbsp; ${today}</div>
  <script>setTimeout(function(){window.print();setTimeout(function(){window.close();},1000);}, 500);</script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=800');
    if (!win) { alert('Izinkan pop-up untuk mencetak.'); return; }
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  return (
    <div className="reports-container">
      {/* Header */}
      <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookMarked size={22} style={{ color: 'var(--color-primary)' }} />
            Buku Besar
          </h2>
          <p className="text-muted">Rincian mutasi per akun — {fmtMonth(selectedMonth)}</p>
        </div>
        <button className="btn btn-primary" onClick={handleCetak} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Printer size={15} /> Cetak
        </button>
      </div>

      {/* Filter */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar" style={{ minWidth: 200 }}>
            <Calendar size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            <select className="search-input" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
              <option value="">Semua Periode</option>
              {monthOptions.map(m => <option key={m} value={m}>{fmtMonth(m)}</option>)}
            </select>
          </div>
          <div className="search-bar" style={{ minWidth: 240 }}>
            <BookMarked size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            <select className="search-input" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
              <option value="">Semua Akun</option>
              {allAccounts.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            {filtered.length} entri · {accountsToShow.length} akun
          </span>
        </div>
      </div>

      {/* Buku Besar per Akun */}
      {accountsToShow.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          <BookMarked size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
          <p>Belum ada data jurnal.</p>
        </div>
      ) : (
        accountsToShow.map(akun => {
          const entries = getEntriesWithBalance(groupedByAccount[akun] || { saldoAwal: 0, entries: [] });
          const totalDebit  = entries.reduce((s, e) => s + e.debit,  0);
          const totalCredit = entries.reduce((s, e) => s + e.credit, 0);
          const saldoAkhir  = totalDebit - totalCredit;
          const isExpanded  = expandedAccounts[akun] !== false; // default expanded

          return (
            <div key={akun} className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Akun Header */}
              <div
                onClick={() => toggleAccount(akun)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.875rem 1.25rem', cursor: 'pointer',
                  background: 'rgba(255,77,0,0.04)',
                  borderBottom: isExpanded ? '1px solid var(--color-border)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{akun}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{entries.length} transaksi</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--color-success)' }}>D: {fmt(totalDebit)}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--color-danger)' }}>K: {fmt(totalCredit)}</span>
                  <span style={{ fontWeight: 700, color: saldoAkhir >= 0 ? 'var(--color-primary)' : 'var(--color-danger)', fontSize: '0.9rem', minWidth: 120, textAlign: 'right' }}>
                    Saldo: {fmt(Math.abs(saldoAkhir))} {saldoAkhir < 0 ? '(K)' : '(D)'}
                  </span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {/* Tabel Mutasi */}
              {isExpanded && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--color-border)' }}>
                        <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Tanggal</th>
                        <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>No. Bukti</th>
                        <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Keterangan</th>
                        <th style={{ padding: '0.6rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Debit</th>
                        <th style={{ padding: '0.6rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Kredit</th>
                        <th style={{ padding: '0.6rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((e, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '0.6rem 1rem', color: 'var(--color-text-muted)' }}>{e.date}</td>
                          <td style={{ padding: '0.6rem 1rem', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{e.id}</td>
                          <td style={{ padding: '0.6rem 1rem' }}>{e.description}</td>
                          <td style={{ padding: '0.6rem 1rem', textAlign: 'right', color: e.debit > 0 ? 'var(--color-text-main)' : 'var(--color-text-muted)' }}>
                            {e.debit > 0 ? fmt(e.debit) : '—'}
                          </td>
                          <td style={{ padding: '0.6rem 1rem', textAlign: 'right', color: e.credit > 0 ? 'var(--color-text-main)' : 'var(--color-text-muted)' }}>
                            {e.credit > 0 ? fmt(e.credit) : '—'}
                          </td>
                          <td style={{ padding: '0.6rem 1rem', textAlign: 'right', fontWeight: 600, color: e.balance >= 0 ? 'var(--color-primary)' : 'var(--color-danger)' }}>
                            {fmt(Math.abs(e.balance))} {e.balance < 0 ? '(K)' : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'rgba(0,0,0,0.02)', fontWeight: 700 }}>
                        <td colSpan={3} style={{ padding: '0.6rem 1rem', fontSize: '0.82rem' }}>Total</td>
                        <td style={{ padding: '0.6rem 1rem', textAlign: 'right', color: 'var(--color-success)' }}>{fmt(totalDebit)}</td>
                        <td style={{ padding: '0.6rem 1rem', textAlign: 'right', color: 'var(--color-danger)' }}>{fmt(totalCredit)}</td>
                        <td style={{ padding: '0.6rem 1rem', textAlign: 'right', color: saldoAkhir >= 0 ? 'var(--color-primary)' : 'var(--color-danger)' }}>
                          {fmt(Math.abs(saldoAkhir))} {saldoAkhir < 0 ? '(K)' : '(D)'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default BukuBesar;
