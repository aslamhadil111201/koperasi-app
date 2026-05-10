import React from 'react';
import { 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  ShoppingCart,
  CreditCard,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useStore } from '../../store/useStore';
// Trigger HMR to resolve recharts
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const StatCard = ({ title, amount, trend, trendValue, icon: Icon, colorClass }) => (
  <div className="glass-panel stat-card">
    <div className="stat-icon-wrapper-top">
      <div className={`stat-icon-circle ${colorClass}`}>
        <Icon size={22} />
      </div>
    </div>
    <p className="stat-title">{title}</p>
    <h3 className="stat-amount">{amount}</h3>
    <div className="stat-footer">
      <span className={`trend ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
        {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {trendValue}
      </span>
      <span className="text-muted text-xs ms-2">vs bulan lalu</span>
    </div>
  </div>
);

const Dashboard = () => {
  const journal = useStore((state) => state.journal);
  const members = useStore((state) => state.members);
  const cashLoans = useStore((state) => state.cashLoans);
  const creditGoods = useStore((state) => state.creditGoods);

  // ── Tanggal referensi ──────────────────────────────────────────────────────
  const today = new Date();
  // Format manual supaya tidak kena timezone offset
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  // Bulan ini & bulan lalu (format YYYY-MM)
  const thisMonth  = todayStr.slice(0, 7);
  const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonth  = lastMonthDate.toISOString().slice(0, 7);

  // ── Helper: hitung kas bersih dari entri jurnal ────────────────────────────
  const kasEntries = journal.filter(j => j.account === 'Kas');

  const kasNetForMonth = (ym) =>
    kasEntries
      .filter(j => j.date.startsWith(ym))
      .reduce((s, j) => s + j.debit - j.credit, 0);

  // ── Total Kas (saldo kumulatif) ────────────────────────────────────────────
  const totalKas = kasEntries.reduce((s, j) => s + j.debit - j.credit, 0);

  const kasThisMonth = kasNetForMonth(thisMonth);
  const kasLastMonth = kasNetForMonth(lastMonth);
  const kasTrend = kasLastMonth !== 0
    ? (((kasThisMonth - kasLastMonth) / Math.abs(kasLastMonth)) * 100).toFixed(1)
    : kasThisMonth > 0 ? '100.0' : '0.0';

  // ── Total Simpanan ─────────────────────────────────────────────────────────
  const totalSimpanan = members.reduce((sum, m) => sum + (m.pokok + m.wajib + m.sukarela), 0);

  // Simpanan bulan ini vs bulan lalu dari jurnal
  const simpananNet = (ym) =>
    journal
      .filter(j => j.account === 'Simpanan Anggota' && j.date.startsWith(ym))
      .reduce((s, j) => s + j.credit - j.debit, 0);
  const simpananThisMonth = simpananNet(thisMonth);
  const simpananLastMonth = simpananNet(lastMonth);
  const simpananTrend = simpananLastMonth !== 0
    ? (((simpananThisMonth - simpananLastMonth) / Math.abs(simpananLastMonth)) * 100).toFixed(1)
    : simpananThisMonth > 0 ? '100.0' : '0.0';

  // ── Pinjaman Aktif ─────────────────────────────────────────────────────────
  const activeCashLoans   = cashLoans.filter(l => l.status === 'Active').reduce((s, l) => s + l.remainingAmount, 0);
  const activeCreditGoods = creditGoods.filter(c => c.status === 'Active').reduce((s, c) => s + c.remainingAmount, 0);
  const activeLoans = activeCashLoans + activeCreditGoods;

  // Pinjaman aktif bulan lalu (approved di bulan lalu)
  const loansApprovedThisMonth = journal
    .filter(j => j.account === 'Piutang Anggota' && j.debit > 0 && j.date.startsWith(thisMonth))
    .reduce((s, j) => s + j.debit, 0);
  const loansApprovedLastMonth = journal
    .filter(j => j.account === 'Piutang Anggota' && j.debit > 0 && j.date.startsWith(lastMonth))
    .reduce((s, j) => s + j.debit, 0);
  const loanTrend = loansApprovedLastMonth !== 0
    ? (((loansApprovedThisMonth - loansApprovedLastMonth) / Math.abs(loansApprovedLastMonth)) * 100).toFixed(1)
    : loansApprovedThisMonth > 0 ? '100.0' : '0.0';

  // ── Penjualan Hari Ini ─────────────────────────────────────────────────────
  const todaySales = journal
    .filter(j => j.account.startsWith('Pendapatan') && j.date === todayStr)
    .reduce((s, j) => s + j.credit, 0);

  // Penjualan kemarin untuk trend
  const yesterdayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth()+1).padStart(2,'0')}-${String(yesterdayDate.getDate()).padStart(2,'0')}`;
  const yesterdaySales = journal
    .filter(j => j.account.startsWith('Pendapatan') && j.date === yesterdayStr)
    .reduce((s, j) => s + j.credit, 0);
  const salesTrend = yesterdaySales !== 0
    ? (((todaySales - yesterdaySales) / Math.abs(yesterdaySales)) * 100).toFixed(1)
    : todaySales > 0 ? '100.0' : '0.0';

  // ── Pinjaman Aktif untuk card ──────────────────────────────────────────────
  const loansNearingDue = [
    ...cashLoans
      .filter(l => l.status === 'Active' && l.remainingAmount > 0)
      .map(l => ({
        id: l.id,
        name: l.name,
        type: 'Pinjaman Tunai',
        remaining: l.remainingAmount,
        tenor: l.tenor,
        colorClass: 'bg-warning-light text-warning',
      })),
    ...creditGoods
      .filter(c => c.status === 'Active' && c.remainingAmount > 0)
      .map(c => ({
        id: c.id,
        name: c.name,
        type: c.itemName,
        remaining: c.remainingAmount,
        tenor: c.tenor,
        colorClass: 'bg-danger-light text-danger',
      })),
  ];

  // ── Transaksi terakhir ─────────────────────────────────────────────────────
  const recentTransactions = [...journal].reverse().slice(0, 5);

  // ── Grafik Arus Kas: 7 hari terakhir dari journal (REAL DATA) ─────────────
  const cashFlowData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - i));
    // Gunakan format manual supaya tidak kena timezone offset
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const label = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });

    const dayEntries  = kasEntries.filter(j => j.date === dateStr);
    const pemasukan   = dayEntries.reduce((s, j) => s + j.debit,  0);
    const pengeluaran = dayEntries.reduce((s, j) => s + j.credit, 0);

    return { name: label, pemasukan, pengeluaran };
  });

  const handleUnduhLaporan = () => {
    const today = new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Laporan Dashboard KPKCG</title>
<style>
  @page { size: A4; margin: 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; }
  h1 { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
  h2 { font-size: 14px; font-weight: 700; margin: 16px 0 8px; border-bottom: 2px solid #FF4D00; padding-bottom: 4px; color: #FF4D00; }
  .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 12px; }
  .header p { font-size: 11px; color: #666; margin-top: 2px; }
  .grid4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 16px; }
  .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; text-align: center; }
  .card .label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  .card .value { font-size: 16px; font-weight: 800; color: #111; }
  .card .trend { font-size: 10px; color: #6b7280; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #f9fafb; padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
  td { padding: 7px 10px; border-bottom: 1px solid #f3f4f6; }
  .text-right { text-align: right; }
  .badge-plus { color: #10b981; font-weight: 600; }
  .badge-minus { color: #ef4444; font-weight: 600; }
  .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
</style>
</head>
<body>
  <div class="header">
    <h1>KPKCG</h1>
    <p>Koperasi Pemasaran Karya Cipta Gemilang</p>
    <p>Laporan Dashboard — Dicetak: ${today}</p>
  </div>

  <h2>Ringkasan Keuangan</h2>
  <div class="grid4">
    <div class="card">
      <div class="label">Total Kas</div>
      <div class="value">Rp ${totalKas.toLocaleString('id-ID')}</div>
      <div class="trend">${Number(kasTrend) >= 0 ? '▲' : '▼'} ${Math.abs(Number(kasTrend))}% vs bulan lalu</div>
    </div>
    <div class="card">
      <div class="label">Total Simpanan</div>
      <div class="value">Rp ${totalSimpanan.toLocaleString('id-ID')}</div>
      <div class="trend">${Number(simpananTrend) >= 0 ? '▲' : '▼'} ${Math.abs(Number(simpananTrend))}% vs bulan lalu</div>
    </div>
    <div class="card">
      <div class="label">Pinjaman Aktif</div>
      <div class="value">Rp ${activeLoans.toLocaleString('id-ID')}</div>
      <div class="trend">${Number(loanTrend) >= 0 ? '▲' : '▼'} ${Math.abs(Number(loanTrend))}% vs bulan lalu</div>
    </div>
    <div class="card">
      <div class="label">Penjualan Hari Ini</div>
      <div class="value">Rp ${todaySales.toLocaleString('id-ID')}</div>
      <div class="trend">${Number(salesTrend) >= 0 ? '▲' : '▼'} ${Math.abs(Number(salesTrend))}% vs kemarin</div>
    </div>
  </div>

  <h2>Transaksi Terakhir (Jurnal Umum)</h2>
  <table>
    <thead>
      <tr>
        <th>Tanggal</th>
        <th>No. Bukti</th>
        <th>Keterangan</th>
        <th>Akun</th>
        <th class="text-right">Debit</th>
        <th class="text-right">Kredit</th>
      </tr>
    </thead>
    <tbody>
      ${recentTransactions.length === 0
        ? '<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:16px">Belum ada transaksi</td></tr>'
        : recentTransactions.map(tx => `
        <tr>
          <td>${tx.date}</td>
          <td style="font-family:monospace;font-size:10px">${tx.id}</td>
          <td>${tx.description}</td>
          <td>${tx.account}</td>
          <td class="text-right ${tx.debit > 0 ? 'badge-minus' : ''}">${tx.debit > 0 ? 'Rp ' + tx.debit.toLocaleString('id-ID') : '-'}</td>
          <td class="text-right ${tx.credit > 0 ? 'badge-plus' : ''}">${tx.credit > 0 ? 'Rp ' + tx.credit.toLocaleString('id-ID') : '-'}</td>
        </tr>`).join('')
      }
    </tbody>
  </table>

  ${loansNearingDue.length > 0 ? `
  <h2>Pinjaman Aktif</h2>
  <table>
    <thead>
      <tr><th>ID</th><th>Nama Anggota</th><th>Jenis</th><th class="text-right">Sisa Tagihan</th><th>Tenor</th></tr>
    </thead>
    <tbody>
      ${loansNearingDue.map(l => `
      <tr>
        <td style="font-family:monospace;font-size:10px">${l.id}</td>
        <td>${l.name}</td>
        <td>${l.type}</td>
        <td class="text-right badge-minus">Rp ${l.remaining.toLocaleString('id-ID')}</td>
        <td>${l.tenor} bln</td>
      </tr>`).join('')}
    </tbody>
  </table>` : ''}

  <div class="footer">
    KPKCG — Koperasi Pemasaran Karya Cipta Gemilang &nbsp;|&nbsp; Dicetak ${today}
  </div>

  <script>window.onload=function(){window.print();setTimeout(function(){window.close();},500);}</script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) { alert('Izinkan pop-up untuk mencetak laporan.'); return; }
    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="dashboard-container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1>Dashboard Overview</h1>
          <p className="text-muted">Ringkasan aktivitas koperasi hari ini.</p>
        </div>
        <button className="btn btn-primary" onClick={handleUnduhLaporan}>Unduh Laporan</button>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <StatCard 
          title="Total Kas" 
          amount={`Rp ${totalKas.toLocaleString('id-ID')}`} 
          trend={Number(kasTrend) >= 0 ? "up" : "down"} 
          trendValue={`${Math.abs(Number(kasTrend))}%`}
          icon={DollarSign} 
          colorClass="bg-primary-light text-primary"
        />
        <StatCard 
          title="Total Simpanan Anggota" 
          amount={`Rp ${totalSimpanan.toLocaleString('id-ID')}`} 
          trend={Number(simpananTrend) >= 0 ? "up" : "down"} 
          trendValue={`${Math.abs(Number(simpananTrend))}%`}
          icon={TrendingUp} 
          colorClass="bg-success-light text-success"
        />
        <StatCard 
          title="Pinjaman Aktif" 
          amount={`Rp ${activeLoans.toLocaleString('id-ID')}`} 
          trend={Number(loanTrend) >= 0 ? "up" : "down"} 
          trendValue={`${Math.abs(Number(loanTrend))}%`}
          icon={CreditCard} 
          colorClass="bg-warning-light text-warning"
        />
        <StatCard 
          title="Penjualan Hari Ini" 
          amount={`Rp ${todaySales.toLocaleString('id-ID')}`} 
          trend={Number(salesTrend) >= 0 ? "up" : "down"} 
          trendValue={`${Math.abs(Number(salesTrend))}%`}
          icon={ShoppingCart} 
          colorClass="bg-secondary-light text-secondary"
        />
      </div>

      <div className="grid grid-cols-3 gap-6" style={{ alignItems: 'stretch', minHeight: '340px' }}>
        <div className="glass-panel col-span-1" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="mb-4">Grafik Arus Kas (7 Hari Terakhir)</h3>
          <div style={{ flex: 1, minHeight: '260px', width: '100%' }}>
            {cashFlowData.every(d => d.pemasukan === 0 && d.pengeluaran === 0) ? (
              <div className="dashboard-empty-state">
                <TrendingUp size={40} />
                <p>Belum ada transaksi kas<br />dalam 7 hari terakhir.</p>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={cashFlowData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorPemasukan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPengeluaran" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-danger)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-danger)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp ${value / 1000000}M`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <Tooltip 
                  formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                />
                <Area type="monotone" dataKey="pemasukan" name="Pemasukan" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorPemasukan)" />
                <Area type="monotone" dataKey="pengeluaran" name="Pengeluaran" stroke="var(--color-danger)" fillOpacity={1} fill="url(#colorPengeluaran)" />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-panel">
          <h3 className="mb-4">Transaksi Terakhir (Jurnal Umum)</h3>
          <div className="transaction-list">
            {recentTransactions.map((tx, index) => (
              <div key={`${tx.id}-${index}`} className="transaction-item">
                <div className="flex items-center gap-3">
                  <div className="transaction-icon bg-primary-light">
                    {tx.debit > 0 ? <TrendingDown size={16} className="text-danger" /> : <TrendingUp size={16} className="text-success" />}
                  </div>
                  <div>
                    <p className="transaction-title truncate" style={{ maxWidth: '150px' }}>{tx.description}</p>
                    <p className="transaction-time text-muted text-xs">{tx.date}</p>
                  </div>
                </div>
                <div className={`transaction-amount font-medium ${tx.debit > 0 ? 'text-danger' : 'text-success'}`}>
                  {tx.debit > 0 ? '-' : '+'}Rp {(tx.debit || tx.credit).toLocaleString('id-ID')}
                </div>
              </div>
            ))}
            {recentTransactions.length === 0 && (
              <div className="dashboard-empty-state">
                <TrendingDown size={36} />
                <p>Belum ada transaksi.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Pinjaman Aktif Card ── */}
        <div className="glass-panel">
          <div className="flex items-center justify-between mb-4">
            <h3>Pinjaman Aktif</h3>
            <span className="loan-badge-count">{loansNearingDue.length} aktif</span>
          </div>
          <div className="transaction-list">
            {loansNearingDue.map((loan) => (
              <div key={loan.id} className="transaction-item">
                <div className="flex items-center gap-3">
                  <div className={`transaction-icon ${loan.colorClass}`}>
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <p className="transaction-title" style={{ maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {loan.name}
                    </p>
                    <p className="transaction-time text-muted text-xs truncate" style={{ maxWidth: '130px' }}>
                      {loan.type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="transaction-amount font-medium text-danger">
                    Rp {loan.remaining.toLocaleString('id-ID')}
                  </p>
                  <p className="text-muted text-xs">{loan.tenor} bln</p>
                </div>
              </div>
            ))}
            {loansNearingDue.length === 0 && (
              <div className="dashboard-empty-state">
                <Clock size={36} />
                <p>Tidak ada pinjaman aktif.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
