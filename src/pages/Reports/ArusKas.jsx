import React, { useState, useMemo } from 'react';
import { Waves, Calendar, Printer, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import './Reports.css';

const fmt  = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;
const fmtM = (n) => `Rp ${(Number(n || 0) / 1_000_000).toFixed(1)}Jt`;

const ArusKas = () => {
  const journal = useStore((s) => s.journal);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const [selectedMonth, setSelectedMonth] = useState('');
  const [viewMode, setViewMode]           = useState('monthly'); // 'monthly' | 'daily'

  const monthOptions = useMemo(() => {
    const months = [...new Set(journal.map(j => j.date?.slice(0, 7)))].filter(Boolean).sort().reverse();
    return months;
  }, [journal]);

  const fmtMonth = (ym) => {
    if (!ym) return 'Semua Periode';
    const [y, m] = ym.split('-');
    return new Date(y, m - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  // Hanya entri akun Kas
  const kasEntries = useMemo(() =>
    journal.filter(j => j.account === 'Kas'),
    [journal]
  );

  const filtered = useMemo(() => {
    if (!selectedMonth) return kasEntries;
    return kasEntries.filter(j => j.date?.startsWith(selectedMonth));
  }, [kasEntries, selectedMonth]);

  // Klasifikasi arus kas
  const classify = (entry) => {
    const desc = (entry.description || '').toLowerCase();
    const ref  = (entry.ref || '').toLowerCase();
    if (desc.includes('penjualan') || desc.includes('pendapatan') || desc.includes('komisi') || ref.includes('bkm'))
      return 'operasi';
    if (desc.includes('pinjaman') || desc.includes('angsuran') || desc.includes('kredit') || ref.includes('pln') || ref.includes('krd'))
      return 'investasi';
    if (desc.includes('simpanan') || desc.includes('modal'))
      return 'pendanaan';
    return 'operasi'; // default
  };

  // Hitung total per kategori
  const totals = useMemo(() => {
    const result = { operasi: { masuk: 0, keluar: 0 }, investasi: { masuk: 0, keluar: 0 }, pendanaan: { masuk: 0, keluar: 0 } };
    filtered.forEach(e => {
      const cat = classify(e);
      result[cat].masuk  += e.debit;
      result[cat].keluar += e.credit;
    });
    return result;
  }, [filtered]);

  const totalMasuk  = filtered.reduce((s, e) => s + e.debit,  0);
  const totalKeluar = filtered.reduce((s, e) => s + e.credit, 0);
  const netKas      = totalMasuk - totalKeluar;

  // Data grafik bulanan
  const monthlyData = useMemo(() => {
    const map = {};
    kasEntries.forEach(e => {
      const ym = e.date?.slice(0, 7);
      if (!ym) return;
      if (!map[ym]) map[ym] = { name: ym, masuk: 0, keluar: 0 };
      map[ym].masuk  += e.debit;
      map[ym].keluar += e.credit;
    });
    return Object.values(map)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(d => ({
        ...d,
        name: new Date(d.name + '-01').toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
        net: d.masuk - d.keluar,
      }));
  }, [kasEntries]);

  // Data grafik harian (bulan terpilih atau 30 hari terakhir)
  const dailyData = useMemo(() => {
    const source = selectedMonth
      ? kasEntries.filter(j => j.date?.startsWith(selectedMonth))
      : kasEntries.filter(j => j.date >= new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29).toISOString().split('T')[0]);

    const map = {};
    source.forEach(e => {
      if (!map[e.date]) map[e.date] = { name: e.date, masuk: 0, keluar: 0 };
      map[e.date].masuk  += e.debit;
      map[e.date].keluar += e.credit;
    });
    return Object.values(map)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(d => ({ ...d, net: d.masuk - d.keluar }));
  }, [kasEntries, selectedMonth]);

  const chartData = viewMode === 'monthly' ? monthlyData : dailyData;

  // Detail transaksi kas
  const detailRows = useMemo(() =>
    filtered.slice().sort((a, b) => b.date.localeCompare(a.date)),
    [filtered]
  );

  const categories = [
    { key: 'operasi',   label: 'Aktivitas Operasi',   desc: 'Penjualan, jasa, beban operasional', color: 'var(--color-primary)' },
    { key: 'investasi', label: 'Aktivitas Investasi',  desc: 'Pinjaman, angsuran, kredit barang',  color: 'var(--color-secondary)' },
    { key: 'pendanaan', label: 'Aktivitas Pendanaan',  desc: 'Simpanan anggota, modal',            color: 'var(--color-success)' },
  ];

  const handleCetak = () => {
    const todayLabel = new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });
    const periodeLabel = fmtMonth(selectedMonth);

    const kategoriHTML = categories.map(cat => {
      const masuk  = totals[cat.key].masuk;
      const keluar = totals[cat.key].keluar;
      const net    = masuk - keluar;
      return `
        <tr>
          <td style="font-weight:600">${cat.label}</td>
          <td style="text-align:right;color:#10b981">Rp ${masuk.toLocaleString('id-ID')}</td>
          <td style="text-align:right;color:#ef4444">Rp ${keluar.toLocaleString('id-ID')}</td>
          <td style="text-align:right;font-weight:700;color:${net>=0?'#FF4D00':'#ef4444'}">Rp ${net.toLocaleString('id-ID')}</td>
        </tr>`;
    }).join('');

    const detailHTML = detailRows.length === 0
      ? `<tr><td colspan="5" style="text-align:center;padding:16px;color:#9ca3af">Belum ada transaksi kas.</td></tr>`
      : detailRows.map((e, i) => {
          const cat = classify(e);
          const catLabel = cat === 'operasi' ? 'Operasi' : cat === 'investasi' ? 'Investasi' : 'Pendanaan';
          return `<tr style="background:${i%2===0?'#fff':'#f9fafb'}">
            <td>${e.date}</td>
            <td style="font-family:monospace;font-size:10px">${e.id}</td>
            <td>${e.description}</td>
            <td><span style="padding:2px 7px;border-radius:999px;font-size:10px;font-weight:600;background:rgba(255,77,0,0.1);color:#FF4D00">${catLabel}</span></td>
            <td style="text-align:right;color:${e.debit>0?'#10b981':'#9ca3af'}">${e.debit>0?'Rp '+e.debit.toLocaleString('id-ID'):'-'}</td>
            <td style="text-align:right;color:${e.credit>0?'#ef4444':'#9ca3af'}">${e.credit>0?'Rp '+e.credit.toLocaleString('id-ID'):'-'}</td>
          </tr>`;
        }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Arus Kas KPKCG</title>
<style>
  @page { size: A4; margin: 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid #FF4D00; padding-bottom: 10px; }
  .header h1 { font-size: 18px; font-weight: 800; color: #FF4D00; }
  .header p  { font-size: 10px; color: #6b7280; margin-top: 2px; }
  h2 { font-size: 13px; font-weight: 700; margin: 16px 0 8px; color: #FF4D00; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
  .summary { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 16px; }
  .card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 12px; }
  .card .label { font-size: 10px; color: #6b7280; margin-bottom: 3px; }
  .card .value { font-size: 15px; font-weight: 800; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 16px; }
  th { background: #FF4D00; color: #fff; padding: 6px 10px; text-align: left; font-size: 10px; }
  td { padding: 6px 10px; border-bottom: 1px solid #f3f4f6; }
  tfoot td { background: #f9fafb; font-weight: 700; border-top: 2px solid #e5e7eb; }
  .footer { text-align: center; font-size: 9px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 12px; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>KPKCG — Laporan Arus Kas</h1>
      <p>Koperasi Pemasaran Karya Cipta Gemilang</p>
      <p>Periode: ${periodeLabel} &nbsp;|&nbsp; ${filtered.length} transaksi kas</p>
    </div>
    <div style="font-size:10px;color:#6b7280;text-align:right">Dicetak: ${todayLabel}</div>
  </div>

  <div class="summary">
    <div class="card">
      <div class="label">Total Kas Masuk</div>
      <div class="value" style="color:#10b981">Rp ${totalMasuk.toLocaleString('id-ID')}</div>
    </div>
    <div class="card">
      <div class="label">Total Kas Keluar</div>
      <div class="value" style="color:#ef4444">Rp ${totalKeluar.toLocaleString('id-ID')}</div>
    </div>
    <div class="card" style="border-color:#FF4D00">
      <div class="label">${netKas>=0?'Surplus Kas':'Defisit Kas'}</div>
      <div class="value" style="color:${netKas>=0?'#FF4D00':'#ef4444'}">Rp ${Math.abs(netKas).toLocaleString('id-ID')}</div>
    </div>
  </div>

  <h2>Klasifikasi Arus Kas</h2>
  <table>
    <thead>
      <tr>
        <th>Kategori</th>
        <th style="text-align:right">Kas Masuk</th>
        <th style="text-align:right">Kas Keluar</th>
        <th style="text-align:right">Net</th>
      </tr>
    </thead>
    <tbody>${kategoriHTML}</tbody>
    <tfoot>
      <tr>
        <td>TOTAL</td>
        <td style="text-align:right;color:#10b981">Rp ${totalMasuk.toLocaleString('id-ID')}</td>
        <td style="text-align:right;color:#ef4444">Rp ${totalKeluar.toLocaleString('id-ID')}</td>
        <td style="text-align:right;color:${netKas>=0?'#FF4D00':'#ef4444'}">Rp ${Math.abs(netKas).toLocaleString('id-ID')}</td>
      </tr>
    </tfoot>
  </table>

  <h2>Detail Transaksi Kas</h2>
  <table>
    <thead>
      <tr>
        <th>Tanggal</th>
        <th>No. Bukti</th>
        <th>Keterangan</th>
        <th>Kategori</th>
        <th style="text-align:right">Kas Masuk</th>
        <th style="text-align:right">Kas Keluar</th>
      </tr>
    </thead>
    <tbody>${detailHTML}</tbody>
    <tfoot>
      <tr>
        <td colspan="4" style="text-align:right">TOTAL</td>
        <td style="text-align:right;color:#10b981">Rp ${totalMasuk.toLocaleString('id-ID')}</td>
        <td style="text-align:right;color:#ef4444">Rp ${totalKeluar.toLocaleString('id-ID')}</td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">KPKCG — Koperasi Pemasaran Karya Cipta Gemilang &nbsp;|&nbsp; ${todayLabel}</div>
  <script>window.onload=function(){window.print();setTimeout(function(){window.close();},500);}</script>
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
            <Waves size={22} style={{ color: 'var(--color-primary)' }} />
            Laporan Arus Kas
          </h2>
          <p className="text-muted">Aliran kas masuk dan keluar — {fmtMonth(selectedMonth)}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ minWidth: 200 }}>
            <Calendar size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            <select className="search-input" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
              <option value="">Semua Periode</option>
              {monthOptions.map(m => <option key={m} value={m}>{fmtMonth(m)}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleCetak} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Printer size={15} /> Cetak
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} style={{ color: 'var(--color-success)' }} />
            <span className="text-muted text-sm">Total Kas Masuk</span>
          </div>
          <h3 style={{ color: 'var(--color-success)', fontSize: '1.3rem' }}>{fmt(totalMasuk)}</h3>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={18} style={{ color: 'var(--color-danger)' }} />
            <span className="text-muted text-sm">Total Kas Keluar</span>
          </div>
          <h3 style={{ color: 'var(--color-danger)', fontSize: '1.3rem' }}>{fmt(totalKeluar)}</h3>
        </div>
        <div className="glass-panel p-4" style={{ border: `2px solid ${netKas >= 0 ? 'var(--color-primary)' : 'var(--color-danger)'}` }}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={18} style={{ color: netKas >= 0 ? 'var(--color-primary)' : 'var(--color-danger)' }} />
            <span className="text-sm font-bold" style={{ color: netKas >= 0 ? 'var(--color-primary)' : 'var(--color-danger)' }}>
              {netKas >= 0 ? 'Surplus Kas' : 'Defisit Kas'}
            </span>
          </div>
          <h3 style={{ color: netKas >= 0 ? 'var(--color-primary)' : 'var(--color-danger)', fontSize: '1.3rem' }}>
            {fmt(Math.abs(netKas))}
          </h3>
        </div>
      </div>

      {/* Grafik */}
      <div className="glass-panel">
        <div className="flex justify-between items-center mb-4">
          <h3>Grafik Arus Kas</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['monthly', 'daily'].map(m => (
              <button key={m}
                onClick={() => setViewMode(m)}
                style={{
                  padding: '0.3rem 0.875rem', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', fontWeight: 600,
                  border: '1.5px solid var(--color-border)', cursor: 'pointer', transition: 'var(--transition)',
                  background: viewMode === m ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: viewMode === m ? '#fff' : 'var(--color-text-muted)',
                }}>
                {m === 'monthly' ? 'Bulanan' : 'Harian'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ height: 280 }}>
          {chartData.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', flexDirection: 'column', gap: '0.5rem' }}>
              <Waves size={36} style={{ opacity: 0.25 }} />
              <p style={{ fontSize: '0.875rem' }}>Belum ada data kas.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="var(--color-text-muted)" />
                <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="var(--color-text-muted)"
                  tickFormatter={v => `${(v/1_000_000).toFixed(1)}Jt`} />
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-md)' }} />
                <Legend />
                <Bar dataKey="masuk"  name="Kas Masuk"  fill="var(--color-success)" radius={[4,4,0,0]} />
                <Bar dataKey="keluar" name="Kas Keluar" fill="var(--color-danger)"  radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Klasifikasi Arus Kas */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
        {categories.map(cat => {
          const masuk  = totals[cat.key].masuk;
          const keluar = totals[cat.key].keluar;
          const net    = masuk - keluar;
          return (
            <div key={cat.key} className="glass-panel p-4" style={{ borderLeft: `4px solid ${cat.color}` }}>
              <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: cat.color }}>{cat.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>{cat.desc}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.2rem' }}>
                <span>Masuk</span><span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{fmt(masuk)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
                <span>Keluar</span><span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{fmt(keluar)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, borderTop: '1px dashed var(--color-border)', paddingTop: '0.4rem' }}>
                <span>Net</span>
                <span style={{ color: net >= 0 ? cat.color : 'var(--color-danger)' }}>{fmt(net)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Transaksi Kas */}
      <div className="glass-panel">
        <h3 style={{ marginBottom: '1rem' }}>Detail Transaksi Kas</h3>
        {detailRows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Belum ada transaksi kas.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '2px solid var(--color-border)' }}>
                  {['Tanggal','No. Bukti','Keterangan','Kategori','Kas Masuk','Kas Keluar'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 1rem', textAlign: h.includes('Kas') ? 'right' : 'left', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detailRows.map((e, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.6rem 1rem', color: 'var(--color-text-muted)' }}>{e.date}</td>
                    <td style={{ padding: '0.6rem 1rem', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{e.id}</td>
                    <td style={{ padding: '0.6rem 1rem' }}>{e.description}</td>
                    <td style={{ padding: '0.6rem 1rem' }}>
                      <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: 999, background: 'rgba(255,77,0,0.08)', color: 'var(--color-primary)', fontWeight: 600 }}>
                        {classify(e) === 'operasi' ? 'Operasi' : classify(e) === 'investasi' ? 'Investasi' : 'Pendanaan'}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 1rem', textAlign: 'right', color: 'var(--color-success)', fontWeight: e.debit > 0 ? 600 : 400 }}>
                      {e.debit > 0 ? fmt(e.debit) : '—'}
                    </td>
                    <td style={{ padding: '0.6rem 1rem', textAlign: 'right', color: 'var(--color-danger)', fontWeight: e.credit > 0 ? 600 : 400 }}>
                      {e.credit > 0 ? fmt(e.credit) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 700, background: 'rgba(0,0,0,0.02)' }}>
                  <td colSpan={4} style={{ padding: '0.6rem 1rem' }}>Total</td>
                  <td style={{ padding: '0.6rem 1rem', textAlign: 'right', color: 'var(--color-success)' }}>{fmt(totalMasuk)}</td>
                  <td style={{ padding: '0.6rem 1rem', textAlign: 'right', color: 'var(--color-danger)' }}>{fmt(totalKeluar)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArusKas;
