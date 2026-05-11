import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import './SHU.css';
import {
  DollarSign, Percent, Users, TrendingUp,
  ChevronDown, ChevronUp, Info, Printer, AlertTriangle, Link,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const fmt  = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;
const fmtP = (n) => `${Number(n || 0).toFixed(1)}%`;

// ─── Akun pendapatan & beban untuk hitung laba bersih ────────────────────────
const INCOME_ACCOUNTS  = ['Pendapatan Penjualan Ritel','Pendapatan Jasa','Pendapatan Komisi','Pendapatan Bunga Pinjaman','Pendapatan Lainnya'];
const HPP_ACCOUNTS     = ['Harga Pokok Penjualan'];

const SHU = () => {
  const members       = useStore((s) => s.members);
  const journal       = useStore((s) => s.journal);
  const cashLoans     = useStore((s) => s.cashLoans);
  const creditGoods   = useStore((s) => s.creditGoods);
  const memberSalesTx = useStore((s) => s.memberSalesTransactions);

  // ── Hitung Laba Bersih dari jurnal (sama persis dengan ProfitLoss) ──────────
  const labaBersih = useMemo(() => {
    const totalRevenue = INCOME_ACCOUNTS.reduce((s, akun) =>
      s + journal.filter(e => e.account === akun).reduce((a, e) => a + e.credit, 0), 0);
    const totalHPP = HPP_ACCOUNTS.reduce((s, akun) =>
      s + journal.filter(e => e.account === akun).reduce((a, e) => a + e.debit, 0), 0);
    const bebanAccounts = [...new Set(journal.filter(e => e.account.startsWith('Beban')).map(e => e.account))];
    const totalBeban = bebanAccounts.reduce((s, akun) =>
      s + journal.filter(e => e.account === akun).reduce((a, e) => a + e.debit, 0), 0);
    return Math.max(0, totalRevenue - totalHPP - totalBeban);
  }, [journal]);

  // ── Persentase distribusi SHU (editable) ────────────────────────────────────
  const [pctCadangan,    setPctCadangan]    = useState(30); // Dana Cadangan/Modal
  const [pctJMAPW,       setPctJMAPW]       = useState(20); // Jasa Modal Simpanan Pokok+Wajib
  const [pctJMASukarela, setPctJMASukarela] = useState(5);  // Jasa Modal Simpanan Sukarela
  const [pctJUAKredit,   setPctJUAKredit]   = useState(20); // Jasa Usaha Kredit Barang
  const [pctJUABelanja,  setPctJUABelanja]  = useState(20); // Jasa Usaha Belanja (kredit+tunai)
  const [pctSosial,      setPctSosial]      = useState(5);  // Dana Sosial
  const [showFormula,    setShowFormula]    = useState(false);

  const SHU_PAGE_SIZE = 10;
  const [shuPage, setShuPage] = useState(1);

  const totalPct = pctCadangan + pctJMAPW + pctJMASukarela + pctJUAKredit + pctJUABelanja + pctSosial;
  const pctValid = totalPct === 100;

  // Total SHU = Laba Bersih
  const totalSHU = labaBersih;

  // Pool per komponen
  const poolCadangan    = totalSHU * (pctCadangan    / 100);
  const poolJMAPW       = totalSHU * (pctJMAPW       / 100);
  const poolJMASukarela = totalSHU * (pctJMASukarela / 100);
  const poolJUAKredit   = totalSHU * (pctJUAKredit   / 100);
  const poolJUABelanja  = totalSHU * (pctJUABelanja  / 100);
  const poolSosial      = totalSHU * (pctSosial      / 100);

  // ── Basis perhitungan per anggota ────────────────────────────────────────────

  // 1. Simpanan Pokok + Wajib per anggota
  const totalPokokWajib = useMemo(() =>
    members.reduce((s, m) => s + m.pokok + m.wajib, 0), [members]);

  // 2. Simpanan Sukarela per anggota
  const totalSukarela = useMemo(() =>
    members.reduce((s, m) => s + m.sukarela, 0), [members]);

  // 3. Kredit barang per anggota (total yang sudah dibayar = amount - remaining)
  const kreditPerMember = useMemo(() => {
    const map = {};
    members.forEach(m => { map[m.id] = 0; });
    creditGoods.forEach(c => {
      if (['Active','Completed'].includes(c.status) && map[c.memberId] !== undefined) {
        map[c.memberId] += c.amount - c.remainingAmount;
      }
    });
    return map;
  }, [members, creditGoods]);
  const totalKreditBayar = useMemo(() =>
    Object.values(kreditPerMember).reduce((a, b) => a + b, 0), [kreditPerMember]);

  // 4. Belanja (penjualan ritel + jasa, kredit + tunai) per anggota
  const belanjaPerMember = useMemo(() => {
    const map = {};
    members.forEach(m => { map[m.id] = 0; });
    memberSalesTx.forEach(tx => {
      if (map[tx.memberId] !== undefined) map[tx.memberId] += tx.amount;
    });
    // Tambah angsuran pinjaman tunai
    cashLoans.forEach(l => {
      if (['Active','Completed'].includes(l.status) && map[l.memberId] !== undefined) {
        map[l.memberId] += l.amount - l.remainingAmount;
      }
    });
    return map;
  }, [members, memberSalesTx, cashLoans]);
  const totalBelanja = useMemo(() =>
    Object.values(belanjaPerMember).reduce((a, b) => a + b, 0), [belanjaPerMember]);

  // ── SHU per anggota ──────────────────────────────────────────────────────────
  const memberSHU = useMemo(() => {
    return members.map(m => {
      const pw       = m.pokok + m.wajib;
      const suk      = m.sukarela;
      const kredit   = kreditPerMember[m.id]  || 0;
      const belanja  = belanjaPerMember[m.id] || 0;

      // JMA Pokok+Wajib
      const jmaPW       = totalPokokWajib > 0 ? (pw      / totalPokokWajib) * poolJMAPW       : 0;
      // JMA Sukarela
      const jmaSukarela = totalSukarela   > 0 ? (suk     / totalSukarela)   * poolJMASukarela : 0;
      // JUA Kredit Barang
      const juaKredit   = totalKreditBayar > 0 ? (kredit  / totalKreditBayar) * poolJUAKredit  : 0;
      // JUA Belanja
      const juaBelanja  = totalBelanja    > 0 ? (belanja / totalBelanja)    * poolJUABelanja  : 0;

      const totalAnggota = jmaPW + jmaSukarela + juaKredit + juaBelanja;

      return { ...m, pw, suk, kredit, belanja, jmaPW, jmaSukarela, juaKredit, juaBelanja, totalAnggota };
    });
  }, [members, kreditPerMember, belanjaPerMember, totalPokokWajib, totalSukarela, totalKreditBayar, totalBelanja, poolJMAPW, poolJMASukarela, poolJUAKredit, poolJUABelanja]);

  const totalTerbagi = memberSHU.reduce((s, m) => s + m.totalAnggota, 0);

  const shuTotalPages = Math.ceil(memberSHU.length / SHU_PAGE_SIZE);
  const pagedSHU = memberSHU.slice((shuPage - 1) * SHU_PAGE_SIZE, shuPage * SHU_PAGE_SIZE);

  const komponen = [
    { label: 'Dana Cadangan / Modal',          pool: poolCadangan,    pct: pctCadangan,    set: setPctCadangan,    color: 'var(--color-danger)',     desc: 'Diputar kembali sebagai modal koperasi' },
    { label: 'JMA Simpanan Pokok + Wajib',     pool: poolJMAPW,       pct: pctJMAPW,       set: setPctJMAPW,       color: 'var(--color-success)',    desc: 'Berdasarkan simpanan pokok & wajib anggota' },
    { label: 'JMA Simpanan Sukarela',          pool: poolJMASukarela, pct: pctJMASukarela, set: setPctJMASukarela, color: 'var(--color-primary)',    desc: 'Berdasarkan simpanan sukarela anggota' },
    { label: 'JUA Kredit Barang',              pool: poolJUAKredit,   pct: pctJUAKredit,   set: setPctJUAKredit,   color: 'var(--color-warning)',    desc: 'Berdasarkan total kredit barang yang dibayar' },
    { label: 'JUA Belanja (Kredit + Tunai)',   pool: poolJUABelanja,  pct: pctJUABelanja,  set: setPctJUABelanja,  color: 'var(--color-secondary)', desc: 'Berdasarkan total belanja & pinjaman anggota' },
    { label: 'Dana Sosial',                    pool: poolSosial,      pct: pctSosial,      set: setPctSosial,      color: '#8B5CF6',                 desc: 'Untuk kegiatan sosial koperasi' },
  ];

  const handleCetak = () => {
    const todayLabel = new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' });

    const komponenRows = komponen.map(k => `
      <tr>
        <td>${k.label}</td>
        <td style="text-align:center">${k.pct}%</td>
        <td style="text-align:right;font-weight:600;color:#FF4D00">Rp ${k.pool.toLocaleString('id-ID')}</td>
      </tr>`).join('');

    const memberRows = memberSHU.map((m, i) => `
      <tr style="background:${i%2===0?'#fff':'#f9fafb'}">
        <td style="font-family:monospace;font-size:10px">${m.id}</td>
        <td>${m.name}</td>
        <td style="text-align:center">
          <span style="padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600;
            background:${m.type==='Penuh'?'rgba(16,185,129,0.1)':'rgba(245,158,11,0.1)'};
            color:${m.type==='Penuh'?'#10b981':'#f59e0b'}">${m.type}</span>
        </td>
        <td style="text-align:right">Rp ${m.pw.toLocaleString('id-ID')}</td>
        <td style="text-align:right">Rp ${m.suk.toLocaleString('id-ID')}</td>
        <td style="text-align:right">Rp ${m.kredit.toLocaleString('id-ID')}</td>
        <td style="text-align:right">Rp ${m.belanja.toLocaleString('id-ID')}</td>
        <td style="text-align:right;color:#10b981">Rp ${m.jmaPW.toLocaleString('id-ID')}</td>
        <td style="text-align:right;color:#FF4D00">Rp ${m.jmaSukarela.toLocaleString('id-ID')}</td>
        <td style="text-align:right;color:#f59e0b">Rp ${m.juaKredit.toLocaleString('id-ID')}</td>
        <td style="text-align:right;color:#06b6d4">Rp ${m.juaBelanja.toLocaleString('id-ID')}</td>
        <td style="text-align:right;font-weight:700;color:#FF4D00">Rp ${m.totalAnggota.toLocaleString('id-ID')}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Laporan SHU KPKCG</title>
<style>
  @page { size: A4 landscape; margin: 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; }
  .header { text-align: center; margin-bottom: 16px; border-bottom: 2px solid #FF4D00; padding-bottom: 10px; }
  .header h1 { font-size: 15px; font-weight: 800; }
  .header h2 { font-size: 13px; font-weight: 700; margin-top: 3px; color: #FF4D00; }
  .header p  { font-size: 10px; color: #6b7280; margin-top: 2px; }
  h3 { font-size: 12px; font-weight: 700; margin: 14px 0 6px; color: #FF4D00; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
  .summary { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 14px; }
  .card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; text-align: center; }
  .card .label { font-size: 9px; color: #6b7280; text-transform: uppercase; margin-bottom: 3px; }
  .card .value { font-size: 13px; font-weight: 800; color: #FF4D00; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 14px; }
  th { background: #FF4D00; color: #fff; padding: 6px 8px; text-align: left; font-size: 9px; text-transform: uppercase; }
  td { padding: 5px 8px; border-bottom: 1px solid #f3f4f6; }
  tfoot td { background: #f9fafb; font-weight: 700; border-top: 2px solid #e5e7eb; }
  .footer { text-align: center; font-size: 9px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 12px; }
</style>
</head>
<body>
  <div class="header">
    <h1>KOPERASI PEMASARAN KARYA CIPTA GEMILANG</h1>
    <h2>LAPORAN PERHITUNGAN SHU</h2>
    <p>Sisa Hasil Usaha — Dicetak: ${todayLabel}</p>
  </div>

  <div class="summary">
    <div class="card">
      <div class="label">Total SHU (Laba Bersih)</div>
      <div class="value">Rp ${totalSHU.toLocaleString('id-ID')}</div>
    </div>
    <div class="card">
      <div class="label">Dibagikan ke Anggota</div>
      <div class="value">Rp ${totalTerbagi.toLocaleString('id-ID')}</div>
    </div>
    <div class="card">
      <div class="label">Cadangan + Sosial</div>
      <div class="value">Rp ${(poolCadangan + poolSosial).toLocaleString('id-ID')}</div>
    </div>
    <div class="card">
      <div class="label">Jumlah Anggota</div>
      <div class="value">${members.length} orang</div>
    </div>
  </div>

  <h3>Distribusi Komponen SHU</h3>
  <table>
    <thead>
      <tr><th>Komponen</th><th style="text-align:center">Persentase</th><th style="text-align:right">Jumlah Pool</th></tr>
    </thead>
    <tbody>${komponenRows}</tbody>
    <tbody id="total-row">
      <tr>
        <td>TOTAL</td>
        <td style="text-align:center">${pctCadangan+pctJMAPW+pctJMASukarela+pctJUAKredit+pctJUABelanja+pctSosial}%</td>
        <td style="text-align:right;color:#FF4D00">Rp ${totalSHU.toLocaleString('id-ID')}</td>
      </tr>
    </tbody>
  </table>

  <h3>Rincian SHU Per Anggota</h3>
  <table>
    <thead>
      <tr>
        <th>ID</th><th>Nama</th><th>Status</th>
        <th style="text-align:right">Pokok+Wajib</th>
        <th style="text-align:right">Sukarela</th>
        <th style="text-align:right">Kredit</th>
        <th style="text-align:right">Belanja</th>
        <th style="text-align:right">JMA PW</th>
        <th style="text-align:right">JMA Suk</th>
        <th style="text-align:right">JUA Kredit</th>
        <th style="text-align:right">JUA Belanja</th>
        <th style="text-align:right">Total SHU</th>
      </tr>
    </thead>
    <tbody>${memberRows}</tbody>
    <tbody id="total-row">
      <tr>
        <td colspan="3"><strong>TOTAL</strong></td>
        <td style="text-align:right"><strong>Rp ${members.reduce((s,m)=>s+m.pokok+m.wajib,0).toLocaleString('id-ID')}</strong></td>
        <td style="text-align:right"><strong>Rp ${totalSukarela.toLocaleString('id-ID')}</strong></td>
        <td style="text-align:right"><strong>Rp ${totalKreditBayar.toLocaleString('id-ID')}</strong></td>
        <td style="text-align:right"><strong>Rp ${totalBelanja.toLocaleString('id-ID')}</strong></td>
        <td style="text-align:right;color:#10b981"><strong>Rp ${poolJMAPW.toLocaleString('id-ID')}</strong></td>
        <td style="text-align:right;color:#FF4D00"><strong>Rp ${poolJMASukarela.toLocaleString('id-ID')}</strong></td>
        <td style="text-align:right;color:#f59e0b"><strong>Rp ${poolJUAKredit.toLocaleString('id-ID')}</strong></td>
        <td style="text-align:right;color:#06b6d4"><strong>Rp ${poolJUABelanja.toLocaleString('id-ID')}</strong></td>
        <td style="text-align:right;color:#FF4D00"><strong>Rp ${totalTerbagi.toLocaleString('id-ID')}</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="footer">KPKCG — Koperasi Pemasaran Karya Cipta Gemilang &nbsp;|&nbsp; ${todayLabel}</div>
  <script>window.onload=function(){window.print();setTimeout(function(){window.close();},500);}</script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=1100,height=800');
    if (!win) { alert('Izinkan pop-up untuk mencetak.'); return; }
    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="shu-container">

      {/* Header */}
      <div className="master-header">
        <div className="master-header-title">
          <h2>Perhitungan SHU</h2>
          <p>Sisa Hasil Usaha — distribusi otomatis dari Laba Bersih koperasi.</p>
        </div>
        <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setShowFormula(v => !v)}>
            <Info size={15} />
            {showFormula ? 'Sembunyikan Rumus' : 'Lihat Rumus'}
            {showFormula ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <button className="btn btn-primary" onClick={handleCetak} style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <Printer size={15} /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* Total SHU dari Laba Bersih */}
      <div className="glass-panel" style={{ padding:'1.25rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem', borderLeft:'4px solid var(--color-primary)' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.25rem' }}>
            <Link size={16} style={{ color:'var(--color-primary)' }} />
            <span style={{ fontWeight:700, fontSize:'0.9rem' }}>Total SHU = Laba Bersih Koperasi</span>
          </div>
          <p style={{ fontSize:'0.78rem', color:'var(--color-text-muted)', margin:0 }}>
            Dihitung otomatis dari Laporan Laba/Rugi (Pendapatan − HPP − Beban Operasional)
          </p>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:'2rem', fontWeight:900, color: totalSHU > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
            {fmt(totalSHU)}
          </div>
          {totalSHU === 0 && (
            <p style={{ fontSize:'0.75rem', color:'var(--color-warning)', margin:0 }}>
              ⚠️ Laba bersih Rp 0 — pastikan ada transaksi di Laba/Rugi
            </p>
          )}
        </div>
      </div>

      {/* Validasi persentase */}
      {!pctValid && (
        <div style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:'var(--radius-md)', padding:'0.75rem 1rem', display:'flex', alignItems:'center', gap:'0.5rem', color:'var(--color-warning)', fontWeight:600, fontSize:'0.875rem' }}>
          <AlertTriangle size={16} />
          Total persentase saat ini {totalPct}% — harus tepat 100%.
        </div>
      )}

      {/* Formula */}
      {showFormula && (
        <div className="shu-formula-card glass-panel">
          <h4 style={{ marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <Info size={17} style={{ color:'var(--color-primary)' }} /> Rumus Pembagian SHU
          </h4>
          <div className="formula-grid">
            <div className="formula-block">
              <div className="formula-label">📐 JMA Pokok + Wajib</div>
              <div className="formula-equation">= (Simpanan PW Anggota / Total PW) × %JMA-PW × SHU</div>
              <p className="formula-desc">Kontribusi modal wajib anggota.</p>
            </div>
            <div className="formula-block">
              <div className="formula-label">📐 JMA Sukarela</div>
              <div className="formula-equation">= (Sukarela Anggota / Total Sukarela) × %JMA-Suk × SHU</div>
              <p className="formula-desc">Kontribusi simpanan sukarela anggota.</p>
            </div>
            <div className="formula-block">
              <div className="formula-label">📐 JUA Kredit Barang</div>
              <div className="formula-equation">= (Kredit Dibayar Anggota / Total Kredit) × %JUA-Kredit × SHU</div>
              <p className="formula-desc">Partisipasi kredit barang yang sudah dibayar.</p>
            </div>
            <div className="formula-block">
              <div className="formula-label">📐 JUA Belanja</div>
              <div className="formula-equation">= (Belanja Anggota / Total Belanja) × %JUA-Belanja × SHU</div>
              <p className="formula-desc">Partisipasi belanja & pinjaman tunai anggota.</p>
            </div>
          </div>
        </div>
      )}

      {/* Komponen & Persentase */}
      <div className="shu-controls glass-panel">
        <h4 className="shu-controls-title">
          <Percent size={17} style={{ color:'var(--color-primary)' }} />
          Komponen Distribusi SHU
          {!pctValid && <span style={{ marginLeft:'0.5rem', fontSize:'0.75rem', color:'var(--color-warning)', fontWeight:400 }}>({totalPct}% / 100%)</span>}
        </h4>
        <div className="shu-controls-grid">
          {komponen.map(k => (
            <div key={k.label} className="form-group">
              <label className="form-label" style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ color: k.color }}>{k.label}</span>
                <span className="pct-badge">{k.pct}%</span>
              </label>
              <input type="number" className="form-control" min={0} max={100} step={1}
                value={k.pct} onChange={(e) => k.set(Number(e.target.value))} />
              <div style={{ fontSize:'0.72rem', color:'var(--color-text-muted)', marginTop:'0.2rem', display:'flex', justifyContent:'space-between' }}>
                <span>{k.desc}</span>
                <span style={{ fontWeight:600, color: k.color }}>{fmt(k.pool)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bar visual */}
        <div className="shu-pool-bar">
          {komponen.filter(k => k.pct > 0).map(k => (
            <div key={k.label} className="pool-segment" style={{ flex: k.pct, background: k.color, opacity: 0.8 }}>
              <span>{k.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ringkasan distribusi */}
      <div className="glass-panel" style={{ padding:'1.5rem' }}>
        <h4 style={{ marginBottom:'1rem', fontWeight:700 }}>Rincian Distribusi SHU</h4>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:'0.75rem' }}>
          {komponen.map(k => (
            <div key={k.label} style={{ background:'var(--color-background)', borderRadius:'var(--radius-md)', padding:'0.875rem 1rem', borderLeft:`3px solid ${k.color}` }}>
              <div style={{ fontSize:'0.72rem', color:'var(--color-text-muted)', marginBottom:'0.25rem' }}>{k.label}</div>
              <div style={{ fontWeight:700, color: k.color, fontSize:'1rem' }}>{fmt(k.pool)}</div>
              <div style={{ fontSize:'0.7rem', color:'var(--color-text-muted)' }}>{fmtP(k.pct)} dari SHU</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="master-stats">
        <div className="stat-card">
          <div className="stat-icon primary"><DollarSign size={22} /></div>
          <div className="stat-info">
            <div className="stat-value">{fmt(totalSHU)}</div>
            <div className="stat-label">Total SHU (Laba Bersih)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><TrendingUp size={22} /></div>
          <div className="stat-info">
            <div className="stat-value">{fmt(totalTerbagi)}</div>
            <div className="stat-label">Dibagikan ke Anggota</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><DollarSign size={22} /></div>
          <div className="stat-info">
            <div className="stat-value">{fmt(poolCadangan + poolSosial)}</div>
            <div className="stat-label">Cadangan + Sosial</div>
          </div>
        </div>
        <div className="stat-card" style={{ flexDirection:'column', alignItems:'center', textAlign:'center' }}>
          <div className="stat-icon secondary"><Users size={22} /></div>
          <div className="stat-info" style={{ textAlign:'center' }}>
            <div className="stat-value">{members.length}</div>
            <div className="stat-label">
              Anggota
              <span style={{ display:'block', fontSize:'0.72rem', color:'var(--color-text-muted)', marginTop:'0.1rem' }}>
                {members.filter(m => m.type==='Penuh').length} Penuh · {members.filter(m => m.type==='Calon').length} Calon
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel per anggota */}
      <div className="glass-panel">
        <div className="master-toolbar" style={{ marginBottom:'1rem' }}>
          <h4 style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <Users size={17} style={{ color:'var(--color-primary)' }} />
            Rincian SHU Per Anggota
          </h4>
          <div className="master-toolbar-info">
            <span>{memberSHU.length} anggota · Halaman {shuPage} dari {Math.ceil(memberSHU.length / SHU_PAGE_SIZE) || 1}</span>
          </div>
        </div>

        <div className="master-table-wrapper">
          <table className="master-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama</th>
                <th>Status</th>
                <th>Pokok+Wajib</th>
                <th>Sukarela</th>
                <th>Kredit Bayar</th>
                <th>Belanja</th>
                <th style={{ color:'var(--color-success)' }}>JMA PW</th>
                <th style={{ color:'var(--color-primary)' }}>JMA Suk</th>
                <th style={{ color:'var(--color-warning)' }}>JUA Kredit</th>
                <th style={{ color:'var(--color-secondary)' }}>JUA Belanja</th>
                <th style={{ color:'var(--color-primary)' }}>Total SHU</th>
              </tr>
            </thead>
            <tbody>
              {pagedSHU.map(m => (
                <tr key={m.id}>
                  <td><span className="cell-id">{m.id}</span></td>
                  <td><span className="cell-name">{m.name}</span></td>
                  <td>
                    <span className={m.type==='Penuh' ? 'member-type-full' : 'member-type-calon'}>{m.type}</span>
                  </td>
                  <td className="cell-amount">{fmt(m.pw)}</td>
                  <td className="cell-amount">{fmt(m.suk)}</td>
                  <td className="cell-amount">{fmt(m.kredit)}</td>
                  <td className="cell-amount">{fmt(m.belanja)}</td>
                  <td className="cell-amount" style={{ color:'var(--color-success)' }}>{fmt(m.jmaPW)}</td>
                  <td className="cell-amount" style={{ color:'var(--color-primary)' }}>{fmt(m.jmaSukarela)}</td>
                  <td className="cell-amount" style={{ color:'var(--color-warning)' }}>{fmt(m.juaKredit)}</td>
                  <td className="cell-amount" style={{ color:'var(--color-secondary)' }}>{fmt(m.juaBelanja)}</td>
                  <td><span className="shu-total-badge">{fmt(m.totalAnggota)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {shuTotalPages > 1 && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.875rem 1rem', borderTop:'1px solid var(--color-border)', fontSize:'0.82rem' }}>
            <span style={{ color:'var(--color-text-muted)' }}>
              Halaman {shuPage} dari {shuTotalPages} · {memberSHU.length} anggota
            </span>
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <button className="btn btn-secondary"
                style={{ padding:'0.3rem 0.75rem', fontSize:'0.78rem', display:'flex', alignItems:'center', gap:4 }}
                onClick={() => setShuPage(p => Math.max(1, p-1))}
                disabled={shuPage === 1}>
                <ChevronLeft size={14} /> Prev
              </button>
              {Array.from({ length: shuTotalPages }, (_, i) => i+1)
                .filter(p => p===1 || p===shuTotalPages || Math.abs(p-shuPage)<=1)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx-1] !== p-1 && <span style={{ padding:'0.3rem 0.25rem', color:'var(--color-text-muted)' }}>…</span>}
                    <button
                      className={`btn ${shuPage===p ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding:'0.3rem 0.625rem', fontSize:'0.78rem', minWidth:32 }}
                      onClick={() => setShuPage(p)}>
                      {p}
                    </button>
                  </React.Fragment>
                ))
              }
              <button className="btn btn-secondary"
                style={{ padding:'0.3rem 0.75rem', fontSize:'0.78rem', display:'flex', alignItems:'center', gap:4 }}
                onClick={() => setShuPage(p => Math.min(shuTotalPages, p+1))}
                disabled={shuPage === shuTotalPages}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {totalBelanja === 0 && totalKreditBayar === 0 && (
          <div className="shu-warning">
            ⚠️ Belum ada data transaksi anggota. Komponen JUA akan bernilai 0 sampai ada penjualan/kredit yang tercatat.
          </div>
        )}
      </div>

      {/* Panel TOTAL — terpisah di bawah */}
      <div className="glass-panel" style={{ borderLeft:'4px solid var(--color-primary)', padding:'1.25rem 1.5rem' }}>
        <h4 style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem', fontWeight:700 }}>
          <DollarSign size={17} style={{ color:'var(--color-primary)' }} />
          Rekapitulasi Total SHU Seluruh Anggota
        </h4>
        <div style={{ overflowX:'auto' }}>
          <table className="master-table" style={{ fontSize:'0.875rem' }}>
            <thead>
              <tr>
                <th>Pokok+Wajib</th>
                <th>Sukarela</th>
                <th>Kredit Bayar</th>
                <th>Belanja</th>
                <th style={{ color:'var(--color-success)' }}>JMA PW</th>
                <th style={{ color:'var(--color-primary)' }}>JMA Suk</th>
                <th style={{ color:'var(--color-warning)' }}>JUA Kredit</th>
                <th style={{ color:'var(--color-secondary)' }}>JUA Belanja</th>
                <th style={{ color:'var(--color-primary)', fontWeight:800 }}>Total Dibagikan</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background:'rgba(255,77,0,0.03)', fontWeight:700 }}>
                <td className="cell-amount"><strong>{fmt(members.reduce((s,m)=>s+m.pokok+m.wajib,0))}</strong></td>
                <td className="cell-amount"><strong>{fmt(totalSukarela)}</strong></td>
                <td className="cell-amount"><strong>{fmt(totalKreditBayar)}</strong></td>
                <td className="cell-amount"><strong>{fmt(totalBelanja)}</strong></td>
                <td className="cell-amount" style={{ color:'var(--color-success)' }}><strong>{fmt(poolJMAPW)}</strong></td>
                <td className="cell-amount" style={{ color:'var(--color-primary)' }}><strong>{fmt(poolJMASukarela)}</strong></td>
                <td className="cell-amount" style={{ color:'var(--color-warning)' }}><strong>{fmt(poolJUAKredit)}</strong></td>
                <td className="cell-amount" style={{ color:'var(--color-secondary)' }}><strong>{fmt(poolJUABelanja)}</strong></td>
                <td><span className="shu-total-badge shu-total-badge-grand">{fmt(totalTerbagi)}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SHU;
