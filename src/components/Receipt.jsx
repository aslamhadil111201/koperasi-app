import React from 'react';
import { Printer } from 'lucide-react';

const Receipt = ({
  items = [], total = 0, type = 'retail',
  memberName, date, transactionId,
  commission, supplierPayable,
  paymentMethod = 'Cash', takeDate,
  installments = 1, startDate, notes, schedule = [],
  pic = ''
}) => {

  const typeLabel = {
    retail:      'Penjualan Barang Ritel',
    consignment: 'Penjualan Konsinyasi',
    service:     'Penjualan Jasa & PPOB',
  }[type] || 'Transaksi';

  const displayDate = date
    ? new Date(date).toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })
    : '-';

  // ── Build HTML struk untuk print window ──────────────────────────────────
  const buildReceiptHTML = () => {
    const rows = (label, value) =>
      `<div class="row"><span>${label}</span><span class="bold">${value}</span></div>`;

    const itemsHTML = items.map(item => `
      <div style="margin-bottom:4px">
        <div>${item.name}</div>
        <div class="row" style="padding-left:8px">
          <span>${item.qty} x Rp ${(item.price||0).toLocaleString('id-ID')}</span>
          <span>Rp ${((item.price||0)*item.qty).toLocaleString('id-ID')}</span>
        </div>
      </div>`).join('');

    const consignHTML = type === 'consignment' && commission != null ? `
      <div class="row"><span>Komisi Koperasi</span><span>Rp ${(commission||0).toLocaleString('id-ID')}</span></div>
      <div class="row"><span>Hutang ke Suplier</span><span>Rp ${(supplierPayable||0).toLocaleString('id-ID')}</span></div>
      <hr>` : '';

    const scheduleHTML = paymentMethod === 'Kredit' && schedule.length > 0 ? `
      <hr>
      <div class="bold" style="font-size:10px;margin-bottom:3px">JADWAL CICILAN:</div>
      ${schedule.map(s => `<div class="row" style="font-size:10px"><span>Cicilan ${s.no} - ${s.date}</span><span>Rp ${s.amount.toLocaleString('id-ID')}</span></div>`).join('')}` : '';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Struk KPKCG</title>
<style>
  @page {
    size: 58mm auto;
    margin: 2mm;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 11px;
    color: #000;
    width: 54mm;
    background: #fff;
  }
  .center { text-align: center; }
  .bold   { font-weight: bold; }
  .row    { display: flex; justify-content: space-between; margin-bottom: 2px; }
  hr      { border: none; border-top: 1px dashed #666; margin: 6px 0; }
  .total-row {
    display: flex;
    justify-content: space-between;
    font-weight: bold;
    font-size: 13px;
    margin: 4px 0;
  }
</style>
</head>
<body>
  <div class="center bold" style="font-size:14px;margin-bottom:2px">KPKCG</div>
  <div class="center" style="font-size:9px;margin-bottom:2px">Koperasi Pemasaran Karya Cipta Gemilang</div>
  <div class="center" style="font-size:9px;margin-bottom:6px">================================</div>

  ${rows('No. Transaksi', transactionId || '-')}
  ${pic ? rows('Kasir/PIC', pic) : ''}
  ${rows('Tanggal', displayDate)}
  ${rows('Jenis', typeLabel)}
  ${memberName ? rows('Anggota', memberName) : ''}
  ${rows('Metode Bayar', paymentMethod === 'Kredit' ? (installments === 1 ? 'TEMPO/LUNAS' : `KREDIT ${installments}X`) : 'CASH')}
  ${takeDate ? rows('Tgl Pengambilan', takeDate) : ''}
  ${paymentMethod === 'Kredit' && startDate ? rows('Mulai Bayar', startDate) : ''}
  ${paymentMethod === 'Kredit' && notes ? rows('Ket.', notes) : ''}

  <hr>
  ${itemsHTML}
  <hr>
  ${consignHTML}

  <div class="total-row">
    <span>TOTAL BAYAR</span>
    <span>Rp ${total.toLocaleString('id-ID')}</span>
  </div>

  ${scheduleHTML}

  <hr>
  <div class="center" style="font-size:9px;margin-top:6px">Terima kasih telah berbelanja!</div>
  <div class="center" style="font-size:9px">Barang yang sudah dibeli</div>
  <div class="center" style="font-size:9px">tidak dapat dikembalikan.</div>
  <div class="center" style="font-size:9px;margin-top:4px">================================</div>

  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() { window.close(); }, 500);
    };
  </script>
</body>
</html>`;
  };

  const handlePrint = () => {
    const html = buildReceiptHTML();
    const win = window.open('', '_blank', 'width=300,height=600');
    if (!win) {
      alert('Pop-up diblokir browser. Izinkan pop-up untuk mencetak struk.');
      return;
    }
    win.document.write(html);
    win.document.close();
  };

  // ── Tampilan struk di modal (preview) ─────────────────────────────────────
  return (
    <>
      <div style={{
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: 12,
        color: '#000',
        maxWidth: 320,
        margin: '0 auto',
        background: '#fff',
        lineHeight: 1.5,
      }}>
        {/* Header */}
        <div style={{ textAlign:'center', fontWeight:'bold', fontSize:14, marginBottom:2 }}>KPKCG</div>
        <div style={{ textAlign:'center', fontSize:10, marginBottom:2 }}>Koperasi Pemasaran Karya Cipta Gemilang</div>
        <div style={{ textAlign:'center', fontSize:10, marginBottom:8 }}>================================</div>

        {/* Info */}
        {[
          ['No. Transaksi', <b>{transactionId || '-'}</b>],
          ...(pic ? [['Kasir/PIC', <b>{pic}</b>]] : []),
          ['Tanggal', displayDate],
          ['Jenis', typeLabel],
          ...(memberName ? [['Anggota', <b>{memberName}</b>]] : []),
          ['Metode Bayar', <b>{paymentMethod === 'Kredit' ? (installments === 1 ? 'TEMPO/LUNAS' : `KREDIT ${installments}X`) : 'CASH'}</b>],
          ...(takeDate ? [['Tgl Pengambilan', takeDate]] : []),
          ...(paymentMethod === 'Kredit' && startDate ? [['Mulai Bayar', <b>{startDate}</b>]] : []),
          ...(paymentMethod === 'Kredit' && notes ? [['Ket.', notes]] : []),
        ].map(([label, value], i) => (
          <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
            <span>{label}</span><span>{value}</span>
          </div>
        ))}

        <hr style={{ border:'none', borderTop:'1px dashed #999', margin:'6px 0' }} />

        {/* Items */}
        {items.map((item, idx) => (
          <div key={idx} style={{ marginBottom:4 }}>
            <div>{item.name}</div>
            <div style={{ display:'flex', justifyContent:'space-between', paddingLeft:8 }}>
              <span>{item.qty} x Rp {(item.price||0).toLocaleString('id-ID')}</span>
              <span>Rp {((item.price||0)*item.qty).toLocaleString('id-ID')}</span>
            </div>
          </div>
        ))}

        <hr style={{ border:'none', borderTop:'1px dashed #999', margin:'6px 0' }} />

        {/* Konsinyasi */}
        {type === 'consignment' && commission != null && (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:2 }}>
              <span>Komisi Koperasi</span><span>Rp {(commission||0).toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:2 }}>
              <span>Hutang ke Suplier</span><span>Rp {(supplierPayable||0).toLocaleString('id-ID')}</span>
            </div>
            <hr style={{ border:'none', borderTop:'1px dashed #999', margin:'6px 0' }} />
          </>
        )}

        {/* Total */}
        <div style={{ display:'flex', justifyContent:'space-between', fontWeight:'bold', fontSize:14, margin:'4px 0' }}>
          <span>TOTAL BAYAR</span>
          <span>Rp {total.toLocaleString('id-ID')}</span>
        </div>

        {/* Jadwal cicilan */}
        {paymentMethod === 'Kredit' && schedule.length > 0 && (
          <>
            <hr style={{ border:'none', borderTop:'1px dashed #999', margin:'6px 0' }} />
            <div style={{ fontSize:11, fontWeight:'bold', marginBottom:3 }}>JADWAL CICILAN:</div>
            {schedule.map(s => (
              <div key={s.no} style={{ display:'flex', justifyContent:'space-between', fontSize:10 }}>
                <span>Cicilan {s.no} - {s.date}</span>
                <span>Rp {s.amount.toLocaleString('id-ID')}</span>
              </div>
            ))}
          </>
        )}

        <hr style={{ border:'none', borderTop:'1px dashed #999', margin:'6px 0' }} />
        <div style={{ textAlign:'center', fontSize:10, marginTop:6 }}>Terima kasih telah berbelanja!</div>
        <div style={{ textAlign:'center', fontSize:10 }}>Barang yang sudah dibeli tidak dapat dikembalikan.</div>
        <div style={{ textAlign:'center', fontSize:10, marginTop:4 }}>================================</div>
      </div>

      {/* Tombol Cetak */}
      <div style={{ textAlign:'center', marginTop:16 }}>
        <button onClick={handlePrint} className="btn btn-primary"
          style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
          <Printer size={16} /> Cetak Struk
        </button>
      </div>
    </>
  );
};

export default Receipt;
