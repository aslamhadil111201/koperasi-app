import React, { useState, useMemo } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Search, Store, User, X, Banknote, CreditCard, Calendar } from 'lucide-react';
import { buildSchedule } from '../../utils/installment';
import { useStore } from '../../store/useStore';
import Receipt from '../../components/Receipt';
import SearchableSelect from '../../components/SearchableSelect';
import './Sales.css';

const ConsignmentSales = () => {
  const consignmentProducts = useStore((state) => state.consignmentProducts);
  const members             = useStore((state) => state.members);
  const checkoutConsignment = useStore((state) => state.checkoutConsignment);
  const currentUser         = useStore((state) => state.currentUser);

  const [cart, setCart]                     = useState([]);
  const [searchTerm, setSearchTerm]         = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [paymentMethod, setPaymentMethod]   = useState('Cash');
  const [takeDate, setTakeDate]             = useState('');
  const [installments, setInstallments]     = useState(1);
  const [startDate, setStartDate]           = useState('');
  const [notes, setNotes]                   = useState('');
  const [showReceipt, setShowReceipt]       = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);

  const filteredProducts = consignmentProducts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => setCart(prev => prev.map(item =>
    item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
  ));

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));

  const totalAmount          = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalCommission      = cart.reduce((sum, item) => sum + ((item.commission ?? (item.price - item.supplierPrice)) * item.qty), 0);
  const totalSupplierPayable = totalAmount - totalCommission;

  const schedule = useMemo(() =>
    paymentMethod === 'Kredit' ? buildSchedule(totalAmount, installments, startDate) : [],
    [paymentMethod, totalAmount, installments, startDate]
  );

  const handleCheckout = () => {
    if (cart.length === 0) return alert('Keranjang kosong!');
    if (paymentMethod === 'Kredit' && !selectedMember) return alert('Metode Kredit harus memilih anggota!');
    if (paymentMethod === 'Kredit' && !startDate) return alert('Isi tanggal mulai cicilan!');
    const member = selectedMember ? members.find(m => m.id === selectedMember) : null;
    const txId = `KNS-${Date.now()}`;
    checkoutConsignment(cart, totalAmount, totalCommission, totalSupplierPayable, selectedMember || null, paymentMethod, installments, startDate || null, notes);
    setLastTransaction({
      items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
      total: totalAmount, type: 'consignment',
      memberName: member?.name || null,
      date: new Date().toISOString(),
      transactionId: txId,
      commission: totalCommission,
      supplierPayable: totalSupplierPayable,
      paymentMethod, takeDate, installments, startDate, notes, schedule,
      pic: currentUser?.name || 'Admin',
    });
    setShowReceipt(true);
    setCart([]); setSelectedMember(''); setPaymentMethod('Cash');
    setTakeDate(''); setInstallments(1); setStartDate(''); setNotes('');
  };

  return (
    <div className="pos-container">
      <div className="product-section glass-panel">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2>Penjualan Konsinyasi (Titipan)</h2>
            <p className="text-muted text-sm mt-1">Sistem kasir untuk barang titipan supplier</p>
          </div>
          <div className="search-bar" style={{ width: '250px' }}>
            <Search size={18} className="text-muted" />
            <input type="text" placeholder="Cari barang/suplier..." className="search-input"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="product-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="product-card" onClick={() => addToCart(product)}>
              <div className="product-img-placeholder">
                {product.image
                  ? <img src={product.image} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'var(--radius-sm)' }} />
                  : <Store size={22} className="text-muted" />
                }
              </div>
              <div className="product-info">
                <p className="product-name">{product.name}</p>
                <p className="product-supplier">Titipan: {product.supplier}</p>
                <p className="product-price">Rp {product.price.toLocaleString('id-ID')}</p>
                <div className="product-meta">
                  <span className="badge badge-primary">Stok: {product.stock}</span>
                  <span className="product-category">
                    +Rp {(product.commission ?? (product.price - product.supplierPrice)).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'2rem', color:'var(--color-text-muted)', fontSize:'0.875rem' }}>
              Tidak ada barang ditemukan.
            </div>
          )}
        </div>
      </div>

      <div className="cart-section glass-panel">
        <h3 className="mb-4 flex items-center gap-2"><ShoppingCart size={20} /> Keranjang Konsinyasi</h3>

        <div className="member-selector">
          <label className="member-selector-label"><User size={14} /> Anggota (Opsional)</label>
          <SearchableSelect
            options={members.map(m => ({ value: m.id, label: `${m.name} (${m.id})` }))}
            value={selectedMember}
            onChange={setSelectedMember}
            placeholder="— Pembeli Umum —"
          />
          {selectedMember && <p className="member-selected-info">Transaksi ini akan dihitung ke SHU anggota</p>}
        </div>

        <div className="payment-method-selector">
          <label className="member-selector-label"><Banknote size={14} /> Metode Pembayaran</label>
          <div className="payment-method-btns">
            <button type="button" className={`payment-btn ${paymentMethod === 'Cash' ? 'active-cash' : ''}`}
              onClick={() => setPaymentMethod('Cash')}><Banknote size={15} /> Cash</button>
            <button type="button" className={`payment-btn ${paymentMethod === 'Kredit' ? 'active-kredit' : ''}`}
              onClick={() => setPaymentMethod('Kredit')}><CreditCard size={15} /> Kredit / Cicilan</button>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
          <label className="member-selector-label"><Calendar size={14} /> Tanggal Pengambilan</label>
          <input type="date" className="form-control" value={takeDate} onChange={(e) => setTakeDate(e.target.value)} />
        </div>

        {paymentMethod === 'Kredit' && (
          <div className="kredit-fields">
            <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '0.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="member-selector-label">Jumlah Cicilan</label>
                <select className="form-control" value={installments} onChange={(e) => setInstallments(Number(e.target.value))}>
                  {[1,2,3,4,5,6,8,10,12].map(n => (
                    <option key={n} value={n}>{n === 1 ? '1x (Tempo/Lunas)' : `${n}x Cicilan`}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="member-selector-label">Mulai Bayar</label>
                <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label className="member-selector-label">Keterangan</label>
              <input type="text" className="form-control" placeholder="Contoh: Potong gaji bulan depan"
                value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            {schedule.length > 0 && (
              <div className="cicilan-preview">
                <div className="cicilan-preview-title">Jadwal Cicilan</div>
                {schedule.map(s => (
                  <div key={s.no} className="cicilan-row">
                    <span>Cicilan ke-{s.no} ({s.date})</span>
                    <span>Rp {s.amount.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="kredit-info-note">
              Dicatat sebagai <strong>Piutang Dagang</strong> - bukan Kas.
            </div>
          </div>
        )}

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart text-muted">Belum ada barang di keranjang.</div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item" style={{ alignItems: 'center' }}>
                <div className="cart-item-info">
                  <p className="cart-item-name">{item.name}</p>
                  <p className="cart-item-price">Rp {item.price.toLocaleString('id-ID')}</p>
                  <p className="text-muted" style={{ fontSize: '0.7rem' }}>
                    Komisi: Rp {(item.commission ?? (item.price - item.supplierPrice)).toLocaleString('id-ID')}/pcs
                  </p>
                </div>
                <div className="cart-item-actions">
                  <button className="qty-btn" onClick={() => updateQty(item.id, -1)}><Minus size={14} /></button>
                  <span className="qty-value">{item.qty}</span>
                  <button className="qty-btn" onClick={() => updateQty(item.id, 1)}><Plus size={14} /></button>
                  <button className="delete-btn ms-2" onClick={() => removeFromCart(item.id)}><Trash2 size={16} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-summary">
          {/* Rincian item */}
          {cart.length > 0 && (
            <div style={{ marginBottom:'0.75rem', paddingBottom:'0.75rem', borderBottom:'1px dashed var(--color-border)' }}>
              {cart.map(item => (
                <div key={item.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'0.8rem', marginBottom:'0.35rem', gap:'0.5rem' }}>
                  <span style={{ color:'var(--color-text-muted)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {item.name}
                  </span>
                  <span style={{ color:'var(--color-text-muted)', flexShrink:0 }}>
                    {item.qty}× Rp {item.price.toLocaleString('id-ID')}
                  </span>
                  <span style={{ fontWeight:600, flexShrink:0, minWidth:70, textAlign:'right' }}>
                    Rp {(item.qty * item.price).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="summary-row" style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            <span>Komisi Koperasi</span><span>Rp {totalCommission.toLocaleString('id-ID')}</span>
          </div>
          <div className="summary-row" style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            <span>Hutang ke Suplier</span><span>Rp {totalSupplierPayable.toLocaleString('id-ID')}</span>
          </div>
          {paymentMethod === 'Kredit' && installments > 1 && (
            <div className="summary-row" style={{ fontSize: '0.8rem', color: 'var(--color-warning)' }}>
              <span>Per cicilan ({installments}x)</span>
              <span>Rp {Math.floor(totalAmount / installments).toLocaleString('id-ID')}</span>
            </div>
          )}
          <div className="summary-row" style={{ fontSize: '0.8rem' }}>
            <span>Metode</span>
            <span style={{ color: paymentMethod === 'Kredit' ? 'var(--color-warning)' : 'var(--color-success)', fontWeight: 600 }}>
              {paymentMethod === 'Kredit' ? `${installments === 1 ? 'Tempo' : `${installments}x Cicilan`}` : 'Cash'}
            </span>
          </div>
          <div className="summary-row" style={{ fontSize: '0.8rem' }}>
            <span>PIC / Kasir</span>
            <span style={{ fontWeight: 600 }}>{currentUser?.name || 'Admin'}</span>
          </div>
          <div className="summary-row total mt-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <span>Total Bayar</span><span>Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>
          <button className="btn btn-primary checkout-btn mt-4" onClick={handleCheckout}>
            {paymentMethod === 'Kredit' ? (installments === 1 ? 'Catat Tempo' : `Catat ${installments}x Cicilan`) : 'Bayar Sekarang'}
          </button>
        </div>
      </div>

      {showReceipt && lastTransaction && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}
          onClick={(e) => e.target === e.currentTarget && setShowReceipt(false)}>
          <div className="modal-content" style={{ maxWidth: 420, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Struk Transaksi</h3>
              <button className="modal-close-btn" onClick={() => setShowReceipt(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <Receipt {...lastTransaction} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowReceipt(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsignmentSales;
