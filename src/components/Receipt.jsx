import React from 'react';
import { Printer, FileText, Truck } from 'lucide-react';

const Receipt = ({
  items = [], total = 0, subtotal = 0, markupAmount = 0, type = 'retail',
  memberName, buyer, date, transactionId,
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

  const simpleDate = date 
    ? new Date(date).toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' }) 
    : '....................';

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

    const markupHTML = markupAmount > 0 ? `
      <div class="row"><span>Subtotal</span><span>Rp ${(subtotal||0).toLocaleString('id-ID')}</span></div>
      <div class="row"><span>Markup Kredit (10%)</span><span>Rp ${markupAmount.toLocaleString('id-ID')}</span></div>
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
  ${markupHTML}

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

  // ── Build HTML Invoice (A4) ──────────────────────────────────────────────
  const buildInvoiceHTML = () => {
    const itemsHTML = items.map((item, index) => {
      const rpPrice = (item.price||0).toLocaleString('id-ID');
      const rpTotal = ((item.price||0)*item.qty).toLocaleString('id-ID');
      return "<tr><td style='text-align:center'>" + (index + 1) + "</td><td>" + item.name + "</td><td style='text-align:center'>" + item.qty + "</td><td style='text-align:right'>Rp " + rpPrice + "</td><td style='text-align:right'>Rp " + rpTotal + "</td></tr>";
    }).join('');

    let scheduleHTML = '';
    if (paymentMethod === 'Kredit' && schedule.length > 1) {
      const rows = schedule.map(s => "<tr><td style='padding:4px 0'>Cicilan " + s.no + " (" + s.date + ")</td><td style='text-align:right'>Rp " + s.amount.toLocaleString('id-ID') + "</td></tr>").join('');
      scheduleHTML = "<div style='margin-top:15px; border:1px solid #ddd; padding:10px; border-radius:4px;'><h4 style='margin-bottom:8px; margin-top:0;'>JADWAL CICILAN</h4><table style='width:100%; border-collapse:collapse; font-size:12px;'>" + rows + "</table></div>";
    }

    let markupHTML = '';
    if (markupAmount > 0) {
      markupHTML = "<tr><td colspan='4' style='text-align:right'>Subtotal</td><td style='text-align:right'>Rp " + subtotal.toLocaleString('id-ID') + "</td></tr><tr><td colspan='4' style='text-align:right'>Markup Kredit (10%)</td><td style='text-align:right'>Rp " + markupAmount.toLocaleString('id-ID') + "</td></tr>";
    }

    const payMethodStr = paymentMethod === 'Kredit' ? 'Kredit / Cicilan' : 'Cash / Lunas';

    let jatuhTempoHTML = '';
    if (paymentMethod === 'Kredit') {
      let jt = startDate;
      if (!jt) {
        const d = new Date(date || new Date());
        d.setMonth(d.getMonth() + 1);
        jt = d.toISOString().split('T')[0];
      }
      jatuhTempoHTML = "<div style='font-size:14px; margin-top:20px; margin-bottom:5px;'><strong>Tanggal Jatuh Tempo:</strong> <span style='color:#FF4D00; font-weight:bold;'>" + jt + "</span></div>";
    }

    const buyerInfoHTML = 
      "<div style='font-weight:bold; font-size:16px;'>" + (memberName || 'Pelanggan Umum') + "</div>" +
      (buyer?.address ? "<div>" + buyer.address + "</div>" : "") +
      (buyer?.npwp ? "<div>NPWP: " + buyer.npwp + "</div>" : "") +
      (buyer?.phone ? "<div>Telp: " + buyer.phone + "</div>" : "");

    const logoUrl = window.location.origin + '/logo.png';

    return "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Invoice - " + transactionId + "</title><style>@page { size: A4; margin: 0; } * { box-sizing: border-box; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; } body { color: #333; font-size: 13px; line-height: 1.5; margin: 0; padding: 12mm; } .header { display: flex; justify-content: space-between; border-bottom: 2px solid #FF4D00; padding-bottom: 10px; margin-bottom: 15px; } .title { font-size: 26px; font-weight: bold; color: #FF4D00; letter-spacing: 2px; margin-bottom:5px; } .info-container { display: flex; justify-content: space-between; margin-bottom: 20px; } .info-box { background: #f8fafc; padding: 12px; border-radius: 8px; width: 100%; } table { width: 100%; border-collapse: collapse; margin-bottom: 15px; } th { background: #1e293b; color: white; padding: 10px; text-align: left; } td { padding: 10px; border-bottom: 1px solid #e2e8f0; } .total-row td { font-weight: bold; font-size: 15px; background: #f8fafc; border-bottom: 2px solid #cbd5e1; } .signatures { display: flex; justify-content: flex-end; margin-top: 30px; text-align: center; page-break-inside: avoid; } .sign-box { width: 220px; page-break-inside: avoid; } .sign-line { border-top: 1px solid #000; margin-top: 50px; padding-top: 5px; font-weight: bold; }</style></head><body><div class='header'><div style='display:flex; align-items:flex-start; gap:15px;'><img src='" + logoUrl + "' style='height:58px; width:auto; object-fit:contain; margin-top:1px;' /><div><div style='font-size:24px; font-weight:900; color:#FF4D00; line-height:1.2;'>KPKCG</div><div style='font-size:12px; font-weight:bold;'>Koperasi Pemasaran Karya Cipta Gemilang</div><div style='font-size:11px; color:#475569;'>Jl Australia I Kav.C1/2, Warnasari, Kec. Citangkil,<br>Kota Cilegon, Banten 42443</div><div style='font-size:11px; color:#475569;'>NPWP: 1000000006662283 | Telp: -</div><div style='font-size:11px; color:#475569;'>Email: kp.karyaciptagemilang@gmail.com</div></div></div><div style='text-align:right'><div class='title'>INVOICE</div><div>#" + transactionId + "</div><div>Tanggal: " + displayDate + "</div><div style='margin-top:10px; font-size:11px; color:#64748b;'>Invoice diterbitkan otomatis oleh sistem</div></div></div><div class='info-container'><div class='info-box'><div style='font-size:12px; color:#64748b; margin-bottom:5px'>DITAGIHKAN KEPADA:</div>" + buyerInfoHTML + "</div></div><table><thead><tr><th style='width:5%; text-align:center'>No</th><th style='width:45%'>Deskripsi Barang</th><th style='width:10%; text-align:center'>Qty</th><th style='width:20%; text-align:right'>Harga Satuan</th><th style='width:20%; text-align:right'>Jumlah</th></tr></thead><tbody>" + itemsHTML + markupHTML + "<tr class='total-row'><td colspan='4' style='text-align:right'>TOTAL TAGIHAN</td><td style='text-align:right; color:#FF4D00;'>Rp " + total.toLocaleString('id-ID') + "</td></tr></tbody></table>" + jatuhTempoHTML + "<div style='font-size:12px; margin-top:10px; border-left:3px solid #FF4D00; padding-left:10px;'><strong>Informasi Pembayaran (Transfer):</strong><br>Nama Bank: BRI<br>No. Rekening: <strong>018801004583301</strong><br>Atas Nama: Koperasi Pemasaran Karya Cipta Gemilang</div>" + scheduleHTML + "<div class='signatures'><div class='sign-box'><div style='margin-bottom:20px;'>Cilegon, " + simpleDate + "</div><div>Hormat Kami</div><div class='sign-line'>Koperasi KPKCG</div></div></div><script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };</script></body></html>";
  };

  // ── Build HTML Surat Jalan (A4) ──────────────────────────────────────────
  const buildSuratJalanHTML = () => {
    const itemsHTML = items.map((item, index) => {
      return "<tr><td style='text-align:center; border: 1px solid #FF4D00; padding: 10px;'>" + (index + 1) + "</td><td style='border: 1px solid #FF4D00; padding: 10px;'>" + item.name + "</td><td style='text-align:center; border: 1px solid #FF4D00; padding: 10px; font-weight:bold;'>" + item.qty + "</td></tr>";
    }).join('');

    const buyerInfoHTML = 
      "<div style='font-weight:bold; font-size:16px;'>" + (memberName || 'Pelanggan Umum') + "</div>" +
      (buyer?.address ? "<div>" + buyer.address + "</div>" : "") +
      (buyer?.phone ? "<div>Telp: " + buyer.phone + "</div>" : "");

    const logoUrl = window.location.origin + '/logo.png';

    return "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Surat Jalan - " + transactionId + "</title><style>@page { size: A4; margin: 0; } * { box-sizing: border-box; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; } body { color: #333; font-size: 13px; line-height: 1.5; margin: 0; padding: 12mm; } .header { display: flex; justify-content: space-between; border-bottom: 3px solid #FF4D00; padding-bottom: 10px; margin-bottom: 15px; } .title { font-size: 26px; font-weight: bold; color: #FF4D00; letter-spacing: 2px; margin-bottom:5px; } .info-box { border: 1px solid #FF4D00; border-radius: 8px; padding: 12px; width: 48%; } table { width: 100%; border-collapse: collapse; margin-bottom: 15px; margin-top:15px; } th { border: 1px solid #FF4D00; padding: 10px; background: #fff0e6; color: #CC3D00; } .signatures { display: flex; justify-content: space-between; margin-top: 40px; text-align: center; page-break-inside: avoid; } .sign-box { width: 30%; page-break-inside: avoid; } .sign-line { border-top: 1px solid #000; margin-top: 50px; padding-top: 5px; }</style></head><body><div class='header'><div style='display:flex; align-items:flex-start; gap:15px;'><img src='" + logoUrl + "' style='height:75px; width:auto; object-fit:contain; margin-top: 3px;' /><div><div style='font-size:24px; font-weight:900; color:#FF4D00; line-height:1.2;'>KPKCG</div><div style='font-size:12px; font-weight:bold;'>Koperasi Pemasaran Karya Cipta Gemilang</div><div style='font-size:11px; color:#475569;'>Jl Australia I Kav.C1/2, Warnasari, Kec. Citangkil,<br>Kota Cilegon, Banten 42443</div></div></div><div style='text-align:right'><div class='title'>SURAT JALAN</div><div>No. Ref: " + transactionId + "</div></div></div><div style='display: flex; justify-content: space-between;'><div class='info-box'><div style='font-size:12px; margin-bottom:5px; color:#ea580c; font-weight:bold;'>PENGIRIM:</div><div style='font-weight:bold; font-size:16px;'>Koperasi KPKCG</div><div>Jl Australia I Kav.C1/2, Warnasari, Citangkil</div><div>Cilegon, Banten 42443</div><div>Telp: -</div><div style='margin-top:10px;'>Tanggal Pengiriman: " + (takeDate || displayDate) + "</div></div><div class='info-box'><div style='font-size:12px; margin-bottom:5px; color:#ea580c; font-weight:bold;'>KEPADA / PENERIMA:</div>" + buyerInfoHTML + "<div style='margin-top:10px'>Catatan: " + (notes || '-') + "</div></div></div><p style='margin-top:15px; font-style:italic;'>Mohon diterima barang-barang dengan rincian sebagai berikut dalam keadaan baik dan cukup:</p><table><thead><tr><th style='width:10%;'>No</th><th style='width:70%; text-align:left;'>Nama Barang</th><th style='width:20%;'>Kuantitas (Qty)</th></tr></thead><tbody>" + itemsHTML + "</tbody></table><div class='signatures'><div class='sign-box'><div style='margin-bottom:20px;'><br></div><div>Hormat Kami,</div><div class='sign-line'>Nama & Tanda Tangan</div></div><div class='sign-box'><div style='margin-bottom:20px;'>Cilegon, " + simpleDate + "</div><div>Diserahkan Oleh,</div><div class='sign-line'>Nama & Tanda Tangan</div></div><div class='sign-box'><div style='margin-bottom:20px;'><br></div><div>Penerima,</div><div class='sign-line'>" + (memberName || 'Nama & Tanda Tangan') + "</div></div></div><script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };</script></body></html>";
  };

  const handlePrintInvoice = () => {
    const html = buildInvoiceHTML();
    const win = window.open('', '_blank');
    if (!win) return alert('Pop-up diblokir browser. Izinkan pop-up untuk mencetak.');
    win.document.write(html);
    win.document.close();
  };

  const handlePrintSuratJalan = () => {
    const html = buildSuratJalanHTML();
    const win = window.open('', '_blank');
    if (!win) return alert('Pop-up diblokir browser. Izinkan pop-up untuk mencetak.');
    win.document.write(html);
    win.document.close();
  };

  // ── Tampilan struk di modal (preview) ─────────────────────────────────────
  return (
    <>
      <div style={{
        background: 'rgba(16, 185, 129, 0.1)',
        color: 'var(--color-success)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        padding: '0.6rem',
        textAlign: 'center',
        fontWeight: 'bold',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '1.25rem',
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem'
      }}>
        ✅ Transaksi Berhasil Disimpan!
      </div>

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
          ...(paymentMethod === 'Kredit' && startDate ? [[installments === 1 ? 'Jatuh Tempo' : 'Mulai Bayar', <b>{startDate}</b>]] : []),
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
              <span>Komisi Koperasi</span><span>Rp ${(commission||0).toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:2 }}>
              <span>Hutang ke Suplier</span><span>Rp ${(supplierPayable||0).toLocaleString('id-ID')}</span>
            </div>
            <hr style={{ border:'none', borderTop:'1px dashed #999', margin:'6px 0' }} />
          </>
        )}

        {/* Markup */}
        {markupAmount > 0 && (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:2 }}>
              <span>Subtotal</span><span>Rp ${(subtotal||0).toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:2 }}>
              <span>Markup Kredit (10%)</span><span>Rp {markupAmount.toLocaleString('id-ID')}</span>
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
      <div style={{ textAlign:'center', marginTop:16, display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
        <button onClick={handlePrint} className="btn"
          style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#f3f4f6', color:'#374151', border:'1px solid #d1d5db' }}>
          <Printer size={16} /> Struk Kasir (Thermal)
        </button>
        <button onClick={handlePrintSuratJalan} className="btn"
          style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#f8fafc', color:'#0f172a', border:'1px solid #cbd5e1' }}>
          <Truck size={16} /> Surat Jalan (A4)
        </button>
        <button onClick={handlePrintInvoice} className="btn btn-primary"
          style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
          <FileText size={16} /> Cetak Invoice (A4)
        </button>
      </div>
    </>
  );
};

export default Receipt;
